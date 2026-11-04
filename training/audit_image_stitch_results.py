"""Audit the completed experiment against frozen inputs and actual compiler output."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from image_stitch_data import HERE,load,fingerprints,strict_recipe

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--run',required=True);args=ap.parse_args();run=Path(args.run)
    metadata=json.loads((run/'metadata.json').read_text());comparison=json.loads((run/'comparison.json').read_text())
    if metadata['task']!='image-stitch-v1' or metadata['sources']!=fingerprints():raise ValueError('Frozen source or dataset mismatch.')
    train,dev,challenge=load()
    if [metadata['train_rows'],metadata['dev_images'],metadata['challenge_images']]!=[len(train),len(dev),len(challenge)]:raise ValueError('Row count mismatch.')
    text_dev=[json.loads(x) for x in (HERE/'stitch-program-v1/examples.jsonl').read_text().splitlines() if json.loads(x)['split']=='dev']
    regression={'id':'known-failure-triangle','split':'regression','prompt':'Make the pictured flat shape with six foundation beads and four rows total. Select a suitable supported stitch.','recipe':{'stitch':'brick','shape':'triangle','width':6,'rows':4},'image':{'kind':'regression-triangle','seed':0,'style':0},'label_source':'authored-known-failure','user_reviewed':False,'physical_success':None}
    matched=[next(r for r in challenge if r.get('image',{}).get('kind')==k) for k in ['triangle','peyote','square','raw']]
    if len({r['prompt'] for r in matched})!=1:raise ValueError('Image counterfactuals contain differing text.')
    swaps=[{**r,'id':'swap-'+r['id'],'image':matched[(i+1)%4]['image'],'image_sha256':matched[(i+1)%4]['image_sha256'],'recipe':matched[(i+1)%4]['recipe']} for i,r in enumerate(matched)]
    sets={'frozen-base-dev':dev,'before-dev':dev,'before-challenge':challenge,'before-text':text_dev,'before-regression':[regression],'after-dev':dev,'after-challenge':challenge,'after-text':text_dev,'after-regression':[regression],'after-image-swaps':swaps,'after-blank-ablation':matched}
    cache={}
    def compiled(recipe):
        if recipe is None:return None
        key=json.dumps(recipe,sort_keys=True)
        if key not in cache:
            code="import {compileRecipe} from './stitch-programs.mjs';let s='';for await(const b of process.stdin)s+=b;const p=compileRecipe(JSON.parse(s));console.log(JSON.stringify({unknown:!!p.needsClarification,beads:p.beadCount??0,maximumAssembly:p.passagePreference?.maximumAssemblyPasses??null,overFive:p.passagePreference?.exceptions.length??0,finishingPlanned:false}));"
            process=subprocess.run(['node','--input-type=module','-e',code],cwd=HERE.parent,input=json.dumps(recipe),capture_output=True,text=True,timeout=15)
            cache[key]=json.loads(process.stdout) if process.returncode==0 else None
        return cache[key]
    reports={};total=0
    for name,expected_rows in sets.items():
        rows=[json.loads(x) for x in (run/name/'predictions.jsonl').read_text().splitlines() if x]
        if len(rows)!=len(expected_rows) or len({r['id'] for r in rows})!=len(rows):raise ValueError('Missing or duplicate predictions: '+name)
        expected={r['id']:r for r in expected_rows}
        for row in rows:
            if row['id'] not in expected or any(row.get(k)!=v for k,v in expected[row['id']].items()):raise ValueError('Prediction input drift: '+name)
            if row.get('input_variant')!=('blank' if name=='after-blank-ablation' else 'normal'):raise ValueError('Wrong input variant.')
            prediction=strict_recipe(row['raw'])
            if prediction!=row['prediction'] or (prediction==row['recipe'])!=row['exact']:raise ValueError('Prediction or exact score mismatch.')
            if bool(prediction and prediction['stitch']==row['recipe']['stitch'])!=row['stitch_correct']:raise ValueError('Stitch score mismatch.')
            if compiled(prediction)!=row['compiled']:raise ValueError('Compiler output mismatch.')
        summary={'examples':len(rows),'exact_recipes':sum(r['prediction']==r['recipe'] for r in rows),'stitch_correct':sum(bool(r['prediction'] and r['prediction']['stitch']==r['recipe']['stitch']) for r in rows),'strict_valid':sum(r['prediction'] is not None for r in rows),'compiled_patterns':sum(bool(r['compiled'] and not r['compiled']['unknown']) for r in rows),'assembly_at_most_five':sum(bool(r['compiled'] and not r['compiled']['unknown'] and r['compiled']['overFive']==0) for r in rows),'unsupported_correct':sum(r['recipe']['stitch']=='unknown' and r['exact'] for r in rows),'unsupported_cases':sum(r['recipe']['stitch']=='unknown' for r in rows),'by_stitch':{s:{'cases':sum(r['recipe']['stitch']==s for r in rows),'exact':sum(r['recipe']['stitch']==s and r['exact'] for r in rows)} for s in sorted({r['recipe']['stitch'] for r in rows})},'physical_validated':False,'finishing_planned':False}
        if summary!=json.loads((run/name/'summary.json').read_text()):raise ValueError('Summary mismatch: '+name)
        reports[name]={'predictions':len(rows),'exact_recipes':summary['exact_recipes'],'unique_positive_targets':len({json.dumps(r['recipe'],sort_keys=True) for r in rows if r['recipe']['stitch']!='unknown'}),'predictions_sha256':hashlib.sha256((run/name/'predictions.jsonl').read_bytes()).hexdigest()};total+=len(rows)
    bindings={'frozen-base-dev':comparison['frozen_base_dev'],'before-dev':comparison['before']['dev'],'before-challenge':comparison['before']['challenge'],'before-text':comparison['before']['text'],'before-regression':comparison['before']['known_regression'],'after-dev':comparison['after']['dev'],'after-challenge':comparison['after']['challenge'],'after-text':comparison['after']['text'],'after-regression':comparison['after']['known_regression'],'after-image-swaps':comparison['after']['image_swaps'],'after-blank-ablation':comparison['after']['blank_image_original_targets']}
    for name,summary in bindings.items():
        if summary!=json.loads((run/name/'summary.json').read_text()):raise ValueError('Comparison mismatch: '+name)
    completion=json.loads((run/'training-complete.json').read_text())
    if float(completion.get('epoch',0))!=2.0:raise ValueError('Two fixed epochs are not complete.')
    weight_sha=hashlib.sha256((run/'adapter/adapter_model.safetensors').read_bytes()).hexdigest()
    if weight_sha==metadata['parent_adapter_sha256']:raise ValueError('Weights did not change.')
    report={'status':'verified','audit_script_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'prediction_count':total,'source_and_data_match':True,'all_predictions_recompiled':True,'two_epochs_complete':True,'adapter_sha256':weight_sha,'parent_adapter_sha256':metadata['parent_adapter_sha256'],'adapter_differs_from_parent':True,'sets':reports,'physical_validated':False,'note':'Synthetic flat references only. Known regression was previously debugged; blank ablation is a diagnostic. No automatic deployment.'}
    (run/'audit.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
if __name__=='__main__':main()

"""Free-T4 image-conditioned continuation, with frozen synthetic image evaluation."""
import argparse,hashlib,json,subprocess,shutil
from pathlib import Path
from image_stitch_data import HERE,MODEL,REVISION,SYSTEM,SCHEMA,load,fingerprints,strict_recipe,render

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--output',required=True);ap.add_argument('--parent-adapter',required=True);ap.add_argument('--resume',action='store_true');ap.add_argument('--check',action='store_true');args=ap.parse_args()
    train,dev,challenge=load();out=Path(args.output);parent=Path(args.parent_adapter)
    parent_weight=parent/'adapter_model.safetensors'
    if not parent_weight.is_file():raise FileNotFoundError('Completed text stitch adapter required. No old weights will be overwritten.')
    text_dev=[json.loads(x) for x in (HERE/'stitch-program-v1/examples.jsonl').read_text().splitlines() if json.loads(x)['split']=='dev']
    metadata={'task':'image-stitch-v1','model':MODEL,'revision':REVISION,'parent_adapter_sha256':hashlib.sha256(parent_weight.read_bytes()).hexdigest(),'parent_config_sha256':hashlib.sha256((parent/'adapter_config.json').read_bytes()).hexdigest(),'epochs':2,'seed':43,'train_rows':len(train),'dev_images':len(dev),'challenge_images':len(challenge),'text_retention_eval':len(text_dev),'sources':fingerprints(),'system_sha256':hashlib.sha256(SYSTEM.encode()).hexdigest(),'note':'Synthetic flat image references, not real-photo or physical-beadability validation. No automatic deployment.'}
    if args.check:print(json.dumps(metadata,indent=2));return
    if (out/'comparison.json').exists():raise FileExistsError('Completed run exists; preserve it.')
    if not shutil.which('node'):raise RuntimeError('Node.js required for exact pattern compilation.')
    manifest=out/'metadata.json'
    if manifest.exists() and (not args.resume or json.loads(manifest.read_text())!=metadata):raise ValueError('Resume requires identical source, parent adapter, data and settings.')
    if out.exists() and not manifest.exists() and any(p.name not in {'repository-revision.txt','pip-freeze.txt','run.log'} or not p.is_file() for p in out.iterdir()):raise ValueError('Unrecognized run files; preserve them.')
    import torch
    from transformers import AutoProcessor,Qwen3VLForConditionalGeneration,BitsAndBytesConfig,Trainer,TrainingArguments,set_seed
    from transformers.trainer_utils import get_last_checkpoint
    from peft import PeftModel,prepare_model_for_kbit_training
    from lmformatenforcer import JsonSchemaParser
    from lmformatenforcer.integrations.transformers import build_transformers_prefix_allowed_tokens_fn
    if not torch.cuda.is_available():raise RuntimeError('No eligible free CUDA GPU. Stop; no paid upgrade or quota bypass.')
    set_seed(43);out.mkdir(parents=True,exist_ok=True);manifest.write_text(json.dumps(metadata,indent=2)+'\n')
    dtype=torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16
    (out/'environment.json').write_text(json.dumps({'gpu':torch.cuda.get_device_name(0),'torch':torch.__version__,'node':subprocess.check_output(['node','--version'],text=True).strip()},indent=2)+'\n')
    processor=AutoProcessor.from_pretrained(MODEL,revision=REVISION)
    model=Qwen3VLForConditionalGeneration.from_pretrained(MODEL,revision=REVISION,device_map={'':0},torch_dtype=dtype,quantization_config=BitsAndBytesConfig(load_in_4bit=True,bnb_4bit_quant_type='nf4',bnb_4bit_use_double_quant=True,bnb_4bit_compute_dtype=dtype))
    def messages(row,variant='normal'):
        content=[]
        if row.get('image'):
            if variant=='blank':
                from PIL import Image
                image=Image.new('RGB',(224,224),'white')
            else:image=render(row['image'])
            content.append({'type':'image','image':image})
        content.append({'type':'text','text':row['prompt']})
        return [{'role':'system','content':[{'type':'text','text':SYSTEM}]},{'role':'user','content':content}]
    def compiled(recipe):
        code="import {compileRecipe} from './stitch-programs.mjs';let s='';for await(const b of process.stdin)s+=b;const p=compileRecipe(JSON.parse(s));console.log(JSON.stringify({unknown:!!p.needsClarification,beads:p.beadCount??0,maximumAssembly:p.passagePreference?.maximumAssemblyPasses??null,overFive:p.passagePreference?.exceptions.length??0,finishingPlanned:false}));"
        try:return json.loads(subprocess.run(['node','--input-type=module','-e',code],cwd=HERE.parent,input=json.dumps(recipe),text=True,capture_output=True,timeout=15,check=True).stdout)
        except (subprocess.SubprocessError,ValueError):return None
    def evaluate(label,rows,variant='normal'):
        folder=out/label;folder.mkdir(exist_ok=True);p=folder/'predictions.jsonl';saved={}
        if p.exists():
            for line in p.read_text().splitlines():
                r=json.loads(line)
                if r['id'] in saved:raise ValueError('Duplicate prediction.')
                saved[r['id']]=r
        expected={r['id']:r for r in rows}
        if set(saved)-set(expected) or any(any(saved[k].get(f)!=v for f,v in row.items()) or saved[k].get('input_variant')!=variant for k,row in expected.items() if k in saved):raise ValueError('Saved predictions differ from frozen inputs.')
        model.eval();model.config.use_cache=True
        for i,row in enumerate(rows,1):
            if row['id'] in saved:continue
            inputs=processor.apply_chat_template(messages(row,variant),tokenize=True,return_dict=True,return_tensors='pt',add_generation_prompt=True);inputs.pop('token_type_ids',None)
            if inputs['input_ids'].shape[1]>2048:raise ValueError('Overlong input; no truncation.')
            inputs={k:v.to(model.device) if hasattr(v,'to') else v for k,v in inputs.items()}
            parser=build_transformers_prefix_allowed_tokens_fn(processor.tokenizer,JsonSchemaParser(SCHEMA))
            with torch.inference_mode():tokens=model.generate(**inputs,max_new_tokens=160,do_sample=False,prefix_allowed_tokens_fn=parser)
            raw=processor.batch_decode(tokens[:,inputs['input_ids'].shape[-1]:],skip_special_tokens=True)[0];recipe=strict_recipe(raw);plan=compiled(recipe) if recipe else None
            r={**row,'input_variant':variant,'raw':raw,'prediction':recipe,'compiled':plan,'exact':recipe==row['recipe'],'stitch_correct':bool(recipe and recipe['stitch']==row['recipe']['stitch'])}
            with p.open('a') as stream:stream.write(json.dumps(r)+'\n');stream.flush()
            saved[row['id']]=r;print(f'{label} {i}/{len(rows)} {row["id"]}: {recipe}; exact {r["exact"]}',flush=True)
        predictions=[saved[r['id']] for r in rows]
        summary={'examples':len(rows),'exact_recipes':sum(r['exact'] for r in predictions),'stitch_correct':sum(r['stitch_correct'] for r in predictions),'strict_valid':sum(r['prediction'] is not None for r in predictions),'compiled_patterns':sum(bool(r['compiled'] and not r['compiled']['unknown']) for r in predictions),'assembly_at_most_five':sum(bool(r['compiled'] and not r['compiled']['unknown'] and r['compiled']['overFive']==0) for r in predictions),'unsupported_correct':sum(r['recipe']['stitch']=='unknown' and r['exact'] for r in predictions),'unsupported_cases':sum(r['recipe']['stitch']=='unknown' for r in predictions),'by_stitch':{s:{'cases':sum(r['recipe']['stitch']==s for r in predictions),'exact':sum(r['recipe']['stitch']==s and r['exact'] for r in predictions)} for s in sorted({r['recipe']['stitch'] for r in predictions})},'physical_validated':False,'finishing_planned':False}
        (folder/'summary.json').write_text(json.dumps(summary,indent=2)+'\n');return summary
    regression={'id':'known-failure-triangle','split':'regression','prompt':'Make the pictured flat shape with six foundation beads and four rows total. Select a suitable supported stitch.','recipe':{'stitch':'brick','shape':'triangle','width':6,'rows':4},'image':{'kind':'regression-triangle','seed':0,'style':0},'label_source':'authored-known-failure','user_reviewed':False,'physical_success':None}
    # Fixed before training. This previously debugged regression is not an unseen challenge.
    base=evaluate('frozen-base-dev',dev)
    model=prepare_model_for_kbit_training(model,use_gradient_checkpointing=True)
    model=PeftModel.from_pretrained(model,parent,is_trainable=True)
    before={'dev':evaluate('before-dev',dev),'challenge':evaluate('before-challenge',challenge),'text':evaluate('before-text',text_dev),'known_regression':evaluate('before-regression',[regression])}
    adapter=out/'adapter'
    if (out/'training-complete.json').exists():
        # Replace the existing named adapter only after preserving its recorded parent.
        model.load_adapter(adapter,adapter_name='image_result');model.set_adapter('image_result')
    else:
        model.config.use_cache=False;model.print_trainable_parameters()
        def collate(rows):
            if len(rows)!=1:raise ValueError('Batch size must be one.')
            row=rows[0];prompt=messages(row);full=prompt+[{'role':'assistant','content':[{'type':'text','text':json.dumps(row['recipe'])}]}]
            batch=processor.apply_chat_template(full,tokenize=True,return_dict=True,return_tensors='pt',add_generation_prompt=False);batch.pop('token_type_ids',None)
            prefix=processor.apply_chat_template(prompt,tokenize=True,return_dict=True,return_tensors='pt',add_generation_prompt=True)['input_ids'];n=prefix.shape[1]
            if not torch.equal(batch['input_ids'][:,:n],prefix) or batch['input_ids'].shape[1]>2048:raise ValueError('Prefix mismatch or overlong input; no truncation.')
            labels=batch['input_ids'].clone();labels[:,:n]=-100;batch['labels']=labels;return batch
        trainer=Trainer(model=model,train_dataset=train,eval_dataset=dev,data_collator=collate,args=TrainingArguments(output_dir=str(adapter),per_device_train_batch_size=1,per_device_eval_batch_size=1,gradient_accumulation_steps=8,learning_rate=5e-5,num_train_epochs=2,bf16=dtype==torch.bfloat16,fp16=dtype==torch.float16,gradient_checkpointing=True,gradient_checkpointing_kwargs={'use_reentrant':False},remove_unused_columns=False,eval_strategy='epoch',save_strategy='steps',save_steps=4,save_total_limit=2,logging_steps=1,report_to='none',seed=43))
        checkpoint=get_last_checkpoint(str(adapter)) if args.resume and adapter.exists() else None
        result=trainer.train(resume_from_checkpoint=checkpoint);trainer.save_model(str(adapter));processor.save_pretrained(str(adapter));(out/'training-complete.json').write_text(json.dumps(result.metrics,indent=2)+'\n')
    after={'dev':evaluate('after-dev',dev),'challenge':evaluate('after-challenge',challenge),'text':evaluate('after-text',text_dev),'known_regression':evaluate('after-regression',[regression])}
    # Same text/dimensions across four families: predictions must follow a changed image.
    matched=[next(r for r in challenge if r.get('image',{}).get('kind')==k) for k in ['triangle','peyote','square','raw']]
    if len({r['prompt'] for r in matched})!=1:raise ValueError('Counterfactual prompts must be identical.')
    swaps=[{**r,'id':'swap-'+r['id'],'image':matched[(i+1)%4]['image'],'image_sha256':matched[(i+1)%4]['image_sha256'],'recipe':matched[(i+1)%4]['recipe']} for i,r in enumerate(matched)]
    after['image_swaps']=evaluate('after-image-swaps',swaps)
    after['blank_image_original_targets']=evaluate('after-blank-ablation',matched,'blank')
    comparison={'frozen_base_dev':base,'before':before,'after':after,'deployed':False,'note':metadata['note'],'ablation_note':'Blank-image accuracy is against original image labels only as a reliance diagnostic, not a valid blank-image pattern target.'}
    (out/'comparison.json').write_text(json.dumps(comparison,indent=2)+'\n');print(json.dumps(comparison,indent=2),flush=True)
if __name__=='__main__':main()

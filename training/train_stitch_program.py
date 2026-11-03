"""Free-T4 QLoRA pilot: select a stitch and generate a bounded recipe."""
import argparse,hashlib,json,subprocess,shutil
from pathlib import Path
from stitch_data import HERE,MODEL,REVISION,SYSTEM,SCHEMA,load,fingerprints,strict_recipe

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--output',required=True);ap.add_argument('--resume',action='store_true');ap.add_argument('--check',action='store_true');args=ap.parse_args()
    train,dev,challenge=load();out=Path(args.output)
    metadata={'task':'stitch-program-v1','model':MODEL,'model_revision':REVISION,'epochs':2,'seed':42,'train_rows':len(train),'dev_rows':len(dev),'challenge_rows':len(challenge),'source_sha256':fingerprints(),'system_sha256':hashlib.sha256(SYSTEM.encode()).hexdigest(),'note':'Synthetic bounded flat swatches; assembly-only pass ledgers. Not general 3D pattern generation or physical validation.'}
    if args.check:print(json.dumps(metadata,indent=2));return
    if not shutil.which('node'):raise RuntimeError('Node.js is required for actual pattern compilation; install it in the free runtime first.')
    if (out/'comparison.json').exists():raise FileExistsError('Completed run exists; preserve it.')
    manifest=out/'metadata.json'
    if manifest.exists() and (not args.resume or json.loads(manifest.read_text())!=metadata):raise ValueError('Resume needs identical source, data and settings.')
    if out.exists() and not manifest.exists() and any(p.name not in {'repository-revision.txt','pip-freeze.txt','run.log'} or not p.is_file() or p.is_symlink() for p in out.iterdir()):raise ValueError('Unidentified run files; preserve them.')
    import torch
    from transformers import AutoProcessor,Qwen3VLForConditionalGeneration,BitsAndBytesConfig,Trainer,TrainingArguments,set_seed
    from transformers.trainer_utils import get_last_checkpoint
    from peft import LoraConfig,get_peft_model,prepare_model_for_kbit_training,PeftModel
    from lmformatenforcer import JsonSchemaParser
    from lmformatenforcer.integrations.transformers import build_transformers_prefix_allowed_tokens_fn
    if not torch.cuda.is_available():raise RuntimeError('Free CUDA GPU unavailable. Stop; do not upgrade or bypass quotas.')
    set_seed(42);out.mkdir(parents=True,exist_ok=True);manifest.write_text(json.dumps(metadata,indent=2)+'\n')
    (out/'model-revision.json').write_text(json.dumps({'model':MODEL,'revision':REVISION})+'\n')
    (out/'environment.json').write_text(json.dumps({'gpu':torch.cuda.get_device_name(0),'torch':torch.__version__,'node':subprocess.check_output(['node','--version'],text=True).strip()},indent=2)+'\n')
    dtype=torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16
    processor=AutoProcessor.from_pretrained(MODEL,revision=REVISION)
    model=Qwen3VLForConditionalGeneration.from_pretrained(MODEL,revision=REVISION,device_map={'':0},torch_dtype=dtype,quantization_config=BitsAndBytesConfig(load_in_4bit=True,bnb_4bit_quant_type='nf4',bnb_4bit_use_double_quant=True,bnb_4bit_compute_dtype=dtype))
    def messages(row):return [{'role':'system','content':[{'type':'text','text':SYSTEM}]},{'role':'user','content':[{'type':'text','text':row['prompt']}]}]
    def compiled(recipe):
        code="import {compileRecipe} from './stitch-programs.mjs';let s='';for await(const b of process.stdin)s+=b;const p=compileRecipe(JSON.parse(s));console.log(JSON.stringify({unknown:!!p.needsClarification,beads:p.beadCount??0,maximumAssembly:p.passagePreference?.maximumAssemblyPasses??null,overFive:p.passagePreference?.exceptions.length??0,finishingPlanned:false}));"
        try:
            r=subprocess.run(['node','--input-type=module','-e',code],cwd=HERE.parent,input=json.dumps(recipe),text=True,capture_output=True,timeout=15,check=True)
            return json.loads(r.stdout)
        except (subprocess.SubprocessError,ValueError):return None
    def evaluate(label,rows):
        folder=out/label;folder.mkdir(exist_ok=True);p=folder/'predictions.jsonl';saved={}
        if p.exists():
            for line in p.read_text().splitlines():
                r=json.loads(line)
                if r['id'] in saved:raise ValueError('Duplicate saved prediction.')
                saved[r['id']]=r
        expected={r['id']:r for r in rows}
        if set(saved)-set(expected) or any(any(saved[k].get(f)!=v for f,v in expected[k].items()) for k in saved):raise ValueError('Saved predictions differ from frozen inputs.')
        model.eval();model.config.use_cache=True
        for i,row in enumerate(rows,1):
            if row['id'] in saved:continue
            inputs=processor.apply_chat_template(messages(row),tokenize=True,return_dict=True,return_tensors='pt',add_generation_prompt=True)
            inputs={k:v.to(model.device) if hasattr(v,'to') else v for k,v in inputs.items()}
            parser=build_transformers_prefix_allowed_tokens_fn(processor.tokenizer,JsonSchemaParser(SCHEMA))
            with torch.inference_mode():tokens=model.generate(**inputs,max_new_tokens=160,do_sample=False,prefix_allowed_tokens_fn=parser)
            raw=processor.batch_decode(tokens[:,inputs['input_ids'].shape[-1]:],skip_special_tokens=True)[0];recipe=strict_recipe(raw);plan=compiled(recipe) if recipe else None
            r={**row,'raw':raw,'prediction':recipe,'compiled':plan,'exact':recipe==row['recipe'],'stitch_correct':bool(recipe and recipe['stitch']==row['recipe']['stitch']),'strict_valid':recipe is not None}
            with p.open('a') as stream:stream.write(json.dumps(r)+'\n');stream.flush()
            saved[row['id']]=r;print(f'{label} {i}/{len(rows)} {row["id"]}: {recipe}; exact {r["exact"]}',flush=True)
        predictions=[saved[r['id']] for r in rows]
        summary={'examples':len(rows),'exact_recipes':sum(r['exact'] for r in predictions),'stitch_correct':sum(r['stitch_correct'] for r in predictions),'strict_valid':sum(r['strict_valid'] for r in predictions),'compiled_patterns':sum(bool(r['compiled'] and not r['compiled']['unknown']) for r in predictions),'assembly_at_most_five':sum(bool(r['compiled'] and not r['compiled']['unknown'] and r['compiled']['overFive']==0) for r in predictions),'by_stitch':{s:{'cases':sum(r['recipe']['stitch']==s for r in predictions),'exact':sum(r['recipe']['stitch']==s and r['exact'] for r in predictions)} for s in sorted({r['recipe']['stitch'] for r in predictions})},'physical_validated':False,'finishing_planned':False}
        (folder/'summary.json').write_text(json.dumps(summary,indent=2)+'\n');return summary
    base=evaluate('base',dev);base_challenge=evaluate('base-challenge',challenge);torch.cuda.empty_cache()
    adapter=out/'adapter'
    if (out/'training-complete.json').exists():model=PeftModel.from_pretrained(model,adapter)
    else:
        model=prepare_model_for_kbit_training(model,use_gradient_checkpointing=True)
        targets=[name for name,_ in model.named_modules() if 'language_model' in name and name.rsplit('.',1)[-1] in ('q_proj','v_proj')]
        if not targets:raise ValueError('Expected language attention modules missing.')
        model=get_peft_model(model,LoraConfig(r=16,lora_alpha=32,lora_dropout=.05,target_modules=targets,bias='none',task_type='CAUSAL_LM'));model.config.use_cache=False;model.print_trainable_parameters()
        def collate(rows):
            if len(rows)!=1:raise ValueError('Batch size must be one.')
            row=rows[0];prompt=messages(row);full=prompt+[{'role':'assistant','content':[{'type':'text','text':json.dumps(row['recipe'])}]}]
            batch=processor.apply_chat_template(full,tokenize=True,return_dict=True,return_tensors='pt',add_generation_prompt=False)
            prefix=processor.apply_chat_template(prompt,tokenize=True,return_dict=True,return_tensors='pt',add_generation_prompt=True)['input_ids'];n=prefix.shape[1]
            if not torch.equal(batch['input_ids'][:,:n],prefix) or batch['input_ids'].shape[1]>2048:raise ValueError('Prefix mismatch or overlong input; no truncation.')
            labels=batch['input_ids'].clone();labels[:,:n]=-100;batch['labels']=labels;return batch
        trainer=Trainer(model=model,train_dataset=train,eval_dataset=dev,data_collator=collate,args=TrainingArguments(output_dir=str(adapter),per_device_train_batch_size=1,per_device_eval_batch_size=1,gradient_accumulation_steps=8,learning_rate=1e-4,num_train_epochs=2,bf16=dtype==torch.bfloat16,fp16=dtype==torch.float16,gradient_checkpointing=True,gradient_checkpointing_kwargs={'use_reentrant':False},remove_unused_columns=False,eval_strategy='epoch',save_strategy='steps',save_steps=4,save_total_limit=2,logging_steps=1,report_to='none',seed=42))
        checkpoint=get_last_checkpoint(str(adapter)) if args.resume and adapter.exists() else None
        result=trainer.train(resume_from_checkpoint=checkpoint);trainer.save_model(str(adapter));processor.save_pretrained(str(adapter));(out/'training-complete.json').write_text(json.dumps(result.metrics,indent=2)+'\n')
    adapted=evaluate('adapter',dev);adapted_challenge=evaluate('adapter-challenge',challenge)
    comparison={'base':base,'adapter':adapted,'challenge':{'base':base_challenge,'adapter':adapted_challenge},'deployed':False,'note':metadata['note']}
    (out/'comparison.json').write_text(json.dumps(comparison,indent=2)+'\n');print(json.dumps(comparison,indent=2),flush=True)
if __name__=='__main__':main()

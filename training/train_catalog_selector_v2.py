"""Free-GPU QLoRA pilot: existing draft selection plus explicit rejection."""
import argparse
import hashlib
import json
from pathlib import Path
from catalog_data_v2 import load, fingerprints, challenge_rows, HERE

MODEL = 'Qwen/Qwen3-VL-2B-Instruct'
REVISION = '89644892e4d85e24eaac8bacfd4f463576704203'


def strict_family(text, families):
    def pairs(items):
        result = {}
        for key, value in items:
            if key in result:
                raise ValueError('Duplicate JSON key.')
            result[key] = value
        return result
    try:
        obj = json.loads(text, object_pairs_hook=pairs)
        if isinstance(obj, dict) and set(obj) == {'family'} and isinstance(obj['family'], str) and obj['family'] in families:
            return obj['family']
    except (ValueError, TypeError):
        pass
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--output', required=True)
    ap.add_argument('--check', action='store_true')
    ap.add_argument('--previous-run', required=True)
    ap.add_argument('--resume', action='store_true')
    ap.add_argument('--epochs', type=int, default=2, choices=[1, 2, 3])
    args = ap.parse_args()
    train, dev, families, system = load()
    out = Path(args.output)
    provenance = {**fingerprints(), 'train_catalog_selector_v2.py':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
                  'requirements-catalog-v2.txt':hashlib.sha256((HERE/'requirements-catalog-v2.txt').read_bytes()).hexdigest()}
    previous = Path(args.previous_run)
    previous_files = ['metadata.json','model-revision.json','adapter/adapter_config.json','adapter/adapter_model.safetensors']
    previous_hashes = {p:hashlib.sha256((previous/p).read_bytes()).hexdigest() for p in previous_files}
    if json.loads((previous/'model-revision.json').read_text()) != {'model':MODEL,'revision':REVISION}:
        raise ValueError('The previous adapter uses a different base model.')
    metadata = {'dataset_version':'v2','model_revision':REVISION,'previous_sha256':previous_hashes,'challenge_rows':len(challenge_rows()),'model':MODEL, 'epochs':args.epochs, 'seed':42, 'source_sha256':provenance,
                'system_sha256':hashlib.sha256(system.encode()).hexdigest(),
                'train_rows':len(train), 'dev_rows':len(dev), 'families':families,
                'note':'Authored synthetic semantic development experiment. Not geometry generation or physical validation.'}
    if args.check:
        print(json.dumps(metadata,indent=2)); return
    if (out/'comparison.json').exists():
        raise FileExistsError('Completed run exists. Preserve it and choose a new output directory.')
    manifest = out/'metadata.json'
    if manifest.exists() and (not args.resume or json.loads(manifest.read_text()) != metadata):
        raise ValueError('Existing run requires --resume with exactly matching configuration.')
    if out.exists() and not manifest.exists():
        # The notebook records its revision, environment and log before invoking us.
        # Permit those startup files, while refusing unidentified model/data outputs.
        startup_files = {'repository-revision.txt', 'pip-freeze.txt', 'run.log'}
        unexpected = [p.name for p in out.iterdir()
                      if p.name not in startup_files or not p.is_file() or p.is_symlink()]
        if unexpected:
            raise ValueError('Unidentified files in the run directory: '+', '.join(sorted(unexpected)))
    import torch
    from transformers import AutoConfig, AutoProcessor, Qwen3VLForConditionalGeneration, BitsAndBytesConfig, Trainer, TrainingArguments, set_seed
    from transformers.trainer_utils import get_last_checkpoint
    from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training, PeftModel
    from lmformatenforcer import JsonSchemaParser
    from lmformatenforcer.integrations.transformers import build_transformers_prefix_allowed_tokens_fn
    if not torch.cuda.is_available():
        raise RuntimeError('No eligible free CUDA GPU. Stop and retry later; do not upgrade.')
    set_seed(42)
    out.mkdir(parents=True,exist_ok=True)
    manifest.write_text(json.dumps(metadata,indent=2)+'\n')
    # Reuse the resolved upstream revision on resumption rather than moving model weights.
    revision_file = out/'model-revision.json'
    if revision_file.exists():
        revision = json.loads(revision_file.read_text())['revision']
    else:
        revision = REVISION
        if not revision:
            raise ValueError('Cannot pin the base model revision.')
        revision_file.write_text(json.dumps({'model':MODEL,'revision':revision})+'\n')
    if revision != REVISION:
        raise ValueError('Base model revision differs from frozen comparison recipe.')
    dtype = torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16
    processor = AutoProcessor.from_pretrained(MODEL,revision=revision)
    model = Qwen3VLForConditionalGeneration.from_pretrained(MODEL,revision=revision,device_map={'':0},torch_dtype=dtype,
        quantization_config=BitsAndBytesConfig(load_in_4bit=True,bnb_4bit_quant_type='nf4',
            bnb_4bit_use_double_quant=True,bnb_4bit_compute_dtype=dtype))
    (out/'environment.json').write_text(json.dumps({'gpu':torch.cuda.get_device_name(0),
        'torch':torch.__version__, 'model_revision':revision},indent=2)+'\n')
    schema = {'type':'object','properties':{'family':{'type':'string','enum':families}},
              'required':['family'],'additionalProperties':False}

    def messages(row):
        return [{'role':'system','content':[{'type':'text','text':system}]},
                {'role':'user','content':[{'type':'text','text':row['prompt']}]}]

    def evaluate(label, evaluation_rows=None):
        evaluation_rows = dev if evaluation_rows is None else evaluation_rows
        folder = out/label; folder.mkdir(exist_ok=True)
        predictions = folder/'predictions.jsonl'
        saved = {}
        if predictions.exists():
            for line in predictions.read_text().splitlines():
                row = json.loads(line)
                if row['id'] in saved:
                    raise ValueError('Duplicate saved prediction.')
                saved[row['id']] = row
        expected = {r['id']:r for r in evaluation_rows}
        if set(saved)-set(expected) or any(any(saved[k].get(f)!=expected[k][f] for f in expected[k]) for k in saved):
            raise ValueError('Saved predictions differ from current development inputs.')
        model.eval(); model.config.use_cache = True
        for i, row in enumerate(evaluation_rows,1):
            if row['id'] in saved:
                continue
            inputs = processor.apply_chat_template(messages(row),tokenize=True,return_dict=True,
                return_tensors='pt',add_generation_prompt=True)
            inputs = {k:v.to(model.device) if hasattr(v,'to') else v for k,v in inputs.items()}
            parser = build_transformers_prefix_allowed_tokens_fn(processor.tokenizer,JsonSchemaParser(schema))
            with torch.inference_mode():
                tokens = model.generate(**inputs,max_new_tokens=64,do_sample=False,prefix_allowed_tokens_fn=parser)
            raw = processor.batch_decode(tokens[:,inputs['input_ids'].shape[-1]:],skip_special_tokens=True)[0]
            family = strict_family(raw,families)
            result = {**row,'prediction_raw':raw,'predicted_family':family,'strict_valid':family is not None,
                      'correct':family==row['family']}
            with predictions.open('a') as stream:
                stream.write(json.dumps(result)+'\n');stream.flush()
            saved[row['id']] = result
            print(f'{label} {i}/{len(evaluation_rows)} {row["id"]}: {family}; correct {result["correct"]}',flush=True)
            del inputs, tokens
        rows = [saved[r['id']] for r in evaluation_rows]
        counts = lambda group: {'cases':len(group),'correct':sum(r['correct'] for r in group)}
        summary = {'examples':len(rows),'correct':sum(r['correct'] for r in rows),
                   'strict_valid':sum(r['strict_valid'] for r in rows),
                   'supported':counts([r for r in rows if r['family']!='unknown']),
                   'rejection':counts([r for r in rows if r['family']=='unknown']),
                   'by_category':{c:counts([r for r in rows if r['category']==c]) for c in sorted({r['category'] for r in rows})},
                   'note':metadata['note']}
        (folder/'summary.json').write_text(json.dumps(summary,indent=2)+'\n')
        return summary

    base = evaluate('base')
    base_challenge = evaluate('base-challenge',challenge_rows())
    torch.cuda.empty_cache()
    adapter = out/'adapter'
    if (out/'training-complete.json').exists():
        model = PeftModel.from_pretrained(model,adapter)
    else:
        model = prepare_model_for_kbit_training(model,use_gradient_checkpointing=True)
        targets = [name for name,_ in model.named_modules() if 'language_model' in name
                   and name.rsplit('.',1)[-1] in ('q_proj','v_proj')]
        if not targets:
            raise ValueError('Expected language attention modules were not found.')
        model = get_peft_model(model,LoraConfig(r=16,lora_alpha=32,lora_dropout=.05,
            target_modules=targets,bias='none',task_type='CAUSAL_LM'))
        model.config.use_cache = False
        model.print_trainable_parameters()

        def collate(rows):
            if len(rows)!=1:
                raise ValueError('This free GPU recipe requires batch size one.')
            row=rows[0]; prompt=messages(row)
            full=prompt+[{'role':'assistant','content':[{'type':'text','text':json.dumps({'family':row['family']})}]}]
            batch=processor.apply_chat_template(full,tokenize=True,return_dict=True,return_tensors='pt',add_generation_prompt=False)
            prefix=processor.apply_chat_template(prompt,tokenize=True,return_dict=True,return_tensors='pt',add_generation_prompt=True)['input_ids']
            n=prefix.shape[1]
            if not torch.equal(batch['input_ids'][:,:n],prefix) or batch['input_ids'].shape[1]>2048:
                raise ValueError('Chat prefix mismatch or overlong example; refusing to truncate.')
            labels=batch['input_ids'].clone();labels[:,:n]=-100;batch['labels']=labels
            return batch

        trainer=Trainer(model=model,train_dataset=train,eval_dataset=dev,data_collator=collate,
            args=TrainingArguments(output_dir=str(adapter),per_device_train_batch_size=1,per_device_eval_batch_size=1,
                gradient_accumulation_steps=8,learning_rate=1e-4,num_train_epochs=args.epochs,
                bf16=dtype==torch.bfloat16,fp16=dtype==torch.float16,gradient_checkpointing=True,
                gradient_checkpointing_kwargs={'use_reentrant':False},remove_unused_columns=False,
                eval_strategy='epoch',save_strategy='steps',save_steps=4,save_total_limit=2,
                logging_steps=1,report_to='none',seed=42))
        checkpoint=get_last_checkpoint(str(adapter)) if args.resume and adapter.exists() else None
        result=trainer.train(resume_from_checkpoint=checkpoint)
        trainer.save_model(str(adapter));processor.save_pretrained(str(adapter))
        (out/'training-complete.json').write_text(json.dumps(result.metrics,indent=2)+'\n')
    adapted=evaluate('adapter')
    adapted_challenge=evaluate('adapter-challenge',challenge_rows())
    # The v2 adapter is already saved. Activate v1 only for a matched comparison.
    model.load_adapter(str(previous/'adapter'),adapter_name='catalog-v1',is_trainable=False)
    model.set_adapter('catalog-v1')
    previous_dev=evaluate('previous')
    previous_challenge=evaluate('previous-challenge',challenge_rows())
    model.set_adapter('default')
    comparison={'base':base,'adapter':adapted,'previous':previous_dev,
                'challenge':{'base':base_challenge,'previous':previous_challenge,'adapter':adapted_challenge},'deployed':False,
                'note':'Inspect failures and collect independent examples before considering deployment. No automatic promotion.'}
    (out/'comparison.json').write_text(json.dumps(comparison,indent=2)+'\n')
    print(json.dumps(comparison,indent=2),flush=True)


if __name__=='__main__':
    main()

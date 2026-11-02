"""Free-GPU semantic decisions only: the model never emits positions or routes."""
import argparse, hashlib, json
from pathlib import Path

FAMILIES = ['dog','cat','duck','lobster','owl','hedgehog','dragon','lamp','chair',
            'watering-can','umbrella','pineapple','unknown']
SYSTEM = ('Choose the single best subject family from this supported catalog: '
          + ', '.join(FAMILIES[:-1]) + '. Return unknown for unsupported subjects, '
          'compositions with multiple subjects, or ambiguous requests. Infer the family '
          'from its meaning, including descriptions without the family name. '
          'Return exactly one JSON object with one field, family. Do not emit coordinates, '
          'parts, bead counts, colors, notes, or instructions.')

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--data',required=True); ap.add_argument('--output',required=True)
    ap.add_argument('--model',default='Qwen/Qwen3-VL-2B-Instruct')
    ap.add_argument('--resume',action='store_true')
    args=ap.parse_args(); destination=Path(args.output)
    rows=[json.loads(x) for x in Path(args.data).read_text().splitlines() if x.strip()]
    if not rows or len({x['id'] for x in rows}) != len(rows):
        raise ValueError('Expected nonempty, uniquely identified prompts.')
    if any(not isinstance(x['prompt'],str) or x['expected_family'] not in FAMILIES for x in rows):
        raise ValueError('Invalid family benchmark.')
    metadata={'model':args.model,'data_sha256':hashlib.sha256(Path(args.data).read_bytes()).hexdigest(),
              'system_sha256':hashlib.sha256(SYSTEM.encode()).hexdigest(),'families':FAMILIES,
              'max_new_tokens':64,'do_sample':False}
    destination.mkdir(parents=True,exist_ok=True)
    manifest=destination/'metadata.json'; predictions=destination/'predictions.jsonl'
    if (destination/'summary.json').exists():
        raise FileExistsError('Completed result exists; choose a new output directory.')
    if manifest.exists() and json.loads(manifest.read_text()) != metadata:
        raise ValueError('Resume configuration changed.')
    if predictions.exists() and not args.resume:
        raise FileExistsError('Predictions exist; use --resume or a new output.')
    manifest.write_text(json.dumps(metadata,indent=2)+'\n')
    saved={}
    if predictions.exists():
        for line in predictions.read_text().splitlines():
            if line.strip():
                row=json.loads(line);saved[row['id']]=row
        expected={x['id']:x for x in rows}
        if set(saved)-set(expected) or any(saved[k]['prompt']!=expected[k]['prompt'] for k in saved):
            raise ValueError('Saved inputs differ from the benchmark.')
    import torch
    from transformers import AutoProcessor,Qwen3VLForConditionalGeneration,BitsAndBytesConfig
    from lmformatenforcer import JsonSchemaParser
    from lmformatenforcer.integrations.transformers import build_transformers_prefix_allowed_tokens_fn
    from evaluate_lora import strict_json_object
    if not torch.cuda.is_available():
        raise RuntimeError('No free CUDA GPU available. Stop and retry later.')
    dtype=torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16
    processor=AutoProcessor.from_pretrained(args.model)
    model=Qwen3VLForConditionalGeneration.from_pretrained(args.model,device_map='auto',torch_dtype=dtype,
        quantization_config=BitsAndBytesConfig(load_in_4bit=True,bnb_4bit_quant_type='nf4',
        bnb_4bit_use_double_quant=True,bnb_4bit_compute_dtype=dtype))
    model.eval(); schema={'type':'object','properties':{'family':{'type':'string','enum':FAMILIES}},
                         'required':['family'],'additionalProperties':False}
    results=[]
    for index,row in enumerate(rows,1):
        if row['id'] in saved:
            results.append(saved[row['id']]);continue
        messages=[{'role':'system','content':[{'type':'text','text':SYSTEM}]},
                  {'role':'user','content':[{'type':'text','text':row['prompt']}]}]
        inputs=processor.apply_chat_template(messages,tokenize=True,return_dict=True,
            return_tensors='pt',add_generation_prompt=True)
        inputs={k:v.to(model.device) if hasattr(v,'to') else v for k,v in inputs.items()}
        parser=build_transformers_prefix_allowed_tokens_fn(processor.tokenizer,JsonSchemaParser(schema))
        with torch.inference_mode():
            tokens=model.generate(**inputs,max_new_tokens=64,do_sample=False,prefix_allowed_tokens_fn=parser)
        raw=processor.batch_decode(tokens[:,inputs['input_ids'].shape[-1]:],skip_special_tokens=True)[0]
        obj,error=strict_json_object(raw)
        valid=error is None and set(obj)=={'family'} and obj['family'] in FAMILIES
        family=obj['family'] if valid else None
        result={**row,'prediction_raw':raw,'predicted_family':family,'strict_valid':valid,
                'correct':valid and family==row['expected_family']}
        with predictions.open('a') as stream:stream.write(json.dumps(result)+'\n');stream.flush()
        results.append(result);print(f"{index}/{len(rows)} {row['id']}: {family}; correct {result['correct']}",flush=True)
        del inputs,tokens
    summary={'examples':len(results),'correct':sum(x['correct'] for x in results),
             'accuracy':sum(x['correct'] for x in results)/len(results),
             'strict_valid':sum(x['strict_valid'] for x in results),
             'unknown_controls':sum(x['expected_family']=='unknown' for x in results),
             'unknown_controls_correct':sum(x['correct'] and x['expected_family']=='unknown' for x in results),
             'note':'Semantic family selection only. This does not measure generated geometry or physical buildability.'}
    (destination/'summary.json').write_text(json.dumps(summary,indent=2)+'\n')
    print(json.dumps(summary,indent=2),flush=True)

if __name__=='__main__':main()

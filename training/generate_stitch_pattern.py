"""Use the experimental adapter to select a stitch and compile an actual flat draft."""
import argparse,hashlib,json,subprocess,shutil
from pathlib import Path
from stitch_data import MODEL,REVISION,SYSTEM,SCHEMA,HERE,strict_recipe

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--adapter',required=True);ap.add_argument('--prompt',required=True);ap.add_argument('--output',required=True);args=ap.parse_args()
    adapter=Path(args.adapter);out=Path(args.output)
    if out.exists():raise FileExistsError('Choose a new output folder; preserve existing patterns.')
    if not args.prompt.strip() or len(args.prompt)>1800:raise ValueError('Use a description of 1–1800 characters including the desired dimensions.')
    if not (adapter/'adapter_config.json').is_file():raise FileNotFoundError('A completed stitch-program adapter is required.')
    if not shutil.which('node'):raise RuntimeError('Node.js is needed for the pattern compiler.')
    import torch
    from transformers import AutoProcessor,Qwen3VLForConditionalGeneration,BitsAndBytesConfig
    from peft import PeftModel
    from lmformatenforcer import JsonSchemaParser
    from lmformatenforcer.integrations.transformers import build_transformers_prefix_allowed_tokens_fn
    if not torch.cuda.is_available():raise RuntimeError('Use the eligible free Colab CUDA runtime. No automatic paid resource is used.')
    dtype=torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16
    processor=AutoProcessor.from_pretrained(MODEL,revision=REVISION)
    model=Qwen3VLForConditionalGeneration.from_pretrained(MODEL,revision=REVISION,device_map={'':0},torch_dtype=dtype,quantization_config=BitsAndBytesConfig(load_in_4bit=True,bnb_4bit_quant_type='nf4',bnb_4bit_use_double_quant=True,bnb_4bit_compute_dtype=dtype))
    model=PeftModel.from_pretrained(model,adapter);model.eval()
    messages=[{'role':'system','content':[{'type':'text','text':SYSTEM}]},{'role':'user','content':[{'type':'text','text':args.prompt}]}]
    inputs=processor.apply_chat_template(messages,tokenize=True,return_dict=True,return_tensors='pt',add_generation_prompt=True)
    if inputs['input_ids'].shape[1]>2048:raise ValueError('Input too long; no truncation.')
    inputs={k:v.to(model.device) if hasattr(v,'to') else v for k,v in inputs.items()}
    parser=build_transformers_prefix_allowed_tokens_fn(processor.tokenizer,JsonSchemaParser(SCHEMA))
    with torch.inference_mode():tokens=model.generate(**inputs,max_new_tokens=160,do_sample=False,prefix_allowed_tokens_fn=parser)
    raw=processor.batch_decode(tokens[:,inputs['input_ids'].shape[-1]:],skip_special_tokens=True)[0]
    recipe=strict_recipe(raw)
    if recipe is None:raise ValueError('Invalid model output; no repair or pattern substitution.')
    result=subprocess.run(['node',str(HERE.parent/'stitch-programs.mjs')],input=json.dumps(recipe),capture_output=True,text=True,check=True,timeout=20)
    plan=json.loads(result.stdout)
    svg=None
    if not plan.get('needsClarification'):
        svg=subprocess.run(['node',str(HERE.parent/'stitch-programs.mjs'),'--svg'],input=json.dumps(recipe),capture_output=True,text=True,check=True,timeout=20).stdout
    out.mkdir(parents=True)
    (out/'recipe.json').write_text(json.dumps(recipe,indent=2)+'\n');(out/'pattern.json').write_text(result.stdout)
    if svg:(out/'bead-chart.svg').write_text(svg)
    evidence={'prompt':args.prompt,'raw':raw,'model':MODEL,'revision':REVISION,'adapter_sha256':hashlib.sha256((adapter/'adapter_model.safetensors').read_bytes()).hexdigest(),'physicalSampleRequired':True,'deployed':False}
    (out/'generation.json').write_text(json.dumps(evidence,indent=2)+'\n')
    print(json.dumps({'saved':str(out),'recipe':recipe,'needsClarification':plan.get('needsClarification',False),'beadCount':plan.get('beadCount'),'passagePreference':plan.get('passagePreference'),'finishing':plan.get('finishing')},indent=2))
if __name__=='__main__':main()

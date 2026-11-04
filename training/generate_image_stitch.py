"""Direct image+text inference for the separately evaluated image-stitch-v1 adapter."""
import argparse,hashlib,json,subprocess,shutil
from pathlib import Path
from image_stitch_data import HERE,MODEL,REVISION,SYSTEM,SCHEMA,strict_recipe

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--adapter',required=True);ap.add_argument('--image',required=True);ap.add_argument('--prompt',required=True);ap.add_argument('--output',required=True);args=ap.parse_args()
    adapter=Path(args.adapter);run=adapter.parent;out=Path(args.output);source=Path(args.image)
    if out.exists():raise FileExistsError('Choose a new output folder; preserve earlier drafts.')
    if not args.prompt.strip() or len(args.prompt)>1800:raise ValueError('Describe the design and explicit bead dimensions in 1–1800 characters.')
    metadata=json.loads((run/'metadata.json').read_text())
    if metadata.get('task')!='image-stitch-v1' or metadata.get('revision')!=REVISION:raise ValueError('Use the new image stitch adapter with the recorded base revision.')
    if not (run/'comparison.json').is_file():raise RuntimeError('Wait for the saved image evaluation to finish before trying this adapter.')
    if not shutil.which('node'):raise RuntimeError('Node.js is required for exact pattern compilation.')
    from PIL import Image,ImageOps
    if source.stat().st_size>10*1024*1024:raise ValueError('Image exceeds 10 MB.')
    with Image.open(source) as original:
        if original.format not in {'PNG','JPEG','WEBP'} or original.width*original.height>20_000_000:raise ValueError('Use PNG, JPEG or WebP below 20 megapixels.')
        oriented=ImageOps.exif_transpose(original).convert('RGBA')
        image=Image.alpha_composite(Image.new('RGBA',oriented.size,'white'),oriented).convert('RGB')
        image=ImageOps.pad(image,(224,224),method=Image.Resampling.LANCZOS,color='white')
        image.info.clear()
    import torch
    from transformers import AutoProcessor,Qwen3VLForConditionalGeneration,BitsAndBytesConfig
    from peft import PeftModel,prepare_model_for_kbit_training
    from lmformatenforcer import JsonSchemaParser
    from lmformatenforcer.integrations.transformers import build_transformers_prefix_allowed_tokens_fn
    if not torch.cuda.is_available():raise RuntimeError('Use an eligible free Colab GPU; no automatic paid resources.')
    dtype=torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16
    processor=AutoProcessor.from_pretrained(MODEL,revision=REVISION)
    model=Qwen3VLForConditionalGeneration.from_pretrained(MODEL,revision=REVISION,device_map={'':0},torch_dtype=dtype,quantization_config=BitsAndBytesConfig(load_in_4bit=True,bnb_4bit_quant_type='nf4',bnb_4bit_use_double_quant=True,bnb_4bit_compute_dtype=dtype))
    # Match the non-quantized parameter preparation used during the recorded evaluation.
    model=prepare_model_for_kbit_training(model,use_gradient_checkpointing=False)
    model=PeftModel.from_pretrained(model,adapter);model.eval();model.config.use_cache=True
    messages=[{'role':'system','content':[{'type':'text','text':SYSTEM}]},{'role':'user','content':[{'type':'image','image':image},{'type':'text','text':args.prompt}]}]
    inputs=processor.apply_chat_template(messages,tokenize=True,return_dict=True,return_tensors='pt',add_generation_prompt=True);inputs.pop('token_type_ids',None)
    if inputs['input_ids'].shape[1]>2048:raise ValueError('Input is too long; no truncation.')
    inputs={k:v.to(model.device) if hasattr(v,'to') else v for k,v in inputs.items()}
    parser=build_transformers_prefix_allowed_tokens_fn(processor.tokenizer,JsonSchemaParser(SCHEMA))
    with torch.inference_mode():tokens=model.generate(**inputs,max_new_tokens=160,do_sample=False,prefix_allowed_tokens_fn=parser)
    raw=processor.batch_decode(tokens[:,inputs['input_ids'].shape[-1]:],skip_special_tokens=True)[0];recipe=strict_recipe(raw)
    if recipe is None:raise ValueError('Invalid model output; no repair or substituted pattern.')
    command=['node',str(HERE.parent/'stitch-programs.mjs')]
    result=subprocess.run(command,input=json.dumps(recipe),capture_output=True,text=True,check=True,timeout=20);plan=json.loads(result.stdout)
    svg=None
    if not plan.get('needsClarification'):svg=subprocess.run(command+['--svg'],input=json.dumps(recipe),capture_output=True,text=True,check=True,timeout=20).stdout
    out.mkdir(parents=True);image.save(out/'reference.png');(out/'recipe.json').write_text(json.dumps(recipe,indent=2)+'\n');(out/'pattern.json').write_text(result.stdout)
    if svg:(out/'bead-chart.svg').write_text(svg)
    evidence={'prompt':args.prompt,'raw':raw,'task':'image-stitch-v1','model':MODEL,'revision':REVISION,'adapter_sha256':hashlib.sha256((adapter/'adapter_model.safetensors').read_bytes()).hexdigest(),'source_image_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'image_pixel_sha256':hashlib.sha256(image.tobytes()).hexdigest(),'image_preprocessing':'EXIF orientation, RGB, preserve aspect ratio and pad to 224 square','evaluation_scope':'synthetic flat references only','physicalSampleRequired':True,'finishingPlanned':False,'deployed':False}
    (out/'generation.json').write_text(json.dumps(evidence,indent=2)+'\n')
    print(json.dumps({'saved':str(out),'recipe':recipe,'needsClarification':plan.get('needsClarification',False),'beadCount':plan.get('beadCount'),'passagePreference':plan.get('passagePreference'),'finishing':plan.get('finishing')},indent=2))
if __name__=='__main__':main()

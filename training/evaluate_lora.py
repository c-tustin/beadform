"""Generate and schema-check held-out Beadform scenes with Qwen 2B."""
import argparse, json, hashlib
from pathlib import Path

HERE = Path(__file__).resolve().parent

def load_rows(path):
    rows = [json.loads(line) for line in Path(path).read_text().splitlines() if line.strip()]
    if not rows:
        raise ValueError('evaluation file is empty')
    for row in rows:
        if any(row.get(k) is not True for k in ('training_consent', 'reviewed', 'scene_validated')):
            raise ValueError('every evaluation example needs consent, review and scene validation')
        if not row.get('group') or not isinstance(row.get('prompt'), str) or not row['prompt'].strip():
            raise ValueError('each evaluation example needs a design family and original prompt')
        if row.get('image') and not Path(row['image']).is_file():
            raise ValueError(f"missing evaluation image: {row['image']}")
    return rows

def parse_json(text):
    decoder = json.JSONDecoder()
    for index, char in enumerate(text):
        if char == '{':
            try:
                value, _ = decoder.raw_decode(text[index:])
                if isinstance(value, dict):
                    return value
            except json.JSONDecodeError:
                continue
    return None

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--data', required=True)
    ap.add_argument('--output', required=True)
    ap.add_argument('--summary', required=True)
    ap.add_argument('--model', default='Qwen/Qwen3-VL-2B-Instruct')
    ap.add_argument('--adapter')
    ap.add_argument('--max-new-tokens', type=int, default=4096)
    ap.add_argument('--image-max-side', type=int, default=384)
    ap.add_argument('--resume', action='store_true',
                    help='keep completed rows in --output and continue with the rest')
    args = ap.parse_args()
    output, summary_path = Path(args.output), Path(args.summary)
    if summary_path.exists():
        ap.error('summary already exists; choose new output and summary paths')
    if args.max_new_tokens < 1 or args.image_max_side < 128:
        ap.error('--max-new-tokens must be positive and --image-max-side must be at least 128')
    rows = load_rows(args.data)
    completed = {}
    if output.exists():
        if not args.resume:
            ap.error('evaluation output exists; choose new paths or pass --resume')
        valid_lines = []
        for line in output.read_text().splitlines():
            try:
                item = json.loads(line)
            except json.JSONDecodeError:
                break
            completed[item['id']] = item
            valid_lines.append(json.dumps(item, ensure_ascii=False))
        output.write_text(''.join(line+'\n' for line in valid_lines))
    schema = json.loads((HERE.parent/'scene-schema.json').read_text())
    from jsonschema import validate
    import torch
    from PIL import Image
    from transformers import AutoProcessor, Qwen3VLForConditionalGeneration, BitsAndBytesConfig
    dtype = torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16
    processor = AutoProcessor.from_pretrained(args.model)
    model = Qwen3VLForConditionalGeneration.from_pretrained(
        args.model, device_map='auto', torch_dtype=dtype,
        quantization_config=BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_quant_type='nf4',
            bnb_4bit_use_double_quant=True, bnb_4bit_compute_dtype=dtype))
    if args.adapter:
        from peft import PeftModel
        model = PeftModel.from_pretrained(model, args.adapter)
    model.eval()
    system = (HERE/'system.txt').read_text()
    results = []
    output.parent.mkdir(parents=True, exist_ok=True)
    summary_path.parent.mkdir(parents=True, exist_ok=True)
    for index, row in enumerate(rows, 1):
        row_id = str(row.get('id') or hashlib.sha256(
            (row['group']+'\n'+row['prompt']+'\n'+json.dumps(row['scene'], sort_keys=True)).encode()
        ).hexdigest()[:16])
        if row_id in completed:
            results.append(completed[row_id])
            print(f'{index}/{len(rows)} {row["group"]}: already saved')
            continue
        content = [{'type': 'text', 'text': row['prompt']}]
        if row.get('image'):
            with Image.open(row['image']) as source:
                image = source.convert('RGB')
                image.thumbnail((args.image_max_side, args.image_max_side))
                content.append({'type': 'image', 'image': image.copy()})
        messages = [{'role': 'system', 'content': system}, {'role': 'user', 'content': content}]
        inputs = processor.apply_chat_template(messages, tokenize=True, return_dict=True,
            return_tensors='pt', add_generation_prompt=True)
        inputs = {key: value.to(model.device) if hasattr(value, 'to') else value
                  for key, value in inputs.items()}
        with torch.inference_mode():
            tokens = model.generate(**inputs, max_new_tokens=args.max_new_tokens, do_sample=False)
        raw = processor.batch_decode(tokens[:, inputs['input_ids'].shape[-1]:],
                                     skip_special_tokens=True)[0]
        prediction = parse_json(raw)
        error = None
        if prediction is None:
            error = 'no JSON object found in generated text'
        else:
            try:
                validate(prediction, schema)
            except Exception as exc:
                error = str(exc)
        item = {'id': row_id, 'group': row['group'], 'prompt': row['prompt'],
            'prediction': prediction, 'prediction_raw': raw, 'schema_valid': error is None,
            'validation_error': error, 'target': row['scene']}
        results.append(item)
        with output.open('a') as stream:
            stream.write(json.dumps(item, ensure_ascii=False)+'\n')
            stream.flush()
        print(f"{index}/{len(rows)} {row['group']}: schema {'pass' if error is None else 'fail'}")
        del inputs, tokens
    summary = {'model': args.model, 'adapter': args.adapter, 'examples': len(results),
        'schema_valid': sum(item['schema_valid'] for item in results),
        'schema_pass_rate': sum(item['schema_valid'] for item in results)/len(results),
        'note': 'Schema validity is not compiler or physical validation.'}
    summary_path.write_text(json.dumps(summary, indent=2)+'\n')
    print(json.dumps(summary, indent=2))

if __name__ == '__main__':
    main()

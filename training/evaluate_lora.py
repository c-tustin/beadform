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
    # Read only the outer object. A valid nested part must not masquerade as a scene.
    start = text.find('{')
    if start < 0:
        return None
    try:
        value, _ = json.JSONDecoder().raw_decode(text[start:])
    except json.JSONDecodeError:
        return None
    return value if isinstance(value, dict) else None


def close_json_object(text):
    """Close unmatched delimiters only; never invent scene content."""
    start = text.find('{')
    if start < 0:
        return None
    stack = []
    quoted = escaped = False
    for char in text[start:]:
        if quoted:
            if escaped:
                escaped = False
            elif char == '\\':
                escaped = True
            elif char == '"':
                quoted = False
            continue
        if char == '"':
            quoted = True
        elif char in '[{':
            stack.append(char)
        elif char in ']}':
            expected = '[' if char == ']' else '{'
            if not stack or stack.pop() != expected:
                return None
    if quoted:
        return None
    try:
        value = json.loads(text[start:] + ''.join(']' if x == '[' else '}' for x in reversed(stack)))
    except json.JSONDecodeError:
        return None
    return value if isinstance(value, dict) else None

def repair_scene(value):
    """Conservatively remove schema-extraneous output and record every change."""
    if not isinstance(value, dict):
        return None, []
    changes = []
    allowed_root = {'title', 'notes', 'parts'}
    result = {key: value[key] for key in allowed_root if key in value}
    for key in value:
        if key not in allowed_root:
            changes.append(f'removed top-level key {key!r}')
    if not isinstance(result.get('parts'), list):
        return result, changes
    allowed_part = {'name', 'type', 'role', 'center', 'size', 'end', 'color'}
    parts = []
    for index, part in enumerate(result['parts']):
        if not isinstance(part, dict):
            parts.append(part)
            continue
        fixed = {key: part[key] for key in allowed_part if key in part}
        for key in part:
            if key not in allowed_part:
                changes.append(f'part {index}: removed key {key!r}')
        for key in ('center', 'size', 'end'):
            coordinates = fixed.get(key)
            if isinstance(coordinates, list) and len(coordinates) > 3:
                fixed[key] = coordinates[:3]
                changes.append(f'part {index}: truncated {key} to three values')
        parts.append(fixed)
    result['parts'] = parts
    return result, changes

def score_output(raw, schema):
    from jsonschema import Draft202012Validator
    validator = Draft202012Validator(schema)
    original = parse_json(raw)
    candidate = original
    changes = []
    # Never replace the raw prediction with the repaired candidate.
    if candidate is None:
        candidate = close_json_object(raw)
        if candidate is not None:
            changes.append('closed unmatched JSON delimiters at end of output')
    candidate, edits = repair_scene(candidate)
    changes.extend(edits)
    def errors(value):
        if value is None:
            return ['no JSON object found in generated text']
        return [error.message for error in validator.iter_errors(value)]
    raw_errors, repaired_errors = errors(original), errors(candidate)
    return dict(prediction=original, prediction_raw=raw,
                schema_valid=not raw_errors, validation_error='; '.join(raw_errors) or None,
                repaired_prediction=candidate, repairs=changes,
                repaired_schema_valid=not repaired_errors,
                repaired_validation_error='; '.join(repaired_errors) or None)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--data', required=True)
    ap.add_argument('--output', required=True)
    ap.add_argument('--summary', required=True)
    ap.add_argument('--model', default='Qwen/Qwen3-VL-2B-Instruct')
    ap.add_argument('--adapter')
    ap.add_argument('--offline-predictions', help='rescore saved prediction_raw JSONL without loading a model')
    ap.add_argument('--constrained', action='store_true', help='filter next tokens using the scene schema')
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
    if args.offline_predictions and args.resume:
        ap.error('offline rescoring writes new artifacts; do not use --resume')
    identity = dict(model=args.model, adapter=args.adapter,
                    constrained=args.constrained, max_new_tokens=args.max_new_tokens,
                    image_max_side=args.image_max_side,
                    data_sha256=hashlib.sha256(Path(args.data).read_bytes()).hexdigest(),
                    system_sha256=hashlib.sha256((HERE/'system.txt').read_bytes()).hexdigest())
    manifest = output.with_suffix(output.suffix + '.metadata.json')
    if not args.offline_predictions:
        if output.exists() and (not manifest.exists() or json.loads(manifest.read_text()) != identity):
            ap.error('resume configuration is missing or changed; choose a new output path')
        output.parent.mkdir(parents=True, exist_ok=True)
        manifest.write_text(json.dumps(identity, indent=2)+'\n')
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
    if args.offline_predictions:
        saved = [json.loads(line) for line in Path(args.offline_predictions).read_text().splitlines() if line.strip()]
        expected = {str(row['id']): row for row in rows}
        if len(saved) != len(expected) or {str(item['id']) for item in saved} != set(expected):
            raise ValueError('saved predictions must match the full evaluation ID set exactly')
        results = []
        for item in saved:
            row = expected[str(item['id'])]
            if item['prompt'] != row['prompt'] or item['group'] != row['group']:
                raise ValueError('saved prediction input does not match evaluation data')
            results.append({**item, **score_output(item['prediction_raw'], schema)})
        if output.exists():
            raise ValueError('offline output already exists; choose a new path')
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(''.join(json.dumps(item, allow_nan=False)+'\n' for item in results))
        summary_path.parent.mkdir(parents=True, exist_ok=True)
        report = {}
        for key in ('schema_valid', 'repaired_schema_valid'):
            report[key] = sum(bool(item[key]) for item in results)
            report[key.replace('valid', 'pass_rate')] = report[key] / len(results)
        report.update(examples=len(results), mode='offline rescore; no new model generation',
                      note='Repair is postprocessing, not model improvement or physical validation.')
        summary_path.write_text(json.dumps(report, indent=2)+'\n')
        print(json.dumps(report, indent=2))
        return
    import torch
    from PIL import Image
    from transformers import AutoProcessor, Qwen3VLForConditionalGeneration, BitsAndBytesConfig
    if not torch.cuda.is_available():
        raise RuntimeError('No free CUDA GPU available. Offline scoring remains available.')
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
            saved = completed[row_id]
            if saved.get('prompt') != row['prompt'] or saved.get('group') != row['group']:
                raise ValueError('resume inputs differ; choose a new output')
            results.append({**saved, **score_output(saved['prediction_raw'], schema)})
            print(f'{index}/{len(rows)} {row["group"]}: already saved')
            continue
        content = [{'type': 'text', 'text': row['prompt']}]
        if row.get('image'):
            with Image.open(row['image']) as source:
                image = source.convert('RGB')
                image.thumbnail((args.image_max_side, args.image_max_side))
                content.append({'type': 'image', 'image': image.copy()})
        messages = [{'role': 'system', 'content': [{'type': 'text', 'text': system}]}, {'role': 'user', 'content': content}]
        inputs = processor.apply_chat_template(messages, tokenize=True, return_dict=True,
            return_tensors='pt', add_generation_prompt=True)
        inputs = {key: value.to(model.device) if hasattr(value, 'to') else value
                  for key, value in inputs.items()}
        generation_options = {}
        if args.constrained:
            from lmformatenforcer import JsonSchemaParser
            from lmformatenforcer.integrations.transformers import build_transformers_prefix_allowed_tokens_fn
            # Fresh parser for each independent generation; tokenizer comes from the processor.
            generation_options['prefix_allowed_tokens_fn'] = build_transformers_prefix_allowed_tokens_fn(
                processor.tokenizer, JsonSchemaParser(schema))
        with torch.inference_mode():
            tokens = model.generate(**inputs, max_new_tokens=args.max_new_tokens,
                                    do_sample=False, **generation_options)
        raw = processor.batch_decode(tokens[:, inputs['input_ids'].shape[-1]:],
                                     skip_special_tokens=True)[0]
        scored = score_output(raw, schema)
        item = {'id': row_id, 'group': row['group'], 'prompt': row['prompt'],
                **scored, 'target': row['scene']}
        results.append(item)
        with output.open('a') as stream:
            stream.write(json.dumps(item, ensure_ascii=False)+'\n')
            stream.flush()
        print(f"{index}/{len(rows)} {row['group']}: raw {item['schema_valid']}; repaired {item['repaired_schema_valid']}")
        del inputs, tokens
    summary = {'model': args.model, 'adapter': args.adapter, 'constrained': args.constrained, 'examples': len(results),
        'schema_valid': sum(item['schema_valid'] for item in results),
        'schema_pass_rate': sum(item['schema_valid'] for item in results)/len(results),
        'repaired_schema_valid': sum(item['repaired_schema_valid'] for item in results),
        'repaired_schema_pass_rate': sum(item['repaired_schema_valid'] for item in results)/len(results),
        'note': 'Repaired scores use a conservative postprocessor and are not compiler or physical validation.'}
    summary_path.write_text(json.dumps(summary, indent=2)+'\n')
    print(json.dumps(summary, indent=2))

if __name__ == '__main__':
    main()

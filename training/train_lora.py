"""Single NVIDIA GPU QLoRA starter. Run --check first; no data is uploaded."""
import argparse, json
from pathlib import Path

HERE = Path(__file__).resolve().parent

def load_rows(path):
    path = Path(path).resolve()
    rows = [json.loads(line) for line in path.read_text().splitlines() if line.strip()]
    if not rows:
        raise ValueError(f'{path}: no examples')
    for r in rows:
        if any(r.get(k) is not True for k in ('training_consent', 'reviewed', 'scene_validated')):
            raise ValueError('every example needs training_consent, reviewed and scene_validated set to true')
        if not r.get('group') or not isinstance(r.get('prompt'), str) or not r['prompt'].strip():
            raise ValueError('each example needs an animal/design group and input prompt')
        if not isinstance(r.get('scene'), dict):
            raise ValueError('scene must contain the corrected target JSON, not an uncorrected export')
        from jsonschema import validate
        validate(r['scene'], json.loads((HERE.parent/'scene-schema.json').read_text()))
        if r.get('image'):
            image = (path.parent/r['image']).resolve()
            if not image.is_file():
                raise ValueError(f'missing input image: {image}')
            r['image'] = str(image)
    return rows

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--train', required=True)
    ap.add_argument('--eval', required=True)
    ap.add_argument('--check', action='store_true')
    ap.add_argument('--model', default='Qwen/Qwen3-VL-2B-Instruct')
    ap.add_argument('--output', default='beadform-qwen-lora')
    ap.add_argument('--epochs', type=float, default=1)
    a = ap.parse_args()
    train, evaluation = load_rows(a.train), load_rows(a.eval)
    if {r['group'] for r in train} & {r['group'] for r in evaluation}:
        raise ValueError('keep entire animal/design groups out of training for evaluation')
    print(f'validated {len(train)} training and {len(evaluation)} evaluation examples')
    if a.check:
        return
    import torch
    from PIL import Image
    from transformers import AutoProcessor, Qwen3VLForConditionalGeneration, BitsAndBytesConfig, Trainer, TrainingArguments
    from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
    if not torch.cuda.is_available():
        raise RuntimeError('this QLoRA recipe needs an NVIDIA CUDA GPU; use a GPU notebook, not a Mac CPU')
    dtype = torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16
    processor = AutoProcessor.from_pretrained(a.model)
    model = Qwen3VLForConditionalGeneration.from_pretrained(
        a.model, device_map={'': 0}, torch_dtype=dtype,
        quantization_config=BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_quant_type='nf4',
            bnb_4bit_use_double_quant=True, bnb_4bit_compute_dtype=dtype))
    model = prepare_model_for_kbit_training(model, use_gradient_checkpointing=True)
    # Adapt language attention only, preserving the vision encoder for this small dataset.
    targets = [n for n, _ in model.named_modules()
               if 'language_model' in n and n.rsplit('.', 1)[-1] in ('q_proj', 'v_proj')]
    if not targets:
        raise RuntimeError('model architecture changed: inspect module names before training')
    model = get_peft_model(model, LoraConfig(r=16, lora_alpha=32, lora_dropout=0.05,
        target_modules=targets, bias='none', task_type='CAUSAL_LM'))
    model.config.use_cache = False
    model.print_trainable_parameters()
    system = (HERE/'system.txt').read_text()

    def collate(rows):
        # A single full example avoids padding/image alignment errors and never truncates image tokens.
        assert len(rows) == 1
        r = rows[0]
        content = [{'type': 'text', 'text': r['prompt']}]
        if r.get('image'):
            with Image.open(r['image']) as im:
                im = im.convert('RGB'); im.thumbnail((512, 512)); im = im.copy()
            content.append({'type': 'image', 'image': im})
        prompt = [{'role': 'system', 'content': system}, {'role': 'user', 'content': content}]
        full = prompt + [{'role': 'assistant', 'content': [{'type': 'text', 'text': json.dumps(r['scene'])}]}]
        batch = processor.apply_chat_template(full, tokenize=True, return_dict=True, return_tensors='pt', add_generation_prompt=False)
        prefix = processor.apply_chat_template(prompt, tokenize=True, return_dict=True, return_tensors='pt', add_generation_prompt=True)['input_ids']
        n = prefix.shape[1]
        if not torch.equal(batch['input_ids'][:, :n], prefix):
            raise ValueError('chat template prefix mismatch: refusing to train with incorrect loss masking')
        if batch['input_ids'].shape[1] > 12000:
            raise ValueError('example is too long; simplify its parts rather than truncating image tokens')
        labels = batch['input_ids'].clone(); labels[:, :n] = -100
        batch['labels'] = labels
        return batch

    trainer = Trainer(model=model, train_dataset=train, eval_dataset=evaluation, data_collator=collate,
        args=TrainingArguments(output_dir=a.output, per_device_train_batch_size=1,
            per_device_eval_batch_size=1, gradient_accumulation_steps=8, learning_rate=1e-4,
            num_train_epochs=a.epochs, bf16=dtype==torch.bfloat16, fp16=dtype==torch.float16,
            gradient_checkpointing=True, gradient_checkpointing_kwargs={'use_reentrant': False},
            remove_unused_columns=False, eval_strategy='epoch', save_strategy='epoch',
            save_total_limit=2, logging_steps=1, report_to='none', seed=42))
    trainer.train()
    trainer.save_model(a.output)
    processor.save_pretrained(a.output)
    print('saved a LoRA adapter; it still requires the exact base model for inference')

if __name__ == '__main__':
    main()

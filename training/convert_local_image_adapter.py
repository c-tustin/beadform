"""Convert only the audited image-stitch-v1 q/v LoRA; no Torch required.

Mapping follows llama.cpp 6f1e654's Qwen3VLTextModel and
convert_lora_to_gguf.py. This is deliberately not a general PEFT converter.
"""
import argparse
import hashlib
import json
import re
from pathlib import Path

import gguf
import numpy as np
from safetensors.numpy import load_file

EXPECTED = '4037c83f7e07b9bf6c11361b433eaef416c344d1dbe8c9f6c671760a3adc00f1'


def convert(folder, output):
    folder, output = Path(folder), Path(output)
    weights = folder / 'adapter_model.safetensors'
    if hashlib.sha256(weights.read_bytes()).hexdigest() != EXPECTED:
        raise ValueError('Not the verified image-stitch-v1 adapter. Refusing conversion.')
    config = json.loads((folder / 'adapter_config.json').read_text())
    if config.get('r') != 16 or config.get('lora_alpha') != 32 or config.get('use_rslora', False) or config.get('use_dora', False):
        raise ValueError('Unsupported adapter scaling.')
    tensors = load_file(weights)
    mapped = {}
    for name, value in tensors.items():
        match = re.fullmatch(r'base_model\.model\.model\.language_model\.layers\.(\d+)\.self_attn\.([qv])_proj\.lora_([AB])\.weight', name)
        if not match:
            raise ValueError(f'Unexpected tensor: {name}')
        layer, projection, side = match.groups()
        if not 0 <= int(layer) < 28:
            raise ValueError('Unexpected layer.')
        expected = (16, 2048) if side == 'A' else (2048 if projection == 'q' else 1024, 16)
        if value.shape != expected or value.dtype != np.float32 or not np.isfinite(value).all():
            raise ValueError(f'Unexpected tensor shape/type: {name}')
        dest = f'blk.{layer}.attn_{projection}.weight.lora_{side.lower()}'
        mapped[dest] = np.ascontiguousarray(value)
    if len(mapped) != 112:
        raise ValueError('Expected 112 tensors.')
    writer = gguf.GGUFWriter(str(output), 'qwen3vl')
    writer.add_type('adapter')
    writer.add_string('adapter.type', 'lora')
    writer.add_float32('adapter.lora.alpha', 32.0)
    for name, value in sorted(mapped.items()):
        writer.add_tensor(name, value)
    writer.write_header_to_file()
    writer.write_kv_data_to_file()
    writer.write_tensors_to_file()
    writer.close()
    # Read back every float, rather than only trusting that the writer returned.
    reader = gguf.GGUFReader(str(output))
    if len(reader.tensors) != len(mapped):
        raise ValueError('GGUF tensor count mismatch.')
    for tensor in reader.tensors:
        if not np.array_equal(tensor.data, mapped[tensor.name]):
            raise ValueError(f'Conversion changed values: {tensor.name}')
    print(json.dumps({'source_sha256': EXPECTED, 'tensors': len(mapped),
                      'output': str(output), 'sha256': hashlib.sha256(output.read_bytes()).hexdigest()}, indent=2))


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('adapter_folder')
    p.add_argument('output')
    a = p.parse_args()
    convert(a.adapter_folder, a.output)

"""CPU-only numerical check against the unchanged parent and audited image adapter."""
import argparse,hashlib,json
from pathlib import Path
from safetensors.torch import load_file
import torch

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--run',required=True);parser.add_argument('--parent-adapter',required=True);args=parser.parse_args()
    run=Path(args.run);parent=Path(args.parent_adapter)
    metadata=json.loads((run/'metadata.json').read_text());audit=json.loads((run/'audit.json').read_text())
    old_path=parent/'adapter_model.safetensors';new_path=run/'adapter/adapter_model.safetensors'
    old_sha=hashlib.sha256(old_path.read_bytes()).hexdigest();new_sha=hashlib.sha256(new_path.read_bytes()).hexdigest()
    if old_sha!=metadata['parent_adapter_sha256'] or new_sha!=audit['adapter_sha256']:raise ValueError('Parent or new adapter hash mismatch.')
    old=load_file(str(old_path),device='cpu');new=load_file(str(new_path),device='cpu')
    if set(old)!=set(new):raise ValueError('Tensor names differ.')
    changed_tensors=changed_elements=total_elements=0;maximum_delta=0.0
    for key,a in old.items():
        b=new[key]
        if a.shape!=b.shape:raise ValueError('Tensor shapes differ.')
        count=int(torch.count_nonzero(a!=b));changed_tensors+=int(count>0);changed_elements+=count;total_elements+=a.numel()
        maximum_delta=max(maximum_delta,float((a.float()-b.float()).abs().max()))
    if not changed_elements:raise ValueError('No numerical weight updates.')
    report={'parent_unchanged':True,'new_matches_audit':True,'parent_sha256':old_sha,'adapter_sha256':new_sha,'changed_tensors':changed_tensors,'tensor_count':len(old),'changed_elements':changed_elements,'total_elements':total_elements,'maximum_absolute_change':maximum_delta}
    (run/'weight-change.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
if __name__=='__main__':main()

"""Run after Colab GPU/Drive/dependency setup. No retraining or paid endpoint."""
import sys,subprocess,json,uuid,html,io,tempfile
from pathlib import Path
import ipywidgets as widgets
from IPython.display import display,HTML,SVG
from PIL import Image,ImageOps

trial_repo=Path(__file__).resolve().parent.parent
adapter_path=Path('/content/drive/MyDrive/Beadform-free-qwen/runs/stitch-program-v1/adapter')
if not (adapter_path/'adapter_model.safetensors').is_file():
    raise FileNotFoundError('Connect the Drive account containing the completed stitch-program-v1 adapter. No retraining is needed.')
prompt_box=widgets.Textarea(value='A flat triangular wing, six foundation beads and four rows total',description='Design:',layout=widgets.Layout(width='95%',height='90px'))
image_upload=widgets.FileUpload(accept='.png,.jpg,.jpeg,.webp',multiple=False,description='Upload image')
clear_image=widgets.Button(description='Clear image')
image_preview=widgets.Output()
generate_button=widgets.Button(description='Generate pattern',button_style='primary')
result_box=widgets.Output()

def image_bytes():
    value=image_upload.value
    if not value:return None
    item=next(iter(value.values())) if isinstance(value,dict) else value[0]
    data=bytes(item['content'])
    if len(data)>10*1024*1024:raise ValueError('Use an image smaller than 10 MB.')
    return data

def decode_image(data):
    with Image.open(io.BytesIO(data)) as original:
        if original.format not in {'PNG','JPEG','WEBP'}:raise ValueError('Use PNG, JPEG or WebP.')
        if original.width*original.height>20_000_000:raise ValueError('Use an image below 20 megapixels.')
        image=ImageOps.exif_transpose(original).convert('RGB')
        image.thumbnail((896,896))
        return image

def show_image(_):
    with image_preview:
        image_preview.clear_output()
        try:
            data=image_bytes()
            if data:
                image=decode_image(data);image.thumbnail((300,300));display(image)
                print('Reference attached. Image accuracy has not been evaluated. Add dimensions in the Design box.')
        except Exception as error:print(str(error))

def remove_image(_):
    global image_upload
    previous=image_upload
    image_upload=widgets.FileUpload(accept='.png,.jpg,.jpeg,.webp',multiple=False,description='Upload image')
    image_upload.observe(show_image,names='value')
    upload_controls.children=(image_upload,clear_image)
    previous.close();image_preview.clear_output()
image_upload.observe(show_image,names='value')
clear_image.on_click(remove_image)

def make_pattern(_):
    generate_button.disabled=True
    with result_box:
        result_box.clear_output(wait=True)
        try:
            if not prompt_box.value.strip():raise ValueError('Describe the design and its bead dimensions first.')
            data=image_bytes()
            image=decode_image(data) if data else None
            print('Loading saved weights and generating a draft; the first request may take a few minutes.',flush=True)
            output_path=Path('/content/drive/MyDrive/Beadform-free-qwen/generated')/('try-'+uuid.uuid4().hex[:12])
            with tempfile.TemporaryDirectory(prefix='beadform-reference-') as temp:
                command=[sys.executable,str(trial_repo/'training/generate_stitch_pattern.py'),'--adapter',str(adapter_path),'--prompt',prompt_box.value,'--output',str(output_path)]
                if image is not None:
                    image_path=Path(temp)/'reference.png';image.save(image_path)
                    command.extend(['--image',str(image_path)])
                completed=subprocess.run(command,cwd=trial_repo,capture_output=True,text=True)
                if completed.returncode:raise RuntimeError(completed.stderr[-2500:] or completed.stdout[-2500:])
            plan=json.loads((output_path/'pattern.json').read_text())
            print('Selected recipe:',plan.get('recipe'))
            if plan.get('needsClarification'):
                print('Specify one supported flat swatch and dimensions: peyote, brick, ladder, RAW or square. Tubes and complete 3D objects are not supported by this pilot.')
            else:
                print('Beads:',plan.get('beadCount'))
                print('Assembly passage report:',plan.get('passagePreference'))
                if image is not None:print('Experimental image-conditioned suggestion: review the selected stitch and shape against your reference.')
                display(SVG(filename=str(output_path/'bead-chart.svg')))
                lines=[]
                for step in plan.get('steps',[]):
                    actions=[]
                    for op in step.get('operations',[]):
                        if op['kind']=='pick':actions.append('Pick up '+str(op['id']))
                        elif op['kind']=='pass':actions.append('Pass through '+str(op['id']))
                        else:actions.append('Pass under thread bridge between '+' and '.join(op.get('between',[])))
                    lines.append('<h4>'+html.escape(step.get('label','Step'))+'</h4><p>'+html.escape(step.get('note',''))+'</p><ol>'+''.join('<li>'+html.escape(a)+'</li>' for a in actions)+'</ol>')
                display(HTML(''.join(lines)))
            print('Saved in your Google Drive:',output_path)
            print('Draft only. Five-pass report covers assembly; starting/finishing and physical beadability still require sampling.')
        except Exception as error:print('Generation stopped:',str(error))
        finally:generate_button.disabled=False

generate_button.on_click(make_pattern)
display(HTML('<h3>Try Beadform — text or image + text</h3><p>Upload an optional reference, describe one small flat swatch, and specify bead dimensions (2–12 beads/units, up to 12 rows). Click Generate pattern.</p><p>Images are processed on this Colab GPU. A resized reference is saved with the result in your Drive. Nothing is published or added to training. Image-conditioned pattern generation is not ready: a live triangle check was recognized by vision but declined by the recipe adapter. The current training scores cover text only. This pilot does not reproduce arbitrary silhouettes, colors or whole 3D objects.</p>'))
upload_controls=widgets.HBox([image_upload,clear_image])
display(prompt_box,upload_controls,image_preview,generate_button,result_box)
print('Ready. Upload a reference or use text, then click Generate pattern.')

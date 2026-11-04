"""Run after Colab GPU/Drive/dependency setup. No retraining or paid endpoint."""
import sys,subprocess,json,uuid,html,io,tempfile
from pathlib import Path
import ipywidgets as widgets
from IPython.display import display,HTML,SVG
from PIL import Image,ImageOps

trial_repo=Path(__file__).resolve().parent.parent
adapter_path=Path('/content/drive/MyDrive/Beadform-free-qwen/runs/image-stitch-v1/adapter')
image_run=adapter_path.parent
comparison=json.loads((image_run/'comparison.json').read_text())
audit=json.loads((image_run/'audit.json').read_text())
import hashlib
if audit.get('status')!='verified' or audit['adapter_sha256']!=hashlib.sha256((adapter_path/'adapter_model.safetensors').read_bytes()).hexdigest():
    raise RuntimeError('A completed evaluation and matching audited weights are required.')
if not (adapter_path/'adapter_model.safetensors').is_file():
    raise FileNotFoundError('Connect the Drive account containing the completed image-stitch-v1 adapter. No retraining is needed.')
prompt_box=widgets.Textarea(value='Choose a suitable supported stitch for this flat reference. Target width 8, total rows 5.',description='Design:',layout=widgets.Layout(width='95%',height='90px'))
image_upload=widgets.FileUpload(accept='.png,.jpg,.jpeg,.webp',multiple=False,description='Upload image')
clear_image=widgets.Button(description='Clear image')
sample_button=widgets.Button(description='Use sample triangle')
sample_data=None
image_preview=widgets.Output()
generate_button=widgets.Button(description='Generate pattern',button_style='primary')
result_box=widgets.Output()

def image_bytes():
    if sample_data is not None:return sample_data
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

def show_image(change):
    global sample_data
    if change is not None:sample_data=None
    with image_preview:
        image_preview.clear_output()
        try:
            data=image_bytes()
            if data:
                image=decode_image(data);image.thumbnail((300,300));display(image)
                print('Reference attached. Evaluation covers synthetic flat references only. Add dimensions in the Design box; review results for your image.')
        except Exception as error:print(str(error))

def remove_image(_):
    global image_upload,sample_data
    previous=image_upload;sample_data=None
    image_upload=widgets.FileUpload(accept='.png,.jpg,.jpeg,.webp',multiple=False,description='Upload image')
    image_upload.observe(show_image,names='value')
    upload_controls.children=(image_upload,clear_image)
    previous.close()
    image_preview.clear_output()

def choose_sample(_):
    global sample_data
    from PIL import ImageDraw
    remove_image(None)
    image=Image.new('RGB',(224,224),'white')
    ImageDraw.Draw(image).polygon([(28,192),(112,32),(196,192)],fill='green')
    buffer=io.BytesIO();image.save(buffer,format='PNG');sample_data=buffer.getvalue()
    prompt_box.value='Make the pictured flat shape with six foundation beads and four rows total. Select a suitable supported stitch.'
    show_image(None)
    with image_preview:print('Using an authored triangle sample; uploading your own image replaces it. This is the known regression case, not an unseen benchmark.')
image_upload.observe(show_image,names='value')
clear_image.on_click(remove_image)
sample_button.on_click(choose_sample)

def make_pattern(_):
    generate_button.disabled=True
    with result_box:
        result_box.clear_output(wait=True)
        try:
            if not prompt_box.value.strip():raise ValueError('Describe the design and its bead dimensions first.')
            data=image_bytes()
            if not data:raise ValueError('Upload one reference image first. This interface uses the new image-trained adapter.')
            image=decode_image(data)
            print('Loading saved weights and generating a draft; the first request may take a few minutes.',flush=True)
            output_path=Path('/content/drive/MyDrive/Beadform-free-qwen/generated')/('try-'+uuid.uuid4().hex[:12])
            with tempfile.TemporaryDirectory(prefix='beadform-reference-') as temp:
                command=[sys.executable,str(trial_repo/'training/generate_image_stitch.py'),'--adapter',str(adapter_path),'--prompt',prompt_box.value,'--output',str(output_path)]
                if image is not None:
                    image_path=Path(temp)/'reference.png';image.save(image_path)
                    command.extend(['--image',str(image_path)])
                completed=subprocess.run(command,cwd=trial_repo,capture_output=True,text=True)
                if completed.returncode:
                    detail=completed.stderr.lower()
                    if 'out of memory' in detail:message='The free GPU ran out of memory. Stop other GPU tasks, reconnect and try again.'
                    elif 'cuda' in detail and 'unavailable' in detail:message='Reconnect a free GPU runtime, then try again.'
                    elif 'filenotfounderror' in detail:message='The saved adapter or a required file is missing. Check the connected Drive account.'
                    else:message='The model could not produce a valid supported draft. Check the dimensions (including even peyote width and triangle row limits), or try a clearer flat reference.'
                    print('No draft saved. '+message)
                    return
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
display(HTML('<h3>Try the new image-trained Beadform adapter</h3><p>Upload a reference and describe one small flat swatch with bead dimensions (2–12 beads/units, up to 12 rows). Ladder uses one row; peyote starter width must be even. Click Generate pattern.</p><p>Experimental: evaluation covers synthetic flat references, not arbitrary photos, colors or whole 3D objects. Images run on this free Colab GPU; a resized reference and draft stay in your Drive. Nothing is automatically published or added to training.</p>'))
print('Synthetic development exact recipes:',comparison['before']['dev']['exact_recipes'],'before ->',comparison['after']['dev']['exact_recipes'],'after, out of',comparison['after']['dev']['examples'])
print('Synthetic challenge exact recipes:',comparison['before']['challenge']['exact_recipes'],'before ->',comparison['after']['challenge']['exact_recipes'],'after, out of',comparison['after']['challenge']['examples'])
print('Audited adapter SHA256:',audit['adapter_sha256'])
upload_controls=widgets.HBox([image_upload,clear_image])
display(prompt_box,upload_controls,sample_button,image_preview,generate_button,result_box)
print('Ready. Upload a reference, enter dimensions and click Generate pattern.')

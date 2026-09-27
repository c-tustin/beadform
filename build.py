from pathlib import Path
import base64, json
p=Path(__file__).parent
s=p.joinpath('shell.html').read_text()
for label,filename in [('STYLE','style.css'),('VOLUME_STYLE','volume-style.css'),('ENGINE','engine.js'),('APP','app.js'),('SHAPE_ENGINE','shape-engine.js'),('VOLUME_ENGINE','volume-engine.js'),('THREAD_DIAGRAM','thread-diagram.js'),('STAGE_GUIDE','stage-guide.js'),('PEYOTE_BALL','peyote-ball.js'),('CONSTRUCTION_GRAPH','construction-graph.js'),('PARTS_ENGINE','parts-engine.js'),('CONTINUOUS_THREAD','continuous-thread.js'),('PARTS_APP','parts-app.js'),('VOLUME_APP','volume-app.js'),('CREATOR_APP','creator-app.js'),('CONNECTION_APP','connection-app.js'),('JOURNEY_APP','journey-app.js'),('FINISHED_APP','finished-app.js'),('PLAYFUL_APP','playful-app.js'),('FLOAT_PHYSICS','float-physics.js'),('SHAPE_REFERENCE','shape-reference.js'),('MAKER_TOOLS','maker-tools.js'),('PATTERN_SOURCES','pattern-sources.js')]:
    s=s.replace('/*'+label+'*/',p.joinpath(filename).read_text())
s=s.replace('<!--VOLUME_HTML-->',p.joinpath('volume-shell.html').read_text())
names=['frog','caterpillar','blue-lizard','jellyfish','starfish','crocodile']
assets=[{'name':name,'src':'data:image/webp;base64,'+base64.b64encode(p.joinpath('assets',name+'.webp').read_bytes()).decode()} for name in names]
s=s.replace("['frog','caterpillar','blue-lizard','jellyfish','starfish','crocodile'].map(name=>({name,src:'assets/'+name+'.webp'}))",json.dumps(assets))
p.joinpath('beadform.html').write_text(s)
print('Built beadform.html:',len(s.encode()),'bytes')

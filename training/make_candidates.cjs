// Synthetic scene drafts for human review; never approve these automatically.
const fs = require('node:fs');
const path = require('node:path');
require('../shape-engine.js');
const P = require('../parts-engine.js');
const part = (name, type, center, size, color, end = center, role = 'solid') =>
  ({ name, type, center, size, color, end, role });

const animalRows = ['frog', 'fish', 'bunny', 'bear', 'butterfly', 'turtle', 'bird'].map(group => {
  const scene = P.example(group);
  scene.notes = 'original generated draft; human and physical review required';
  return { group, prompt: `a small ${group} bead animal with a rounded body and simple features`, scene };
});

const extras = [
  {
    group: 'flower', prompt: 'a simple bead flower with five pink petals, a yellow center, green stem, and two leaves',
    scene: { title: 'five-petal garden flower', notes: '', parts: [
      part('green stem', 'capsule', [0, -0.65, 0], [.12, .12, .12], '#679d71', [0, -1.7, 0]),
      part('left leaf', 'ellipsoid', [-.45, -.8, 0], [.48, .22, .3], '#7caa80', [-.45, -.8, 0]),
      part('right leaf', 'ellipsoid', [.45, -.45, 0], [.48, .22, .3], '#a9c8a0', [.45, -.45, 0]),
      part('flower center', 'ellipsoid', [0, .65, 0], [.35, .35, .3], '#dfb85c'),
      ...Array.from({length: 5}, (_, i) => { const a = i * Math.PI * 2 / 5; return part(`petal ${i+1}`, 'ellipsoid', [Math.cos(a)*.62, .65+Math.sin(a)*.62, 0], [.4, .4, .3], '#e69db4'); })
    ]}
  },
  {
    group: 'mushroom', prompt: 'a small red bead mushroom with a cream stem and three pale cap spots',
    scene: { title: 'spotted woodland mushroom', notes: '', parts: [
      part('cream stem', 'ellipsoid', [0, -.1, 0], [.42, .8, .42], '#e6e8be'),
      part('red cap', 'ellipsoid', [0, .62, 0], [1.05, .48, .9], '#d88978'),
      ...[-1, 0, 1].map((x, i) => part(`pale cap spot ${i+1}`, 'ellipsoid', [x*.52, .78, .72], [.15, .15, .12], '#fff3db', undefined, 'paint'))
    ]}
  },
  {
    group: 'cactus', prompt: 'a small potted bead cactus with two arms and a pink flower',
    scene: { title: 'potted cactus', notes: '', parts: [
      part('terracotta pot', 'box', [0, -1, 0], [1.15, .75, .85], '#d88978'),
      part('main cactus', 'ellipsoid', [0, -.05, 0], [.42, 1.15, .4], '#679d71'),
      part('left arm', 'capsule', [-.42, .05, 0], [.2, .2, .2], '#7caa80', [-.68, .48, 0]),
      part('left arm tip', 'capsule', [-.68, .48, 0], [.2, .2, .2], '#7caa80', [-.68, .82, 0]),
      part('right arm', 'capsule', [.42, -.1, 0], [.2, .2, .2], '#7caa80', [.68, .22, 0]),
      part('right arm tip', 'capsule', [.68, .22, 0], [.2, .2, .2], '#7caa80', [.68, .62, 0]),
      part('pink flower', 'ellipsoid', [0, 1.12, .12], [.32, .26, .22], '#e69db4')
    ]}
  },
  {
    group: 'house', prompt: 'a tiny bead cottage with a green roof, door, and two blue windows',
    scene: { title: 'tiny garden cottage', notes: '', parts: [
      part('cream house body', 'box', [0, 0, 0], [1.45, 1.2, .9], '#e6e8be'),
      part('green roof', 'box', [0, .76, 0], [1.7, .38, 1.05], '#679d71'),
      part('front door', 'box', [0, -.42, .48], [.38, .65, .12], '#d88978', undefined, 'paint'),
      part('left blue window', 'box', [-.48, .12, .49], [.32, .3, .12], '#7fa9c7', undefined, 'paint'),
      part('right blue window', 'box', [.48, .12, .49], [.32, .3, .12], '#7fa9c7', undefined, 'paint'),
      part('door knob', 'ellipsoid', [.13, -.42, .56], [.06, .06, .04], '#dfb85c', undefined, 'paint')
    ]}
  },
  {
    group: 'rocket', prompt: 'a small red and white bead rocket with two fins and a round blue window',
    scene: { title: 'little red rocket', notes: '', parts: [
      part('white rocket body', 'capsule', [0, 0, 0], [.48, .48, .48], '#fff3db', [0, 1.35, 0]),
      part('red nose cone', 'ellipsoid', [0, 1.38, 0], [.42, .45, .42], '#d88978'),
      part('left red fin', 'capsule', [-.3, -.8, 0], [.18, .18, .18], '#d88978', [-.78, -1.22, 0]),
      part('right red fin', 'capsule', [.3, -.8, 0], [.18, .18, .18], '#d88978', [.78, -1.22, 0]),
      part('blue window', 'ellipsoid', [0, .35, .4], [.2, .2, .12], '#7fa9c7', undefined, 'paint'),
      part('yellow flame', 'capsule', [0, -1.28, 0], [.22, .22, .22], '#dfb85c', [0, -1.8, 0])
    ]}
  },
  {
    group: 'whale', prompt: 'a friendly blue bead whale with a tail, two flippers, and a small water spout',
    scene: { title: 'blue ocean whale', notes: '', parts: [
      part('blue whale body', 'ellipsoid', [0, 0, 0], [1.35, .75, .68], '#7fa9c7'),
      part('tail stem', 'capsule', [-1.1, 0, 0], [.25, .25, .25], '#6797b5', [-1.55, .12, 0]),
      part('upper tail fluke', 'ellipsoid', [-1.72, .32, 0], [.46, .2, .4], '#6797b5', undefined, 'solid'),
      part('lower tail fluke', 'ellipsoid', [-1.72, -.2, 0], [.46, .2, .4], '#6797b5'),
      part('left flipper', 'capsule', [.2, -.4, .45], [.2, .2, .2], '#6797b5', [.65, -.82, .85]),
      part('right flipper', 'capsule', [.2, -.4, -.45], [.2, .2, .2], '#6797b5', [.65, -.82, -.85]),
      part('white belly', 'ellipsoid', [.08, -.18, .52], [.9, .42, .22], '#fff3db', undefined, 'paint'),
      part('eye', 'ellipsoid', [.85, .25, .48], [.09, .09, .08], '#26382e', undefined, 'paint'),
      part('water spout', 'capsule', [0, .75, 0], [.08, .08, .08], '#7fa9c7', [0, 1.25, 0])
    ]}
  },
  {
    group: 'snail', prompt: 'a tiny bead snail with a spiral shell, two eyestalks, and a green body',
    scene: { title: 'garden snail', notes: '', parts: [
      part('green body', 'capsule', [0, -.35, 0], [.36, .36, .36], '#7caa80', [1.15, -.35, 0]),
      part('rose shell', 'ellipsoid', [.25, .35, 0], [.72, .82, .58], '#d889a6'),
      part('shell spiral center', 'ellipsoid', [.25, .35, .58], [.28, .28, .12], '#bd718d', undefined, 'paint'),
      part('left eyestalk', 'capsule', [.88, -.05, .12], [.1, .1, .1], '#7caa80', [1.02, .34, .12]),
      part('right eyestalk', 'capsule', [1.02, -.04, -.12], [.1, .1, .1], '#7caa80', [1.16, .34, -.12]),
      part('left eye', 'ellipsoid', [1.02, .4, .2], [.09, .09, .09], '#26382e', undefined, 'paint'),
      part('right eye', 'ellipsoid', [1.16, .4, -.04], [.09, .09, .09], '#26382e', undefined, 'paint')
    ]}
  },
  {
    group: 'penguin', prompt: 'a little black and white bead penguin with orange feet and a tiny orange beak',
    scene: { title: 'little penguin', notes: '', parts: [
      part('rounded black body', 'ellipsoid', [0, 0, 0], [.82, 1.05, .68], '#26382e'),
      part('white belly and face', 'ellipsoid', [0, .02, .57], [.55, .82, .18], '#fff3db', undefined, 'paint'),
      part('left flipper', 'capsule', [-.62, .05, 0], [.18, .18, .18], '#26382e', [-.95, -.55, .1]),
      part('right flipper', 'capsule', [.62, .05, 0], [.18, .18, .18], '#26382e', [.95, -.55, .1]),
      part('orange beak', 'ellipsoid', [0, .36, .72], [.19, .14, .18], '#dfb85c'),
      part('left eye', 'ellipsoid', [-.2, .43, .72], [.08, .08, .06], '#26382e', undefined, 'paint'),
      part('right eye', 'ellipsoid', [.2, .43, .72], [.08, .08, .06], '#26382e', undefined, 'paint'),
      part('left orange foot', 'capsule', [-.3, -.85, .05], [.2, .16, .16], '#dfb85c', [-.42, -1.13, .2]),
      part('right orange foot', 'capsule', [.3, -.85, .05], [.2, .16, .16], '#dfb85c', [.42, -1.13, .2])
    ]}
  },
  {
    group: 'octopus', prompt: 'a friendly purple bead octopus with a round head, four short curling arms, and two eyes',
    scene: { title: 'friendly octopus', notes: '', parts: [
      part('round purple head', 'ellipsoid', [0, .55, 0], [.78, .7, .65], '#a987bd'),
      ...Array.from({length: 4}, (_, i) => { const a = i * Math.PI / 2; const x = Math.cos(a), z = Math.sin(a); return part(`short arm ${i+1}`, 'capsule', [x*.42, -.02, z*.38], [.16, .16, .16], '#9272aa', [x*.95, -.58, z*.82]); }),
      part('left eye', 'ellipsoid', [-.22, .62, .58], [.09, .09, .07], '#26382e', undefined, 'paint'),
      part('right eye', 'ellipsoid', [.22, .62, .58], [.09, .09, .07], '#26382e', undefined, 'paint')
    ]}
  },
  {
    group: 'pear', prompt: 'a simple green bead pear with a short brown stem and one leaf',
    scene: { title: 'green garden pear', notes: '', parts: [
      part('pear body', 'ellipsoid', [0, -.1, 0], [.82, 1.05, .72], '#a9c8a0'),
      part('short brown stem', 'capsule', [0, .78, 0], [.12, .12, .12], '#8d6549', [.06, 1.25, 0]),
      part('single leaf', 'ellipsoid', [.35, 1.02, 0], [.4, .18, .22], '#679d71', [.35, 1.02, 0])
    ]}
  },
  {
    group: 'robot', prompt: 'a small friendly bead robot with a square head, boxy body, two arms, and blue eyes',
    scene: { title: 'friendly little robot', notes: '', parts: [
      part('green robot body', 'box', [0, -.25, 0], [.68, .62, .48], '#7caa80'),
      part('square robot head', 'box', [0, .72, 0], [.58, .48, .48], '#a9c8a0'),
      part('left arm', 'capsule', [-.72, -.1, 0], [.18, .18, .18], '#679d71', [-1.08, -.42, 0]),
      part('right arm', 'capsule', [.72, -.1, 0], [.18, .18, .18], '#679d71', [1.08, -.42, 0]),
      part('left leg', 'capsule', [-.35, -.82, 0], [.18, .18, .18], '#679d71', [-.42, -1.22, 0]),
      part('right leg', 'capsule', [.35, -.82, 0], [.18, .18, .18], '#679d71', [.42, -1.22, 0]),
      part('left blue eye', 'ellipsoid', [-.2, .8, .49], [.12, .12, .06], '#7fa9c7', undefined, 'paint'),
      part('right blue eye', 'ellipsoid', [.2, .8, .49], [.12, .12, .06], '#7fa9c7', undefined, 'paint'),
      part('smile panel', 'box', [0, .48, .5], [.18, .05, .04], '#d88978', undefined, 'paint')
    ]}
  },
  {
    group: 'sailboat', prompt: 'a simple red and blue bead sailboat with one white sail and a tall mast',
    scene: { title: 'red-sailed boat', notes: '', parts: [
      part('blue boat hull', 'box', [0, -.65, 0], [1.05, .3, .5], '#7fa9c7'),
      part('brown mast', 'capsule', [0, -.35, 0], [.1, .1, .1], '#8d6549', [0, 1.18, 0]),
      part('large white sail', 'box', [.42, .42, 0], [.42, .72, .12], '#fff3db'),
      part('small red sail', 'box', [-.3, .18, 0], [.3, .47, .12], '#d88978'),
      part('red hull stripe', 'box', [0, -.65, .51], [.72, .1, .05], '#d88978', undefined, 'paint')
    ]}
  },
  {
    group: 'train', prompt: 'a tiny green bead train engine with a round boiler, a chimney, and two wheels',
    scene: { title: 'tiny green train', notes: '', parts: [
      part('green engine base', 'box', [0, -.45, 0], [1.15, .34, .52], '#679d71'),
      part('round green boiler', 'ellipsoid', [.18, .12, 0], [.74, .56, .5], '#7caa80'),
      part('yellow cabin', 'box', [-.78, .08, 0], [.34, .56, .48], '#dfb85c'),
      part('short chimney', 'capsule', [.62, .65, 0], [.18, .18, .18], '#d88978', [.62, .98, 0]),
      part('front light', 'ellipsoid', [.88, .1, .3], [.16, .16, .12], '#fff3db'),
      part('left wheel', 'ellipsoid', [-.55, -.76, .38], [.25, .25, .12], '#26382e', undefined, 'paint'),
      part('right wheel', 'ellipsoid', [.45, -.76, .38], [.25, .25, .12], '#26382e', undefined, 'paint')
    ]}
  },
  {
    group: 'cloud', prompt: 'a soft white bead cloud with three blue raindrops underneath',
    scene: { title: 'rainy day cloud', notes: '', parts: [
      part('cloud center', 'ellipsoid', [0, .25, 0], [.78, .45, .48], '#fff3db'),
      part('left cloud puff', 'ellipsoid', [-.55, .28, 0], [.48, .4, .42], '#fff3db'),
      part('right cloud puff', 'ellipsoid', [.55, .28, 0], [.48, .4, .42], '#fff3db'),
      part('middle blue raindrop', 'capsule', [0, -.38, .1], [.13, .13, .13], '#7fa9c7', [0, -.92, .1]),
      part('left blue raindrop', 'capsule', [-.55, -.38, .1], [.13, .13, .13], '#7fa9c7', [-.55, -.92, .1]),
      part('right blue raindrop', 'capsule', [.55, -.38, .1], [.13, .13, .13], '#7fa9c7', [.55, -.92, .1])
    ]}
  }
];

const rows = [...animalRows, ...extras].map(({group, prompt, scene}) => {
  scene.notes = 'synthetic generated draft; human and physical review required';
  const graph = P.build(scene, { detail: 3, threadDiameter: 0.25 });
  return {
    id: `${group}-synthetic-01`, group, prompt, scene,
    source: { kind: 'synthetic-beadform-scene', creator: 'beadform', external_material: false },
    training_consent: false, reviewed: false, scene_validated: false, physically_tested: false,
    review_notes: 'review the prompt and scene; rebuild after edits; keep only if approved',
    compiler_check: { valid: graph.validation.valid, beads: graph.nodes.length,
      thread_sections: graph.threadSections, max_passes: graph.maxPasses },
    image: null
  };
});

fs.writeFileSync(path.join(__dirname, 'candidates.jsonl'), rows.map(row => JSON.stringify(row)).join('\n') + '\n');
console.log(`${rows.length} synthetic candidates written; none approved for training`);

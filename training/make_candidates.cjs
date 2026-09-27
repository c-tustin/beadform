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

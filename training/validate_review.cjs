// Read-only compiler check for a human-edited JSONL review queue.
const fs = require('node:fs');
const path = require('node:path');
require('../shape-engine.js');
const Parts = require('../parts-engine.js');

const input = process.argv[2];
if (!input) {
  console.error('Usage: node training/validate_review.cjs path/to/review-queue.jsonl');
  process.exit(2);
}

const rows = fs.readFileSync(input, 'utf8').split(/\r?\n/).filter(Boolean);
let failed = false;
for (const [index, line] of rows.entries()) {
  try {
    const row = JSON.parse(line);
    const graph = Parts.build(row.scene, { detail: 3, threadDiameter: 0.25 });
    const valid = graph.validation.valid;
    console.log(`${valid ? 'PASS' : 'FAIL'} line ${index + 1}: ${row.id || row.prompt || 'unnamed'}; ${graph.nodes.length} beads; ${graph.threadSections} thread section(s); max ${graph.maxPasses} passes`);
    if (!valid) {
      console.error(graph.validation.errors.join('\n'));
      failed = true;
    }
  } catch (error) {
    console.error(`FAIL line ${index + 1}: ${error.message}`);
    failed = true;
  }
}
process.exitCode = failed ? 1 : 0;

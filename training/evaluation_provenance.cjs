const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.join(__dirname,'..');
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(path.isAbsolute(file)?file:path.join(root,file))).digest('hex');
function capture(files){const hashes=Object.fromEntries(files.map(file=>[file,hash(file)]));return {hashes,assertUnchanged(){for(const [file,before]of Object.entries(hashes))if(hash(file)!==before)throw Error('Evaluation source changed during execution: '+file);}};}
module.exports={capture,hash};

const fs=require('fs'),os=require('os'),path=require('path');
const p=path.join(os.homedir(),'.config','configstore','firebase-tools.json');
const j=JSON.parse(fs.readFileSync(p,'utf8'));
console.log('KEYS:',Object.keys(j).join(','));
console.log('has tokens:',!!j.tokens,'| has user:',!!j.user);
if(j.user) console.log('user:',JSON.stringify(j.user).slice(0,300));
if(j.tokens) console.log('tokens keys:',Object.keys(j.tokens).join(','),'email:',j.tokens.email);

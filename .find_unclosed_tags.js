const fs = require('fs');
const path = 'c:/Users/LENOVO/dentiste-frontend/src/pages/Rendezvous.js';
const s = fs.readFileSync(path, 'utf8');
let stack = [];
const re = /<\/?([A-Za-z0-9_-]+)[^>]*>/g;
let m;
while ((m = re.exec(s))) {
  const tag = m[1];
  const isClose = s[m.index + 1] === '/';
  if (!isClose) {
    if (['br','img','input','hr','meta','link','area','base','col','embed','param','source','track','wbr'].includes(tag)) continue;
    stack.push({ tag, idx: m.index });
  } else {
    if (stack.length === 0) {
      console.log('Extra closing tag </' + tag + '> at', m.index);
    } else {
      const last = stack[stack.length - 1];
      if (last.tag === tag) {
        stack.pop();
      } else {
        console.log('Mismatch: expected closing </' + last.tag + '> but found </' + tag + '> at', m.index);
        stack.pop();
      }
    }
  }
}
if (stack.length) console.log('Unclosed tags remain:', stack.map(x => x.tag + '@' + x.idx));
else console.log('No unclosed tags found');

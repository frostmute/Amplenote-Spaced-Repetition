let q = '`window`<!-- {"cell":{"borderBottom":true,"color":"#EEEEEE"}} -->';
let stripped = q.replace(/<!--.*?-->/g, '').trim();
console.log(stripped);

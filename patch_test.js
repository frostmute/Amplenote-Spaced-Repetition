const fs = require('fs'); const content = fs.readFileSync('plugin.js', 'utf8'); console.log(content.substring(0, 10));

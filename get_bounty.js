const https = require('https');

https.get('https://www.amplenote.com/bounty_plugins', (resp) => {
  let data = '';
  resp.on('data', (chunk) => { data += chunk; });
  resp.on('end', () => { 
    const match = data.match(/href="([^"]+terms[^"]+)"/i);
    if (match) console.log("Terms URL found:", match[1]);
    else console.log("No terms URL found in HTML.");
  });
});

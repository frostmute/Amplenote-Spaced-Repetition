const http = require('http');
const fs = require('fs');

const pluginCode = fs.readFileSync(
  '/Users/thewytchhaus/Documents/GitHub/amplenote-spaced-repetition/plugin.js',
  'utf8'
);

const options = {
  hostname: '127.0.0.1',
  port: 39377,
  path: '/mcp',
  method: 'GET',
  headers: {
    Accept: 'text/event-stream',
    Authorization: 'Bearer d9a648249617408e56df7d1536bc4a7ee8b8623d360e9b6dd8697a82b127d139',
  },
};

const req = http.request(options, (res) => {
  let postUrl = '';

  res.on('data', (chunk) => {
    const data = chunk.toString();
    console.log('SSE Chunk:', data);

    if (data.includes('endpoint')) {
      try {
        const lines = data.split('\\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const parsed = JSON.parse(line.substring(6));
            if (parsed.endpoint) {
              postUrl = parsed.endpoint.startsWith('/')
                ? `http://127.0.0.1:39377${parsed.endpoint}`
                : parsed.endpoint;

              console.log('Got POST URL:', postUrl);
              runPipeline(postUrl);
            }
          }
        }
      } catch (e) {}
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.end();

function makePost(url, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const urlObj = new URL(url);
    const req = http.request(
      {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname + urlObj.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer d9a648249617408e56df7d1536bc4a7ee8b8623d360e9b6dd8697a82b127d139',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (d) => (body += d));
        res.on('end', () => resolve(JSON.parse(body)));
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runPipeline(postUrl) {
  try {
    console.log('Searching for plugin note...');
    const search = await makePost(postUrl, {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: { name: 'amplenote_searchNotes', arguments: { query: 'Spaced Repetition' } },
    });

    const content = search.result.content[0].text;
    const match = content.match(/UUID:\\s*([0-9a-fA-F-]+)/);
    if (!match) throw new Error('Could not find UUID');
    const noteUUID = match[1];
    console.log('Found UUID:', noteUUID);

    console.log('Fetching note...');
    const note = await makePost(postUrl, {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: { name: 'amplenote_getNoteContent', arguments: { noteUUID } },
    });

    const currentContent = note.result.content[0].text;
    const newContent = currentContent.replace(
      /```javascript\\n([\\s\\S]*?)```/,
      `\`\`\`javascript\\n${pluginCode}\\n\`\`\``
    );

    console.log('Pushing update...');
    const update = await makePost(postUrl, {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'amplenote_replaceNoteContent',
        arguments: { noteUUID, markdownContent: newContent },
      },
    });

    console.log('Update success!');
    process.exit(0);
  } catch (e) {
    console.error('Pipeline error:', e);
    process.exit(1);
  }
}

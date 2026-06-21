const content = `|Question|Answer|
|How do you link?|` + "\\[\\[Note Name\\]\\]|";

const _parseCells = function(line) {
    const cells = [];
    let current = '';
    let inCode = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '`') {
        if (line.slice(i, i + 3) === '```') { inCode = !inCode; i += 2; }
        else { inCode = !inCode; }
      }
      if (line[i] === '|' && !inCode) { cells.push(current); current = ''; }
      else { current += line[i]; }
    }
    cells.push(current);
    if (cells.length >= 2) {
      return cells.slice(1, -1).map(c => c.trim());
    }
    return cells.map(c => c.trim());
};

const _extractFlashcardsFromMarkdown = function(content) {
    const flashcards = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim().startsWith('|')) continue;

      const headers = _parseCells(line).map(h => h.toLowerCase().trim());
      const qIdx = headers.indexOf('question');
      const aIdx = headers.indexOf('answer');
      const srsIdx = headers.indexOf('srs_data');
      if (qIdx === -1 || aIdx === -1) continue;

      i++; // move past header
      
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const cells = _parseCells(lines[i]);
        let q = cells[qIdx] !== undefined ? cells[qIdx].replace(/<!--.*?-->/g, '').trim() : '';
        let a = cells[aIdx] !== undefined ? cells[aIdx].replace(/<!--.*?-->/g, '').trim() : '';
        if (q && a) {
           flashcards.push({ question: q, answer: a });
        }
        i++;
      }
    }
    return { flashcards, lines };
};

console.log(JSON.stringify(_extractFlashcardsFromMarkdown(content), null, 2));

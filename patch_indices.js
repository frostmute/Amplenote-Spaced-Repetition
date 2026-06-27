const fs = require('fs');

const file = '/Users/thewytchhaus/Documents/GitHub/amplenote-spaced-repetition/plugin.js';
let data = fs.readFileSync(file, 'utf8');

// The new extract function
const newExtract = `  _extractFlashcardsFromMarkdown: function(content) {
    const flashcards = [];
    const lines = content.split('\\n');
    
    let registry = {};
    const registryRegex = /## ⚙️ Spaced Repetition Data[\\s\\S]*?\`\`\`json\\n([\\s\\S]*?)\\n\`\`\`/;
    const match = content.match(registryRegex);
    if (match) {
      try { registry = JSON.parse(match[1]); } catch(e) {}
    }
    
    let i = 0;
    for (; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim().startsWith('|')) continue;

      let headerLineIdx = -1;
      for (let j = i; j >= Math.max(0, i - 5); j--) {
        const h = this._parseCells(lines[j]).map(c => c.toLowerCase().trim().replace(/<!--.*?-->/g, '').trim());
        if (h.includes('question') && h.includes('answer')) { headerLineIdx = j; break; }
      }

      if (headerLineIdx !== -1 && i > headerLineIdx) {
        const headers = this._parseCells(lines[headerLineIdx]).map(h => h.toLowerCase().trim().replace(/<!--.*?-->/g, '').trim());
        const qIdx = headers.indexOf('question');
        const aIdx = headers.indexOf('answer');
        
        const originalHeadersLower = this._parseCells(lines[headerLineIdx]).map(h => h.toLowerCase().trim());
        let srsIdx = originalHeadersLower.indexOf('srs_data');
        if (srsIdx === -1) {
          srsIdx = originalHeadersLower.findIndex(h => h.includes('srs_data') || h.includes('<!--srs_data-->'));
        }
        if (qIdx === -1 || aIdx === -1) continue;

        if (i === headerLineIdx) i++;
        if (i < lines.length && /^\\s*\\|[\\s\\-:|]+\\|$/.test(lines[i].replace(/<!--.*?-->/g, '').trim())) { i++; }

        while (i < lines.length && lines[i].trim().startsWith('|')) {
          const cells = this._parseCells(lines[i]);
          const rowLower = cells.map(c => c.toLowerCase().trim());
          if (rowLower.some(h => h === 'question' || h.includes('question<!--')) && 
              rowLower.some(h => h === 'answer' || h.includes('answer<!--'))) {
            break;
          }
          if (rowLower.every(c => c === '')) { i++; continue; }

          if (cells.length > Math.max(qIdx, aIdx) || cells.some(c => c && c.trim().length > 0)) {
            let rowQIdx = qIdx; let rowAIdx = aIdx; let rowSrsIdx = srsIdx;

            if (!cells[0] || cells[0].trim() === '') {
              const headerFirstContentIdx = headers.findIndex(h => h.trim().length > 0);
              const rowFirstContentIdx = cells.findIndex(c => c && c.trim().length > 0);
              if (rowFirstContentIdx > -1 && headerFirstContentIdx > -1 && rowFirstContentIdx !== headerFirstContentIdx) {
                const shift = rowFirstContentIdx - headerFirstContentIdx;
                rowQIdx = qIdx + shift;
                rowAIdx = aIdx + shift;
                if (srsIdx !== -1) rowSrsIdx = srsIdx + shift;
              }
            }

            let q = rowQIdx !== -1 && cells[rowQIdx] !== undefined ? cells[rowQIdx].replace(/<!--.*?-->/g, '').trim() : '';
            let a = rowAIdx !== -1 && cells[rowAIdx] !== undefined ? cells[rowAIdx].replace(/<!--.*?-->/g, '').trim() : '';

            if (q === '' && a === '') {
              q = qIdx !== -1 && cells[qIdx] !== undefined ? cells[qIdx].replace(/<!--.*?-->/g, '').trim() : '';
              a = aIdx !== -1 && cells[aIdx] !== undefined ? cells[aIdx].replace(/<!--.*?-->/g, '').trim() : '';
              rowSrsIdx = srsIdx;
            }

            const nonEmpty = cells.map((c, idx) => ({ c: c.trim(), idx })).filter(x => x.c.length > 0);
            if (!q || q === '') { if (nonEmpty.length > 0) q = nonEmpty[0].c; }
            if (!a || a === '') {
              if (nonEmpty.length > 1) {
                if (q === nonEmpty[0].c) { a = nonEmpty[1].c; } else {
                  const qIdxInNonEmpty = nonEmpty.findIndex(n => n.c === q);
                  if (qIdxInNonEmpty !== -1 && qIdxInNonEmpty + 1 < nonEmpty.length) {
                    a = nonEmpty[qIdxInNonEmpty + 1].c;
                  } else { a = nonEmpty[1].c; }
                }
              }
            }

            let idMatch = q ? q.match(/<!--id:([a-zA-Z0-9_]+)-->/) : null;
            let id = idMatch ? idMatch[1] : null;
            if (q) q = q.replace(/<!--.*?-->/g, '').trim();

            if (q && a) {
              let srsData = {};
              if (id && registry[id]) {
                  srsData = registry[id];
              } else {
                  const srsField = rowSrsIdx !== -1 && cells[rowSrsIdx] ? cells[rowSrsIdx].trim() : '';
                  if (srsField) {
                    try {
                      const cleanSrs = srsField.replace(/<!--/g, '').replace(/-->/g, '').trim();
                      srsData = JSON.parse(atob(decodeURIComponent(cleanSrs)));
                    } catch (e1) {
                      try { srsData = JSON.parse(atob(srsField.replace(/<!--/g, '').replace(/-->/g, '').trim())); } catch (e2) {
                        try { srsData = JSON.parse(srsField.replace(/<!--/g, '').replace(/-->/g, '').trim()); } catch (e3) {}
                      }
                    }
                  }
              }
              
              flashcards.push({
                lineIndex: i,
                id: id,
                question: q,
                answer: a.replace(/<!--.*?-->/g, '').trim(),
                ...srsData
              });
            }
          }
          i++;
        }
        i--;
      }
    }
    return { flashcards, lines, registry };
  },`;

const newUpdate = `  _updateFlashcardInLines: function(lines, card) {
    let headerLineIdx = -1;
    for (let i = card.lineIndex - 1; i >= 0; i--) {
      if (lines[i].trim().startsWith('|')) {
        const h = this._parseCells(lines[i]).map(c => c.toLowerCase().trim().replace(/<!--.*?-->/g, '').trim());
        if (h.includes('question') && h.includes('answer')) { headerLineIdx = i; break; }
      }
    }
    if (headerLineIdx === -1) return false;

    const headers = this._parseCells(lines[headerLineIdx]).map(h => h.toLowerCase().trim().replace(/<!--.*?-->/g, '').trim());
    const qIdx = headers.indexOf('question');
    if (qIdx === -1) return false;

    const cells = this._parseCells(lines[card.lineIndex]);
    const headerCells = this._parseCells(lines[headerLineIdx]);
    
    while (cells.length < headerCells.length) cells.push('');
    while (cells.length > headerCells.length) cells.pop();

    if (!cells[qIdx].includes('<!--id:')) {
      cells[qIdx] = \`\${cells[qIdx].trim()} <!--id:\${card.id}-->\`;
    }
    
    lines[card.lineIndex] = '| ' + cells.join(' | ') + ' |';
    return true;
  },`;

const newSave = `  _saveCardToNote: async function(app, card) {
    const note = await app.notes.find(card.noteUUID);
    if (!note) return;

    const freshContent = await note.content();
    const { flashcards, lines, registry } = this._extractFlashcardsFromMarkdown(freshContent);

    let freshCard = flashcards.find(c => c.question === card.question && c.answer === card.answer);
    if (!freshCard) { console.error("Failed to find card in note:", card.question); return; }
    
    if (!freshCard.id) {
      freshCard.id = 'id_' + Math.random().toString(36).substr(2, 9);
      card.id = freshCard.id;
    } else {
      card.id = freshCard.id;
    }

    registry[card.id] = {
      interval: card.interval,
      easinessFactor: card.easinessFactor,
      nextReview: card.nextReview,
      reps: card.reps,
      lapses: card.lapses,
      stability: card.stability,
      difficulty: card.difficulty
    };

    const updated = this._updateFlashcardInLines(lines, card);
    if (!updated) { console.error("Failed to update card line in note:", card.question); return; }

    let newContent = this._linesToMarkdown(lines);
    
    const registryText = \`\\n\\n---\\n## ⚙️ Spaced Repetition Data\\n> <details><summary>⚠️ Do not modify the data below.</summary>\\n> It contains your flashcard review history.\\n> \\\\\`\\\\\`\\\\\`json\\n> \${JSON.stringify(registry, null, 2).replace(/\\n/g, '\\n> ')}\\n> \\\\\`\\\\\`\\\\\`\\n> </details>\`;
    
    const regBlockRegex = /\\n*---\\n## ⚙️ Spaced Repetition Data[\\s\\S]*?<\\/details>/;
    if (regBlockRegex.test(newContent)) {
      newContent = newContent.replace(regBlockRegex, registryText);
    } else {
      newContent += registryText;
    }

    newContent = newContent.replace(/\\\\/g, '');
    await note.replaceContent(newContent);
  },`;

const extStartIndex = data.indexOf('  _extractFlashcardsFromMarkdown: function(content) {');
const extEndIndex = data.indexOf('  _updateFlashcardInLines: function(lines, card) {');

const updStartIndex = extEndIndex;
const updEndIndex = data.indexOf('  _linesToMarkdown: function(lines) {');

const saveStartIndex = data.indexOf('  _saveCardToNote: async function(app, card) {');
const saveEndIndex = data.indexOf('  _createScheduler: function() {'); // this is reliably after _saveCardToNote!

if (extStartIndex !== -1 && updEndIndex !== -1 && saveStartIndex !== -1 && saveEndIndex !== -1) {
  const p1 = data.substring(0, extStartIndex);
  const p2 = data.substring(updEndIndex, saveStartIndex);
  const p3 = data.substring(saveEndIndex);

  let finalData = p1 + newExtract + '\\n\\n' + newUpdate + '\\n\\n' + p2 + newSave + '\\n\\n' + p3;

  // Fix Dashboard Update
  finalData = finalData.replace(
    'i++;\\n    }\\n    \\n    await app.alert',
    'i++;\\n    }\\n    if (completed > 0) { await this._updateDashboard(app, this._currentReviewSession); }\\n    await app.alert'
  );

  // Fix Dashboard Stats display gap
  finalData = finalData.replace(
    '| 🟣 Easy | ${stats.easy} | ${easyPct}% |\\n\\n<!--STATS:${JSON.stringify(stats)}-->`;',
    '| 🟣 Easy | ${stats.easy} | ${easyPct}% |\\n<!--STATS:${JSON.stringify(stats)}-->`;'
  );

  // Fix Session Card Updates
  finalData = finalData.replace(
    'const updatedCard = this._updateCardSRS(currentCard, data.rating);\\n      await this._saveCardToNote(app, updatedCard);',
    'const updatedCard = this._updateCardSRS(currentCard, data.rating);\\n      this._currentReviewSession.cards[this._currentReviewSession.index] = updatedCard;\\n      await this._saveCardToNote(app, updatedCard);'
  );
  finalData = finalData.replace(
    'const updatedCard = this._updateCardSRS(card, rating);\\n      await this._saveCardToNote(app, updatedCard);',
    'const updatedCard = this._updateCardSRS(card, rating);\\n      this._currentReviewSession.cards[i] = updatedCard;\\n      await this._saveCardToNote(app, updatedCard);'
  );

  fs.writeFileSync(file, finalData);
  console.log('SUCCESS: Replaced via precise indices!');
} else {
  console.error('Could not find function indices!');
}

({
  // --- Markdown / Parser helpers ---

  _parseCells: function(line) {
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
    // Remove leading/trailing empty fragments caused by outermost pipe delimiters
    if (cells.length >= 2) {
      return cells.slice(1, -1).map(c => c.trim());
    }
    return cells.map(c => c.trim());
  },

  _extractFlashcardsFromMarkdown: function(content) {
    const flashcards = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim().startsWith('|')) continue;

      const headers = this._parseCells(line).map(h => h.toLowerCase().trim().replace(/<!--.*?-->/g, '').trim());
      const qIdx = headers.indexOf('question');
      const aIdx = headers.indexOf('answer');
      
      // Look for srs_data in the original headers (since we might have hidden it in a comment)
      const originalHeadersLower = this._parseCells(line).map(h => h.toLowerCase().trim());
      let srsIdx = originalHeadersLower.indexOf('srs_data');
      if (srsIdx === -1) {
        srsIdx = originalHeadersLower.findIndex(h => h.includes('srs_data') || h.includes('<!--srs_data-->'));
      }
      if (qIdx === -1 || aIdx === -1) continue;

      i++; // move past header
      // Skip separator row if present (strict: must be ONLY pipes, dashes, colons, spaces)
      if (i < lines.length && /^\s*\|[\s\-:|]+\|$/.test(lines[i].replace(/<!--.*?-->/g, '').trim())) {
        i++;
      }

      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const cells = this._parseCells(lines[i]);

        // Detect if this row is another header row (empty rows acting as headers in Amplenote)
        const rowLower = cells.map(c => c.toLowerCase().trim());
        if (rowLower.some(h => h === 'question' || h.includes('question<!--')) && 
            rowLower.some(h => h === 'answer' || h.includes('answer<!--'))) {
          break;
        }

        // Skip completely empty rows
        if (rowLower.every(c => c === '')) {
          i++;
          continue;
        }

        if (cells.length > Math.max(qIdx, aIdx) || cells.some(c => c && c.trim().length > 0)) {
          // Amplenote sometimes shifts columns right with empty leading cells
          let rowQIdx = qIdx;
          let rowAIdx = aIdx;
          let rowSrsIdx = srsIdx;

          if (!cells[0] || cells[0].trim() === '') {
            const headerFirstContentIdx = headers.findIndex(h => h.trim().length > 0);
            const rowFirstContentIdx = cells.findIndex(c => c && c.trim().length > 0);
            if (rowFirstContentIdx > -1 && headerFirstContentIdx > -1 && rowFirstContentIdx !== headerFirstContentIdx) {
              const shift = rowFirstContentIdx - headerFirstContentIdx;
              if (qIdx !== -1 && cells.length > qIdx + shift) rowQIdx = qIdx + shift;
              if (aIdx !== -1 && cells.length > aIdx + shift) rowAIdx = aIdx + shift;
              if (srsIdx !== -1 && cells.length > srsIdx + shift) rowSrsIdx = srsIdx + shift;
            }
          }

          let q = rowQIdx !== -1 && cells[rowQIdx] !== undefined ? cells[rowQIdx].replace(/<!--.*?-->/g, '').trim() : '';
          let a = rowAIdx !== -1 && cells[rowAIdx] !== undefined ? cells[rowAIdx].replace(/<!--.*?-->/g, '').trim() : '';

          // Fallback to original unshifted indices if shift gave us nothing
          if (q === '' && a === '') {
            q = qIdx !== -1 && cells[qIdx] !== undefined ? cells[qIdx].replace(/<!--.*?-->/g, '').trim() : '';
            a = aIdx !== -1 && cells[aIdx] !== undefined ? cells[aIdx].replace(/<!--.*?-->/g, '').trim() : '';
            rowSrsIdx = srsIdx;
          }

          // Final fallback: first and second non-empty cells
          const nonEmpty = cells.map((c, idx) => ({ c: c.trim(), idx })).filter(x => x.c.length > 0);
          if (!q || q === '') {
            if (nonEmpty.length > 0) q = nonEmpty[0].c;
          }
          if (!a || a === '') {
            if (nonEmpty.length > 1) {
              // Try to find the cell after the question
              if (q === nonEmpty[0].c) {
                a = nonEmpty[1].c;
              } else {
                const qIdxInNonEmpty = nonEmpty.findIndex(n => n.c === q);
                if (qIdxInNonEmpty !== -1 && qIdxInNonEmpty + 1 < nonEmpty.length) {
                  a = nonEmpty[qIdxInNonEmpty + 1].c;
                } else {
                  a = nonEmpty[1].c;
                }
              }
            }
          }

          // Strip markdown bold/italics etc if we want, or at least trim HTML comments from question
          if (q) q = q.replace(/<!--.*?-->/g, '').trim();

          if (q && a) {
            let srsData = {};
            const srsField = rowSrsIdx !== -1 && cells[rowSrsIdx] ? cells[rowSrsIdx].trim() : '';
            if (srsField) {
              try {
                // Try decoding the base64 string
                const cleanSrs = srsField.replace(/<!--/g, '').replace(/-->/g, '').trim();
                srsData = JSON.parse(atob(decodeURIComponent(cleanSrs)));
              } catch (e1) {
                try {
                  srsData = JSON.parse(atob(srsField.replace(/<!--/g, '').replace(/-->/g, '').trim()));
                } catch (e2) {
                  try {
                    srsData = JSON.parse(srsField.replace(/<!--/g, '').replace(/-->/g, '').trim());
                  } catch (e3) {}
                }
              }
            }
            flashcards.push({
              lineIndex: i,
              question: q,
              answer: a,
              ...srsData
            });
          }
        }
        i++;
      }
      i--; // back up since outer loop also increments
    }

    return { flashcards, lines };
  },

  _updateFlashcardInLines: function(lines, card) {
    const targetLine = lines[card.lineIndex];
    if (!targetLine) return false;

    let headerLineIdx = -1;
    for (let i = card.lineIndex - 1; i >= 0; i--) {
      if (lines[i].trim().startsWith('|')) {
        const h = this._parseCells(lines[i]).map(c => c.toLowerCase().trim().replace(/<!--.*?-->/g, '').trim());
        if (h.includes('question') && h.includes('answer')) { headerLineIdx = i; break; }
      }
    }
    if (headerLineIdx === -1) return false;

    const originalHeadersLower = this._parseCells(lines[headerLineIdx]).map(h => h.toLowerCase().trim());
    const headers = originalHeadersLower.map(h => h.replace(/<!--.*?-->/g, '').trim());
    const qIdx = headers.indexOf('question');
    let srsIdx = originalHeadersLower.indexOf('srs_data');
    if (srsIdx === -1) {
      srsIdx = originalHeadersLower.findIndex(h => h.includes('srs_data') || h.includes('<!--srs_data-->'));
    }
    if (qIdx === -1) return false;

    // If no SRS_DATA column exists, add one to the table
    if (srsIdx === -1) {
      srsIdx = headers.length;
      // Update header row. We can name the header <!--SRS_DATA--> to hide the header itself!
      const headerCells = this._parseCells(lines[headerLineIdx]);
      headerCells.push('<!--SRS_DATA-->');
      // Trim empty trailing cells so we don't inflate
      while(headerCells.length > 2 && headerCells[headerCells.length - 2] === '') {
          headerCells.splice(headerCells.length - 2, 1);
          srsIdx--;
      }
      lines[headerLineIdx] = '| ' + headerCells.join(' | ') + ' |';

      // Update separator row if present
      const sepIdx = headerLineIdx + 1;
      if (sepIdx < lines.length && /^\s*\|[\s\-:|]+\|$/.test(lines[sepIdx].replace(/<!--.*?-->/g, '').trim())) {
        const sepCells = this._parseCells(lines[sepIdx]);
        while(sepCells.length < headerCells.length) sepCells.push('---');
        while(sepCells.length > headerCells.length) sepCells.pop();
        lines[sepIdx] = '| ' + sepCells.join(' | ') + ' |';
      }
      
      // We must explicitly clean up the other rows in the table to match the column count, 
      // or Amplenote's exporter goes crazy.
      let r = (sepIdx < lines.length && /^\s*\|[\s\-:|]+\|$/.test(lines[sepIdx].replace(/<!--.*?-->/g, '').trim())) ? sepIdx + 1 : headerLineIdx + 1;
      while (r < lines.length && lines[r].trim().startsWith('|')) {
        const rowCells = this._parseCells(lines[r]);
        const rowLower = rowCells.map(c => c.toLowerCase().trim());
        if (rowLower.some(h => h === 'question') && rowLower.some(h => h === 'answer')) break;
        
        while(rowCells.length > headerCells.length) rowCells.pop();
        while(rowCells.length < headerCells.length) rowCells.push('');
        lines[r] = '| ' + rowCells.join(' | ') + ' |';
        r++;
      }
    }

    const cells = this._parseCells(lines[card.lineIndex]);
    
    // Explicitly align the cell count to match headers to prevent column inflation
    const headerCells = this._parseCells(lines[headerLineIdx]);
    while (cells.length < headerCells.length) cells.push('');
    while (cells.length > headerCells.length) cells.pop();

    const srsData = {
      interval: card.interval, easinessFactor: card.easinessFactor,
      nextReview: card.nextReview, reps: card.reps, lapses: card.lapses || 0,
      stability: card.stability, difficulty: card.difficulty,
      elapsed_days: card.elapsed_days, scheduled_days: card.scheduled_days,
      state: card.state, last_review: card.last_review
    };
    
    // Encode to base64, then wrap in an HTML comment so it is invisible to the user in the note editor
    const encodedSrs = btoa(JSON.stringify(srsData));
    
    // Actually, Amplenote ignores HTML comments during table rendering.
    // If we wrap the whole SRS column data in <!--...-->, it hides it completely.
    // Furthermore, we can even remove the SRS_DATA header entirely, but Amplenote's Markdown parser expects a header.
    // Wait, the user wants the data hidden. `<!--base64-->` achieves this! The cell will look blank in Amplenote's rich text view.
    cells[srsIdx] = `<!--${encodedSrs}-->`;

    // Fix the compounding backslash bug when Amplenote escapes the markdown.
    // Ensure we don't accidentally insert an empty column shift marker by placing empty strings
    // Amplenote shifts columns when there are empty cells at the start `| | Question |`.
    // When we join, if cells[0] is empty, it makes `|  | Question |` which creates an empty column!
    // But `_parseCells` drops the outer pipes. If cells[0] was empty, `cells.join(' | ')` does it correctly.
    // Wait, the test document has `| | | | | | \n |-|-|-|-|-| \n |Question|Answer|||| \n |What does DOM stand for?|Document Object Model||||`
    // Oh! Amplenote's exporter is creating massive arrays of empty columns because we did `while (cells.length <= srsIdx) cells.push('');`
    // And `srsIdx` got pushed out to 5 or 6 somehow! Let's prevent runaway column inflation.
    
    // Trim empty trailing cells beyond srsIdx
    // Actually, we just enforced strict cell length matching above, so this block is no longer needed
    // and might interfere if the SRS idx isn't the absolute last column for some reason.
    // while (cells.length > srsIdx + 1 && cells[cells.length - 1] === '') {
    //  cells.pop();
    // }

    lines[card.lineIndex] = '| ' + cells.join(' | ') + ' |';
    return true;
  },

  _linesToMarkdown: function(lines) {
    return lines.join('\n');
  },

  _escapeHtml: function(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    let escaped = text.replace(/[&<>"']/g, m => map[m]);
    // Amplenote aggressively escapes markdown brackets inside tables. 
    // We strip these stray backslashes before rendering them in the flashcard UI.
    escaped = escaped.replace(/\\\[/g, '[').replace(/\\\]/g, ']');
    return escaped;
  },

  _createScheduler: function() {
    const w = [0.4072, 1.1829, 3.1262, 15.4722, 7.2102, 0.5316, 1.0651, 0.0589, 1.5330, 0.1544, 1.0071, 1.9395, 0.1100, 0.2900, 2.2700, 0.2500, 2.9898, 0.5100, 0.4300];

    function initStability(rating) { return Math.max(w[rating - 1], 0.1); }
    function initDifficulty(rating) { return Math.min(Math.max(w[4] - Math.exp(w[5] * (rating - 1)) + 1, 1), 10); }
    function nextDifficulty(d, rating) {
      const next = d - w[6] * (rating - 3);
      return Math.min(Math.max(meanReversion(w[4], next), 1), 10);
    }
    function meanReversion(init, current) { return w[7] * init + (1 - w[7]) * current; }
    function retrievability(elapsed, stability) { return Math.pow(1 + (0.9 / stability) * elapsed, -1 / 0.1); }
    function nextRecallStability(d, s, r, rating) {
      const hardPenalty = rating === 2 ? w[15] : 1;
      const easyBonus = rating === 4 ? w[16] : 1;
      return s * (Math.exp(w[8]) * (11 - d) * Math.pow(s, -w[9]) * (Math.exp(w[10] * (1 - r)) - 1) * hardPenalty * easyBonus + 1);
    }
    function nextForgetStability(d, s, r) { return w[11] * Math.pow(d, -w[12]) * (Math.pow(s + 1, w[13]) - 1) * Math.exp(w[14] * (1 - r)); }
    function nextInterval(stability) {
      const newInterval = (stability / 0.9) * (Math.pow(0.9, -1 / 0.1) - 1);
      return Math.max(Math.round(newInterval), 1);
    }

    return {
      next: (card, rating) => {
        const now = new Date();
        const isNew = !card.reps || card.reps === 0;
        let stability, difficulty, interval, state;

        if (isNew) {
          stability = initStability(rating);
          difficulty = initDifficulty(rating);
          if (rating === 1) { interval = 0; state = 3; }
          else { interval = rating === 4 ? 4 : 1; state = 2; }
        } else {
          const lastReview = card.last_review ? new Date(card.last_review) : now;
          const elapsed = Math.max(0, Math.floor((now - lastReview) / 86400000));
          const r = retrievability(elapsed, card.stability || 1);
          difficulty = nextDifficulty(card.difficulty || 5, rating);
          if (rating === 1) {
            stability = nextForgetStability(difficulty, card.stability || 1, r);
            interval = 0; state = 3;
          } else {
            stability = nextRecallStability(difficulty, card.stability || 1, r, rating);
            interval = nextInterval(stability); state = 2;
          }
        }

        const due = new Date(now);
        due.setDate(due.getDate() + interval);

        return {
          stability, difficulty, interval, state,
          reps: (card.reps || 0) + 1,
          lapses: rating === 1 ? (card.lapses || 0) + 1 : (card.lapses || 0),
          elapsed_days: interval,
          scheduled_days: interval,
          due: due.toISOString(),
          last_review: now.toISOString()
        };
      }
    };
  },

  // --- Hooks ---

  // --- Core review logic ---

  _collectDueCards: async function(app, tags) {
    // app.filterNotes expects a string for the 'tag' property in some versions, 
    // or sometimes an array. If 'tags' is an array, we should extract the first element 
    // or pass it directly. Amplenote's API: `app.filterNotes({ tag: "my-tag" })`
    const tagQuery = Array.isArray(tags) ? tags[0] : tags;
    const noteHandles = await app.filterNotes({ tag: tagQuery });
    if (noteHandles.length === 0) { await app.alert("No notes found with the selected tags."); return []; }

    let allFlashcards = [];
    for (const noteHandle of noteHandles) {
      const note = await app.notes.find(noteHandle.uuid);
      if (note) {
        const content = await note.content();
        const { flashcards } = this._extractFlashcardsFromMarkdown(content);
        flashcards.forEach(card => { card.noteUUID = note.uuid; });
        allFlashcards = allFlashcards.concat(flashcards);
      }
    }

    const now = new Date();
    let dueCards = allFlashcards.filter(card => {
      const nextReview = card.nextReview ? new Date(card.nextReview) : new Date(0);
      return nextReview <= now;
    });

    if (dueCards.length === 0) { await app.alert("No flashcards are due for review!"); return []; }

    // Apply Custom Sort Order
    let reviewOrder = "Due Date (Oldest First)";
    if (app.settings && app.settings["Review Order"]) {
      reviewOrder = app.settings["Review Order"];
    }

    if (reviewOrder === "Random") {
      // Fisher-Yates shuffle
      for (let i = dueCards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [dueCards[i], dueCards[j]] = [dueCards[j], dueCards[i]];
      }
    } else if (reviewOrder === "Easiness (Hardest First)") {
      dueCards.sort((a, b) => {
        // Lower easinessFactor / stability means it's harder
        const aDiff = a.easinessFactor || 0;
        const bDiff = b.easinessFactor || 0;
        return aDiff - bDiff; 
      });
    } else {
      // Default: Due Date (Oldest First)
      dueCards.sort((a, b) => {
        const dateA = a.nextReview ? new Date(a.nextReview).getTime() : 0;
        const dateB = b.nextReview ? new Date(b.nextReview).getTime() : 0;
        return dateA - dateB;
      });
    }

    // Enforce Daily Review Limit if specified in settings
    if (app.settings && app.settings["Daily Review Limit"]) {
      const limit = parseInt(app.settings["Daily Review Limit"], 10);
      if (!isNaN(limit) && limit > 0 && dueCards.length > limit) {
        dueCards = dueCards.slice(0, limit);
      }
    }

    return dueCards;
  },

  _runReviewSession: async function(app, dueCards) {
    this._currentReviewSession = { cards: dueCards, index: 0, ratingsCount: {1:0, 2:0, 3:0, 4:0} };
    
    // Check context for mobile flag. If mobile, skip embed and go straight to prompt.
    const context = (app.context && typeof app.context === 'object') ? app.context : (await app.getContext ? await app.getContext() : null);
    const isMobile = context ? (context.environment === 'mobile' || context.isMobile) : false;

    if (isMobile) {
      console.log("Mobile client detected, using free-tier prompt mode directly.");
      await this._runFreeTierPromptSession(app, dueCards);
      return;
    }

    // Try to open the paid-tier embed first
    try {
      // Pass card object directly — Amplenote handles serialization internally.
      // renderEmbed must be robust to receiving either an object or a JSON string.
      await app.openSidebarEmbed(1, "Spaced Repetition Review", dueCards[0]);
    } catch (e) {
      console.error("openSidebarEmbed failed, falling back to free-tier prompt mode", e);
      await this._runFreeTierPromptSession(app, dueCards);
    }
  },

  _runFreeTierPromptSession: async function(app, dueCards) {
    let i = 0;
    let completed = 0;
    while (i < dueCards.length) {
      const card = dueCards[i];
      
      // Step 1: Show question
      const showAnswer = await app.prompt(`Question ${i + 1} of ${dueCards.length}`, {
        message: card.question,
        submitAction: "Show Answer"
      });
      
      if (showAnswer === false || showAnswer === null) break; // User cancelled
      
      // Step 2: Show answer and ask for rating
      const ratingOptions = [
        { label: "1. Again (Forgot)", value: "1" },
        { label: "2. Hard", value: "2" },
        { label: "3. Good", value: "3" },
        { label: "4. Easy", value: "4" }
      ];
      
      const ratingResult = await app.prompt(`Answer ${i + 1} of ${dueCards.length}`, {
        message: `Q: ${card.question}\n\nA: ${card.answer}\n\nHow well did you remember this?`,
        inputs: [{ type: "select", label: "Rating", options: ratingOptions }]
      });
      
      if (!ratingResult) break; // User cancelled
      
      const rating = parseInt(ratingResult, 10);
      this._currentReviewSession.ratingsCount[rating] = (this._currentReviewSession.ratingsCount[rating] || 0) + 1;
      
      // Process the rating
      const updatedCard = this._updateCardSRS(card, rating);
      await this._saveCardToNote(app, updatedCard);
      completed++;
      i++;
    }
    
    await app.alert(`Review Session Complete!\n\nYou reviewed ${completed} card(s).`);
  },

  noteOption: {
    "Start Review Session": async function(app, noteUUID) {
      // Need to capture `this` context for noteOption hooks
      const self = this;
      
      const tags = await app.prompt("Select tags to review", {
        inputs: [{ label: "Tags", type: "tags", limit: 5 }]
      });
      if (!tags || tags.length === 0) {
        // User cancelled or left empty
        return;
      }

      const dueCards = await self._collectDueCards(app, tags);
      if (!dueCards || dueCards.length === 0) {
        // _collectDueCards already handles its own alerts if 0 cards are due,
        // but we return just to be safe.
        return;
      }

      await self._runReviewSession(app, dueCards);
    }
  },

  appOption: {
    "Start Review Session": async function(app) {
      // Need to capture `this` context for appOption hooks
      const self = this;
      
      let defaultTags = [];
      if (app.settings && app.settings["Default Tags"]) {
        defaultTags = app.settings["Default Tags"].split(',').map(t => t.trim());
      }
      
      const promptInputs = [{ label: "Tags", type: "tags", limit: 5 }];
      // Note: We cannot pre-fill the 'tags' input type in Amplenote easily via prompt yet, 
      // but we can fallback to defaultTags if the user submits empty.
      
      let tags = await app.prompt("Select tags to review (leave blank to use defaults)", {
        inputs: promptInputs
      });
      
      // Handle prompt cancellation or empty submission
      if (!tags || tags.length === 0) {
         if (defaultTags.length > 0) {
             tags = defaultTags;
         } else {
             await app.alert("No tags selected and no Default Tags configured. Exiting.");
             return;
         }
      }

      const dueCards = await self._collectDueCards(app, tags);
      if (!dueCards || dueCards.length === 0) {
        // _collectDueCards handles its own alerts
        return; 
      }

      await self._runReviewSession(app, dueCards);
    }
  },

  renderEmbed: async function(app, ...args) {
    // Amplenote may pass the card as an object directly or as a JSON string.
    // It may also pass internal args before our data. Scan all args for a valid card.
    let card = null;
    let isComplete = false;
    let completeStats = null;
    let completeTotal = null;
    let completeAvgEf = null;

    for (const arg of args) {
      if (arg && typeof arg === 'object') {
        if (arg.question) {
          card = arg;
          break;
        }
        if (arg._complete) {
          isComplete = true;
          completeStats = arg.stats;
          completeTotal = arg.total;
          completeAvgEf = arg.avgEf;
          break;
        }
      }
      if (typeof arg === 'string' && arg.length > 0) {
        try {
          const parsed = JSON.parse(arg);
          if (parsed && parsed.question) {
            card = parsed;
            break;
          }
          if (parsed && parsed._complete) {
            isComplete = true;
            completeStats = parsed.stats;
            completeTotal = parsed.total;
            completeAvgEf = parsed.avgEf;
            break;
          }
        } catch (e) {}
      }
    }

    // Final fallback: read from session state
    if (!card && !isComplete && this._currentReviewSession && this._currentReviewSession.cards.length > 0) {
      const session = this._currentReviewSession;
      card = session.cards[session.index] || {};
    }

    card = card || {};

    const session = this._currentReviewSession;
    const progress = session
      ? `${session.index + 1} / ${session.cards.length}`
      : '1 / 1';
    const barPct = session
      ? Math.round((session.index / session.cards.length) * 100)
      : 0;

    if (isComplete || card._complete) {
      const stats = completeStats || card.stats || {1:0, 2:0, 3:0, 4:0};
      const total = completeTotal || card.total || 1;
      const avgEf = completeAvgEf || card.avgEf || 0;
      const p1 = Math.round((stats[1]/total)*100)||0;
      const p2 = Math.round((stats[2]/total)*100)||0;
      const p3 = Math.round((stats[3]/total)*100)||0;
      const p4 = Math.round((stats[4]/total)*100)||0;

      return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;margin:0;overflow:hidden}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;background:#0f1117;color:#f8fafc;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px}
.wrap{text-align:center;max-width:440px;width:100%;animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);}
.ic{font-size:64px;margin-bottom:16px;filter:drop-shadow(0 0 20px rgba(99, 102, 241, 0.4));animation: bounce 2s infinite ease-in-out;}
h2{font-size:1.8em;font-weight:700;margin-bottom:8px;background:linear-gradient(135deg,#6366f1,#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
p{color:#94a3b8;font-size:1.05em;line-height:1.5;margin-bottom:24px;}
.sta{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px;}
.sta-item{background:#1e2130;border:1px solid #2a2e45;border-radius:12px;padding:16px 8px;text-align:center;}
.sta-item .v{font-size:1.6em;font-weight:700;color:#6366f1;margin-bottom:4px;}
.sta-item .l{font-size:0.75em;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;font-weight:500;}

.chart{display:flex;height:120px;align-items:flex-end;gap:12px;background:#1e2130;border:1px solid #2a2e45;border-radius:12px;padding:20px 16px 10px 16px;margin-bottom:20px;}
.bar-col{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;gap:6px;}
.bar{width:100%;border-radius:4px;animation: growUp 1s ease-out forwards;transform-origin:bottom;background:#6366f1;}
.b1{background:#dc2626;} .b2{background:#d97706;} .b3{background:#16a34a;} .b4{background:#7c3aed;}
.bar-l{font-size:11px;color:#94a3b8;font-weight:600;}
.bar-v{font-size:11px;color:#f8fafc;font-weight:700;margin-bottom:2px;}

@keyframes slideUp { from {opacity:0; transform:translateY(20px);} to {opacity:1; transform:translateY(0);} }
@keyframes bounce { 0%, 100% {transform:translateY(0);} 50% {transform:translateY(-10px);} }
@keyframes growUp { from {transform:scaleY(0);} to {transform:scaleY(1);} }
</style>
</head>
<body>
<div class="wrap">
  <div class="ic">🎉</div>
  <h2>Session Complete!</h2>
  <p>Great work! You cleared your queue.</p>
  
  <div class="chart">
    <div class="bar-col"><div class="bar-v">${stats[1]||0}</div><div class="bar b1" style="height:${Math.max(p1, 2)}%"></div><div class="bar-l">AGAIN</div></div>
    <div class="bar-col"><div class="bar-v">${stats[2]||0}</div><div class="bar b2" style="height:${Math.max(p2, 2)}%"></div><div class="bar-l">HARD</div></div>
    <div class="bar-col"><div class="bar-v">${stats[3]||0}</div><div class="bar b3" style="height:${Math.max(p3, 2)}%"></div><div class="bar-l">GOOD</div></div>
    <div class="bar-col"><div class="bar-v">${stats[4]||0}</div><div class="bar b4" style="height:${Math.max(p4, 2)}%"></div><div class="bar-l">EASY</div></div>
  </div>

  <div class="sta">
    <div class="sta-item"><div class="v">${total}</div><div class="l">Reviewed</div></div>
    <div class="sta-item"><div class="v">100%</div><div class="l">Focus</div></div>
    <div class="sta-item"><div class="v">${Math.round(avgEf*10)/10}</div><div class="l">Avg EF</div></div>
  </div>
</div>
</body>
</html>`;
    }

    if (!card.question) {
      return `<div style="padding:24px;text-align:center;font-family:ui-sans-serif,system-ui,sans-serif;color:#9ca3af;font-size:15px;">No flashcard data available.</div>`;
    }

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;margin:0;overflow:hidden}
body{font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#0f1117;color:#e5e7eb;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px}
.wrap{width:100%;max-width:520px;display:flex;flex-direction:column;height:100%;max-height:600px;justify-content:center}
.hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;font-size:13px;color:#6b7280}
.hdr span:nth-child(2){font-variant-numeric:tabular-nums;font-size:12px;background:#1f2937;padding:3px 10px;border-radius:12px;color:#9ca3af}
.bar{height:3px;background:#1f2937;border-radius:2px;margin-bottom:28px;overflow:hidden}
.bar-fill{height:100%;background:linear-gradient(90deg,#6366f1,#8b5cf6);border-radius:2px;transition:width .4s ease}
.card{background:#1a1d27;border:1px solid #2d3142;border-radius:16px;padding:28px 24px;min-height:220px;display:flex;align-items:center;justify-content:center;text-align:center;margin-bottom:24px;perspective:1000px;position:relative}
.card-inner{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:1.35em;font-weight:500;line-height:1.5;word-break:break-word;transition:transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);transform-style:preserve-3d;position:absolute;top:0;left:0}
.card.flipped .card-inner{transform:rotateY(180deg)}
.question, .answer{position:absolute;width:100%;height:100%;display:flex;align-items:center;justify-content:center;padding:0 24px;backface-visibility:hidden; -webkit-backface-visibility:hidden;}
.answer{transform:rotateY(180deg)}
.show-btn{width:100%;padding:14px;background:linear-gradient(135deg,#6366f1,#7c3aed);color:#fff;border:none;border-radius:10px;font-size:1em;font-weight:600;cursor:pointer;transition:opacity .2s,transform .1s}
.show-btn:active{transform:scale(.98);opacity:.9}
.ratings{display:none;grid-template-columns:repeat(4,1fr);gap:8px;animation: fadeIn 0.4s ease}
.ratings button{padding:11px 4px;border:none;border-radius:8px;font-size:.88em;font-weight:600;cursor:pointer;transition:transform .1s,filter .2s;color:#fff}
.ratings button:active{transform:scale(.95);filter:brightness(1.15)}
.again{background:#dc2626}
.hard{background:#d97706}
.good{background:#16a34a}
.easy{background:#7c3aed}
.hint{text-align:center;font-size:12px;color:#4b5563;margin-top:12px}
.hint kbd{background:#1f2937;border:1px solid #374151;border-radius:4px;padding:1px 6px;font-size:11px;font-family:inherit}
@keyframes fadeIn { from {opacity:0} to {opacity:1} }
</style>
</head>
<body>
<div class="wrap" tabindex="0" id="mainWrap" style="outline:none;">
  <div class="hdr"><span>Flashcard Review</span><span id="progress">${progress}</span></div>
  <div class="bar"><div class="bar-fill" id="bar" style="width:${this._currentReviewSession ? Math.round((this._currentReviewSession.index / this._currentReviewSession.cards.length) * 100) : 0}%"></div></div>
  <div class="card" id="card"><div class="card-inner" id="cardText">
    <div class="question">${this._escapeHtml(card.question)}</div>
    <div class="answer" id="answerBack"></div>
  </div></div>
  <button class="show-btn" id="showBtn" onclick="showAnswer()">Show Answer</button>
  <div class="ratings" id="ratings">
    <button class="again" onclick="rate(1)">Again</button>
    <button class="hard" onclick="rate(2)">Hard</button>
    <button class="good" onclick="rate(3)">Good</button>
    <button class="easy" onclick="rate(4)">Easy</button>
  </div>
  <p class="hint">Press <kbd>Space</kbd> to reveal &nbsp;|&nbsp; <kbd>1</kbd><kbd>2</kbd><kbd>3</kbd><kbd>4</kbd> to rate</p>
</div>
<script>
let start = Date.now();
let answered = false;
function showAnswer() {
  if (answered) return;
  answered = true;
  const card = document.getElementById('card');
  const answerBack = document.getElementById('answerBack');
  answerBack.innerHTML = ${JSON.stringify(this._escapeHtml(card.answer || ""))};
  card.classList.add('flipped');
  document.getElementById('showBtn').style.display = 'none';
  document.getElementById('ratings').style.display = 'grid';
  start = Date.now();
}
function rate(v) {
  const elapsed = Math.floor((Date.now() - start) / 1000);
  window.callAmplenotePlugin("rate", JSON.stringify({ rating:v, time:elapsed }));
}
document.addEventListener('keydown', function(e) {
  if (e.code === 'Space' && !answered) { e.preventDefault(); showAnswer(); }
  if (answered) {
    if (e.key === '1') { e.preventDefault(); rate(1); }
    if (e.key === '2') { e.preventDefault(); rate(2); }
    if (e.key === '3') { e.preventDefault(); rate(3); }
    if (e.key === '4') { e.preventDefault(); rate(4); }
  }
});
window.focus();
document.getElementById('mainWrap').focus();
</script>
</body>
</html>`;
  },

  onEmbedCall: async function(app, ...args) {
    // Amplenote passes action as first arg, data as second arg.
    // The embed may call callAmplenotePlugin(action, data) or callAmplenotePlugin(JSON.stringify({action, ...})).
    let action = '';
    let data = {};

    if (args.length >= 2 && typeof args[0] === 'string') {
      // Proper signature: callAmplenotePlugin("rate", {rating: 3, time: 12})
      action = args[0];
      const rawData = args[1];
      if (typeof rawData === 'string') {
        try { data = JSON.parse(rawData); } catch (e) {}
      } else if (typeof rawData === 'object' && rawData !== null) {
        data = rawData;
      }
    } else if (args.length === 1 && typeof args[0] === 'string') {
      // Legacy wrapped signature: callAmplenotePlugin(JSON.stringify({action: "rate", ...}))
      try {
        const parsed = JSON.parse(args[0]);
        action = parsed.action || '';
        data = parsed;
      } catch (e) {}
    } else if (args.length === 1 && typeof args[0] === 'object') {
      action = args[0].action || '';
      data = args[0];
    }

    if (action === "rate") {
      const ratingValue = parseInt(data.rating, 10);
      this._currentReviewSession.ratingsCount[ratingValue] = (this._currentReviewSession.ratingsCount[ratingValue] || 0) + 1;
      const currentCard = this._currentReviewSession.cards[this._currentReviewSession.index];
      const updatedCard = this._updateCardSRS(currentCard, data.rating);
      await this._saveCardToNote(app, updatedCard);

      this._currentReviewSession.index++;
      if (this._currentReviewSession.index < this._currentReviewSession.cards.length) {
        // Use updateEmbedArgs + renderEmbed to update the modal in place
        const nextCard = this._currentReviewSession.cards[this._currentReviewSession.index];
        await app.context.updateEmbedArgs(nextCard);
        await app.context.renderEmbed();
      } else {
        await this._updateDashboard(app, this._currentReviewSession);
        await app.context.updateEmbedArgs({ 
          _complete: true, 
          stats: this._currentReviewSession.ratingsCount, 
          total: this._currentReviewSession.cards.length,
          avgEf: this._currentReviewSession.cards.reduce((a,c)=>a+(c.easinessFactor||0),0)/(this._currentReviewSession.cards.length||1)
        });
        await app.context.renderEmbed();
      }
    }
  },

  // --- Internal state ---

  _updateDashboard: async function(app, session) {
    try {
      let dashboardNote = null;
      const notes = await app.filterNotes({ tag: "srs-dashboard" });
      if (notes && notes.length > 0) {
        dashboardNote = await app.notes.find(notes[0].uuid);
      } else {
        const newNoteUUID = await app.notes.create("Spaced Repetition Dashboard", ["srs-dashboard"]);
        dashboardNote = await app.notes.find(newNoteUUID);
      }

      let content = await dashboardNote.content() || "";
      let stats = { totalReviews: 0, again: 0, hard: 0, good: 0, easy: 0 };
      
      const statsMatch = content.match(/<!--STATS:(.*?)-->/);
      if (statsMatch) {
        try { stats = JSON.parse(statsMatch[1]); } catch(e) {}
      }

      stats.totalReviews += session.cards.length;
      stats.again += session.ratingsCount[1] || 0;
      stats.hard += session.ratingsCount[2] || 0;
      stats.good += session.ratingsCount[3] || 0;
      stats.easy += session.ratingsCount[4] || 0;

      const againPct = stats.totalReviews > 0 ? Math.round((stats.again / stats.totalReviews) * 100) : 0;
      const hardPct = stats.totalReviews > 0 ? Math.round((stats.hard / stats.totalReviews) * 100) : 0;
      const goodPct = stats.totalReviews > 0 ? Math.round((stats.good / stats.totalReviews) * 100) : 0;
      const easyPct = stats.totalReviews > 0 ? Math.round((stats.easy / stats.totalReviews) * 100) : 0;
      const retention = stats.totalReviews > 0 ? Math.round(((stats.hard + stats.good + stats.easy) / stats.totalReviews) * 100) : 0;

      const dbLines = [
        "## 🧠 Spaced Repetition Dashboard",
        "> This note is automatically updated by the Spaced Repetition plugin after every review session.",
        "",
        `**Lifetime Retention Rate:** ${retention}% `,
        "___",
        "### Lifetime Statistics",
        "| Metric | Count | Distribution |",
        "| --- | --- | --- |",
        `| **Total Reviews** | **${stats.totalReviews}** | 100% |`,
        `| 🔴 Again (Forgot) | ${stats.again} | ${againPct}% |`,
        `| 🟠 Hard | ${stats.hard} | ${hardPct}% |`,
        `| 🟢 Good | ${stats.good} | ${goodPct}% |`,
        `| 🟣 Easy | ${stats.easy} | ${easyPct}% |`,
        "",
        `<!--STATS:${JSON.stringify(stats)}-->`
      ];
      await dashboardNote.replaceContent(dbLines.join('\n'));
    } catch (e) {
      console.error("Failed to update dashboard", e);
    }
  },


  _currentReviewSession: { cards: [], index: 0 },

  _updateCardSRS: function(card, rating) {
    const scheduler = this._createScheduler();
    const result = scheduler.next(card, rating);
    return {
      ...card,
      interval: result.scheduled_days,
      easinessFactor: result.stability,
      nextReview: result.due,
      reps: result.reps,
      lapses: result.lapses,
      stability: result.stability,
      difficulty: result.difficulty,
      elapsed_days: result.elapsed_days,
      scheduled_days: result.scheduled_days,
      state: result.state,
      last_review: result.last_review
    };
  },

  _saveCardToNote: async function(app, card) {
    const note = await app.notes.find(card.noteUUID);
    if (!note) return;

    const freshContent = await note.content();
    const { flashcards, lines } = this._extractFlashcardsFromMarkdown(freshContent);

    const freshCard = flashcards.find(c =>
      (c.question === card.question && c.answer === card.answer) ||
      (c.answer === card.question) // fallback for corrupted rows where question landed in answer col
    );
    if (!freshCard) { console.error("Failed to find card in note:", card.question); return; }
    card.lineIndex = freshCard.lineIndex;

    const targetLine = lines[card.lineIndex];
    const updated = this._updateFlashcardInLines(lines, card);
    if (!updated) { console.error("Failed to update card line in note:", card.question); return; }

    // If the line didn't change (other than SRS_DATA), try to only replace that specific block of text to prevent backslash compounding
    // across the entire document during replaceContent. But Amplenote API does not support line-by-line edit without UUIDs.
    // However, the backslash compounding happens because Amplenote's Markdown parser double-escapes on replaceContent.
    // Workaround: We only replace the exact text of the single row using replaceContent's `replace` parameter if it existed.
    // But since replaceContent only takes (newContent), it replaces everything. 
    // Wait, `replaceContent` can take a second parameter! `note.replaceContent(newMarkdown, section)`!
    // Since we don't have the section, we can use `note.replaceContent(newContent)` but we must unescape the compounding slashes before sending it back!
    
    // Unescape compounding backslashes that Amplenote generates on every read/write cycle
    // Note: If you have \ in your markdown, it will get reduced to nothing on each save.
    // This is necessary because Amplenote's API currently doubles backslashes inside tables on every full-note overwrite.
    let newContent = this._linesToMarkdown(lines);
    // Eliminate all compounding slashes indiscriminately so they don't corrupt the note visually
    newContent = newContent.replace(/\\/g, '');
    await note.replaceContent(newContent);
  }
})
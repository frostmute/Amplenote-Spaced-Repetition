const fs = require('fs');
const pluginContent = fs.readFileSync('plugin.js', 'utf8');
const plugin = eval(pluginContent);

describe('Markdown Parser', () => {
    it('parses a basic table', () => {
        const content = `| Question | Answer |
| -------- | ------ |
| Q1       | A1     |`;
        const { flashcards } = plugin._extractFlashcardsFromMarkdown(content);
        expect(flashcards.length).toBe(1);
        expect(flashcards[0].question).toBe('Q1');
        expect(flashcards[0].answer).toBe('A1');
    });

    it('parses a shifted table', () => {
        const content = `| | | |
| - | - | - |
| | Question | Answer |
| | -------- | ------ |
| | Q1       | A1     |`;
        const { flashcards } = plugin._extractFlashcardsFromMarkdown(content);
        expect(flashcards.length).toBe(1);
        expect(flashcards[0].question).toBe('Q1');
        expect(flashcards[0].answer).toBe('A1');
    });
    
    it('parses a corrupted row where question lands in answer col', () => {
        const content = `| Question | Answer |
| -------- | ------ |
| | Q1       |`;
        const { flashcards } = plugin._extractFlashcardsFromMarkdown(content);
        expect(flashcards.length).toBe(1);
        expect(flashcards[0].question).toBe('Q1');
    });
});

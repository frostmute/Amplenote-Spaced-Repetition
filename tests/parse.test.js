const fs = require('fs');
const path = require('path');
const plugin = require('../plugin');

describe('Markdown Parser', () => {
    it('parses a basic table', () => {
        const content = `| Question | Answer |\n| -------- | ------ |\n| Q1       | A1     |`;
        const { flashcards } = plugin._extractFlashcardsFromMarkdown(content);
        expect(flashcards.length).toBe(1);
        expect(flashcards[0].question).toBe('Q1');
        expect(flashcards[0].answer).toBe('A1');
    });

    it('parses a shifted table', () => {
        const content = `| | | |\n| - | - | - |\n| | Question | Answer |\n| | -------- | ------ |\n| | Q1       | A1     |`;
        const { flashcards } = plugin._extractFlashcardsFromMarkdown(content);
        expect(flashcards.length).toBe(1);
        expect(flashcards[0].question).toBe('Q1');
        expect(flashcards[0].answer).toBe('A1');
    });
    
    it('parses a corrupted row where question lands in answer col', () => {
        const content = `| Question | Answer |\n| -------- | ------ |\n| | Q1       |`;
        const { flashcards } = plugin._extractFlashcardsFromMarkdown(content);
        expect(flashcards.length).toBe(1);
        expect(flashcards[0].question).toBe('Q1');
    });

    it('updates flashcards in lines', () => {
        const lines = [
          '| Question | Answer | srs_data |',
          '| -------- | ------ | -------- |',
          '| Q1       | A1     |          |'
        ];
        const card = { question: 'Q1', answer: 'A1', lapses: 0, lineIndex: 2 };
        plugin._updateFlashcardInLines(lines, card);
        // Uses base64 encoding for srs_data now
        expect(lines[2]).toContain('eyJsYXBzZXMiOjB9');
    });

    it('finds column index correctly', () => {
        const lines = [
          '| Some Header | Question | Answer |',
          '| ----------- | -------- | ------ |'
        ];
        const qIdx = plugin._findColIdx(lines, ['question']);
        expect(qIdx).toBe(1);
        const aIdx = plugin._findColIdx(lines, ['answer', 'back']);
        expect(aIdx).toBe(2);
    });

    it('finds header row correctly', () => {
        const lines = [
          '| Some Header | Question | Answer |',
          '| ----------- | -------- | ------ |',
          '| h1          | q1       | a1     |'
        ];
        const rowIdx = plugin._findHeaderRow(lines, 1);
        expect(rowIdx).toBe(0);
    });

    it('converts lines back to markdown', () => {
        const lines = ['a', 'b', 'c'];
        expect(plugin._linesToMarkdown(lines)).toBe('a\nb\nc');
    });
});

const fs = require('fs');
const path = require('path');
const MockApp = require('./mock-app');
const plugin = require('../plugin');

describe('Integration Tests', () => {
  it('should run an empty review session gracefully', async () => {
    const app = new MockApp();
    app.prompt = async () => 'srs/review';
    app.filterNotes = async () => [{ uuid: 'note-1' }];
    app.notes = {
      find: async () => ({
        uuid: 'note-1',
        content: async () => 'No flashcards here',
        tags: ['srs/review']
      })
    };
    let alerted = false;
    app.alert = async (msg) => { alerted = true; };
    
    await plugin.noteOption['Start Review Session'].bind(plugin)(app, 'note-1');
    expect(alerted).toBe(true);
  });
  
  it('should collect due cards across notes', async () => {
    const app = new MockApp();
    app.filterNotes = async () => [{ uuid: 'note-1' }, { uuid: 'note-2' }];
    app.notes = {
      find: async (args) => {
        if (args.uuid === 'note-1') {
          return {
            uuid: 'note-1',
            tags: ['srs/review'],
            content: async () => `
| Question | Answer |
| -------- | ------ |
| Q1       | A1     |
`
          };
        } else {
          return {
            uuid: 'note-2',
            tags: ['srs/review'],
            content: async () => `
| Question | Answer | srs_data |
| -------- | ------ | -------- |
| Q2       | A2     | <!--eyJsYXBzZXMiOjB9--> |
`
          };
        }
      }
    };
    
    const dueCards = await plugin._collectDueCards(app, ['srs/review']);
    expect(dueCards.length).toBeGreaterThan(0);
  });
  
  it('should save card to note correctly', async () => {
    const app = new MockApp();
    let replacedContent = '';
    
    app.notes = {
      find: async () => ({
        uuid: 'note-1',
        tags: ['srs'],
        content: async () => `
| Question | Answer |
| -------- | ------ |
| Q1       | A1     |
`,
        replaceContent: async (content) => {
          replacedContent = content;
        }
      })
    };
    
    const card = {
      question: 'Q1',
      answer: 'A1',
      noteUUID: 'note-1',
      lineIndex: 3,
      srs_data: { reps: 1 }
    };
    
    await plugin._saveCardToNote(app, card);
    expect(replacedContent).toContain('<!--e30=-->');
  });
});


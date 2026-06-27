const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const pluginSrc = fs.readFileSync(
  '/Users/thewytchhaus/Documents/GitHub/amplenote-spaced-repetition/plugin.js',
  'utf8'
);
const plugin = eval(pluginSrc);

let mockFlashcardNote = `
# Flashcards
| Question | Answer |
|---|---|
| What is 2+2? | 4 |
| What is the capital of France? | Paris |
`;

let mockDashboardNote = null;
let currentEmbedArgs = null;
let cardsReviewed = 0;

const app = {
  context: {
    pluginUUID: 'test-plugin-123',
    updateEmbedArgs: async (...args) => {
      currentEmbedArgs = args;
    },
    renderEmbed: async () => {
      await plugin.renderEmbed(app, ...currentEmbedArgs);
    },
  },
  filterNotes: async ({ tag }) => {
    if (tag === 'srs-dashboard') return mockDashboardNote ? [{ uuid: 'dash-123' }] : [];
    return [{ uuid: 'note-123' }];
  },
  notes: {
    find: async (uuid) => {
      if (uuid === 'note-123') {
        return {
          uuid: 'note-123',
          name: 'Test Note',
          content: async () => mockFlashcardNote,
          replaceContent: async (newContent) => {
            mockFlashcardNote = newContent;
          },
        };
      }
      if (uuid === 'dash-123') {
        return {
          uuid: 'dash-123',
          name: 'Spaced Repetition Dashboard',
          content: async () => mockDashboardNote,
          replaceContent: async (newContent) => {
            mockDashboardNote = newContent;
          },
        };
      }
      return null;
    },
  },
  getNoteContent: async ({ uuid }) => {
    return uuid === 'dash-123' ? mockDashboardNote : mockFlashcardNote;
  },
  replaceNoteContent: async ({ uuid }, newContent) => {
    if (uuid === 'dash-123') mockDashboardNote = newContent;
    else mockFlashcardNote = newContent;
  },
  createNote: async (title, tags) => {
    mockDashboardNote = `# ${title}`;
    return 'dash-123';
  },
  openSidebarEmbed: async (width, title, ...args) => {
    currentEmbedArgs = args;
    await plugin.renderEmbed(app, ...args);
    if (plugin.onEmbedCall) {
      setTimeout(async () => {
        cardsReviewed++;
        await plugin.onEmbedCall(app, 'rate', JSON.stringify({ rating: 3, card: args[0] }));

        if (cardsReviewed < 2 && currentEmbedArgs[0] && !currentEmbedArgs[0].isComplete) {
          setTimeout(async () => {
            cardsReviewed++;
            await plugin.onEmbedCall(
              app,
              'rate',
              JSON.stringify({ rating: 4, card: currentEmbedArgs[0] })
            );
          }, 100);
        }
      }, 100);
    }
  },
  alert: async (msg) => console.log(`[Mock App ALERT]: ${msg}`),
  prompt: async (msg, opts) => {
    return ['test-tag'];
  },
};

global.window = new JSDOM('<!DOCTYPE html><p>Hello world</p>').window;
global.document = window.document;

async function runSimulation() {
  console.log('\\n--- Starting Simulation ---');
  const reviewActionKey = Object.keys(plugin.noteOption).find(
    (k) => k.includes('Review') || k.includes('Study')
  );
  await plugin.noteOption[reviewActionKey].call(plugin, app);

  setTimeout(() => {
    console.log('\\n--- Simulation Complete ---');
    console.log('\\n*** Flashcard Note ***');
    console.log(mockFlashcardNote);
    console.log('\\n*** Dashboard Note ***');
    console.log(mockDashboardNote.split('<!--STATS:')[1]);
  }, 1500);
}

runSimulation();

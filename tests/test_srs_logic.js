const fs = require('fs');
const path = require('path');
const pluginContent = fs.readFileSync(path.join(__dirname, '../plugin.js'), 'utf8');
const plugin = eval(pluginContent);

const scheduler = plugin._createScheduler();
const card = {}; // new card
console.log("New Card (Rating 3/Good):");
const res1 = scheduler.next(card, 3);
console.log(res1);

console.log("\nAfter 1 day (Rating 3/Good):");
const card2 = {
  reps: 1, 
  lapses: 0,
  stability: res1.stability,
  difficulty: res1.difficulty,
  last_review: new Date(Date.now() - 86400000).toISOString()
};
const res2 = scheduler.next(card2, 3);
console.log(res2);

console.log("\nAfter 4 days (Rating 2/Hard):");
const card3 = {
  reps: 2, 
  lapses: 0,
  stability: res2.stability,
  difficulty: res2.difficulty,
  last_review: new Date(Date.now() - (86400000 * 4)).toISOString()
};
const res3 = scheduler.next(card3, 2);
console.log(res3);

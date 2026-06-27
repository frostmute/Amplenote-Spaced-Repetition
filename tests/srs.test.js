const plugin = require('../plugin');

describe('SRS Logic Tests', () => {
  it('calculates next review intervals correctly', () => {
    const scheduler = plugin._createScheduler();
    
    // New Card
    const card = {}; 
    const res1 = scheduler.next(card, 3); // 3 = Good
    expect(res1.stability).toBeGreaterThan(0);
    expect(res1.difficulty).toBeGreaterThan(0);
    expect(res1.due).toBeDefined();

    // After 1 day
    const card2 = {
      reps: 1,
      lapses: 0,
      stability: res1.stability,
      difficulty: res1.difficulty,
      last_review: new Date(Date.now() - 86400000).toISOString(),
    };
    const res2 = scheduler.next(card2, 3); // Good
    expect(res2.stability).toBeGreaterThan(res1.stability);
    
    // After 4 days, rating Hard
    const card3 = {
      reps: 2,
      lapses: 0,
      stability: res2.stability,
      difficulty: res2.difficulty,
      last_review: new Date(Date.now() - 86400000 * 4).toISOString(),
    };
    const res3 = scheduler.next(card3, 2); // Hard
    expect(res3.stability).toBeGreaterThan(0);
  });
  
  it('handles bounds and bad inputs', () => {
    const scheduler = plugin._createScheduler();
    const res1 = scheduler.next({}, 1); // Again
    expect(res1.difficulty).toBeDefined();
    
    const res2 = scheduler.next({}, 4); // Easy
    expect(res2.difficulty).toBeDefined();
    
    // If last_review is missing
    const res3 = scheduler.next({ reps: 1, stability: 1, difficulty: 5 }, 3);
    expect(res3.stability).toBeGreaterThan(0);
  });
});

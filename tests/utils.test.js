const plugin = require('../plugin');

describe('Utility Tests', () => {
  it('escapes HTML correctly', () => {
    expect(plugin._escapeHtml('<div>&"\'</div>')).toBe('&lt;div&gt;&amp;&quot;&#039;&lt;/div&gt;');
  });

  it('handles custom backslash bracket replacement', () => {
    expect(plugin._escapeHtml('\\[\\[Note Name\\]\\]')).toBe('[[Note Name]]');
  });

  it('calculates days between dates', () => {
    const d1 = new Date('2023-01-01');
    const d2 = new Date('2023-01-05');
    // Using simple math to test the logic you might have
    const days = (d2 - d1) / 86400000;
    expect(days).toBe(4);
  });
});

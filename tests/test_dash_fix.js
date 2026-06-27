const fs = require('fs');
let code = fs.readFileSync('plugin.js', 'utf8');

const replacement = `const againPct = stats.totalReviews > 0 ? Math.round((stats.again / stats.totalReviews) * 100) : 0;
      const hardPct = stats.totalReviews > 0 ? Math.round((stats.hard / stats.totalReviews) * 100) : 0;
      const goodPct = stats.totalReviews > 0 ? Math.round((stats.good / stats.totalReviews) * 100) : 0;
      const easyPct = stats.totalReviews > 0 ? Math.round((stats.easy / stats.totalReviews) * 100) : 0;
      const retention = stats.totalReviews > 0 ? Math.round(((stats.hard + stats.good + stats.easy) / stats.totalReviews) * 100) : 0;

      const dbLines = [
        "## 🧠 Spaced Repetition Dashboard",
        "> This note is automatically updated by the Spaced Repetition plugin after every review session.",
        "",
        \`**Lifetime Retention Rate:** \${retention}% \`,
        "___",
        "### Lifetime Statistics",
        "| Metric | Count | Distribution |",
        "| --- | --- | --- |",
        \`| **Total Reviews** | **\${stats.totalReviews}** | 100% |\`,
        \`| 🔴 Again (Forgot) | \${stats.again} | \${againPct}% |\`,
        \`| 🟠 Hard | \${stats.hard} | \${hardPct}% |\`,
        \`| 🟢 Good | \${stats.good} | \${goodPct}% |\`,
        \`| 🟣 Easy | \${stats.easy} | \${easyPct}% |\`,
        "",
        \`<!--STATS:\${JSON.stringify(stats)}-->\`
      ];`;

if (code.includes('const dbLines = [')) {
  const newCode = code.replace(
    /const dbLines = \[\s*"# Spaced Repetition Dashboard",[\s\S]*?`<!--STATS:\$\{JSON\.stringify\(stats\)\}-->`\s*\];/,
    replacement
  );
  fs.writeFileSync('plugin.js', newCode);
  console.log('Replaced dashboard formatting');
} else {
  console.log('Failed to find dbLines');
}

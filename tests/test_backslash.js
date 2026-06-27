let newContent = `|How do you link?|\\\\[\\\\[Note Name\\\\]\\\\]|`;
console.log('Original: ' + newContent);
newContent = newContent.replace(/\\/g, '');
console.log('Reduced: ' + newContent);

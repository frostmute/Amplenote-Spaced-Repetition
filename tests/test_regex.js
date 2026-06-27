let newContent = `|Question|Answer|\n|How do you link?|\\\\[\\\\[Note Name\\\\]\\\\]|`;
console.log('Original:', newContent);
// Strip every single backslash character globally
newContent = newContent.replace(/\\/g, '');
console.log('Replaced:', newContent);

const q = "\\[\\[Note Name\\]\\]";
console.log("Raw string:", q);

const _escapeHtml = function(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    let escaped = text.replace(/[&<>"']/g, m => map[m]);
    // Fix: We need to replace literal backslashes followed by brackets.
    escaped = escaped.replace(/\\\[/g, '[').replace(/\\\]/g, ']');
    return escaped;
};

console.log("Escaped:", _escapeHtml(q));

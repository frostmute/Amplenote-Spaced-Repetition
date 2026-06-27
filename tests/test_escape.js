const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
const _escapeHtml = function (text) {
  return text.replace(/[&<>"']/g, (m) => map[m]);
};
console.log(_escapeHtml('my [code] test'));
console.log(JSON.stringify(_escapeHtml('my [code] test')));

/**
 * Patch html2canvas to safely handle modern CSS color functions like oklch, lab, lch, color-mix
 * instead of throwing "Attempting to parse an unsupported color function"
 */
const fs = require('fs');
const path = require('path');

const targetFiles = [
  path.resolve('node_modules/html2canvas/dist/html2canvas.js'),
  path.resolve('node_modules/html2canvas/dist/html2canvas.esm.js'),
  path.resolve('node_modules/.vite/deps/html2canvas.js')
];

const searchRegex = /if\s*\(\s*typeof\s+colorFunction\s*===\s*['"]undefined['"]\s*\)\s*(?:\{\s*)?throw\s+new\s+Error\s*\(\s*["']Attempting to parse an unsupported color function.*?;\s*(?:\}\s*)?/g;

const replacement = `if (typeof colorFunction === "undefined") {
  try {
    if (typeof document !== 'undefined') {
      var _cvs = document.createElement('canvas');
      _cvs.width = 1; _cvs.height = 1;
      var _ctx = _cvs.getContext('2d', { willReadFrequently: true });
      if (_ctx) {
        var _argsStr = '';
        if (value.values && value.values.length) {
          for (var _vi = 0; _vi < value.values.length; _vi++) {
            var _v = value.values[_vi];
            if (_v.type === 17) _argsStr += (_v.number !== undefined ? _v.number : '') + (_v.unit || '') + ' ';
            else if (_v.type === 18) _argsStr += (_v.name ? _v.name + '() ' : '');
            else _argsStr += (_v.value !== undefined ? _v.value : '') + ' ';
          }
        }
        var _cssVal = value.name + '(' + _argsStr.trim() + ')';
        _ctx.fillStyle = '#000000';
        _ctx.fillStyle = _cssVal;
        _ctx.fillRect(0, 0, 1, 1);
        var _px = _ctx.getImageData(0, 0, 1, 1).data;
        return ((_px[0] << 24) | (_px[1] << 16) | (_px[2] << 8) | (_px[3] << 0)) >>> 0;
      }
    }
  } catch (_e) {}
  return 0x00000000;
}`;

let patchedCount = 0;
for (const file of targetFiles) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    if (searchRegex.test(content)) {
      content = content.replace(searchRegex, replacement);
      fs.writeFileSync(file, content, 'utf8');
      console.log('Successfully patched:', file);
      patchedCount++;
    } else {
      console.log('Already patched or pattern not found in:', file);
    }
  } else {
    console.log('File not found, skipping:', file);
  }
}

console.log('Patch completed for', patchedCount, 'files.');

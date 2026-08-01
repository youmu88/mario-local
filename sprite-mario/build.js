#!/usr/bin/env node
/*
 * 一键构建脚本：把 ES module 源码合并为单文件非模块脚本 game.all.js
 * 用法：npm run build  （或 node build.js）
 * 解决：file:// 直接双击 index.html 时浏览器 CORS 拦截 module 导致黑屏
 */
const fs = require('fs');
const path = require('path');

// 依赖顺序（先定义后引用）
const ORDER = [
  'config.js', 'sprites.js', 'physics.js', 'levelgen.js', 'entities.js',
  'level.js', 'player.js', 'render.js', 'input.js', 'audio.js', 'game.js',
  'ui.js', 'main.js'
];

let out = '/* ===== SUPER MARIO - 单文件构建版 (自动生成，避免 file:// 下 ES module CORS 黑屏) ===== */\n';
out += '/* 来源: js/*.js (ES module) 合并去模块化，由 npm run build 重新生成 */\n';
out += ';(function(){\n"use strict";\n\n';

for (const file of ORDER) {
  const p = path.join(__dirname, 'js', file);
  if (!fs.existsSync(p)) { console.error('缺失源码:', p); process.exit(1); }
  let code = fs.readFileSync(p, 'utf8');
  // 剥离 import 行
  code = code.replace(/^import\s+.*?from\s+['"].*?['"];\s*$/gm, '');
  // 剥离 export
  code = code
    .replace(/^export\s+default\s+/gm, '')
    .replace(/^export\s+(class|function|const|let|var)\s+/gm, '$1 ')
    .replace(/^export\s*\{[^}]*\};?\s*$/gm, '');
  out += '/* ===== ' + file + ' ===== */\n' + code + '\n\n';
}

out += '})();\n';

const target = path.join(__dirname, 'js', 'game.all.js');
fs.writeFileSync(target, out);
console.log('✅ 已重建', path.relative(process.cwd(), target), '(' + (out.length/1024).toFixed(1) + 'KB)');

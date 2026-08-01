/* ===== 入口 ===== */
import { Game } from './game.js';
import { Renderer } from './render.js';
import { Input } from './input.js';
import { AudioFX } from './audio.js';
import { UI } from './ui.js';
import { StartConfig } from './config.js';
import { loadOfficialSprites } from './sprites.js';

const renderer = new Renderer();
const input = new Input();
const sfx = new AudioFX();
let game = null;
let ui = null;
let last = 0;

function startGame(cfg){
  ui.hideAll();
  document.getElementById('touch-controls').classList.remove('hidden');
  game.startGame(cfg);
}

function retry(){
  ui.hideAll();
  document.getElementById('touch-controls').classList.remove('hidden');
  // 回到当前状态继续/下一关
  if (game.state==='clear') game.levelNo++;
  else if (game.state==='gameover'){ game.backToMenu(); }
  if (game.state!=='menu'){
    game.startLevel({...game.cfg});
  }
  renderer.resize();
}

function init(){
  loadOfficialSprites();  // 异步加载官方马里奥主题精灵（加载后自动替换程序化精灵）
  ui = new UI((c)=>startGame(c), ()=>retry());
  game = new Game(renderer, input, sfx, (st)=>{
    if (st==='playing') ui.hideAll();
    else if (st==='gameover') ui.showResult('gameover', game);
    else if (st==='clear') ui.showResult('clear', game);   // 过关：显示 COURSE CLEAR + 下一关按钮
    else if (st==='dying') { /* 死亡由后续显示 */ }
  });
  ui.mount();
  renderer.resize();
  window.__MARIO_DEBUG = { game, renderer, input, sfx };

  window.addEventListener('resize', ()=>renderer.resize());
  window.addEventListener('keydown', e=>{ if(e.key==='Enter'){ sfx.resume(); } });
  document.addEventListener('pointerdown', ()=>sfx.resume(), {once:true});

  // PWA 注册
  if ('serviceWorker' in navigator){
    navigator.serviceWorker.register('./sw.js').catch(()=>{});
  }
}

function loop(t){
  requestAnimationFrame(loop);
  const dt = Math.min((t-last)/1000, 0.05);
  last = t;
  if (!game) return;
  game.update(dt);
  renderer.begin();
  // 统一渲染
  if (game.world){
    game.render();
  } else {
    renderer.drawMenu();
  }
}

window.addEventListener('DOMContentLoaded', init);
last = performance.now();
requestAnimationFrame(loop);

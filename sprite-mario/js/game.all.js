/* ===== SUPER MARIO - 单文件构建版 (自动生成，避免 file:// 下 ES module CORS 黑屏) ===== */
/* 来源: js/*.js (ES module) 合并去模块化，由 npm run build 重新生成 */
;(function(){
"use strict";

/* ===== config.js ===== */
/* ===== 全局配置与开局配置 ===== */
const CFG = {
  // 逻辑分辨率（固定像素，物理恒定）
  VIEW_W: 640,
  VIEW_H: 360,
  // 像素块尺寸
  TILE: 32,
  GRAVITY: 0.55,        // 重力
  MAX_FALL: 14,
  RUN_SPEED: 1.8,       // 基础跑速（更慢，经典手感）
  DASH_SPEED: 3.0,      // 冲刺
  JUMP_VEL: -11.0,      // 跳跃初速（更高，跳得更远）
  DASH_JUMP_VEL: -13.0, // 冲刺大跳
  JUMP_HOLD_GRAV: 0.22, // 长按跳跃时的上升重力（越小跳得越高/越远，可变跳高）
  NORMAL_GRAV: 0.42,    // 常态重力（松开跳或下落时）
  // 时间限制(秒)
  TIME_LIMIT: 300,
};

/* 像素精灵地图缩放（每精灵内用 16x16 或 8x8 网格） */
const PX = 4; // 每个逻辑像素内精灵网格（提高分辨率，画面更精细）

/* ===== 开局配置（可被 UI 修改） ===== */
const StartConfig = {
  lives: 3,          // 3 | 30
  startBig: false,   // 开局是否大马里奥
  startFire: false,  // 开局是否带子弹(火球)
  invincible: false, // 无敌
};

/* 通过 localStorage 保存偏好可选项 */
let savedCfg = null;
try { savedCfg = JSON.parse(localStorage.getItem('mario_start_config')); } catch(e){}
if (savedCfg) Object.assign(StartConfig, savedCfg);

function saveStartConfig(){
  try { localStorage.setItem('mario_start_config', JSON.stringify(StartConfig)); } catch(e){}
}



/* ===== sprites.js ===== */
/* ===== 程序化像素精灵绘制（高精度重绘版） =====
 * 用字符画描述精灵，运行时在离屏 canvas 上渲染为高清纹理。
 * PX 在 config.js 中定义（当前=4，更高分辨率）。
 * 另支持加载官方马里奥主题素材（assets/sprites/*.png）替换程序化精灵。
 */

/* 简易像素字符画：'.'透明 其他=色板key */
function makeSprite(rows, pal) {
  const h = rows.length;
  const w = Math.max(...rows.map(r => r.length));
  const c = document.createElement('canvas');
  c.width = w * PX;
  c.height = h * PX;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = rows[y][x];
      if (ch === '.') continue;
      const col = pal[ch];
      if (!col) continue;
      g.fillStyle = col;
      g.fillRect(x * PX, y * PX, PX, PX);
    }
  }
  return c;
}

/* ===== 调色板（经典红白配色） ===== */
const PAL = {
  'R':'#e03a20',  // 马里奥红(帽/上衣)
  'r':'#9c2010',  // 深红(阴影)
  'B':'#2050e0',  // 马里奥蓝(背带裤)
  'b':'#1030a0',  // 深蓝阴影
  'S':'#f8d0a8',  // 肤色
  's':'#d8a070',  // 肤色阴影
  'H':'#603010',  // 棕色(头发/胡子/鞋)
  'h':'#381c05',  // 深棕
  'K':'#1a0a00',  // 黑(眼睛)
  'W':'#ffffff',  // 白(手套/眼睛高光)
  'Y':'#ffd800',  // 黄(星/扣)
  'y':'#c9a000',
  'G':'#c07830',  // Goomba 板栗棕
  'g':'#804818',  // 深棕
  'T':'#50a028',  // Koopa 壳绿
  't':'#286812',  // 深绿
  'M':'#e83818',  // 蘑菇伞红
  'm':'#a02008',
  'E':'#f8f0e0',  // 蘑菇柄米白
  'e':'#d0b890',
  'F':'#ff8020',  // 火焰花橙
  'O':'#ffa030',  // 火球亮橙
  'o':'#d06000',  // 火球暗橙
  'P':'#c96a12',  // 砖块土色
  'p':'#8a3d00',
  'Q':'#ffc020',  // 金币金
  'q':'#d09000',
  'C':'#e0e0e0',  // 砖灰
  'c':'#a0a0a0',
  'D':'#b8b8b8',  // 暗灰
  'd':'#787878',
};

const SPRITES = {};
window.__SPRITES = SPRITES;  // 调试钩子（与 __MARIO_DEBUG 同风格）

/* ===== 小马里奥（面向右，经典红白配色） 16x20 ===== */
SPRITES['mario_small'] = makeSprite([
  '.....RRRRRRR.....',
  '....RRRRRRRRRR...',
  '....RRRRRRRRRRR..',
  '....RRRRRRRRRRR..',
  '....SSSSSSSSSSS..',
  '....SSSSKSSSSK...',
  '....SSSSSSSSSS...',
  '.....SSSSSSSS....',
  '....HHSSSSSSHH...',
  '...HHHSSSSSSHHH..',
  '...HHHHSSSSHHHH..',
  '....HHHHHHHHH....',
  '.....RRRRRRR.....',
  '....RRRRRRRRR....',
  '...RRBRRRRRBRR...',
  '...RBBBRRRBBBR...',
  '...RBBBBBBBBBR...',
  '....BBBBBBBBB....',
  '....BB.BBB.BB....',
  '....BB.BBB.BB....',
], PAL);

/* ===== 大马里奥（面向右） 20x28 ===== */
SPRITES['mario_big'] = makeSprite([
  '......RRRRRRRR......',
  '.....RRRRRRRRRR.....',
  '....RRRRRRRRRRRR....',
  '....RRRRRRRRRRRR....',
  '....SSSSSSSSSSSS....',
  '....SSSSSKSSSSK.....',
  '....SSSSSSSSSSSS....',
  '.....SSSSSSSSSS.....',
  '....HHSSSSSSSSHH....',
  '...HHHSSSSSSSSHHH...',
  '...HHHHSSSSSSHHHH...',
  '....HHHHHHHHHHHH....',
  '.....RRRRRRRRRR.....',
  '....RRRRRRRRRRRR....',
  '....RRRRRRRRRRRR....',
  '...RRRRRRRRRRRRRR...',
  '...RRBBRRRRRRBBRR...',
  '...RBBBBRRRRBBBBR...',
  '...RBBBBBBBBBBBBR...',
  '....BBBBBBBBBBBB....',
  '....BBBB.BBBBBB.....',
  '....BBBB.BBBBBB.....',
  '....BBB...BBB.......',
  '....BBB...BBB.......',
  '....BB.....BB.......',
  '....BB.....BB.......',
  '....BBB...BBB.......',
  '....BBB...BBB.......',
], PAL);

/* ===== 板栗仔 Goomba（面向右） 14x14 ===== */
SPRITES['goomba'] = makeSprite([
  '....GGGGGG....',
  '...GGGGGGGG...',
  '..GGGGGGGGGG..',
  '..GGgGGGGgGG..',
  '..GGGGGGGGGG..',
  '..GGKGGGGKGG..',
  '..GGGGGGGGGG..',
  '.GGGGGGGGGGGG.',
  '.GGGGGGGGGGGG.',
  '.GGGGgGGgGGGG.',
  '.GGGGGGGGGGGG.',
  '..GGGGGGGGGG..',
  '...ggGGGGgg...',
  '....gggggg....',
], PAL);

/* ===== 板栗仔走路帧B（脚部交替） ===== */
SPRITES['goomba_w2'] = makeSprite([
  '....GGGGGG....',
  '...GGGGGGGG...',
  '..GGGGGGGGGG..',
  '..GGgGGGGgGG..',
  '..GGGGGGGGGG..',
  '..GGKGGGGKGG..',
  '..GGGGGGGGGG..',
  '.GGGGGGGGGGGG.',
  '.GGGGGGGGGGGG.',
  '.GGGGgGGgGGGG.',
  '.GGGGGGGGGGGG.',
  '..GGGGGGGGGG..',
  '....ggGGGG....',
  '...ggggggg....',
], PAL);

/* ===== 板栗仔踩扁（压扁状） ===== */
SPRITES['goomba_squash'] = makeSprite([
  '..............',
  '..............',
  '..............',
  '..............',
  '..............',
  '....GGGGGG....',
  '...GGGGGGGG...',
  '..GGGGGGGGGG..',
  '..GGKGGGGKGG..',
  '.GGGGGGGGGGGG.',
  '..gggggggggg..',
], PAL);

/* ===== 乌龟 Koopa（面向右） 16x18 ===== */
SPRITES['koopa'] = makeSprite([
  '......TTTT......',
  '.....TTTTTT.....',
  '....TTTTTTTT....',
  '....TTTTTTTT....',
  '....TTsTTTTs....',
  '....TTTTTTTT....',
  '....TTTTTTTT....',
  '.....TTTTTT.....',
  '....TTTTTTTT....',
  '...TTTTTTTTTT...',
  '..TTTTTTTTTTTT..',
  '..TTTTTTTTTTTT..',
  '..TTsTTTTTTsTT..',
  '..TTTTTTTTTTTT..',
  '..TTTTTTTTTTTT..',
  '...TTTTTTTTTT...',
  '....TT....TT....',
  '....TT....TT....',
], PAL);

/* ===== 乌龟走路帧B ===== */
SPRITES['koopa_w2'] = makeSprite([
  '......TTTT......',
  '.....TTTTTT.....',
  '....TTTTTTTT....',
  '....TTTTTTTT....',
  '....TTsTTTTs....',
  '....TTTTTTTT....',
  '....TTTTTTTT....',
  '.....TTTTTT.....',
  '....TTTTTTTT....',
  '...TTTTTTTTTT...',
  '..TTTTTTTTTTTT..',
  '..TTTTTTTTTTTT..',
  '..TTsTTTTTTsTT..',
  '..TTTTTTTTTTTT..',
  '..TTTTTTTTTTTT..',
  '...TTTTTTTTTT...',
  '.....TT..TT.....',
  '.....TT..TT.....',
], PAL);

/* ===== 乌龟壳（静止） 14x10 ===== */
SPRITES['koopa_shell'] = makeSprite([
  '.....TTTTT.....',
  '...TTTTTTTTT...',
  '..TTTTTTTTTTT..',
  '..TTTTTTTTTTT..',
  '.TTtTTTTTTtTT..',
  '.TTTTTTTTTTTT..',
  '..TTTTTTTTTTT..',
  '..TTTTTTTTTTT..',
  '...TTTTTTTTT...',
  '.....TTTTT.....',
], PAL);

/* ===== 食人花（程序化占位，会被官方素材替换） 14x18 ===== */
SPRITES['piranha'] = makeSprite([
  '.....TTTTT.....',
  '....TTTTTTT....',
  '...TTTTTTTTT...',
  '..TTWWTTTWWTT..',
  '..TTWWTTTWWTT..',
  '..TTTTTTTTTTT..',
  '...TTTTTTTTT...',
  '...TTTTTTTTT...',
  '....TTTTTTT....',
  '....TTTTTTT....',
  '.....TTTTT.....',
  '.....TTTTT.....',
  '.....TTTTT.....',
  '.....TTTTT.....',
  '.....TTTTT.....',
  '.....TTTTT.....',
  '.....TTTTT.....',
  '.....TTTTT.....',
], PAL);
SPRITES['piranha_2'] = SPRITES['piranha'];

/* ===== 尖刺龟 Spiny（程序化：红壳+白刺，踩踏受伤） 16x16 ===== */
SPRITES['spiny'] = makeSprite([
  '....WW..WW....',
  '...W..WW..W...',
  '..W..RRRR..W..',
  '.W..RRRRRR..W.',
  '....RRRRRR....',
  '...RRWWRRWW...',
  '..RRRRRRRRRR..',
  '..RRKRRRRKRR..',
  '..RRRRRRRRRR..',
  '...RRRRRRRR...',
  '...RgRRRRgR...',
  '....RRRRRR....',
  '.....RRRR.....',
  '...RR....RR...',
  '...RR....RR...',
  '...RR....RR...',
], PAL);
/* ===== 尖刺龟行走帧B（腿并拢迈步，与 spiny 张开腿交替 = 走路动画） ===== */
SPRITES['spiny_w2'] = makeSprite([
  '....WW..WW....',
  '...W..WW..W...',
  '..W..RRRR..W..',
  '.W..RRRRRR..W.',
  '....RRRRRR....',
  '...RRWWRRWW...',
  '..RRRRRRRRRR..',
  '..RRKRRRRKRR..',
  '..RRRRRRRRRR..',
  '...RRRRRRRR...',
  '...RgRRRRgR...',
  '....RRRRRR....',
  '.....RRRR.....',
  '.....RRRR.....',
  '.....RRRR.....',
  '.....RRRR.....',
], PAL);

/* ===== 尖刺龟压扁帧（被消灭后显示，眼睛压扁） ===== */
SPRITES['spiny_squash'] = makeSprite([
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '..RRRRRRRRRRRR..',
  '..RRKRRRRRRKRR..',
  '..RRRRRRRRRRRR..',
  '...RRRRRRRRRR...',
  '....RRRRRRRR....',
  '.....RRRRRR.....',
], PAL);

/* ===== 蘑菇（红，变大道具） 16x16 ===== */
SPRITES['mushroom'] = makeSprite([
  '.....MMMMMM.....',
  '....MMMMMMMM....',
  '...MMMMMMMMMM...',
  '..MMMMMMMMMMMM..',
  '..MMMMMMMMMMMM..',
  '.MMWWMMMMWWMMMM.',
  '.MMWWMMMMWWMMMM.',
  '.MMMMMMMMMMMMMM.',
  '.MMMMMMMMMMMMMM.',
  '.MMMMMMMMMMMMMM.',
  '..MMMMMMMMMMMM..',
  '...EEEEEEEEEE...',
  '...EEEEEEEEEE...',
  '...EEEEEEEEEE...',
  '....EEEEEEEE....',
  '....EEEEEEEE....',
], PAL);

/* ===== 火焰花（发子弹道具） 12x16 ===== */
SPRITES['flower'] = makeSprite([
  '.....FF.....',
  '....FFFF....',
  '...FFFFFF...',
  '..FFFFFFFF..',
  '..FFFFFFFF..',
  '..FFKFFKFF..',
  '..FFFFFFFF..',
  '...FFFFFF...',
  '....FFFF....',
  '....EEEE....',
  '....EEEE....',
  '....EEEE....',
  '....EEEE....',
  '....EEEE....',
  '....EEEE....',
  '....EEEE....',
], PAL);

/* ===== 星星（无敌道具） 12x12 ===== */
SPRITES['star'] = makeSprite([
  '.....YY.....',
  '....YYYY....',
  '...YYYYYY...',
  '..YYYYYYYY..',
  '.YYYYYYYYYY.',
  '.YYYYYYYYYY.',
  '..YYYYYYYY..',
  '...YYYYYY...',
  '....YYYY....',
  '....YWWY....',
  '....YWWY....',
  '.....WW.....',
], PAL);

/* ===== 子弹/火球 8x8 ===== */
SPRITES['fireball'] = makeSprite([
  '...OOO...',
  '..OOOOO..',
  '.OOYOYOO.',
  '.OOOOOOO.',
  '.OOYOYOO.',
  '..OOOOO..',
  '...OOO...',
], PAL);

/* ===== 问号砖 8x8 ===== */
SPRITES['brick_q'] = makeSprite([
  'pppppppp',
  'pPPPPPPp',
  'pPQQQQPP',
  'pPQWWQQP',
  'pPPQQQQP',
  'pPQWWQQP',
  'pQQPPPPQ',
  'pppppppp',
], PAL);

/* ===== 已消耗问号砖 8x8 ===== */
SPRITES['brick_q_used'] = makeSprite([
  'pppppppp',
  'pPPPPPPp',
  'pPPPPPPp',
  'pPPPPPPp',
  'pPPPPPPp',
  'pPPPPPPp',
  'pPPPPPPp',
  'pppppppp',
], PAL);

/* ===== 普通方块砖 8x8 ===== */
SPRITES['block'] = makeSprite([
  'CCCCCCCC',
  'CddddddC',
  'CddddddC',
  'CCCCCCCC',
  'CddddddC',
  'CddddddC',
  'CCCCCCCC',
  'dddddddd',
], PAL);

/* ===== 可撞碎砖 8x8 ===== */
SPRITES['brick_b'] = makeSprite([
  'CddCddCc',
  'ddCCddCd',
  'CddCCddC',
  'ddCddCdd',
  'CddCddCC',
  'dCddCddC',
  'CddCddCC',
  'ddCddCdd',
], PAL);

/* ===== 金币 8x8 ===== */
SPRITES['coin'] = makeSprite([
  '..QQQQ..',
  '.QQYYQQ.',
  'QQYQQYQQ',
  'QQYQQYQQ',
  'QQYQQYQQ',
  'QQYQQYQQ',
  '.QQYYQQ.',
  '..QQQQ..',
], PAL);

/* ===== 山（远景装饰） 15x8 ===== */
SPRITES['hill'] = makeSprite([
  '......OOO......',
  '.....OOOOO.....',
  '....OOOoooo....',
  '...OOOoooOOO...',
  '..OOOooOOOoOO..',
  '..OOOOOOoOOOO..',
  '.OOOOOOOOOOOOO.',
  'OOOOOOOOOOOOOOO',
], PAL);

/* ===== 云 12x6 ===== */
SPRITES['cloud'] = makeSprite([
  '....WWWW....',
  '..WWWWWWWW..',
  '.WWWWWWWWWW.',
  'WWWWWWWWWWWW',
  'WWWWWWWWWWWW',
  '..WWWWWWWW..',
], PAL);

/* ===== 灌木 10x6 ===== */
SPRITES['bush'] = makeSprite([
  '..GGGGGG..',
  '.GGgGGgGG.',
  'GGgGGgGGgG',
  'GGgGGgGGgG',
  'GGGGGGGGGG',
  'GGGGGGGGGG',
], PAL);

/* ===== 管道 12x6 ===== */
SPRITES['pipe'] = makeSprite([
  '..GGGGGGGG..',
  'GGGGGGGGGGGG',
  'GGggggggggGG',
  'GGggggggggGG',
  'GGggggggggGG',
  'GGggggggggGG',
], PAL);

/* ===== 旗杆顶旗 8x8 ===== */
SPRITES['flag_pole'] = makeSprite([
  'RRR.....',
  'RRRRR...',
  'RRR.....',
  'YYY.....',
], PAL);

/* ===== 城堡（终点） 14x10 ===== */
SPRITES['castle'] = makeSprite([
  '...RRRRRRRR...',
  '..RRRRRRRRRR..',
  '.RRRSSSSSSRRR.',
  '.RRSSSSSSSSRR.',
  '.RRSSSSSSSSRR.',
  '.RRRRRSSSRRRR.',
  '...SSS.SSS....',
  '...SSS.SSS....',
  '.RRRRR.RRRRR..',
  '.RRRRR.RRRRR..',
], PAL);

/* ===== 动画帧占位（与静态帧同源，加载官方素材后替换） ===== */
SPRITES['mario_small_run2'] = SPRITES['mario_small'];
SPRITES['mario_small_run3'] = SPRITES['mario_small'];
SPRITES['mario_small_run4'] = SPRITES['mario_small'];
SPRITES['mario_small_jump'] = SPRITES['mario_small'];
SPRITES['mario_big_run'] = SPRITES['mario_big'];
SPRITES['mario_big_runB'] = SPRITES['mario_big'];
SPRITES['mario_big_runC'] = SPRITES['mario_big'];

/* ===== 官方马里奥主题素材（assets/sprites/*.png，异步加载后替换程序化精灵） =====
 * 素材来源（本仓库 assets/sprites/ 目录）：
 *  - mario_*.png : 任天堂《超级马里奥兄弟》NES 官方精灵提取（社区仓库 Hammania689/Super-Mario-Bros-1-1-in-Unity）
 *  - goomba_*.png / koopa_*.png / piranha_*.png : 《Super Mario Maker》SMB1 主题官方素材提取（NostalgicMysticalCat/Super-Mario-Maker-Assets-Archive）
 * 版权归 Nintendo 所有；仅供个人学习/自用项目，禁止商用分发。
 */
const OFFICIAL_URLS = {
  mario_small:      'assets/sprites/mario_0.png',   // 站立
  mario_small_run2: 'assets/sprites/mario_1.png',   // 跑1
  mario_small_run3: 'assets/sprites/mario_2.png',   // 跑2
  mario_small_run4: 'assets/sprites/mario_3.png',   // 跑3
  mario_small_jump: 'assets/sprites/mario_4.png',   // 跳跃
  mario_big:        'assets/sprites/mario_6.png',   // 大马里奥站
  mario_big_run:    'assets/sprites/mario_7.png',   // 大马里奥跑
  goomba:           'assets/sprites/goomba_0.png',  // 走路A
  goomba_w2:        'assets/sprites/goomba_1.png',  // 走路B
  goomba_squash:    'assets/sprites/goomba_4.png',  // 踩扁
  koopa:            'assets/sprites/koopa_0.png',   // 走路A
  koopa_w2:         'assets/sprites/koopa_1.png',   // 走路B
  koopa_shell:      'assets/sprites/koopa_2.png',   // 壳
  piranha:          'assets/sprites/piranha_0.png',
  piranha_2:        'assets/sprites/piranha_1.png',
};

// 飞行敌人帧：在官方板栗仔上叠加红色翅膀
function makeFlyerFrame(baseCanvas, wingFlip){
  const c = document.createElement('canvas');
  const wingW = 14;
  c.width = baseCanvas.width + wingW;
  c.height = Math.max(baseCanvas.height, 24);
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  // 翅膀（红，两段式小翼）
  g.fillStyle = '#e83818';
  if (wingFlip){
    g.beginPath();
    g.moveTo(c.width-2, 6); g.lineTo(c.width-10, 10); g.lineTo(c.width-2, 14);
    g.closePath(); g.fill();
    g.fillRect(c.width-12, 8, 5, 8);
  } else {
    g.beginPath();
    g.moveTo(2, 6); g.lineTo(10, 10); g.lineTo(2, 14);
    g.closePath(); g.fill();
    g.fillRect(7, 8, 5, 8);
  }
  g.drawImage(baseCanvas, wingFlip? 0 : wingW, 0);
  return c;
}

// 从大马里奥跑步单帧生成"腾空(上移)/落地(下移)"派生帧，构成 3 帧跑步弹跳循环（不插站立帧）
function makeBigRunFrame(baseCanvas, dy){
  const c = document.createElement('canvas');
  c.width = baseCanvas.width; c.height = baseCanvas.height;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  g.drawImage(baseCanvas, 0, dy);
  return c;
}

let officialLoaded = 0;
const OFFICIAL_TOTAL = Object.keys(OFFICIAL_URLS).length;

// 官方马里奥素材面向左（帽檐朝左，与官方 koopa 同源）；水平镜像为面向右，
// 与程序化精灵(面向右)及 drawPlayer 的 flip=(dir<0) 逻辑保持一致。
function flipCanvas(c){
  const f = document.createElement('canvas');
  f.width = c.width; f.height = c.height;
  const g = f.getContext('2d');
  g.imageSmoothingEnabled = false;
  g.translate(c.width, 0);
  g.scale(-1, 1);
  g.drawImage(c, 0, 0);
  return f;
}

function loadOfficialSprite(key, url){
  const img = new Image();
  img.onload = () => {
    let c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    c.getContext('2d').drawImage(img, 0, 0);
    // 官方 mario 帧统一镜像为面向右；mario_7(大马里奥跑)素材本身面向右，不翻转(避免头部反向)
    if (key.indexOf('mario_')===0 && key!=='mario_big_run') c = flipCanvas(c);
    SPRITES[key] = c;
    officialLoaded++;
    // 大马里奥跑步：由单帧派生腾空/落地帧（官方素材加载后自动启用 3 帧跑步动画）
    if (key==='mario_big_run'){
      SPRITES['mario_big_runB'] = makeBigRunFrame(c, -1);
      SPRITES['mario_big_runC'] = makeBigRunFrame(c, 1);
    }
    // 飞行帧：goomba + 翅膀（goomba 就绪后合成）
    if (key==='goomba' || key==='goomba_w2'){
      const target = key==='goomba' ? 'flyer' : 'flyer_w2';
      SPRITES[target] = makeFlyerFrame(c, true);
      SPRITES[target].__isFlyer = true;
    }
  };
  img.onerror = () => { /* 加载失败保留程序化精灵兜底 */ };
  img.src = url;
}

// 加载全部官方素材（main.js 启动时调用；加载完成后自动替换渲染精灵）
function loadOfficialSprites(){
  if (officialLoaded>0) return;   // 幂等
  for (const k in OFFICIAL_URLS) loadOfficialSprite(k, OFFICIAL_URLS[k]);
}

// 是否已全部加载（供调试/测试）
function officialSpritesReady(){
  return officialLoaded >= OFFICIAL_TOTAL;
}



/* ===== physics.js ===== */
/* ===== 物理与碰撞 ===== */
const TILE = 32;

// AABB 碰撞检测
function aabb(a, b){
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// 水平推回：返回是否落地面
function moveX(body, tiles, onCollide) {
  const tile = TILE;
  // 扫过所占 tile 范围
  const ys = Math.floor(body.y / tile);
  const ye = Math.floor((body.y + body.h - 0.001) / tile);
  const dir = body.vx > 0 ? 1 : -1;
  const edge = dir > 0 ? Math.floor((body.x + body.w) / tile) : Math.floor(body.x / tile);
  const nEdge = dir > 0 ? Math.floor((body.x + body.w + body.vx) / tile) : Math.floor((body.x + body.vx) / tile);
  for (let y = ys; y <= ye; y++){
    for (let x = Math.min(edge,nEdge); x <= Math.max(edge,nEdge); x++){
      if (tiles[y] && tiles[y][x]) {
        // 撞墙
        if (dir > 0) body.x = x * tile - body.w - 0.01;
        else body.x = (x + 1) * tile + 0.01;
        body.vx = 0;
        onCollide && onCollide(x, y, dir);
        return;
      }
    }
  }
  body.x += body.vx;
}

// 垂直推回 + 落面判定
// 返回结构 { grounded, hitCeil(col,row) }
function moveY(body, tiles, hits) {
  const tile = TILE;
  const xs = Math.floor(body.x / tile);
  const xe = Math.floor((body.x + body.w - 0.001) / tile);
  let grounded = false;
  const hitCells = [];

  if (body.vy >= 0) {
    // 下落
    const row = Math.floor((body.y + body.h) / tile);
    const nrow = Math.floor((body.y + body.h + body.vy) / tile);
    for (let r = row; r <= nrow; r++){
      for (let x = xs; x <= xe; x++){
        if (tiles[r] && tiles[r][x]) {
          body.y = r * tile - body.h - 0.01;
          body.vy = 0;
          grounded = true;
          hitCells.push([x, r]);
          return { grounded, hits: hitCells };
        }
      }
    }
  } else {
    // 上升
    const row = Math.floor(body.y / tile);
    const nrow = Math.floor((body.y + body.vy) / tile);
    for (let r = row; r >= nrow; r--){
      for (let x = xs; x <= xe; x++){
        if (tiles[r] && tiles[r][x]) {
          body.y = (r + 1) * tile + 0.01;
          body.vy = 0;
          hitCells.push([x, r]);
          return { grounded:false, hits: hitCells };
        }
      }
    }
  }
  body.y += body.vy;
  return { grounded, hits: hitCells };
}


/* ===== levelgen.js ===== */
/* ===== 无限随机关卡生成 =====
 * 关卡由一系列段落拼接，返回二维 tile 数组 + 实体/道具/敌人刷出点。
 * tile 编码：
 *   0 空
 *   1 坚硬砖(block,不可破坏)
 *   2 可撞碎的砖(brick, 从上方撞可碎)
 *   3 问号块(可顶出金币/道具)
 *   4 已用问号块
 *   5 地板(ground, 特殊顶部纹理)
 * 敌人类型：goomba 板栗仔 / koopa 乌龟 / spiny 尖刺龟(踩踏受伤) / flyer 红翼板栗(空中) / piranha 食人花(管道)
 */

function createEmpty(w, h){
  const t = [];
  for (let y=0;y<h;y++){ t.push(new Array(w).fill(0)); }
  return t;
}

/* 按关卡难度选择敌人类型 */
function pickEnemy(rng, levelNo){
  const r = rng();
  if (levelNo >= 2){
    if (r < 0.42) return 'goomba';
    if (r < 0.66) return 'koopa';
    if (r < 0.85) return 'spiny';   // 尖刺龟：踩踏受伤
    return 'flyer';                 // 红翼板栗：空中巡逻
  }
  return r < 0.6 ? 'goomba' : 'koopa';
}

/* 用 RNG 生成关卡。返回 { w,h,tiles, startX, spawns, sections } */
function generateLevel(levelNo, seedStr){
  // 确定性随机
  let seed = hashStr(seedStr || 'seed' + levelNo);
  const rng = () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  const ri = (a,b) => Math.floor(rng()*(b-a)) + a;

  const H = 12;                     // 逻辑高度(块)
  const groundY = H-1;              // 地板行
  const GROUND = 5;
  // 关卡长度随关卡显著增长：每关 +30 格，进入下一关后明显更长的旅程
  const w = 190 + levelNo*30;       // level1=220 level2=250 level3=280 ...
  const tiles = createEmpty(w, H);
  // 地板（单行：H=12 时 tiles[groundY+1] 越界恒不生效，地面仅一行，脚底行=groundY）
  for (let x=0;x<w;x++) tiles[groundY][x] = GROUND;

  const spawns = [];   // { x, type, y }
  const blocks=[];     // 特殊块: { x, y, kind:'?'|'b' , content }
  let x = 8;
  let sectionIndex = 0;

  // 难度系数
  const diff = Math.min(1 + levelNo*0.12, 4.5);
  const pitChance = Math.min(0.55 + levelNo*0.03, 0.9);
  const enemyRate = Math.min(0.55 + levelNo*0.08, 1.8);

  // 问号块：同时写入 tiles（tile 3），保证渲染/碰撞/可顶
  const pushBlock = (bx, kind, content) => {
    blocks.push({x:bx, y:groundY-2, kind, content});
    tiles[groundY-2][bx] = 3;
  };
    // 问号块道具内容：金币/蘑菇/花/星/1up（经典分布，统一为具体类型）
  const pickContent = () => {
    const r = rng();
    if (r < 0.55) return 'coin';
    if (r < 0.75) return 'mushroom';
    if (r < 0.88) return 'flower';
    if (r < 0.97) return 'star';
    return '1up';
  };

  const tileY = groundY-1;  // 放置实体块的行(距地面1格)

  // 起始安全段
  x += ri(2,5);

  while (x < w - 14) {
    const r = rng();
    const segW = ri(6,14);
    let choice = r < 0.20 ? 'ground' : (r < 0.42 ? 'blocks' : (r < 0.64 ? 'pit' : (r < 0.82 ? 'pipe' : 'enemies')));

    if (choice === 'pit'){
      // 坑（宽度与新跳跃能力匹配：普通跳≈3格，冲刺大跳≈5格）
      if (x > 14 && x < w-20 && rng() < pitChance){
        const pw = ri(2, 3+Math.floor(diff/3));  // 2~4格，确保能跳过去
        for (let px=0;px<pw;px++){
          for (let gy=0; gy<H; gy++) tiles[gy][x+px] = 0;
        }
        x += pw + ri(1,3);
      } else {
        choice = 'ground';
      }
    }

    if (choice === 'ground'){
      // 平地 + 偶尔低平台
      if (rng()<0.5 && x>10 && x<w-20){
        const platW = ri(3,6);
        const platY = tileY-1;
        for (let px=0;px<platW;px++){
          tiles[platY][x+px] = 1;
          if (rng()<0.8) tiles[platY+1][x+px]=1; // 高度2
        }
        // 平台上放块
        if (rng()<0.6 && x+platW < w-15){
          const kb = rng();
          if (kb<0.5) pushBlock(x+1,'?', rng()<0.55?'coin':pickContent());
          else tiles[platY-1>=0?platY-1:platY-1][x+2]=2;
          x += platW;
        } else {
          x += platW + ri(1,3);
        }
      } else {
        // 空中问号块列
        if (rng()<0.6 && x < w-16){
          const n = ri(1,3);
          for (let i=0;i<n;i++){
            pushBlock(x+i*2, '?', rng()<0.55?'coin':pickContent());
          }
          x += n*2 + ri(1,2);
        } else {
          // 纯平地段落：中点放宝箱点缀，避免后半程大段空白（快速冲到旗杆）
          const mid = x + Math.floor(segW/2);
          if (mid > 12 && mid < w-18 && rng()<0.75){
            pushBlock(mid, '?', rng()<0.55?'coin':pickContent());
          }
          x += segW;
        }
        // 散落地面的敌人（随难度混入尖刺龟/飞行板栗）
        const eg = Math.floor(enemyRate * rng()*4);
        for (let i=0;i<eg;i++){
          if (x+i*2 < w-16){
            const type = pickEnemy(rng, levelNo);
            spawns.push({x:x+i*2, y: (type==='flyer'? tileY-3 : tileY), type});
          }
          x+=2;
        }
      }
    }
    else if (choice === 'blocks'){
      // 砖块 + 问号 组合
      const nb = ri(3,7);
      for (let i=0;i<nb;i++){
        const bx = x + i*2;
        if (bx > w-16) break;
        const kind = i%2===0 ? '?' : 'b';
        if (kind==='?') pushBlock(bx, '?', rng()<0.55?'coin':pickContent());
        else tiles[tileY][bx]=2;
      }
      x += nb*2;
    }
    else if (choice === 'pipe'){
      // 管道
      const ph = ri(1, 1+Math.floor(diff/2));
      for (let px=0;px<2;px++){
        for (let py=0;py<ph;py++){
          tiles[tileY-py][x+px] = 1;
        }
      }
      // 管道口食人花（还原原版要素：接近伸出攻击）
      if (rng()<0.5){
        spawns.push({x:x, y:tileY-(ph-1), type:'piranha'});
      }
      // 管道口跳上来有宝
      if (rng()<0.5) pushBlock(x, '?', 'mushroom');
      x += 2 + ri(1,3);
    }
    else { // enemies
      const eg = 1 + Math.floor(Math.min(enemyRate, 3) * rng()*3);
      for (let i=0;i<eg;i++){
        const ex = x+i*3;
        if (ex < w-16){
          const type = pickEnemy(rng, levelNo);
          spawns.push({x:ex, y: (type==='flyer'? tileY-3 : tileY), type});
        }
      }
      x += eg*3;
    }
    sectionIndex++;
  }

  // 处理凹块上方的地形保持(确保有支撑)
  // 终点旗杆 + 城堡
  const flagX = w - 9;
  // 终点前一段清空地面敌人安全（同时把已写入 tiles 的问号块清掉）
  for (let i=0;i<blocks.length;i++){ if (blocks[i].x > flagX-2){ tiles[blocks[i].y][blocks[i].x]=0; blocks.splice(i,1); i--; } }
  for (let i=0;i<spawns.length;i++){ if (spawns[i].x > flagX-2){ spawns.splice(i,1); i--; } }

  // 画旗杆(地图元素) — 用块标记: 在 flagX 垂直列放杆和旗
  for (let py=0; py<3; py++) tiles[tileY-1-py][flagX]=1;
  const flag = { x: flagX };

  // ===== 检查点：起点 + 沿途安全列（连续3格地面、头顶2格无实心块），死亡后从最近检查点复活 =====
  const checkpoints = [{ x: 6 }];
  for (let cx = 26; cx < flagX - 6; cx += 20){
    const ok = tiles[groundY][cx]===5 && tiles[groundY][cx-1]===5 && tiles[groundY][cx+1]===5
      && tiles[groundY-1][cx]===0 && tiles[groundY-2][cx]===0;
    if (ok) checkpoints.push({ x: cx });
  }

  return {
    w, h:H, tiles, startX: 6,
    groundY, tileY,
    blocks, spawns,
    flagX,
    checkpoints,
    seed: seedStr || ('level'+levelNo),
    levelNo
  };
}

function hashStr(s){
  let h = 2166136261;
  for (let i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// 兼容: treeY helper
function treeY(y){ return y; }


/* ===== entities.js ===== */
/* ===== 世界实体：道具/敌人/子弹 =====
 * 敌人类型：
 *   goomba  板栗仔（可踩扁，火球/踢壳可消灭）
 *   koopa   乌龟（可踩成壳，壳可踢出连杀/撞墙反弹）
 *   spiny   尖刺龟（踩踏受伤，仅火球/踢壳可消灭）
 *   flyer   红翼板栗（空中正弦巡逻，可踩扁，火球/踢壳可消灭）
 *   piranha 食人花（管道伸缩攻击，不可踩，碰撞受伤）
 */

// 道具(蘑菇/花/星/1up)
class PowerUp {
  constructor(x, y, type){
    this.x=x; this.y=y;
    this.w=TILE; this.h=TILE;
    this.vx=1.6; this.vy=0;
    this.type=type;         // 'mushroom'|'flower'|'star'|'1up'
    this.alive=true;
    this.rising=0.9;        // 从块中升出
    this.landY=y;
    this.startY=y-TILE;
  }
  update(world){
    if (this.rising>0){
      this.rising -= 0.06;
      this.y = this.landY - this.rising*(this.landY-this.startY);
      if (this.rising<=0){ this.y=this.landY; }
      return;
    }
    if (this.type==='flower') return; // 花静止
    // 星跳动
    if (this.type==='star'){
      this.vy += 0.4;
      if (this.y+this.h >= world.groundY*TILE){ this.vy=-7; this.y = world.groundY*TILE-this.h; }
    } else {
      this.vy += 0.5;
    }
    this.x += this.vx;
    this.y += this.vy;
    // 落到地面(玩家同一基准: groundY)
    const gy = world.groundY*TILE - this.h;
    if (this.vy>0 && this.y >= gy){ this.y=gy; this.vy=0; }
    // 碰到障碍反向
    const col = world.solidAt(this.x, this.y, this.w, this.h);
    if (col){ this.vx = -this.vx; }
  }
}

// 敌人基类
class Enemy {
  constructor(x,y,type){
    this.type=type;
    this.w=TILE; this.h=TILE;
    if (type==='koopa'){ this.h=TILE+4; } // koopa 略高
    this.x=x; this.y=y-this.h;
    this.vx = (type==='goomba'||type==='spiny') ? -0.6 : (type==='flyer' ? -0.8 : -0.5);
    this.vy=0;
    this.dir = this.vx<0?-1:1;
    this.alive=true;
    this.dead=false;         // 被消灭(踩扁/击杀)
    this.deadT=0;
    this.shell=false;        // 乌龟变壳
    this.kicked=false;       // 壳被踢出
    this.kickVX=0;
    this.kickT=0;            // 踢出计时（刚踢出不伤玩家）
    this.walkT=0;            // 动画计时
    this.frame=0;            // 当前动画帧 0/1
    this.baseY=this.y;       // flyer 飞行基准
    this.phase=Math.random()*Math.PI*2;
  }
  update(world){
    if (this.dead){ this.deadT--; if (this.deadT<=0) this.alive=false; return; }
    if (this.shell){
      if (this.kicked){
        this.kickT++;
        // 撞墙反弹（踢出的壳在原版中撞墙会弹回）
        if (this.worldSolidAhead(world)){ this.kickVX = -this.kickVX; }
        this.x += this.kickVX;
      }
      this.applyGravity(world);
      return;
    }
    if (this.type==='flyer'){
      // 飞行：正弦上下 + 水平巡逻（不落地、不坠坑）
      this.phase += 0.06;
      this.y = this.baseY + Math.sin(this.phase)*18;
      this.walkT++;
      this.frame = Math.floor(this.walkT/10)%2;
      if (this.worldSolidAhead(world)){ this.vx=-this.vx; }
      this.x += this.vx;
      this.dir = this.vx<0?-1:1;
      return;
    }
    // 正常移动
    this.applyGravity(world);
    this.walkT++;
    this.frame = Math.floor(this.walkT/10)%2;
    // 碰墙/边缘
    const ahead = this.worldSolidAhead(world);
    const edge = this.noEdgeAhead(world);
    if ((ahead || !edge) && !this.inAir(world)) this.vx=-this.vx;
    this.x += this.vx;
    this.dir = this.vx<0?-1:1;
  }
  inAir(world){ const gy=world.groundY*TILE-this.h; return Math.abs((this.y)-gy)>2; }
  applyGravity(world){ this.vy+=0.5; this.y+=this.vy; const gy=world.groundY*TILE-this.h; if(this.y>=gy){this.y=gy;this.vy=0; } }
  worldSolidAhead(world){
    const side = this.vx>0 ? this.x+this.w+2 : this.x-2;
    const tx=Math.floor(side/TILE); const ty=Math.floor((this.y+this.h/2)/TILE);
    return world.tileAt(tx,ty)!==0;
  }
  noEdgeAhead(world){
    const side = this.vx>0 ? this.x+this.w+4 : this.x-4;
    const tx=Math.floor(side/TILE); const ty=Math.floor((this.y+this.h)/TILE); // 脚底所在行(H=12时+1越界恒0导致原地抖动)
    if (tx>=world.w) return true;
    return world.tileAt(tx,ty)!==0;
  }
}

// 食人花：从管道伸缩攻击（不可踩，碰撞受伤）
class Piranha {
  constructor(x,y,pipeTopY){
    this.type='piranha';
    this.w=TILE; this.h=TILE;
    this.x=x; this.y=pipeTopY;      // y = 花头顶部位置（初始缩在管道口）
    this.pipeTopY=pipeTopY;         // 缩回基准（管道口顶面）
    this.maxExtend=TILE*1.5;        // 最大伸出高度
    this.phase='hidden';            // hidden|rising|up|falling
    this.phaseT=0;
    this.alive=true; this.dead=false;
    this.dir=-1; this.vx=0; this.vy=0;
    this.walkT=0; this.frame=0;
  }
  // 碰撞盒：花头（仅伸出明显时有效；未伸出则无碰撞）
  get box(){
    const out = this.pipeTopY - this.y;   // 当前伸出量
    if (out < 10) return { x:this.x, y:this.y, w:0, h:0 };
    return { x:this.x+2, y:this.y, w:this.w-4, h:Math.min(out+10, 42) };
  }
  update(world){
    this.walkT++;
    this.frame = Math.floor(this.walkT/8)%2;   // 花头张合动画
    const player = world.player;
    const dist = player ? Math.abs((player.x+player.w/2) - (this.x+this.w/2)) : 999;
    if (this.phase==='hidden'){
      if (dist < 5*TILE){ this.phase='rising'; this.phaseT=0; }
      this.y = this.pipeTopY;
    } else if (this.phase==='rising'){
      this.phaseT++;
      this.y = this.pipeTopY - this.maxExtend * Math.min(1, this.phaseT/22);
      if (this.phaseT>=22){ this.phase='up'; this.phaseT=0; }
    } else if (this.phase==='up'){
      this.phaseT++;
      if (dist > 6.5*TILE || this.phaseT>110){ this.phase='falling'; this.phaseT=0; }
    } else { // falling
      this.phaseT++;
      this.y = this.pipeTopY - this.maxExtend * Math.max(0, 1 - this.phaseT/18);
      if (this.phaseT>=18){ this.phase='hidden'; this.y=this.pipeTopY; }
    }
  }
}

// 敌人工厂
function makeEnemy(x,y,type){
  if (type==='piranha') return new Piranha(x, y, y);   // y = 管道顶面像素
  return new Enemy(x,y,type);
}

// 子弹(火球)
class Bullet {
  constructor(x,y,dir){
    this.x=x; this.y=y; this.w=14; this.h=14;
    this.vx=dir*6; this.vy=0; this.alive=true;
    this.age=0;
  }
  update(world){
    this.age++;
    if (this.age>240){ this.alive=false; return; }
    this.vy+=0.6; this.x+=this.vx; this.y+=this.vy;
    const gy = world.groundY*TILE-22;
    if (this.vy>0 && this.y>=gy){ this.y=gy; this.vy=-4; } // 弹跳
    // 出界(屏幕外较远处 或 掉出世界底部)
    if (this.x < -60 || this.x > world.w*TILE+60 || this.y > world.h*TILE+60) this.alive=false;
  }
}



/* ===== level.js ===== */
/* ===== World：关卡世界(管理地图/块/实体/玩家) ===== */




class World {
  constructor(levelNo, seed, startCfg){
    this.levelNo = levelNo;
    // 生成地图（seed 固定后同一关卡可复现）
    this.seed = seed || ('level'+levelNo);
    const gen = generateLevel(levelNo, this.seed);
    this.w = gen.w; this.h = gen.h;
    this.tiles = gen.tiles;
    this.groundY = gen.groundY;
    this.tileY = gen.tileY;
    this.blocks = gen.blocks;
    this.spawnDefs = gen.spawns;
    this.flagX = gen.flagX;
    this.startX = gen.startX;
    this.levelW = this.w * TILE;

    // 相机
    this.camX = -60;
    this.camTarget = this.camX;
    this.camY = 0;

    // 实体
    this.powerups = [];
    this.enemies = [];
    this.bullets = [];
    this.coinFx = [];      // 金币弹出动画 {x,y,t}
    this.spawnFromDefs();

    // 动态状态
    this.usedBlocks = [];   // {x,y}
    this.smashed = [];      // 可碎砖被撞碎动画
    this.flagReached = false;
    this.flagSlide = 0;   // 过关旗子下滑进度 0→1
    this.flagDone = false;
    this.time = 300;
    this.complete = false;
    this.startCfg = startCfg;

    // 检查点（复活点）：起点 + 沿途安全列；curCp 为当前已激活检查点索引
    this.checkpoints = (gen.checkpoints && gen.checkpoints.length) ? gen.checkpoints : [{ x: gen.startX }];
    this.curCp = 0;
  }

  // 当前复活点（像素）
  get checkpointX(){ return this.checkpoints[this.curCp].x * TILE; }

  // 玩家前进经过检查点时激活最新一个（死亡后从该点复活）
  updateCheckpoint(px){
    while (this.curCp+1 < this.checkpoints.length && this.checkpoints[this.curCp+1].x*TILE <= px){
      this.curCp++;
    }
  }

  spawnFromDefs(){
    for (const s of this.spawnDefs){
      this.enemies.push(makeEnemy(s.x*TILE, s.y*TILE, s.type));
    }
  }

  tileAt(tx, ty){
    if (ty<0 || ty>=this.h || tx<0 || tx>=this.w) return 0;
    return this.tiles[ty][tx];
  }

  // 某实心区域是否有障碍(给定像素AABB)
  solidAt(x,y,w,h){
    const x0=Math.floor(x/TILE), x1=Math.floor((x+w-0.001)/TILE);
    const y0=Math.floor(y/TILE), y1=Math.floor((y+h-0.001)/TILE);
    for (let ty=y0;ty<=y1;ty++) for (let tx=x0;tx<=x1;tx++){
      const t=this.tileAt(tx,ty);
      if (t===1||t===2||t===3||t===4) return true;
    }
    return false;
  }

  get groundPixelY(){ return this.groundY*TILE; }
  get tilePixelY(){ return this.tileY*TILE; }
}


/* ===== player.js ===== */
/* ===== 马里奥玩家 ===== */




const CFG_ = CFG;

class Player {
  constructor(world, startCfg){
    this.world = world;
    this.x = (startCfg.spawnX!=null) ? startCfg.spawnX : world.startX*TILE;
    this.y = world.groundY*TILE - TILE;
    this.small = !startCfg.startBig;
    this.fire = !!startCfg.startFire;
    this.invincible = !!startCfg.invincible;
    this.setSize();
    this.vx=0; this.vy=0;
    this.dir=1;           // 面向
    this.onGround=false;
    this.running=false;
    this.alive=true;
    this.starT = this.invincible? 99999 : 0;  // 无敌星星计时
    this.dying=false;     // 掉落坑
    this.dieT=0;
    this.stompCooldown=0;
    this.onBlock = null;  // 触发的块回调
    this.dead=false;
    this.score=0;
    this.coins=0;
    this.hurtFlashT=0;    // 受伤闪烁(无敌时间)
    this.respawnInvT=0;   // 复活无敌计时(5秒，期间不受伤害)
    this.frames=0;
    this.clearMode=null;   // 过关动画: null | 'slide'(沿旗杆滑下) | 'walk'(走向城堡)
    this.cleared=false;    // 已走进城堡(渲染隐藏)
  }

  setSize(){
    if (this.small){ this.w=TILE; this.h=TILE; }
    else { this.w=TILE; this.h=TILE*2; } // 大马里奥2格高
    // 保持脚底对齐
    this.y = (this.world.groundY*TILE) - this.h;
  }

  get spriteKey(){
    if (this.fire && !this.small) return 'mario_big'; // 火马里奥同大造型+不同色
    return this.small? 'mario_small':'mario_big';
  }

  update(input, sfx){
    this.frames++;
    if (this.hurtFlashT>0) this.hurtFlashT--;
    if (this.respawnInvT>0) this.respawnInvT--;

    // 死亡下跌
    if (this.dying){
      this.vy+=0.5; this.y+=this.vy;
      this.dieT--;
      if (this.dieT<=0) this.alive=false;
      return;
    }

    // 过关动画：不受输入控制（沿杆滑下 → 自动走向城堡）
    if (this.clearMode){
      if (this.clearMode==='slide'){
        this.vx=0; this.vy=0;
        this.y += 2.6;   // 沿杆下滑
        const ground = this.world.groundY*TILE - this.h;
        if (this.y >= ground){ this.y = ground; this.clearMode='walk'; }
      } else if (this.clearMode==='walk'){
        this.dir = 1;
        this.vx = CFG_.RUN_SPEED;
        this.x += this.vx;
        this.onGround = true;
        if (this.x >= this.world.flagX*TILE + 4.5*TILE) this.cleared = true;  // 走进城堡
      }
      return;
    }

    // 冲刺/跑
    const max = input.keys.run ? CFG_.DASH_SPEED : CFG_.RUN_SPEED;
    if (input.keys.left){ this.vx = -max; this.dir=-1; }
    else if (input.keys.right){ this.vx = max; this.dir=1; }
    else this.vx=0;
    this.running = input.keys.run && (input.keys.left||input.keys.right);

    // 跳跃缓冲 + 蓄力(长按跳更高更远)
    if (input.consumeJump()){
      if (this.onGround){
        this.vy = this.running? CFG_.DASH_JUMP_VEL : CFG_.JUMP_VEL;
        this.onGround=false;
        this.jumpHeld = true;
        sfx.jump();
      } else {
        // 空中再跳(经典马里奥不能二段跳，忽略)
      }
    }
    // 松开跳跃：立即截断上升(短按跳得低)，长按则保持低重力升空
    if (!input.keys.jump){
      this.jumpHeld = false;
      if (this.vy < -3) this.vy = -3;   // 快速结束上升，实现可变跳高
    }

    // 开火
    if (input.consumeFire() && this.fire){
      if (this.world.bullets.filter(b=>b.alive).length<2){
        const by = this.small? this.y+4 : this.y+this.h*0.35;
        this.world.bullets.push(new Bullet(this.x + (this.dir>0? this.w:0) - 7, by, this.dir));
        sfx.fire();
      }
    }

    // 物理：上升中按住跳用低重力(长按大跳)，否则常态重力
    const g = (this.vy < 0 && this.jumpHeld) ? CFG_.JUMP_HOLD_GRAV : CFG_.NORMAL_GRAV;
    this.vy = Math.min(this.vy + g, CFG_.MAX_FALL);

    // 水平碰撞(推回 + 触碰块)
    const prevOnGround = this.onGround;
    const prevVX = this.vx;
    moveX(this, this.world.tiles, (tx,ty,dir)=>{
      // 撞到方块，如果是 ?/b 且 dir=1(向左撞) 触发? 经典是从下撞
    });
    // 垂直
    const m = moveY(this, this.world.tiles);
    this.onGround = m.grounded;
    for (const [tx,ty] of m.hits){
      this.triggerBlock(tx,ty, sfx);
    }

    // 掉落坑
    if (this.y > (this.world.h+2)*TILE + 20){ this.startDying(); }
  }

  // 从下顶块
  triggerBlock(tx,ty,sfx){
    const t = this.world.tileAt(tx,ty);
    if (t===3){ // 问号块
      this.world.usedBlocks.push({x:tx,y:ty});
      this.world.tiles[ty][tx] = 4;
      const blk = this.world.blocks.find(b=>b.x===tx && b.y===ty);
      const content = blk? blk.content : 'coin';
      this.bumpBlock(tx,ty);
      if (content==='coin'){ this.coins++; this.score+=100; this.world.coinFx.push({x:tx,y:ty,t:24}); sfx.coin(); }
      else { this.world.powerups.push(new PowerUp(tx*TILE, ty*TILE, content)); }
    } else if (t===2){ // 可碎砖
      // 大马里奥可碎
      if (!this.small){ this.world.tiles[ty][tx]=0; this.world.smashed.push({x:tx,y:ty,t:20}); sfx.bump(); }
      else { sfx.bump(); }
    }
  }
  bumpBlock(tx,ty){ this.world.smashed.push({x:tx,y:ty,t:12, bump:true}); }

  startDying(){
    if (this.dying) return;
    this.dying=true;
    this.vy=-7; this.vx=0; this.dieT=70;
  }

  damage(){
    if (this.starT>0 || this.respawnInvT>0) return;
    if (!this.small){ this.small=true; this.setSize(); this.hurtFlashT=80; }   // 缩回
    else { this.alive=false; }
  }
}


/* ===== render.js ===== */
/* ===== 渲染引擎：画布绘制（支持动画帧/新敌人类型） ===== */


class Renderer {
  constructor(){
    this.canvas = document.getElementById('game');
    this.ctx = this.canvas.getContext('2d');
    this.scale = 1;
    this.offX = 0; this.offY = 0;
  }

  // 计算缩放(保留整块像素，最大清晰度)
  resize(){
    const cw = window.innerWidth, ch = window.innerHeight;
    this.canvas.width = cw; this.canvas.height = ch;
    // 保持 640x360 逻辑，等比缩放
    const s = Math.min(cw/640, ch/360);
    this.scale = s;
    this.offX = (cw - 640*s)/2;
    this.offY = (ch - 360*s)/2;
    this.ctx.imageSmoothingEnabled = false;
  }

  begin(){
    const ctx=this.ctx;
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
  }

  draw(world){
    const ctx=this.ctx, camX=world.camX;
    ctx.save();
    ctx.translate(this.offX, this.offY);
    ctx.scale(this.scale, this.scale);
    ctx.imageSmoothingEnabled=false;

    sky(ctx, camX);
    clouds(ctx, camX);
    // 背景山(视差，慢速滚动)
    hills(ctx, camX*0.35);
    // 背景灌木(视差中速)
    bushes(ctx, camX*0.6);
    // 地面草皮纹理(远层装饰随相机滚动)
    groundDecor(ctx, camX);

    // 地块
    const vx0 = Math.max(0, Math.floor(camX/TILE));
    const vx1 = Math.min(world.w-1, Math.ceil((camX+640)/TILE));
    for (let ty=0; ty<world.h; ty++){
      for (let tx=vx0; tx<=vx1; tx++){
        const t = world.tiles[ty] && world.tiles[ty][tx];
        if (!t) continue;
        const px = tx*TILE - camX, py=ty*TILE;
        if (px<-64||px>640+64) continue;
        this.drawTile(ctx,t,px,py);
      }
    }
    // 旗杆 + 终点城堡
    this.drawFlag(ctx, world, camX);
    this.drawCastle(ctx, world, camX);

    // 道具（逻辑1格高）
    for (const p of world.powerups) this.drawSprite(ctx, spriteFor(p.type), p.x-camX, p.y, {fit:TILE});
    // 敌人（动画帧）
    for (const e of world.enemies) if(e.alive||e.deadT>0) this.drawEnemy(ctx,e,camX);
    // 子弹（逻辑约半格）
    for (const b of world.bullets) if(b.alive) this.drawSprite(ctx, SPRITES.fireball, b.x-camX, b.y, {fit:14});
    // 金币动画
    for (const c of world.coinFx) if(c.t>0) this.drawSprite(ctx, SPRITES.coin, c.x*TILE-camX, c.y*TILE-14-(24-c.t)*0.3, {fit:TILE*0.85});
    // 碎砖/顶块动画
    for (const s of world.smashed) if(s.t>0 && s.bump) this.drawSprite(ctx, SPRITES.brick_q, s.x*TILE-camX, s.y*TILE-4*(1-s.t/12), {fit:TILE});
    ctx.restore();
  }

  drawSprite(ctx, spl, sx, sy, o={}){
    if(!spl) return;
    // o.fit: 逻辑高度(px) — 将精灵缩放到该逻辑高度，宽度按比例
    // o.scale: 直接缩放倍数（与 fit 二选一，fit 优先）
    let w=spl.width, h=spl.height;
    if(o.fit){ const k=o.fit/spl.height; w=spl.width*k; h=o.fit; }
    else if(o.scale){ w=spl.width*o.scale; h=spl.height*o.scale; }
    ctx.save();
    ctx.globalAlpha = o.alpha!==undefined?o.alpha:1;
    if(o.flip){ ctx.translate(sx+w,sy); ctx.scale(-1,1); ctx.drawImage(spl,0,0,w,h); }
    else ctx.drawImage(spl,sx,sy,w,h);
    ctx.restore();
  }

  drawTile(ctx,t,px,py){
    const m={1:SPRITES.block,2:SPRITES.brick_b,3:SPRITES.brick_q,4:SPRITES.brick_q_used};
    if(t===5){
      ctx.fillStyle='#b07730';ctx.fillRect(px,py,TILE,TILE);
      ctx.fillStyle='#e8b84a';ctx.fillRect(px,py,TILE,6);
      ctx.fillStyle='#7a4a18';
      for(let i=0;i<4;i++)ctx.fillRect(px+i*8,py+16,4,4);
      return;
    }
    if(m[t])ctx.drawImage(m[t],px,py,TILE,TILE);
  }

  drawFlag(ctx,world,camX){
    const fx=world.flagX*TILE+16-camX, base=world.groundY*TILE, top=base-6*TILE;
    ctx.fillStyle='#2a1200';ctx.fillRect(fx-2,top,4,base-top+40);
    // 旗子：绿色三角旗，过关时从杆顶滑到底（world.flagSlide 0→1）
    const slide = world.flagSlide || 0;
    const fy = top + slide*(base-top-20);
    ctx.fillStyle='#3fae5a';ctx.strokeStyle='#1d5a2a';ctx.lineWidth=1;
    ctx.beginPath();
    ctx.moveTo(fx+2, fy);
    ctx.lineTo(fx+24, fy+10);
    ctx.lineTo(fx+2, fy+20);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
  }

  // 终点城堡：旗杆右侧，玩家过关后走向城堡门
  drawCastle(ctx,world,camX){
    const base=world.groundY*TILE;
    const cx=(world.flagX+5)*TILE - camX;
    if (cx < -160 || cx > 680) return;
    const bw=4*TILE, bh=5*TILE, y0=base-bh;
    ctx.fillStyle='#c85a1e';
    ctx.fillRect(cx,y0,bw,bh);
    ctx.strokeStyle='#7a3a10';ctx.lineWidth=2;
    for(let row=1;row<5;row++){ctx.beginPath();ctx.moveTo(cx,y0+row*TILE);ctx.lineTo(cx+bw,y0+row*TILE);ctx.stroke();}
    for(let col=1;col<4;col++){ctx.beginPath();ctx.moveTo(cx+col*TILE,y0);ctx.lineTo(cx+col*TILE,base);ctx.stroke();}
    // 城齿
    for(let i=0;i<4;i++) ctx.fillRect(cx+i*TILE+2, y0-TILE, TILE-4, TILE+2);
    // 门洞 + 门楣
    ctx.fillStyle='#1a0a00';ctx.fillRect(cx+TILE*1.1, base-2.3*TILE, TILE*1.8, 2.3*TILE);
    ctx.fillStyle='#e8b84a';ctx.fillRect(cx+TILE*0.9, base-2.5*TILE, TILE*2.2, 6);
  }

  // 敌人渲染：动画帧交替（走/爬）、踩扁帧、壳、食人花/尖刺龟/飞行
  drawEnemy(ctx,e,camX){
    const px=e.x-camX;
    // 官方素材敌人(koopa/goomba/flyer)本身面向左（头左壳右），dir<0 向左走时不翻转、dir>0 向右走才翻转；spiny 程序化精灵左右对称不受影响
    const flip = (e.dir!==undefined && e.dir>0);
    // 食人花（管道伸缩，张合动画）
    if (e.type==='piranha'){
      const spr = e.frame ? SPRITES.piranha_2 : SPRITES.piranha;
      if (spr) this.drawSprite(ctx, spr, px, e.y, {fit:TILE});
      else { ctx.fillStyle='#2f9a4a'; ctx.fillRect(px,e.y,TILE,TILE); }
      return;
    }
    // 被消灭：压扁形态
    if(e.dead){
      const spr = e.type==='koopa' ? SPRITES.koopa_shell
        : (e.type==='spiny' ? SPRITES.spiny_squash : SPRITES.goomba_squash);
      if (spr) this.drawSprite(ctx, spr, px, e.y + e.h - 12, {flip, fit:12});
      else { ctx.fillStyle='#8a5224';ctx.fillRect(px,e.y+e.h-6,e.w,6); }
      return;
    }
    // 乌龟壳
    if(e.shell){
      this.drawSprite(ctx, SPRITES.koopa_shell, px, e.y+2, {fit:TILE-6});
      return;
    }
    // 走路/爬行动画帧
    let spr;
    if (e.type==='spiny'){ spr = e.frame ? SPRITES.spiny_w2 : SPRITES.spiny; }
    else if (e.type==='flyer'){ spr = e.frame ? SPRITES.flyer_w2 : SPRITES.flyer; }
    else if (e.type==='goomba'){ spr = e.frame ? SPRITES.goomba_w2 : SPRITES.goomba; }
    else { spr = e.frame ? SPRITES.koopa_w2 : SPRITES.koopa; }
    let sx = px;
    // goomba 走路重心摆动：帧A偏后、帧B向移动方向前倾 1px，增强对称素材的方向感
    if (e.type==='goomba' && e.dir) sx = px + e.dir * (e.frame ? 1 : -1);
    if (spr) this.drawSprite(ctx, spr, sx, e.y, {flip, fit:TILE});
    else { ctx.fillStyle='#8a5224';ctx.fillRect(px,e.y,e.w,e.h); }
  }

  // 玩家（站/跑/跳动画帧，按方向翻转）
  drawPlayer(player, camX, dying){
    const ctx=this.ctx;
    ctx.save();ctx.translate(this.offX,this.offY);ctx.scale(this.scale,this.scale);
    const sx=player.x-camX;
    let spr;
    if (player.clearMode==='slide'){
      // 抓杆姿态：面向旗杆贴杆（使用站立帧）
      spr = player.small ? SPRITES.mario_small : SPRITES.mario_big;
    } else if (player.small){
      if (!player.onGround){ spr = SPRITES.mario_small_jump; }
      else if (Math.abs(player.vx)>0.1){
        // 跑步动画只循环跑步帧(run2/3/4)，不插入站立帧，避免跑动中“一步一顿”
        const r = Math.floor(player.frames/5)%3;
        spr = r===0 ? SPRITES.mario_small_run2
          : (r===1 ? SPRITES.mario_small_run3 : SPRITES.mario_small_run4);
      } else spr = SPRITES.mario_small;
    } else {
      if (!player.onGround){ spr = SPRITES.mario_big; }
      else if (Math.abs(player.vx)>0.1){
        // 大马里奥跑步：3 帧弹跳循环 [跑, 腾空, 落地]，不插入站立帧，动画更顺滑
        const r = Math.floor(player.frames/5)%3;
        spr = r===0 ? SPRITES.mario_big_run
          : (r===1 ? SPRITES.mario_big_runB : SPRITES.mario_big_runC);
      }
      else spr = SPRITES.mario_big;
    }
    if(!spr) spr = SPRITES.mario_small;
    const ft = player.hurtFlashT>0 ? player.hurtFlashT : (player.respawnInvT||0);
    const flicker = ft>0 && Math.floor(ft/6)%2===0;
    ctx.globalAlpha = flicker?0.5:1;
    const o={flip:player.dir<0, fit:player.h};
    // 按玩家逻辑高度缩放精灵(占格不变，细节放大)；水平居中，避免各帧宽度不同导致跑动左右跳动
    const w = spr.width * (player.h/spr.height);
    this.drawSprite(ctx, spr, sx + (player.w - w)/2, player.y, o);
    ctx.restore();
  }

  drawHUD(game){
    const ctx=this.ctx, t=game;
    ctx.save();
    ctx.translate(this.offX,this.offY);ctx.scale(this.scale,this.scale);
    ctx.font='bold 14px monospace';ctx.textAlign='left';ctx.textBaseline='top';
    ctx.fillStyle='#fff';ctx.strokeStyle='#000';ctx.lineWidth=3;
    const tp=(x,y,s)=>{ctx.strokeText(s,x,y);ctx.fillText(s,x,y);};
    const p=t.player||{};
    tp(12,10,`MARIO  ${String(p.score??t.score??0).padStart(6,'0')}`);
    tp(220,10,`●×${p.coins??0}`);
    tp(340,10,`WORLD ${t.levelNo}`);
    tp(520,10,`TIME ${String(Math.ceil(t.world?(t.world.time):300)).padStart(3,'0')}`);
    tp(140,34,`命 x${t.lives}`);
    if((p.starT>0&&p.starT<9999)||p.respawnInvT>0){ctx.fillStyle='#ffe14d';tp(420,34,'无敌*');}
    ctx.restore();
  }

  // 菜单背景(简单)
  drawMenu(){
    const ctx=this.ctx;
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    ctx.save();ctx.translate(this.offX,this.offY);ctx.scale(this.scale,this.scale);
    sky(ctx,0);
    ctx.fillStyle='#5a3a00';ctx.fillRect(0,300,640,60);
    ctx.fillStyle='#3a2500';ctx.fillRect(0,340,640,20);
    ctx.font='bold 42px monospace';ctx.textAlign='center';
    ctx.fillStyle='#ffd800';ctx.strokeStyle='#8a3d00';ctx.lineWidth=6;
    ctx.strokeText('SUPER MARIO',320,110);ctx.fillText('SUPER MARIO',320,110);
    ctx.font='16px monospace';ctx.fillStyle='#fff';
    ctx.strokeText('无限随机闯关 · 经典还原',320,170);ctx.fillText('无限随机闯关 · 经典还原',320,170);
    // 站立的马里奥
    this.drawSprite(ctx, SPRITES.mario_big||SPRITES.mario_small, 280, 260);
    ctx.restore();
  }
}

function spriteFor(type){
  if(type==='flower')return SPRITES.flower;
  if(type==='star')return SPRITES.star;
  return SPRITES.mushroom;
}

function sky(ctx,camX){
  const g=ctx.createLinearGradient(0,0,0,360);
  g.addColorStop(0,'#5c94fc');g.addColorStop(1,'#8fc8ff');
  ctx.fillStyle=g;ctx.fillRect(-40,0,720,360);
}
function clouds(ctx,camX){
  // 两行整齐云阵：行高固定 44/96、行内间距 240、两行错开 120，视差滚动，观感整齐如书脊
  ctx.fillStyle='rgba(255,255,255,0.85)';
  for(let i=0;i<6;i++){
    const col=i%3, row=Math.floor(i/3);
    const r=((col*240 + row*120 - camX*0.25)%1080+1080)%1080-160;
    const y=row===0?44:96;
    ctx.beginPath();
    ctx.arc(r,y,15,0,7);ctx.arc(r+19,y-4,19,0,7);ctx.arc(r+38,y,15,0,7);ctx.fill();
  }
}

// 背景山（视差慢速滚动，立体青绿色）
function hills(ctx,off){
  for(let i=0;i<5;i++){
    const hx=((i*300 - off)%1600+1600)%1600-160;
    const hh=70+(i%3)*28;
    ctx.fillStyle = i%2 ? '#3fae5a' : '#2f9a4a';
    ctx.beginPath();
    ctx.moveTo(hx, 328);
    ctx.quadraticCurveTo(hx+60, 328-hh, hx+120, 328);
    ctx.closePath(); ctx.fill();
    // 高光
    ctx.fillStyle='rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.moveTo(hx+22, 328);
    ctx.quadraticCurveTo(hx+52, 328-hh*0.55, hx+88, 328);
    ctx.closePath(); ctx.fill();
  }
}

// 背景灌木（视差中速，半透明绿丛）
function bushes(ctx,off){
  for(let i=0;i<6;i++){
    const bx=((i*220 - off)%1320+1320)%1320-120;
    const by=300-((i%3)*6);
    ctx.fillStyle='rgba(70,160,60,0.55)';
    ctx.beginPath();
    ctx.arc(bx,by,14,0,7);ctx.arc(bx+16,by-6,16,0,7);ctx.arc(bx+34,by,14,0,7);
    ctx.fill();
  }
}

// 地面装饰（草皮/小石子，随相机滚动）
function groundDecor(ctx,camX){
  const gy=328;
  ctx.fillStyle='#7ed957';
  for(let i=0;i<10;i++){
    const gx=((i*90 - camX)%1000+1000)%1000-80;
    ctx.fillRect(gx,gy+2,8,3);
    ctx.fillRect(gx+3,gy-2,3,6);
  }
  ctx.fillStyle='#9a6a2a';
  for(let i=0;i<6;i++){
    const gx=((i*160 - camX)%1200+1200)%1200-80;
    ctx.fillRect(gx,gy+10,4,3);
    ctx.fillRect(gx+6,gy+16,5,3);
  }
}


/* ===== input.js ===== */
/* ===== 输入管理：键盘 + 触屏虚拟按键 ===== */
class Input {
  constructor() {
    this.keys = { left:false, right:false, jump:false, run:false, fire:false };
    this.jumpPressed = false;   // 跳跃按下沿(供跳跃缓冲)
    this.firePressed = false;
    this.onTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    this.touchBtn = {};
    this._bind();
  }

  _bind() {
    window.addEventListener('keydown', e => this._key(e, true));
    window.addEventListener('keyup', e => this._key(e, false));
    // 触屏按钮
    if (this.onTouchDevice) {
      document.querySelectorAll('.tbtn').forEach(btn => {
        const k = btn.dataset.key;
        const press = (v) => {
          this.keys[k] = v;
          if (v && k === 'jump') this.jumpPressed = true;
          if (v && k === 'fire') this.firePressed = true;
          if (v && this.handler) this.handler('touch', k);
        };
        btn.addEventListener('touchstart', e => { e.preventDefault(); press(true); btn.classList.add('active'); }, {passive:false});
        btn.addEventListener('touchend', e => { e.preventDefault(); press(false); btn.classList.remove('active'); }, {passive:false});
        btn.addEventListener('touchcancel', e => { press(false); btn.classList.remove('active'); });
        btn.addEventListener('mousedown', e => { e.preventDefault(); press(true); btn.classList.add('active'); });
        btn.addEventListener('mouseup', e => { press(false); btn.classList.remove('active'); });
        btn.addEventListener('mouseleave', e => { press(false); btn.classList.remove('active'); });
      });
    } else {
      document.getElementById('touch-controls').classList.add('hidden');
    }
  }

  _key(e, down) {
    const map = {
      'ArrowLeft':'left','a':'left','A':'left',
      'ArrowRight':'right','d':'right','D':'right',
      'ArrowUp':'jump','w':'jump','W':'jump',' ':'jump',' ': 'jump',
      'ArrowDown':'down','s':'down','S':'down',
      'Shift':'run','x':'fire','X':'fire','Enter':'jump'
    };
    const k = map[e.key];
    if (!k) return;
    e.preventDefault();
    // 空间/箭头 不重复触发
    if (this.keys[k] === down) {
      // jump 仍要捕获按下沿
      if (down && k === 'jump') this.jumpPressed = true;
      return;
    }
    this.keys[k] = down;
    if (down && k === 'jump') this.jumpPressed = true;
    if (down && k === 'fire') this.firePressed = true;
  }

  // 消费沿信号
  consumeJump() { const v = this.jumpPressed; this.jumpPressed = false; return v; }
  consumeFire() { const v = this.firePressed; this.firePressed = false; return v; }
  reset() {
    for (const k in this.keys) this.keys[k] = false;
    this.jumpPressed = false;
    this.firePressed = false;
  }
}



/* ===== audio.js ===== */
/* ===== 程序化音效 Web Audio ===== */
class AudioFX {
  constructor(){
    this.ctx = null;
    this.enabled = true;
    this._init();
  }
  _init(){
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){ this.enabled=false; }
  }
  resume(){
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }
  _tone(freq, dur, type='square', vol=0.15, slideTo=null){
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }
  jump(){ this._tone(330, 0.18, 'square', 0.1, 660); }
  coin(){ this._tone(988, 0.09,'square',0.12); setTimeout(()=>this._tone(1319,0.25,'square',0.12),80); }
  stomp(){ this._tone(200, 0.12, 'triangle', 0.18, 80); }
  hurt(){ this._tone(400, 0.3, 'sawtooth', 0.12, 120); }
  powerup(){ [660,880,1100,1320].forEach((f,i)=>setTimeout(()=>this._tone(f,0.08,'square',0.1),i*90)); }
  fire(){ this._tone(1400, 0.15, 'square', 0.08, 400); }
  bump(){ this._tone(140, 0.1, 'square', 0.12); }
  die(){ [400,300,200,120].forEach((f,i)=>setTimeout(()=>this._tone(f,0.15,'sawtooth',0.12),i*140)); }
  flag(){ this._tone(523,0.1,'square',0.1); setTimeout(()=>this._tone(659,0.1,'square',0.1),110); setTimeout(()=>this._tone(784,0.25,'square',0.12),220); }
  clear(){ [523,523,523,659,784,659,1046].forEach((f,i)=>setTimeout(()=>this._tone(f,0.12,'square',0.13),i*120)); }
}



/* ===== game.js ===== */
/* ===== 游戏主状态机 ===== */







class Game {
  constructor(renderer, input, sfx, onStateChange){
    this.renderer = renderer;
    this.input = input;
    this.sfx = sfx;
    this.onStateChange = onStateChange;
    this.state = 'menu';      // menu | playing | dying | clear | gameover
    this.levelNo = 1;
    this.lives = StartConfig.lives;
    this.score = 0;
    this.world = null;
    this.player = null;
    this.clearT = 0;
    this.timer = 0;
    this.starMario = StartConfig.invincible;
  }

  startGame(cfg){
    this.lives = cfg.lives;
    this.score = 0;
    this.levelNo = 1;
    this.startLevel(cfg);
  }

  startLevel(cfg){
    if (this.lives <= 0 && !cfg){ this.gameOver(); return; }
    this.cfg = cfg || this.cfg || { lives:this.lives, startBig:StartConfig.startBig, startFire:StartConfig.startFire, invincible:StartConfig.invincible };
    // 保存当前玩家大小/火球状态（复活时保留），仅当是同关复活时
    const respawn = cfg && cfg.respawn;
    const keepBig = respawn && this.player ? !this.player.small : this.cfg.startBig;
    const keepFire = respawn && this.player ? this.player.fire : this.cfg.startFire;
    const seed = (respawn && this.world) ? this.world.seed : null;  // 复活用同一seed保持同关
    const spawnX = (respawn && this.world) ? this.world.checkpointX : null;  // 复活点(像素)：上次激活的检查点
    this.world = new World(this.levelNo, seed, this.cfg);
    this.world.score = this.score;
    this.player = new Player(this.world, { startBig: keepBig, startFire: keepFire, invincible: this.cfg.invincible, spawnX });
    this.world.player = this.player;   // 挂载玩家引用（食人花等需要感知玩家位置）
    this.player.score = this.score;
    this.player.lives = this.lives;
    // 复活：镜头跳到出生点 + 5 秒无敌保护（300帧）
    if (respawn && spawnX!=null){
      this.world.camX = this.world.camTarget = Math.max(-60, spawnX - 200);
      this.player.respawnInvT = 300;
    }
    this.state = 'playing';
    this.timer = 0;
    this.clearT = 0;
    this.onStateChange && this.onStateChange('playing', this);
  }

  update(dt){
    if (this.state==='menu') return;
    if (this.state==='playing' || this.state==='clear'){
      this.timer += dt;
      // 时间限制
      this.world.time = Math.max(0, 300 - Math.floor(this.timer));
      this.updateWorld();
      this.updatePlayer();
      if (this.player.alive) this.world.updateCheckpoint(this.player.x);
      this.checkCollisions();
      this.updateCamera();
      // 分数同步
      this.score = this.player.score;
      if (this.state==='clear') this.updateClear(dt);   // 过关动画 + 自动倒计时跳关
    } else if (this.state==='dying'){
      this.updatePlayer();
      if (!this.player.alive){
        this.lives--;
        if (this.lives<=0){ this.state='gameover'; this.onStateChange('gameover', this); }
        else { this.state='clear'; this.clearT=0; this.startLevel({...this.cfg, lives:this.lives, respawn:true}); }
      }
    }
  }

  updateWorld(){
    const w = this.world;
    // 道具
    for (const p of w.powerups){ if (p.alive) p.update(w); }
    // 敌人（含食人花/尖刺龟/飞行敌人）
    for (const e of w.enemies){ if (e.alive) e.update(w); }
    // 子弹
    for (const b of w.bullets){ if (b.alive) b.update(w); }
    // 金币/碎砖动画
    for (const c of w.coinFx) c.t--;
    for (const s of w.smashed){ s.t--; if (s.t<=0 && !s.bump) s.bump=true; } // 简化
    // 回收
    w.powerups = w.powerups.filter(p=>p.alive);
    w.enemies = w.enemies.filter(e=>e.alive || e.deadT>0);
    w.bullets = w.bullets.filter(b=>b.alive);
  }

  updatePlayer(){
    if (!this.player.alive && this.state==='playing'){ this.state='dying'; this.onStateChange('dying', this); return; }
    if (this.state==='playing' || this.state==='clear') this.player.update(this.input, this.sfx);
    else if (this.state==='dying') this.player.update(this.input, this.sfx);
  }

  checkCollisions(){
    const w = this.world, p = this.player;
    if (!p.alive || this.state!=='playing') return;
    const pa = {x:p.x,y:p.y,w:p.w,h:p.h};
    const inv = p.starT>0 || p.hurtFlashT>0 || p.respawnInvT>0;  // 无敌(星星/受伤闪烁/复活保护)
    // 与道具
    for (const pu of w.powerups){
      if (!pu.alive) continue;
      if (aabb(pa, pu)){
        pu.alive=false;
        this.applyPower(pu.type);
      }
    }
    // 与敌人
    for (const e of w.enemies){
      if (!e.alive || e.dead) continue;
      const ebox = e.type==='piranha' ? e.box : {x:e.x,y:e.y,w:e.w,h:e.h};
      if (!aabb(pa, ebox)) continue;
      const stomping = p.vy>0 && (p.y + p.h - e.y) < 16;
      if (stomping){
        // 可踩：goomba/koopa/flyer；不可踩：piranha(花)/spiny(尖刺，踩踏受伤)
        if (e.type==='piranha' || e.type==='spiny'){
          if (!inv) this.hurtPlayer();
        } else {
          this.stomp(e);
        }
      } else {
        // 侧面碰撞
        if (e.type==='koopa' && e.shell && e.kicked){
          // 被踢出的壳撞到玩家：刚踢出瞬间不伤，之后受伤（原版行为）
          if (e.kickT > 10 && !inv) this.hurtPlayer();
          continue;
        }
        if (!inv) this.hurtPlayer();
      }
    }
    // 踢出的壳击杀其他敌人（撞墙反弹连杀）
    for (const k of w.enemies){
      if (!k.alive || !k.shell || !k.kicked) continue;
      for (const e of w.enemies){
        if (e===k || !e.alive || e.dead || e.shell) continue;
        if (aabb({x:k.x,y:k.y,w:k.w,h:k.h},{x:e.x,y:e.y,w:e.w,h:e.h})){
          e.dead=true; e.deadT=20; e.vx=0;
          this.addScore(200); this.sfx.stomp();
        }
      }
    }
    // 子弹击杀敌人(火球可消灭板栗/乌龟/尖刺/飞行/食人花，+100分)
    for (const b of w.bullets){
      if (!b.alive) continue;
      for (const e of w.enemies){
        if (!e.alive || e.dead) continue;
        const ebox = e.type==='piranha' ? e.box : {x:e.x,y:e.y,w:e.w,h:e.h};
        if (aabb(b, ebox) && this.killEnemyByBullet(b)){
          e.dead=true; e.deadT=20; e.vx=0;
          this.addScore(100);
          this.sfx.stomp();
          break;
        }
      }
    }
    // 到达旗杆
    if (!w.flagReached && p.x + p.w >= w.flagX*TILE + 8){
      this.reachFlag();
    }
  }

  // 子弹命中敌人：返回 true 表示命中并消耗该子弹
  killEnemyByBullet(b){
    if (b.hitFrames !== undefined) return false;
    b.alive = false;      // 触敌即消散(经典火球命中敌人消失)
    return true;
  }

  // 踩踏判定：goomba/flyer 踩扁；koopa 踩成壳/踢壳/停壳；spiny/piranha 不可踩(提前处理)
  stomp(e){
    const w=this.world;
    const s=this.sfx;
    if (e.type==='goomba' || e.type==='flyer'){
      e.dead=true; e.deadT=30; this.player.vy=-6; this.addScore(100); s.stomp();
    } else if (e.type==='koopa'){
      if (e.shell){
        // 已变壳：移动中→踩停；静止→踢出
        if (e.kicked){
          e.kicked=false; e.kickVX=0; this.player.vy=-6; this.addScore(100); s.stomp();
        } else {
          e.kicked=true; e.kickVX=this.player.dir*6; e.kickT=0; this.player.vy=-7; this.addScore(200); s.stomp();
        }
      } else {
        // 踩龟变壳
        e.shell=true; e.dead=false; this.player.vy=-7; this.addScore(100); s.stomp();
      }
    }
  }

  hurtPlayer(){
    const p = this.player;
    if (p.hurtFlashT>0 || p.starT>0 || p.respawnInvT>0) return;  // 无敌期(星星/复活保护)或受伤闪烁期不再受伤
    p.hurtFlashT=80;
    p.damage();   // 大变小 / 小死亡
    this.sfx.hurt();
    if (!p.alive){ this.sfx.die(); p.startDying(); this.state='dying'; }
  }

  applyPower(type){
    const p=this.player;
    if (type==='coin'){ p.coins++; p.score+=100; this.sfx.coin(); return; }
    if (type==='1up'){ this.lives++; this.addScore(1000); this.onStateChange('hud', this); this.sfx.clear(); return; }
    if (type==='mushroom'){ if (p.small){ p.small=false; p.setSize(); } p.score+=1000; this.sfx.powerup(); this.onStateChange('hud', this); return; }
    if (type==='flower'){ p.fire=true; p.small=false; p.setSize(); p.score+=1000; this.sfx.powerup(); this.onStateChange('hud', this); return; }
    if (type==='star'){ p.starT=9999; p.invincible=true; this.starMario=true; this.sfx.powerup(); return; }
  }

  addScore(n){ this.player.score += n; this.onStateChange('hud', this); }

  reachFlag(){
    if (this.world.flagReached) return;
    this.world.flagReached = true;
    this.sfx.flag();
    this.addScore(1000);
    const p=this.player;
    // 玩家抓旗：x 对齐旗杆左侧，进入滑旗动画；旗子从杆顶滑下
    p.clearMode='slide';
    p.vx=0; p.vy=0; p.dir=-1;                 // 面向旗杆
    p.x = this.world.flagX*TILE + 6;          // 贴杆
    this.world.flagSlide = 0;
    this.state='clear';
    this.clearT=0; this.animDone=false; this.resultT=0;
    // 不再立即弹过关界面：动画完成(走进城堡)后由 updateClear 发出 onStateChange('clear')
  }

  // 过关动画推进：旗子下滑(1.2s) + 玩家滑旗/走城堡；完成后显示 COURSE CLEAR 并自动倒计时跳关
  updateClear(dt){
    const w=this.world, p=this.player;
    this.clearT += dt;
    if (!w.flagDone){ w.flagSlide = Math.min(1, this.clearT/1.2); if (w.flagSlide>=1) w.flagDone=true; }
    if (!this.animDone){
      if (p.cleared){                          // 玩家已走进城堡
        this.animDone = true;
        this.resultT = 0;
        this.onStateChange('clear', this);     // 此时才显示 COURSE CLEAR 覆盖层
      }
    } else {
      this.resultT += dt;
      if (this.resultT >= 5) this.nextLevel(); // 自动倒计时跳关
    }
  }

  // 剩余自动跳关秒数（供 UI 按钮倒计时显示）
  get clearRemain(){ return Math.max(0, Math.ceil(5 - (this.resultT||0))); }

  nextLevel(){
    this.levelNo++;
    this.animDone=false; this.resultT=0;
    if (this.player) this.player.clearMode=null;
    this.startLevel({...this.cfg});
  }

  updateCamera(){
    const w=this.world, p=this.player;
    // 相机跟随(向右)
    w.camTarget = Math.max(w.camTarget, p.x - 200);
    w.camX += (w.camTarget - w.camX)*0.12;
    if (w.camX < -60) w.camX = -60;
    const maxCam = w.levelW - 640;
    if (w.camX > maxCam) w.camX = maxCam;
  }

  render(){
    const r = this.renderer;
    if (!this.world) { r.drawMenu(); return; }
    r.begin(this.world);
    r.draw(this.world);
    if (this.player && this.player.alive && this.state!=='menu'){
      r.drawPlayer(this.player, this.world.camX, this.state==='dying');
    }
    r.drawHUD(this);
  }

  gameOver(){ this.state='gameover'; this.onStateChange('gameover', this); }
  backToMenu(){ this.state='menu'; this.onStateChange('menu', this); }
}


/* ===== ui.js ===== */
/* ===== UI：菜单/配置/结算 ===== */

class UI {
  constructor(onStart, onRetry){
    this.onStart = onStart;
    this.onRetry = onRetry;
    this.overlay = document.getElementById('overlay');
    this.hudEl = null;
    this.screens = {};
    window._ui = this;
  }

  mount(){
    this.overlay.innerHTML = '';
    this.showMenu();
  }

  scr(cls){
    const d = document.createElement('div');
    d.className = 'screen ' + cls;
    return d;
  }

  /* ===== 开始菜单 + 配置 ===== */
  showMenu(){
    document.getElementById('touch-controls').classList.add('hidden');
    const s = this.scr('menu');
    s.innerHTML = `
      <div class="title">SUPER MARIO</div>
      <div class="subtitle">▶ 无限随机闯关 · 高精度经典还原 ◀</div>
      <div class="config-box">
        <div class="config-row">
          <div class="config-label">命数<small>初始生命数量</small></div>
          <div class="seg" data-cfg="lives">
            <button class="seg-btn ${StartConfig.lives===3?'active':''}" data-v="3">3 命</button>
            <button class="seg-btn ${StartConfig.lives===30?'active':''}" data-v="30">30 命</button>
          </div>
        </div>
        <div class="config-row">
          <div class="config-label">开局大小<small>大号=已吃蘑菇</small></div>
          <div class="seg" data-cfg="startBig">
            <button class="seg-btn ${!StartConfig.startBig?'active':''}" data-v="false">小马里奥</button>
            <button class="seg-btn ${StartConfig.startBig?'active':''}" data-v="true">大马里奥</button>
          </div>
        </div>
        <div class="config-row">
          <div class="config-label">默认子弹<small>开局即可发射火球(仅大号)</small></div>
          <div class="seg" data-cfg="startFire">
            <button class="seg-btn ${!StartConfig.startFire?'active':''}" data-v="false">无</button>
            <button class="seg-btn ${StartConfig.startFire?'active':''}" data-v="true">带子弹</button>
          </div>
        </div>
        <div class="config-row">
          <div class="config-label">无敌<small>不受任何伤害</small></div>
          <div class="seg" data-cfg="invincible">
            <button class="seg-btn ${!StartConfig.invincible?'active':''}" data-v="false">关</button>
            <button class="seg-btn ${StartConfig.invincible?'active':''}" data-v="true">开</button>
          </div>
        </div>
      </div>
      <button class="primary-btn" id="btn-start">▶ 开始游戏</button>
      <div class="status-line"></div>
    `;
    this.overlay.appendChild(s);
    // 配置切换
    s.querySelectorAll('.seg').forEach(seg => {
      seg.querySelectorAll('.seg-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const key = seg.dataset.cfg;
          const v = btn.dataset.v==='true'?true:(btn.dataset.v==='false'?false:Number(btn.dataset.v));
          StartConfig[key] = v;
          seg.querySelectorAll('.seg-btn').forEach(b=>b.classList.remove('active'));
          btn.classList.add('active');
          saveStartConfig();
        });
      });
    });
    s.querySelector('#btn-start').addEventListener('click', () => this.onStart({...StartConfig}));
  }

  /* ===== 结算/死亡/游戏结束 ===== */
  showResult(type, game){
    document.getElementById('touch-controls').classList.remove('hidden');
    const s = this.scr('result');
    let title='', msg='', btnText='';
    if (type==='gameover'){ title='GAME OVER'; msg='再接再厉'; btnText='回到主菜单'; }
    else if (type==='clear'){ title='COURSE CLEAR!'; msg=`本关得分 ${game.score}`; btnText='继续下一关'; }
    else { title=''; msg=''; btnText='点击重试'; }
    s.innerHTML = `
      <div class="title" style="font-size:34px">${title}</div>
      <div class="status-line">${msg}</div>
      <button class="primary-btn red">${btnText}</button>
      <div class="loading"></div>
    `;
    this.overlay.appendChild(s);
    const btn = s.querySelector('.primary-btn');
    if (type==='gameover') btn.addEventListener('click', ()=>this.showMenu());
    else btn.addEventListener('click', ()=>this.onRetry());
    // clear 界面：按钮显示自动跳关倒计时（可点击立即进入下一关；倒计时结束 game 自动跳关）
    if (type==='clear'){
      const upd = ()=>{
        const r = game.clearRemain || 0;
        btn.textContent = `${btnText} (${r})`;
        if (r<=0){ clearInterval(this.clearTimer); this.clearTimer=null; }
      };
      upd();
      this.clearTimer = setInterval(upd, 500);
      setTimeout(()=>{ document.getElementById('touch-controls').classList.remove('hidden'); }, 400);
    }
  }

  /* 返回菜单时清理覆盖层 */
  hideAll(){
    if (this.clearTimer){ clearInterval(this.clearTimer); this.clearTimer=null; }
    this.overlay.innerHTML = '';
  }
}


/* ===== main.js ===== */
/* ===== 入口 ===== */







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


})();

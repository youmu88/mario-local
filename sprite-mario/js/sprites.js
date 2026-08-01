/* ===== 程序化像素精灵绘制（高精度重绘版） =====
 * 用字符画描述精灵，运行时在离屏 canvas 上渲染为高清纹理。
 * PX 在 config.js 中定义（当前=4，更高分辨率）。
 * 另支持加载官方马里奥主题素材（assets/sprites/*.png）替换程序化精灵。
 */
import { PX } from './config.js';

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

function loadOfficialSprite(key, url){
  const img = new Image();
  img.onload = () => {
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    c.getContext('2d').drawImage(img, 0, 0);
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
export function loadOfficialSprites(){
  if (officialLoaded>0) return;   // 幂等
  for (const k in OFFICIAL_URLS) loadOfficialSprite(k, OFFICIAL_URLS[k]);
}

// 是否已全部加载（供调试/测试）
export function officialSpritesReady(){
  return officialLoaded >= OFFICIAL_TOTAL;
}

export { SPRITES, makeSprite, PAL };

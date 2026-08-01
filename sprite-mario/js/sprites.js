/* ===== 程序化像素精灵绘制 =====
 * 用 8x8/16x16 网格点阵描述精灵，运行时在离屏 canvas 上渲染为高清纹理。
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

const PAL = {
  'R':'#e03a20','r':'#9c2a15',  // 红(帽/衣)
  'B':'#2a8cd4','b':'#1a5c9c',  // 蓝(裤)
  'S':'#f7c5a0','s':'#c98a62',  // 肤色
  'H':'#5a320a','h':'#341c05',  // 棕头发
  'K':'#2a1200',                // 眼睛黑
  'Y':'#ffd800','y':'#c9a400',  // 黄(扣/星)
  'W':'#fff','w':'#c0c0c0',     // 白
  'G':'#b07730','g':'#7a4a18',  // 棕壳
  'O':'#ff8c00',                // 橙
  'N':'#111',                   // 壳深
  'T':'#5aa02a','t':'#3a6a18',  // 乌龟绿
  'M':'#7ce82a',                // 绿
  'P':'#c96a12','p':'#8a3d00',  // 问号砖土色
  'C':'#d0d0d0',                // 灰砖
  'L':'#8fd14f',                // 蘑菇伞
  'E':'#e8e8e8',                // 蘑菇柄
  'F':'#ffb400',                // 火球
  'Q':'#ff7040',                // 金币
  'V':'#8a1a1a',                // 旗砖
};
PAL.M = '#7ce82a';

/* ===== 精灵定义 ===== */
const SPRITES = {};

// 问号砖
SPRITES['brick_q'] = makeSprite([
  'pppppppp',
  'pPPPPPPp',
  'pPYYYYPP',
  'pPYWYPPP',
  'pPPPYYYY',
  'pPPYWYPP',
  'pYPPPPPP',
  'pppppppp'
], PAL);

// 已消耗问号砖
SPRITES['brick_q_used'] = makeSprite([
  'pppppppp',
  'pPPPPPPp',
  'pPPPPPPp',
  'pPPPPPPp',
  'pPPPPPPp',
  'pPPPPPPp',
  'pPPPPPPp',
  'pppppppp'
], PAL);

// 普通实心砖方块
SPRITES['block'] = makeSprite([
  'CCCCCCCC',
  'CccccccC',
  'CccccccC',
  'CCCCCCCC',
  'CccccccC',
  'CccccccC',
  'CCCCCCCC',
  'ccccccCC'
], PAL);

// 可撞碎砖(金币砖下面的实心)
SPRITES['brick_b'] = makeSprite([
  'CgGCgGCc',
  'gG.CgGCg',
  'CGgGCgGC',
  'CgGCgGCg',
  'gGCgGCgG',
  'GgGCgGCg',
  'CgGCgGCG',
  'gGCgGCgG'
], PAL);

// 金币
SPRITES['coin'] = makeSprite([
  '..QQQQ..',
  '.QYYYYQ.',
  'QYQYYQYQ',
  'QYQYYQYQ',
  'QYQYYQYQ',
  'QYQYYQYQ',
  '.QYYYYQ.',
  '..QQQQ..'
], PAL);

/* 小马里奥 - 面向右 */
const MARIO_SMALL = [
  '.....RRR.',
  '....RRRRR',
  '...RRRRRR',
  '..RRRRRRR',
  '..SSSSSSS',
  '..SSSKSKS',
  '..SSSSSSS',
  '.sSSSSSSs',
  '.sss.sss.',
  '...R...R.',
  '...B...B.',
  '..BB..BB.',
  '..B....B.'
];
SPRITES['mario_small'] = makeSprite(MARIO_SMALL, PAL);

/* 大马里奥 - 面向右 */
const MARIO_BIG = [
  '....RRRRR.',
  '...RRRRRRR',
  '...RRRRRRR',
  '...SSSSSSS',
  '..SSSSSSSS',
  '..SSSSKSKS',
  '...SSSSSSS',
  '...sSSSss.',
  '....sSSs..',
  '.RRR..RRR.',
  '.RRR..RRR.',
  '.BBB..BBB.',
  '.BBBB.BBBB',
  '.BB....BB.',
  '.........'
];
SPRITES['mario_big'] = makeSprite(MARIO_BIG, PAL);

// 蘑菇怪 Goomba
const GOOMBA = [
  '..NNNNNN..',
  '.NbbbbbbN.',
  'NbbbbbbbbN',
  'NbbbswbbNN',
  'NbbbbbbbbN',
  'NbNbbbbNNN',
  'NbbbbbbbbN',
  '.NNNNNNNN.',
  '...N..N...',
  '..NN..NN..'
];
PAL.b='#b07730'; PAL.n='#2a1200';
SPRITES['goomba'] = makeSprite(GOOMBA, PAL);

// 乌龟 Koopa（绿，面向右）
const KOOPA = [
  '....TtT...',
  '...TTtTT..',
  '.TTTTTTtTT',
  'TTttsssTTT',
  'TTsssKKTtT',
  '.TTTTTTTT.',
  '..GGGGGG..',
  '..GgGgGG..',
  '..GgGgGG..'
];
SPRITES['koopa'] = makeSprite(KOOPA, PAL);

// 蘑菇(红)- 变大道具
const MUSHROOM = [
  '....LLLLL....',
  '...LLLLLLL...',
  '.LLLLLLLLLLL.',
  'LLLLLLLLLLLLL',
  'LLLLLWWLLLLLL',
  'LLLLLWWWWLLLL',
  'LLLLLLLLLLLLL',
  'LLLLLLLLLLLLL',
  '.EEEEEEEEEEE.',
  'EeEeEEEEeEEEe',
  '.EEEEEEEEEEE.'
];
SPRITES['mushroom'] = makeSprite(MUSHROOM, PAL);

// 火之花
const FLOWER = [
  '....GG....',
  '...GGGG...',
  '.FGGGGGGF.',
  'FGGGFGGGF',
  '..GGGGGG..',
  '..GGGGGG..',
  '..GGGGGG..',
  '...EEEE...',
  '...EEEE...',
  '...EEEE...'
];
SPRITES['flower'] = makeSprite(FLOWER, PAL);

// 子弹(火球)
SPRITES['fireball'] = makeSprite([
  '..FF..',
  '.FFFF.',
  'FFFFFF',
  'FFFFFF',
  '.FFFF.',
  '..FF..'
], PAL);

// 星星
SPRITES['star'] = makeSprite([
  '...YY...',
  '..YYYY..',
  '.YYYYYY.',
  'YYYYYYYY',
  'YYYYYYYY',
 '.YYYYYY.',
 '..YYYY..',
 '...WW...'
], PAL);

// 旗杆顶部
SPRITES['flag_pole'] = makeSprite([
  'OOO....',
  'OOOOO..',
  'OOO....',
  'RRR....'
], PAL);

// 城堡(简单)
SPRITES['castle'] = makeSprite([
  '..VVVVVV..',
  '.VVSSSSVV.',
  'VSSSSSSSSV',
  'VSSSSSSSSV',
  'VVVVSSVVVV',
  ' SSS S S S'.replace(/ /g,'.'), // 门
  'VVVV..VVVV',
  'VVVV..VVVV'
], PAL);

// 云
SPRITES['cloud'] = makeSprite([
  '....WWW....',
  '..WWWWWW..',
  'WWWWWWWWWW',
  'WWWWWWWWWW',
  '..WWWWWW..'
], PAL);

// 灌木
SPRITES['bush'] = makeSprite([
  '..GGGG..',
  '.GGmGGg.',
  'GGmGGmGg',
  'GGmGGmGg',
  'GGGGGGGG',
  'GGGGGGGG'
], PAL);
PAL.m = '#3a8a22';

// 山
SPRITES['hill'] = makeSprite([
  '.....OOO.....',
  '....OOOOO....',
  '...OOOoOOO...',
  '..OOOoOoOOO..',
  '.OOOoOOOoOOO.',
  'OOOoOOOoOOOoO',
  'OOOOOOOOOOOOO'
], PAL);

// 管道
SPRITES['pipe'] = makeSprite([
  '..GGGGGG..',
  'GGggggggGG',
  'GGggggggGG',
  'GGggggggGG',
  'GGggggggGG'
], PAL);

export { SPRITES, makeSprite, PAL };

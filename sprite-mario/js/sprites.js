/* ===== 程序化像素精灵绘制（高精度重绘版） =====
 * 用字符画描述精灵，运行时在离屏 canvas 上渲染为高清纹理。
 * PX 在 config.js 中定义（当前=4，更高分辨率）。
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

export { SPRITES, makeSprite, PAL };

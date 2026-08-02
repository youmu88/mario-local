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

/* ===== 1up 绿蘑菇（加命道具，与红蘑菇同构、绿伞白点） 16x16 ===== */
SPRITES['1up'] = makeSprite([
  '.....TTTTTT.....',
  '....TTTTTTTT....',
  '...TTTTTTTTTT...',
  '..TTTTTTTTTTTT..',
  '..TTTTTTTTTTTT..',
  '.TTWWTTTTWWTTTT.',
  '.TTWWTTTTWWTTTT.',
  '.TTTTTTTTTTTTTT.',
  '.TTTTTTTTTTTTTT.',
  '.TTTTTTTTTTTTTT.',
  '..TTTTTTTTTTTT..',
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

/* ===== 问号砖 16x16（经典金色方块+白色?，可顶出道具） ===== */
SPRITES['brick_q'] = makeSprite([
  'pppppppppppppppp',
  'pQQQQQQQQQQQQQQp',
  'pQQQQQQQQQQQQQQp',
  'pQQQWWWWWWQQQQQp',
  'pQQWWWWWWWWQQQQp',
  'pQQWWWWWWWWQQQQp',
  'pQQQQQQQQWWQQQQp',
  'pQQQQQQQQWWQQQQp',
  'pQQQQQQQQWWQQQQp',
  'pQQQQQQWWQQQQQQp',
  'pQQQQQQWWQQQQQQp',
  'pQQQQQQQQQQQQQQp',
  'pQQQQQWWQQQQQQQp',
  'pQQQQQWWQQQQQQQp',
  'pQQQQQQQQQQQQQQp',
  'pppppppppppppppp',
], PAL);

/* ===== 已消耗问号砖 16x16（顶用后变暗金，无?图案） ===== */
SPRITES['brick_q_used'] = makeSprite([
  'pppppppppppppppp',
  'pqqqqqqqqqqqqqqp',
  'pqqqqqqqqqqqqqqp',
  'pqqqqqqqqqqqqqqp',
  'pqqqqqqqqqqqqqqp',
  'pqqqqqqqqqqqqqqp',
  'pqqqqqqqqqqqqqqp',
  'pqqqqqqqqqqqqqqp',
  'pqqqqqqqqqqqqqqp',
  'pqqqqqqqqqqqqqqp',
  'pqqqqqqqqqqqqqqp',
  'pqqqqqqqqqqqqqqp',
  'pqqqqqqqqqqqqqqp',
  'pqqqqqqqqqqqqqqp',
  'pqqqqqqqqqqqqqqp',
  'pppppppppppppppp',
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

/* ===== 大马里奥蹲姿（蜷缩一团；官方派生帧加载后自动替换） 16x16 ===== */
SPRITES['mario_big_crouch'] = makeSprite([
  '.....RRRRRR.....',
  '....RRRRRRRRR...',
  '....RRRRRRRRR...',
  '....SSSSSSSSS...',
  '...SSKSSSSKSS...',
  '...SSSSSSSSSS...',
  '....HHHHHHHHH...',
  '...RRRRRRRRRR...',
  '..RRRBRRRRBRRR..',
  '..RBBBBBBBBBBR..',
  '..BBBBBBBBBBBB..',
  '..BBBBBBBBBBBB..',
  '...BB.BBBB.BB...',
  '..HHH.HHHH.HHH..',
  '..HHH.HHHH.HHH..',
  '................',
], PAL);

/* ===== 官方马里奥主题素材（assets/sprites/**.png，异步加载后替换程序化精灵） =====
 * 素材来源（本仓库 assets/sprites/ 目录）：
 *  - mario_*.png / goomba_*.png / piranha_*.png : NES 官方精灵（R7 起在用，生产验证）
 *  - koopa_*.png : 《Super Mario Maker》SMB1 主题官方素材（NostalgicMysticalCat/Super-Mario-Maker-Assets-Archive）
 *  - remastered/*.png : AwkwaBear/SMB-Remastered 全烘焙真彩帧（R21 新增：火马里奥全套、蘑菇/1UP/星/火球；
 *    该仓库精灵表为「未rip占位绿格+全烘焙格」混合，仅全烘焙格可出货，已逐帧 ASCII 像素验证）
 * 版权归 Nintendo 所有；仅供个人学习/自用项目，禁止商用分发。
 */
const R21 = 'assets/sprites/remastered/';
const OFFICIAL_URLS = {
  mario_small:      'assets/sprites/mario_0.png',   // 站立(NES官帧)
  mario_small_run2: 'assets/sprites/mario_1.png',   // 跑1
  mario_small_run3: 'assets/sprites/mario_2.png',   // 跑2
  mario_small_run4: 'assets/sprites/mario_3.png',   // 跑3
  mario_small_jump: 'assets/sprites/mario_4.png',   // 跳跃
  mario_big:        'assets/sprites/mario_6.png',   // 大马里奥站
  mario_big_run:    'assets/sprites/mario_7.png',   // 大马里奥跑
  mario_big_crouch: 'assets/sprites/mario_crouch.png', // 大马里奥蹲姿(官方站立帧派生)
  mario_fire:       R21+'rem_fire_stand.png',   // 火马里奥站(R21新增,全烘焙真彩22×27)
  mario_fire_run:   R21+'rem_fire_run.png',     // 火马里奥跑(同帧,runB/C由loader派生)
  mario_fire_crouch: R21+'rem_fire_crouch.png', // 火马里奥蹲(站姿压高24px派生)
  brick_q:          'assets/sprites/qblock_0.png',  // 问号块(SMB-Remastered 周年庆)
  goomba:           'assets/sprites/goomba_0.png',  // 走路A(NES官帧)
  goomba_w2:        'assets/sprites/goomba_1.png',  // 走路B
  goomba_squash:    'assets/sprites/goomba_4.png',  // 踩扁
  koopa:            'assets/sprites/koopa_0.png',   // 走路A(SMM源)
  koopa_w2:         'assets/sprites/koopa_1.png',
  koopa_shell:      'assets/sprites/koopa_2.png',
  piranha:          'assets/sprites/piranha_0.png', // (NES官帧)
  piranha_2:        'assets/sprites/piranha_1.png',
  mushroom:         R21+'rem_mushroom.png',     // 蘑菇(R21新增,全烘焙,替换程序化)
  '1up':            R21+'rem_1up.png',          // 1UP绿菇(R21新增,替换程序化)
  star:             R21+'rem_star.png',         // 星星(R21新增,替换程序化)
  fireball:         R21+'rem_fireball.png',     // 火球(R21新增,替换程序化)
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
    // 官方 mario 帧统一镜像为面向右；mario_7(大马里奥跑)素材本身面向右，不翻转(避免头部反向)；
    // R21 火马里奥帧(近对称正面站姿)随统一镜像，方向观感一致
    if (key.indexOf('mario_')===0 && key!=='mario_big_run') c = flipCanvas(c);
    SPRITES[key] = c;
    officialLoaded++;
    // 大/火马里奥跑步：由单帧派生腾空/落地帧（官方素材加载后自动启用 3 帧跑步动画）
    if (key==='mario_big_run' || key==='mario_fire_run'){
      SPRITES[key+'B'] = makeBigRunFrame(c, -1);
      SPRITES[key+'C'] = makeBigRunFrame(c, 1);
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

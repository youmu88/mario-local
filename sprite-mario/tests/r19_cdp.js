#!/usr/bin/env node
/* R19 CDP 端到端：下蹲(进入/退出/锁步/被迫蹲/蹲滑穿缝/长大自动蹲/小马里奥不可蹲/蹲姿受伤/触旗站起)
   + 旗杆按高度分档给分(100~5000) + 蹲姿精灵资源存在 */
const { execSync, spawn } = require('child_process');
const ROOT = '/Users/wilsonwen/.ai-chatAgent/workspace/45e4d2e4d23a4cdeb17aab17ef59c0fd';
const INDEX = 'file://' + ROOT + '/sprite-mario/index.html';
const PORT = 9225;
const CDP = 'http://127.0.0.1:' + PORT;
try { execSync(`pkill -f "remote-debugging-port=${PORT}"`); } catch(e){}
try { execSync(`rm -rf /tmp/mario19_profile`); } catch(e){}
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', '--disable-gpu', '--no-sandbox',
  `--remote-debugging-port=${PORT}`,
  '--user-data-dir=/tmp/mario19_profile',
  '--window-size=800,450',
  INDEX
], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function getTarget(){
  for (let i=0;i<60;i++){
    try {
      const list = await (await fetch(CDP + '/json/list')).json();
      const page = list.find(t => t.type==='page');
      if (page && page.webSocketDebuggerUrl) return page;
    } catch(e){}
    await sleep(250);
  }
  throw new Error('CDP target not found');
}
const TEST_JS = `(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const out = {};
  try {
  for (let i=0;i<50 && !(window.__MARIO_DEBUG && window.__MARIO_DEBUG.game);i++) await sleep(200);
  if (!(window.__MARIO_DEBUG && window.__MARIO_DEBUG.game)){ out.ERR='MARIO_DEBUG not ready'; return out; }
  const D = window.__MARIO_DEBUG, g = D.game;
  g.startGame({lives:30, startBig:true, startFire:false, invincible:false});
  await sleep(200);
  const p = g.player, w = g.world;
  g.state = 'menu';                                   // 暂停 rAF 双驱动
  const TILE=32, groundY=w.groundY;
  const mkI = (down,right,run)=>({keys:{down:!!down,right:!!right,left:false,jump:false,run:!!run,fire:false}, consumeJump:()=>false, consumeFire:()=>false});
  const zone=12;
  for (let tx=zone; tx<zone+30; tx++) for (let ty=8; ty<=10; ty++) w.tiles[ty][tx]=0;

  // T1 下蹲进入/退出（空旷，脚底不动）
  p.x=zone*TILE; p.small=false; p.crouching=false; p.setSize(); p.vx=0; p.vy=0; p.onGround=true;
  const feet0=p.y+p.h;
  p.update(mkI(true), g.sfx);
  out.T1_enter={crouching:p.crouching, h:p.h, feetKept:Math.abs((p.y+p.h)-feet0)<0.01};
  p.update(mkI(false), g.sfx);
  out.T1_exit={crouching:p.crouching, h:p.h, feetKept:Math.abs((p.y+p.h)-feet0)<0.01};

  // T2 主动蹲锁定迈步：静止按↓+→ 30帧，vx≈0
  p.x=zone*TILE; p.y=groundY*TILE-p.h; p.vx=0; p.vy=0; p.onGround=true;
  for(let i=0;i<30;i++) p.update(mkI(true,true), g.sfx);
  out.T2_lock={vx:Math.round(p.vx*100)/100, crouching:p.crouching};

  // T3 低矮通道被迫蹲：蹲滑入→松↓仍蹲→可蹲走→出通道自动站起
  const c0=zone+6, cLen=5;
  for(let tx=c0; tx<c0+cLen; tx++) w.tiles[groundY-2][tx]=1;
  p.x=(c0-1)*TILE-8; p.crouching=false; p.setSize(); p.vx=0; p.vy=0; p.onGround=true;
  p.update(mkI(true), g.sfx);            // 蹲下
  p.vx=1.5;                              // 模拟带速滑入
  for(let i=0;i<600 && p.x+p.w < c0*TILE+cLen*TILE+8;i++){
    const headIn = (p.x + p.w) > c0*TILE + 4;
    p.update(headIn ? mkI(false,true) : mkI(true), g.sfx);
  }
  const midCrouch = p.crouching;
  for(let i=0;i<400 && p.crouching;i++) p.update(mkI(false,true), g.sfx);
  out.T3_forced={midCrouch, standAfterExit:!p.crouching, hAfter:p.h, xOut:Math.round(p.x)};

  // T4 冲刺蹲滑穿 1 格缝（3格长通道）
  const d0=zone+16, dLen=3;
  for(let tx=d0; tx<d0+dLen; tx++) w.tiles[groundY-2][tx]=1;
  p.x=(d0-8)*TILE; p.crouching=false; p.setSize(); p.vx=0; p.vy=0; p.onGround=true;
  let crossed=false, blocked=false;
  for(let i=0;i<500;i++){
    const nearGap = p.x + p.w > d0*TILE - 32;
    p.update(nearGap? mkI(true) : mkI(false,true,true), g.sfx);
    if (p.x > (d0+dLen)*TILE){ crossed=true; break; }
    if (p.vx===0 && p.x + p.w < d0*TILE){ blocked=true; break; }
  }
  out.T4_slide={crossed, blocked};

  // T5 旗杆按抓杆高度分档给分（地面=100 … 杆顶=5000）
  const flagBase=groundY*TILE, poleH=6*TILE;
  const tiers=[100,200,400,800,1000,2000,4000,5000];
  const testH=[0, 48, 96, 150, 192];
  const got=[];
  for (const gh of testH){
    w.flagReached=false; g.state='menu'; p.clearMode=null; p.crouching=false; p.h=TILE*2;
    const s0=p.score;
    p.x=w.flagX*TILE-40; p.y=flagBase - p.h - gh; p.vy=0;
    g.state='playing'; g.reachFlag(); g.state='menu';
    got.push(p.score-s0);
  }
  const exp=testH.map(gh=>tiers[Math.min(7,Math.floor(Math.max(0,Math.min(poleH,gh))/poleH*8))]);
  out.T5_flag={got, exp, pass: got.join()===exp.join()};

  // T6 低矮通道里小马里奥吃蘑菇长大 → 自动蹲（防嵌顶）
  p.clearMode=null;
  p.small=true; p.crouching=false; p.setSize();
  p.x=(c0+1)*TILE; p.y=groundY*TILE-p.h; p.vy=0; p.vx=0; p.onGround=true;
  const feetG=p.y+p.h;
  g.applyPower('mushroom');
  p.update(mkI(false), g.sfx);
  out.T6_growCrouch={small:p.small, crouching:p.crouching, h:p.h, feetKept:Math.abs((p.y+p.h)-feetG)<0.01};

  // T7 小马里奥按下不能蹲
  p.clearMode=null;
  p.small=true; p.crouching=false; p.setSize();
  p.x=zone*TILE; p.y=groundY*TILE-p.h; p.vy=0; p.onGround=true;
  p.update(mkI(true), g.sfx);
  out.T7_smallNoCrouch={crouching:p.crouching, h:p.h};

  // T8 蹲姿受伤：缩小+清蹲姿+脚底不动
  p.small=false; p.setSize(); p.crouching=true; p.h=TILE; p.y=groundY*TILE-p.h;
  const feetH=p.y+p.h;
  p.starT=0; p.respawnInvT=0; p.hurtFlashT=0;
  p.damage();
  out.T8_hurt={small:p.small, crouching:p.crouching, h:p.h, feetKept:Math.abs((p.y+p.h)-feetH)<0.01};

  // T9 蹲姿精灵资源存在（官方派生帧或程序化兜底）
  const cs = window.__SPRITES && window.__SPRITES.mario_big_crouch;
  const qs = window.__SPRITES && window.__SPRITES.brick_q;
  out.T9_sprite={crouch:!!cs, crouchW:cs&&cs.width, qblock:!!qs, qblockW:qs&&qs.width};

  // T10 蹲滑触旗：恢复站姿对齐滑旗动画
  w.flagReached=false; g.state='menu'; p.clearMode=null;
  p.crouching=true; p.h=TILE; p.y=flagBase-TILE; p.x=w.flagX*TILE-40;
  g.state='playing'; g.reachFlag(); g.state='menu';
  out.T10_flagStand={crouching:p.crouching, h:p.h};
  } catch(e){ out.ERR = String(e && e.stack || e); }
  return out;
})()`;
async function main(){
  const target = await getTarget();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 0; const pending = {};
  const send = (method, params={}) => new Promise((resolve,reject)=>{
    const mid = ++id; pending[mid] = {resolve,reject};
    ws.send(JSON.stringify({id:mid, method, params}));
  });
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending[m.id]){ pending[m.id].resolve(m); delete pending[m.id]; }
  };
  await new Promise(r => ws.onopen = r);
  await sleep(1200);
  const r = await send('Runtime.evaluate', { expression: TEST_JS, awaitPromise: true, returnByValue: true });
  const val = r.result && r.result.result && r.result.result.value;
  if (!val) console.log('RAW:', JSON.stringify(r.result).slice(0, 500));
  console.log('RESULT:' + JSON.stringify(val, null, 2));
  // 判定
  const checks = [];
  const ck = (name, ok) => { checks.push((ok?'PASS':'FAIL')+' '+name); };
  if (val){
    ck('T1_enter', val.T1_enter && val.T1_enter.crouching && val.T1_enter.h===32 && val.T1_enter.feetKept);
    ck('T1_exit', val.T1_exit && !val.T1_exit.crouching && val.T1_exit.h===64 && val.T1_exit.feetKept);
    ck('T2_lock', val.T2_lock && Math.abs(val.T2_lock.vx)<=0.05 && val.T2_lock.crouching);
    ck('T3_forced', val.T3_forced && val.T3_forced.midCrouch && val.T3_forced.standAfterExit && val.T3_forced.hAfter===64);
    ck('T4_slide', val.T4_slide && val.T4_slide.crossed && !val.T4_slide.blocked);
    ck('T5_flag', val.T5_flag && val.T5_flag.pass);
    ck('T6_growCrouch', val.T6_growCrouch && !val.T6_growCrouch.small && val.T6_growCrouch.crouching && val.T6_growCrouch.h===32 && val.T6_growCrouch.feetKept);
    ck('T7_smallNoCrouch', val.T7_smallNoCrouch && !val.T7_smallNoCrouch.crouching);
    ck('T8_hurt', val.T8_hurt && val.T8_hurt.small && !val.T8_hurt.crouching && val.T8_hurt.feetKept);
    ck('T9_sprite', val.T9_sprite && val.T9_sprite.crouch && val.T9_sprite.qblock);
    ck('T10_flagStand', val.T10_flagStand && !val.T10_flagStand.crouching && val.T10_flagStand.h===64);
    ck('NO_ERR', !val.ERR);
  }
  console.log(checks.join('\n'));
  console.log(checks.every(c=>c.startsWith('PASS')) && checks.length>0 ? 'ALL_PASS' : 'SOME_FAIL');
  ws.close(); chrome.kill(); process.exit(0);
}
main().catch(e => { console.error('ERR', e.message); chrome.kill(); process.exit(1); });

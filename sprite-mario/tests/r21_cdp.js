#!/usr/bin/env node
/* R21 CDP 端到端：素材升级终版验证
   T1 remastered 新帧加载(火马里奥3帧+道具4件, 尺寸断言)
   T1b NES 官帧回退守卫(mario_small/goomba/piranha 保持 NES 尺寸)
   T2 火马里奥视觉(开火局奶油白像素 vs 对照局 NES 棕/肤像素)
   T3 火球发射 / T4 玩法冒烟(右移) */
const { execSync, spawn } = require('child_process');
const ROOT = '/Users/wilsonwen/.ai-chatAgent/workspace/45e4d2e4d23a4cdeb17aab17ef59c0fd';
const INDEX = 'file://' + ROOT + '/sprite-mario/index.html';
const PORT = 9227;
const CDP = 'http://127.0.0.1:' + PORT;
try { execSync(`pkill -f "remote-debugging-port=${PORT}"`); } catch(e){}
try { execSync(`rm -rf /tmp/mario21_profile`); } catch(e){}
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--disable-web-security', '--allow-file-access-from-files',
  `--remote-debugging-port=${PORT}`,
  '--user-data-dir=/tmp/mario21_profile',
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
const ASSETS_JS = `(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const out = {};
  try {
    for (let i=0;i<60 && !(window.__MARIO_DEBUG && window.__MARIO_DEBUG.game); i++) await sleep(200);
    const S = window.__SPRITES;
    if (!S) { out.ERR='no __SPRITES'; return out; }
    for (let i=0;i<50 && !(S.mario_fire && S.mario_fire.width===22); i++) await sleep(200);
    const d = {};
    for (const k of ['mario_fire','mario_fire_run','mario_fire_runB','mario_fire_runC','mario_fire_crouch','mushroom','1up','star','fireball','mario_small','mario_big','mario_big_crouch','goomba','koopa','piranha','brick_q'])
      d[k] = S[k] ? S[k].width + 'x' + S[k].height : null;
    out.dims = d;
  } catch(e){ out.ERR = String(e && e.stack || e); }
  return out;
})()`;
const FIRE_JS = `(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const out = {};
  try {
    const D = window.__MARIO_DEBUG, g = D.game;
    for (let i=0;i<50 && !(window.__SPRITES.mario_fire && window.__SPRITES.mario_fire_run); i++) await sleep(200);
    const scan = () => {
      const r = D.renderer, p = g.player;
      const sx = Math.round((p.x - 12 - g.world.camX) * r.scale + r.offX);
      const sy = Math.round(p.y * r.scale + r.offY);
      const w = Math.round((p.w + 24) * r.scale), h = Math.round(p.h * r.scale);
      const img = r.ctx.getImageData(Math.max(sx,0), Math.max(sy,0), Math.min(w, r.canvas.width-Math.max(sx,0)), Math.min(h, r.canvas.height-Math.max(sy,0))).data;
      let cream = 0, brown = 0, nesSkin = 0;
      for (let i = 0; i < img.length; i += 4) {
        const R = img[i], G = img[i+1], B = img[i+2], A = img[i+3];
        if (A < 200) continue;
        if (R > 240 && G > 215 && G < 248 && B > 155 && B < 215) cream++;        // 火马里奥奶油白(255,231,181)
        if (R > 170 && R < 225 && G > 75 && G < 125 && B < 30) brown++;          // NES棕(198,99,0)
        if (R > 240 && G > 130 && G < 170 && B > 70 && B < 110) nesSkin++;       // NES肤(255,148,90)
      }
      return { cream, brown, nesSkin };
    };
    g.startGame({ lives: 30, startBig: true, startFire: true, invincible: false });
    await sleep(800);
    out.fireState = { fire: g.player.fire, small: g.player.small };
    out.fireScan = scan();
    D.input.firePressed = true;
    out.bullets = 0;
    for (let i=0;i<25;i++){ await sleep(20); const n = g.world.bullets.filter(b => b.alive).length; if (n>0){ out.bullets = n; break; } }
    g.startGame({ lives: 30, startBig: true, startFire: false, invincible: false });
    await sleep(800);
    out.bigScan = scan();
    const x0 = g.player.x;
    D.input.keys.right = true;
    await sleep(700);
    D.input.keys.right = false;
    out.moved = g.player.x > x0 + 30;
    out.state = g.state;
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
  await sleep(1500);
  const evalJs = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    return r.result && r.result.result && r.result.result.value;
  };
  const checks = [];
  const ck = (name, ok) => { checks.push((ok?'PASS':'FAIL')+' '+name); };
  await send('Emulation.setDeviceMetricsOverride', { width:1280, height:720, deviceScaleFactor:1, mobile:false });
  await sleep(300);
  const a = await evalJs(ASSETS_JS);
  console.log('ASSETS:', JSON.stringify(a));
  const d = (a && a.dims) || {};
  ck('T1_fire_stand_22x27', d.mario_fire === '22x27');
  ck('T1_fire_run', d.mario_fire_run === '22x27');
  ck('T1_fire_runBC_derived', d.mario_fire_runB === '22x27' && d.mario_fire_runC === '22x27');
  ck('T1_fire_crouch', d.mario_fire_crouch === '22x24');
  ck('T1_mushroom', d.mushroom === '16x16');
  ck('T1_1up', d['1up'] === '16x16');
  ck('T1_star', d.star === '14x16');
  ck('T1_fireball', d.fireball === '8x8');
  ck('T1b_nes_small_kept', d.mario_small === '16x18');
  ck('T1b_nes_goomba_kept', d.goomba === '16x18');
  ck('T1b_nes_piranha_kept', d.piranha === '16x25');
  ck('T1b_nes_big_kept', d.mario_big === '16x26');
  ck('T1b_koopa_smm_kept', d.koopa === '16x25');
  const f = await evalJs(FIRE_JS);
  console.log('FIRE:', JSON.stringify(f));
  ck('T2_fire_state', !!(f && f.fireState && f.fireState.fire === true && f.fireState.small === false));
  ck('T2_fire_cream_pixels', !!(f && f.fireScan && f.fireScan.cream >= 20));
  ck('T2_control_nes_brown', !!(f && f.bigScan && f.bigScan.brown >= 10));
  ck('T2_control_no_cream', !!(f && f.bigScan && f.bigScan.cream < 5));
  ck('T3_bullet_fired', !!(f && f.bullets > 0));
  ck('T4_gameplay_move', !!(f && f.moved === true));
  console.log('\n===== R21 结果 =====');
  checks.forEach(c => console.log(' ', c));
  const fails = checks.filter(c => c.startsWith('FAIL'));
  console.log(fails.length === 0 ? 'ALL_PASS ' + checks.length + '/'+ checks.length : 'FAILED ' + fails.length + ': ' + fails.join(' | '));
  ws.close();
  try { execSync(`pkill -f "remote-debugging-port=${PORT}"`); } catch(e){}
  process.exit(fails.length === 0 ? 0 : 1);
}
main().catch(e => { console.error(e); try { execSync(`pkill -f "remote-debugging-port=${PORT}"`); } catch(e2){} process.exit(1); });

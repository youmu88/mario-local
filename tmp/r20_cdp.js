#!/usr/bin/env node
/* R20 CDP 端到端：devicePixelRatio 适配 + 整数倍缩放 snapping
   T1 dpr=1 基线(canvas=dpr×CSS, scale整数) / T2 居中 / T3 画面非空白(截图)
   T4 玩法回归(右移) / T5 窗口变化重算 / T6 dpr=2 / T7 小窗兜底 */
const { execSync, spawn } = require('child_process');
const ROOT = '/Users/wilsonwen/.ai-chatAgent/workspace/45e4d2e4d23a4cdeb17aab17ef59c0fd';
const INDEX = 'file://' + ROOT + '/sprite-mario/index.html';
const PORT = 9226;
const CDP = 'http://127.0.0.1:' + PORT;
try { execSync(`pkill -f "remote-debugging-port=${PORT}"`); } catch(e){}
try { execSync(`rm -rf /tmp/mario20_profile`); } catch(e){}
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', '--disable-gpu', '--no-sandbox',
  `--remote-debugging-port=${PORT}`,
  '--user-data-dir=/tmp/mario20_profile',
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
const STATE_JS = `(()=>{const r=window.__MARIO_DEBUG.renderer,cv=r.canvas;
  return {dpr:window.devicePixelRatio,cw:cv.width,ch:cv.height,iw:window.innerWidth,ih:window.innerHeight,
    scale:r.scale,scaleInt:Number.isInteger(r.scale),offX:r.offX,offY:r.offY,
    offInt:Number.isInteger(r.offX)&&Number.isInteger(r.offY),
    smoothOff:r.ctx.imageSmoothingEnabled===false}})()`;
const PLAY_JS = `(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const out = {};
  try {
  for (let i=0;i<50 && !(window.__MARIO_DEBUG && window.__MARIO_DEBUG.game);i++) await sleep(200);
  if (!(window.__MARIO_DEBUG && window.__MARIO_DEBUG.game)){ out.ERR='MARIO_DEBUG not ready'; return out; }
  const D = window.__MARIO_DEBUG, g = D.game;
  g.startGame({lives:30, startBig:false, startFire:false, invincible:false});
  await sleep(300);
  const p = g.player, x0 = p.x;
  D.input.keys.right = true;
  await sleep(800);
  D.input.keys.right = false;
  out.T4_gameplay = { moved: p.x > x0 + 30, x0: Math.round(x0), x1: Math.round(p.x), state: g.state };
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
  const evalJs = async (expr, awaitP=false) => {
    const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: awaitP, returnByValue: true });
    return r.result && r.result.result && r.result.result.value;
  };
  const checks = [];
  const ck = (name, ok) => { checks.push((ok?'PASS':'FAIL')+' '+name); };

  // T1/T2：dpr=1 基线（override 1280x720 精确视口，避免窗口装饰影响 innerHeight）
  await send('Emulation.setDeviceMetricsOverride', { width:1280, height:720, deviceScaleFactor:1, mobile:false });
  await sleep(300);
  await evalJs(`window.dispatchEvent(new Event('resize'))`);
  await sleep(200);
  const s1 = await evalJs(STATE_JS);
  console.log('S1:', JSON.stringify(s1));
  ck('T1_dpr1_canvas', s1 && s1.cw === Math.round(s1.iw*s1.dpr) && s1.ch === Math.round(s1.ih*s1.dpr));
  ck('T1_scale2', s1 && s1.scale === 2);
  ck('T1_scale_int', s1 && s1.scaleInt === true);
  ck('T1_off_int', s1 && s1.offInt === true && s1.offX >= 0 && s1.offY >= 0);
  ck('T1_smoothing_off', s1 && s1.smoothOff === true);
  ck('T2_center', s1 && Math.abs(2*s1.offX + 640*s1.scale - s1.cw) <= 1 && Math.abs(2*s1.offY + 360*s1.scale - s1.ch) <= 1);

  // T4：玩法回归（开始游戏+右移）
  const s4 = await evalJs(PLAY_JS, true);
  console.log('S4:', JSON.stringify(s4));
  ck('T4_moved', s4 && s4.T4_gameplay && s4.T4_gameplay.moved === true);
  ck('NO_ERR', s4 && !s4.ERR);

  // T3：游戏画面截图非空白（overlay 已隐藏，canvas 可见）
  await sleep(400);
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  const bytes = shot.result && shot.result.data ? shot.result.data.length : 0;
  console.log('SHOT_BASE64_LEN:', bytes);
  ck('T3_not_blank', bytes > 8000);

  // T5：窗口变为 1024x768(dpr=1) → scale=1, offX=192, offY=204
  await send('Emulation.setDeviceMetricsOverride', { width:1024, height:768, deviceScaleFactor:1, mobile:false });
  await sleep(300);
  await evalJs(`window.dispatchEvent(new Event('resize'))`);
  await sleep(200);
  const s5 = await evalJs(STATE_JS);
  console.log('S5:', JSON.stringify(s5));
  ck('T5_resize_1024', s5 && s5.cw===1024 && s5.ch===768 && s5.scale===1 && s5.scaleInt && s5.offX===192 && s5.offY===204);

  // T6：dpr=2 → canvas 1600x900, scale=2, offX=160, offY=90
  await send('Emulation.setDeviceMetricsOverride', { width:800, height:450, deviceScaleFactor:2, mobile:false });
  await sleep(300);
  await evalJs(`window.dispatchEvent(new Event('resize'))`);
  await sleep(200);
  const s6 = await evalJs(STATE_JS);
  console.log('S6:', JSON.stringify(s6));
  ck('T6_dpr2', s6 && s6.dpr===2 && s6.cw===1600 && s6.ch===900 && s6.scale===2 && s6.scaleInt && s6.offX===160 && s6.offY===90);

  // T7：小窗 500x300 兜底（fit<1 等比缩小，scale>0 不归零）
  await send('Emulation.setDeviceMetricsOverride', { width:500, height:300, deviceScaleFactor:1, mobile:false });
  await sleep(300);
  await evalJs(`window.dispatchEvent(new Event('resize'))`);
  await sleep(200);
  const s7 = await evalJs(STATE_JS);
  console.log('S7:', JSON.stringify(s7));
  ck('T7_smallwin', s7 && s7.cw===500 && s7.ch===300 && s7.scale>0 && s7.scale<1);

  await send('Emulation.clearDeviceMetricsOverride');
  console.log(checks.join('\n'));
  console.log(checks.every(c=>c.startsWith('PASS')) && checks.length>0 ? 'ALL_PASS' : 'SOME_FAIL');
  ws.close(); chrome.kill(); process.exit(0);
}
main().catch(e => { console.error('ERR', e.message); chrome.kill(); process.exit(1); });

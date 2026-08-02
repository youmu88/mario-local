#!/usr/bin/env node
/* R22 像素锐利度回归（固化版 v2：runs 整数倍为主证）
   背景：v1.11.0- 精灵绘制浮点矩形+非整数倍源像素缩放 → 3/5px 混排(用户感知"模糊")
   v1.12.0 修复：drawSprite 整数倍源像素吸附+设备网格量化(底部锚定)、draw/drawPlayer camX 量化
   主证指标：精灵躯干行同色 run 长度必须全为吸附倍数 n=round(scale*逻辑高/源高) 的整数倍
            （修复前 [29,39,30] 混排 vs 修复后 [20,10,40,10,20] 全 10 倍数，区分度完美）
   注意：gradPct(d<=60) 会误伤素材内部相近色阶梯/天空渐变dithering/HUD文字AA，仅作小窗软指标
   T1 dpr2环境/canvas适配/scale整数  T2 静止 runs 全 n 倍数  T3 移动 runs 全 n 倍数(无敌防闪烁)
   T4 小窗600x340真触发scale<1浮点兜底+游戏可玩+coreGrad<2 */
const { execSync, spawn } = require('child_process');
const ROOT = '/Users/wilsonwen/.ai-chatAgent/workspace/45e4d2e4d23a4cdeb17aab17ef59c0fd';
const INDEX = 'file://' + ROOT + '/sprite-mario/index.html';
const PORT = 9228;
const CDP = 'http://127.0.0.1:' + PORT;
try { execSync(`pkill -f "remote-debugging-port=${PORT}"`); } catch(e){}
try { execSync(`rm -rf /tmp/mario22t_profile`); } catch(e){}
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--disable-web-security', '--allow-file-access-from-files',
  `--remote-debugging-port=${PORT}`,
  '--user-data-dir=/tmp/mario22t_profile',
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
const SCAN_JS = `(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const out = {};
  try {
    const D = window.__MARIO_DEBUG;
    for (let i=0;i<60 && !(D && D.game && D.game.player && window.__SPRITES && window.__SPRITES.mario_big); i++) await sleep(200);
    const r = D.renderer, g = D.game, S = window.__SPRITES;
    // 精灵躯干中段一行同色 run（内缩避开手臂/边缘与背景）
    const runsOf = () => {
      const p = g.player, camQ = Math.round(g.world.camX * r.scale) / r.scale;
      const sx = Math.round((p.x - camQ) * r.scale + r.offX), sy = Math.round(p.y * r.scale + r.offY);
      const w = Math.round(p.w * r.scale), h = Math.round(p.h * r.scale);
      const y = Math.round(sy + h * 0.5), x0 = Math.round(sx + w * 0.25), x1 = Math.round(sx + w * 0.75);
      const img = r.ctx.getImageData(x0, y, Math.max(x1 - x0, 2), 1).data;
      const runs = []; let last = -1, len = 0;
      for (let i = 0; i < img.length; i += 4) {
        const key = img[i] * 65536 + img[i+1] * 256 + img[i+2];
        if (key === last) len++; else { if (last >= 0) runs.push(len); last = key; len = 1; }
      }
      runs.push(len);
      return runs.slice(0, 16);
    };
    const coreGrad = () => {
      const p = g.player, camQ = Math.round(g.world.camX * r.scale) / r.scale;
      const sx = Math.round((p.x - camQ) * r.scale + r.offX), sy = Math.round(p.y * r.scale + r.offY);
      const w = Math.round(p.w * r.scale), h = Math.round(p.h * r.scale);
      const img = r.ctx.getImageData(sx + Math.round(w*0.25), sy + Math.round(h*0.2), Math.max(Math.round(w*0.5),4), Math.max(Math.round(h*0.6),4)).data;
      let grad = 0, tot = 0;
      const W = Math.max(Math.round(w*0.5),4);
      for (let i = 0; i + 7 < img.length; i += 4) {
        if ((i/4+1) % W === 0) continue;
        if (img[i+3] < 200 || img[i+7] < 200) continue;
        const d = Math.abs(img[i]-img[i+4]) + Math.abs(img[i+1]-img[i+5]) + Math.abs(img[i+2]-img[i+6]);
        if (d > 0 && d <= 60) grad++;
        tot++;
      }
      return tot ? +(100 * grad / tot).toFixed(2) : 0;
    };
    g.startGame({ lives: 30, startBig: true, startFire: false, invincible: true });  // 无敌：防受伤闪烁alpha混合污染
    await sleep(900);
    out.env = { dpr: window.devicePixelRatio, canvasW: r.canvas.width, canvasH: r.canvas.height, scale: r.scale };
    out.n = Math.max(1, Math.round(g.player.h * r.scale / S.mario_big.height));
    out.stillRuns = runsOf();
    out.stillGrad = coreGrad();
    const x0 = g.player.x;
    D.input.keys.right = true; await sleep(700); D.input.keys.right = false; await sleep(120);
    out.moved = g.player.x > x0 + 30;
    out.movedRuns = runsOf();
    out.movedGrad = coreGrad();
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
  // 中段 runs（排除首尾=扫描窗截断/背景过渡）必须全为 n 的整数倍
  const midOk = (runs, n) => {
    const mid = runs.slice(1, -1).filter(v => v > 0);
    return mid.length >= 2 && mid.every(v => v % n === 0);
  };
  // 场景1：Retina 整数倍（主场景）
  await send('Emulation.setDeviceMetricsOverride', { width:1280, height:720, deviceScaleFactor:2, mobile:false });
  await sleep(400);
  const a = await evalJs(SCAN_JS);
  console.log('SCAN(dsf=2):', JSON.stringify(a));
  ck('T1_dpr2_recognized', !!(a && a.env && a.env.dpr === 2));
  ck('T1_canvas_dpr_fit', !!(a && a.env && a.env.canvasW === 2560 && a.env.canvasH === 1440));
  ck('T1_scale_integer', !!(a && a.env && Number.isInteger(a.env.scale)));
  ck('T2_still_runs_n_multiple', !!(a && midOk(a.stillRuns || [], a.n || 1)));
  ck('T3_moved_runs_n_multiple', !!(a && a.moved && midOk(a.movedRuns || [], a.n || 1)));
  // 场景2：600x340 真·小窗浮点兜底（scale<1）
  await send('Emulation.setDeviceMetricsOverride', { width:600, height:340, deviceScaleFactor:1, mobile:false });
  await sleep(400);
  const b = await evalJs(SCAN_JS);
  console.log('SCAN(small):', JSON.stringify(b));
  ck('T4_smallwin_float_scale', !!(b && b.env && b.env.scale < 1));
  ck('T4_smallwin_playable', !!(b && b.state === 'playing' && b.moved));
  ck('T4_smallwin_core_low_grad', !!(b && b.stillGrad < 2 && b.movedGrad < 2));
  console.log('\n===== R22 结果 =====');
  checks.forEach(c => console.log(' ', c));
  const fails = checks.filter(c => c.startsWith('FAIL'));
  console.log(fails.length === 0 ? 'ALL_PASS ' + checks.length + '/'+ checks.length : 'FAILED ' + fails.length + ': ' + fails.join(' | '));
  ws.close();
  try { execSync(`pkill -f "remote-debugging-port=${PORT}"`); } catch(e){}
  process.exit(fails.length === 0 ? 0 : 1);
}
main().catch(e => { console.error(e); try { execSync(`pkill -f "remote-debugging-port=${PORT}"`); } catch(e2){} process.exit(1); });

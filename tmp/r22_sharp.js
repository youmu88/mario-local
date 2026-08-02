#!/usr/bin/env node
/* R22 模糊根因实证：当前 v1.11.0 渲染锐利度像素级审计
   T1 典型窗口(1280x720 dsf=2 模拟Retina)：renderer scale 为整数、canvas=dpr适配
   T2 马里奥区域"渐变像素对"占比 ≈0（锐利=颜色突变，无线性插值过渡色）
   T3 像素块宽均匀性：站立静止时同色 run 长度应≈scale 整数倍（无 3/5px 混排）
   T4 移动中(浮点 camX)块宽均匀性——检验浮点绘制坐标是否致毛糙 */
const { execSync, spawn } = require('child_process');
const ROOT = '/Users/wilsonwen/.ai-chatAgent/workspace/45e4d2e4d23a4cdeb17aab17ef59c0fd';
const INDEX = 'file://' + ROOT + '/sprite-mario/index.html';
const PORT = 9228;
const CDP = 'http://127.0.0.1:' + PORT;
try { execSync(`pkill -f "remote-debugging-port=${PORT}"`); } catch(e){}
try { execSync(`rm -rf /tmp/mario22_profile`); } catch(e){}
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--disable-web-security', '--allow-file-access-from-files',
  `--remote-debugging-port=${PORT}`,
  '--user-data-dir=/tmp/mario22_profile',
  '--window-size=1280,720',
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
/* 在页面内执行的锐利度审计：返回 renderer 状态 + 马里奥区域像素统计 */
const AUDIT_JS = `(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const out = {};
  try {
    for (let i=0;i<60 && !(window.__MARIO_DEBUG && window.__MARIO_DEBUG.game); i++) await sleep(200);
    const D = window.__MARIO_DEBUG, r = D.renderer, g = D.game;
    out.env = {
      dpr: window.devicePixelRatio,
      canvasW: r.canvas.width, canvasH: r.canvas.height,
      scale: r.scale, offX: r.offX, offY: r.offY,
      scaleIsInt: Number.isInteger(r.scale)
    };
    // 开局（大马里奥站立静止）
    g.startGame({ lives: 30, startBig: true, startFire: false, invincible: true });
    await sleep(900);
    const p = g.player;
    // 玩家精灵在 canvas 上的实际矩形
    const sx = Math.round((p.x - g.world.camX) * r.scale + r.offX);
    const sy = Math.round(p.y * r.scale + r.offY);
    const w = Math.round(p.w * r.scale), h = Math.round(p.h * r.scale);
    out.playerRect = { sx, sy, w, h, camX: g.world.camX };
    const img = r.ctx.getImageData(sx, sy, w, h).data;
    // 水平相邻像素对分类：same(完全相同) / jump(突变>60) / grad(渐变 1~60)
    let same=0, jump=0, grad=0;
    for (let y=0; y<h; y++){
      for (let x=0; x<w-1; x++){
        const i=(y*w+x)*4, j=(y*w+x+1)*4;
        const d = Math.abs(img[i]-img[j]) + Math.abs(img[i+1]-img[j+1]) + Math.abs(img[i+2]-img[j+2]) + Math.abs(img[i+3]-img[j+3]);
        if (d===0) same++; else if (d>60) jump++; else grad++;
      }
    }
    const total = same+jump+grad;
    out.sharp = { same, jump, grad, gradPct: +(100*grad/total).toFixed(2) };
    // 块宽均匀性：取躯干中轴行，统计同色 run 长度（剔除透明背景段）
    const midY = Math.floor(h*0.55);
    const runs = [];
    let last=null, len=0;
    for (let x=0; x<w; x++){
      const i=(midY*w+x)*4;
      const key = img[i+3]<200 ? 'T' : (img[i]+','+img[i+1]+','+img[i+2]);
      if (key===last) len++;
      else { if (last!==null && last!=='T') runs.push(len); last=key; len=1; }
    }
    if (last!==null && last!=='T') runs.push(len);
    out.stillRuns = runs.filter(n=>n>=1);
    // T4：向右移动 0.35s（camX 变浮点），再测一次
    D.input.keys.right = true;
    await sleep(350);
    D.input.keys.right = false;
    await sleep(50);
    out.camX_moved = g.world.camX;
    const p2 = g.player;
    const sx2 = Math.round((p2.x - g.world.camX) * r.scale + r.offX);
    const sy2 = Math.round(p2.y * r.scale + r.offY);
    const img2 = r.ctx.getImageData(sx2, sy2, w, h).data;
    const midY2 = Math.floor(h*0.55);
    const runs2 = [];
    last=null; len=0;
    for (let x=0; x<w; x++){
      const i=(midY2*w+x)*4;
      const key = img2[i+3]<200 ? 'T' : (img2[i]+','+img2[i+1]+','+img2[i+2]);
      if (key===last) len++;
      else { if (last!==null && last!=='T') runs2.push(len); last=key; len=1; }
    }
    if (last!==null && last!=='T') runs2.push(len);
    out.movedRuns = runs2.filter(n=>n>=1);
    // 移动态渐变数
    let same2=0, jump2=0, grad2=0;
    for (let y=0; y<h; y++){
      for (let x=0; x<w-1; x++){
        const i=(y*w+x)*4, j=(y*w+x+1)*4;
        const d = Math.abs(img2[i]-img2[j]) + Math.abs(img2[i+1]-img2[j+1]) + Math.abs(img2[i+2]-img2[j+2]) + Math.abs(img2[i+3]-img2[j+3]);
        if (d===0) same2++; else if (d>60) jump2++; else grad2++;
      }
    }
    out.sharpMoved = { gradPct: +(100*grad2/(same2+jump2+grad2)).toFixed(2) };
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
  // Retina 模拟：dsf=2
  await send('Emulation.setDeviceMetricsOverride', { width:1280, height:720, deviceScaleFactor:2, mobile:false });
  await sleep(500);
  const a = await evalJs(AUDIT_JS);
  console.log('AUDIT(dsf=2):', JSON.stringify(a, null, 1));
  if (a && a.ERR) { console.log('ERR:', a.ERR); }
  ck('T1_dpr2_recognized', !!(a && a.env && a.env.dpr === 2));
  ck('T1_canvas_dpr_fit', !!(a && a.env && a.env.canvasW === 2560 && a.env.canvasH === 1440));
  ck('T1_scale_integer', !!(a && a.env && a.env.scaleIsInt === true && a.env.scale === 4));
  ck('T2_still_sharp_gradPct<1', !!(a && a.sharp && a.sharp.gradPct < 1));
  // 块宽均匀：静止时 run 长度全部 ∈ {scale-0, scale, scale 的倍数附近}，无 ±1 抖动
  const runOk = (runs, s) => runs && runs.length>0 && runs.every(n => n % s === 0 || (n>=s-1 && n<=s+1));
  ck('T3_still_runs_uniform', runOk(a && a.stillRuns, 4));
  ck('T4_moved_gradPct<1', !!(a && a.sharpMoved && a.sharpMoved.gradPct < 1));
  const mv = a && a.movedRuns;
  ck('T4_moved_runs_uniform', runOk(mv, 4));
  console.log('\n===== R22 结果 =====');
  checks.forEach(c => console.log(' ', c));
  const fails = checks.filter(c => c.startsWith('FAIL'));
  console.log(fails.length === 0 ? 'ALL_PASS ' + checks.length + '/'+ checks.length : 'FAILED ' + fails.length + ': ' + fails.join(' | '));
  ws.close();
  try { execSync(`pkill -f "remote-debugging-port=${PORT}"`); } catch(e){}
  process.exit(fails.length === 0 ? 0 : 1);
}
main().catch(e => { console.error(e); try { execSync(`pkill -f "remote-debugging-port=${PORT}"`); } catch(e2){} process.exit(1); });

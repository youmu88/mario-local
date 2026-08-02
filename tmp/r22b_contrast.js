#!/usr/bin/env node
/* R22b 对照：grad 在精灵还是背景AA？A=顶部天空 B=马里奥核心 C=全游戏区 */
const { execSync, spawn } = require('child_process');
const ROOT = '/Users/wilsonwen/.ai-chatAgent/workspace/45e4d2e4d23a4cdeb17aab17ef59c0fd';
const PORT = 9229, CDP = 'http://127.0.0.1:' + PORT;
try { execSync(`pkill -f "remote-debugging-port=${PORT}"`); } catch(e){}
try { execSync(`rm -rf /tmp/mario22b_profile`); } catch(e){}
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new','--disable-gpu','--no-sandbox','--disable-web-security','--allow-file-access-from-files',
  `--remote-debugging-port=${PORT}`,'--user-data-dir=/tmp/mario22b_profile','--window-size=800,450',
  'file://' + ROOT + '/sprite-mario/index.html'
], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function main(){
  let target = null;
  for (let i=0;i<60;i++){
    try { const l = await (await fetch(CDP+'/json/list')).json(); target = l.find(t=>t.type==='page'); if (target) break; } catch(e){}
    await sleep(250);
  }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id=0; const pend={};
  ws.onmessage = ev => { const m=JSON.parse(ev.data); if (m.id&&pend[m.id]){pend[m.id].resolve(m);delete pend[m.id];} };
  await new Promise(r=>ws.onopen=r);
  const evl = async ex => (await new Promise(res=>{const i=++id;pend[i]={resolve:res};ws.send(JSON.stringify({id:i,method:'Runtime.evaluate',params:{expression:ex,awaitPromise:true,returnByValue:true}}));})).result.result.value;
  await sleep(1500);
  const out = await evl(`(async()=>{
    const s=ms=>new Promise(r=>setTimeout(r,ms));
    for(let i=0;i<60&&!(window.__MARIO_DEBUG&&window.__MARIO_DEBUG.game);i++)await s(200);
    const D=window.__MARIO_DEBUG,r=D.renderer,g=D.game;
    g.startGame({lives:30,startBig:true,startFire:false,invincible:false});
    await s(800);
    const gp=(x,y,w,h)=>{const d=r.ctx.getImageData(x,y,w,h).data;let t=0,gr=0;
      for(let row=0;row<h;row++)for(let col=0;col<w-1;col++){const i=(row*w+col)*4,j=i+4;
        if(d[i+3]<200)continue;const df=Math.abs(d[i]-d[j])+Math.abs(d[i+1]-d[j+1])+Math.abs(d[i+2]-d[j+2]);
        t++;if(df>0&&df<=60)gr++;}
      return t?+(100*gr/t).toFixed(2):0;};
    const sc=r.scale,p=g.player,cam=Math.round(g.world.camX*sc)/sc;
    const A=gp(r.canvas.width/2-80,8,160,60);
    const cx=Math.round((p.x-cam)*sc+r.offX),cy=Math.round(p.y*sc+r.offY);
    const cw2=Math.round(p.w*sc*0.4),ch2=Math.round(p.h*sc*0.4);
    const B=gp(cx+(p.w*sc-cw2)/2|0,cy+(p.h*sc-ch2)/2|0,cw2,ch2);
    const C=gp(r.offX,r.offY,640*sc,360*sc);
    return {A_sky:A,B_marioCore:B,C_full:C,scale:sc};
  })()`);
  console.log('CONTRAST:', JSON.stringify(out));
  ws.close(); try{execSync(`pkill -f "remote-debugging-port=${PORT}"`);}catch(e){}
  process.exit(0);
}
main().catch(e=>{console.error(e);try{execSync(`pkill -f "remote-debugging-port=${PORT}"`);}catch(e2){}process.exit(1);});

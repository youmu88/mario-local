/* ===== UI：菜单/配置/结算 ===== */
import { StartConfig, saveStartConfig } from './config.js';

export class UI {
  constructor(onStart, onRetry){
    this.onStart = onStart;
    this.onRetry = onRetry;
    this.overlay = document.getElementById('overlay');
    this.hudEl = null;
    this.screens = {};
    window._ui = this;
  }

  mount(){
    this.overlay.innerHTML = '';
    this.showMenu();
  }

  scr(cls){
    const d = document.createElement('div');
    d.className = 'screen ' + cls;
    return d;
  }

  /* ===== 开始菜单 + 配置 ===== */
  showMenu(){
    document.getElementById('touch-controls').classList.add('hidden');
    const s = this.scr('menu');
    s.innerHTML = `
      <div class="title">SUPER MARIO</div>
      <div class="subtitle">▶ 无限随机闯关 · 高精度经典还原 ◀</div>
      <div class="config-box">
        <div class="config-row">
          <div class="config-label">命数<small>初始生命数量</small></div>
          <div class="seg" data-cfg="lives">
            <button class="seg-btn ${StartConfig.lives===3?'active':''}" data-v="3">3 命</button>
            <button class="seg-btn ${StartConfig.lives===30?'active':''}" data-v="30">30 命</button>
          </div>
        </div>
        <div class="config-row">
          <div class="config-label">开局大小<small>大号=已吃蘑菇</small></div>
          <div class="seg" data-cfg="startBig">
            <button class="seg-btn ${!StartConfig.startBig?'active':''}" data-v="false">小马里奥</button>
            <button class="seg-btn ${StartConfig.startBig?'active':''}" data-v="true">大马里奥</button>
          </div>
        </div>
        <div class="config-row">
          <div class="config-label">默认子弹<small>开局即可发射火球(仅大号)</small></div>
          <div class="seg" data-cfg="startFire">
            <button class="seg-btn ${!StartConfig.startFire?'active':''}" data-v="false">无</button>
            <button class="seg-btn ${StartConfig.startFire?'active':''}" data-v="true">带子弹</button>
          </div>
        </div>
        <div class="config-row">
          <div class="config-label">无敌<small>不受任何伤害</small></div>
          <div class="seg" data-cfg="invincible">
            <button class="seg-btn ${!StartConfig.invincible?'active':''}" data-v="false">关</button>
            <button class="seg-btn ${StartConfig.invincible?'active':''}" data-v="true">开</button>
          </div>
        </div>
      </div>
      <button class="primary-btn" id="btn-start">▶ 开始游戏</button>
      <div class="status-line"></div>
    `;
    this.overlay.appendChild(s);
    // 配置切换
    s.querySelectorAll('.seg').forEach(seg => {
      seg.querySelectorAll('.seg-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const key = seg.dataset.cfg;
          const v = btn.dataset.v==='true'?true:(btn.dataset.v==='false'?false:Number(btn.dataset.v));
          StartConfig[key] = v;
          seg.querySelectorAll('.seg-btn').forEach(b=>b.classList.remove('active'));
          btn.classList.add('active');
          saveStartConfig();
        });
      });
    });
    s.querySelector('#btn-start').addEventListener('click', () => this.onStart({...StartConfig}));
  }

  /* ===== 结算/死亡/游戏结束 ===== */
  showResult(type, game){
    document.getElementById('touch-controls').classList.remove('hidden');
    const s = this.scr('result');
    let title='', msg='', btnText='';
    if (type==='gameover'){ title='GAME OVER'; msg='再接再厉'; btnText='回到主菜单'; }
    else if (type==='clear'){ title='COURSE CLEAR!'; msg=`本关得分 ${game.score}`; btnText='继续下一关'; }
    else { title=''; msg=''; btnText='点击重试'; }
    s.innerHTML = `
      <div class="title" style="font-size:34px">${title}</div>
      <div class="status-line">${msg}</div>
      <button class="primary-btn red">${btnText}</button>
      <div class="loading"></div>
    `;
    this.overlay.appendChild(s);
    const btn = s.querySelector('.primary-btn');
    if (type==='gameover') btn.addEventListener('click', ()=>this.showMenu());
    else btn.addEventListener('click', ()=>this.onRetry());
    // clear 界面：按钮显示自动跳关倒计时（可点击立即进入下一关；倒计时结束 game 自动跳关）
    if (type==='clear'){
      const upd = ()=>{
        const r = game.clearRemain || 0;
        btn.textContent = `${btnText} (${r})`;
        if (r<=0){ clearInterval(this.clearTimer); this.clearTimer=null; }
      };
      upd();
      this.clearTimer = setInterval(upd, 500);
      setTimeout(()=>{ document.getElementById('touch-controls').classList.remove('hidden'); }, 400);
    }
  }

  /* 返回菜单时清理覆盖层 */
  hideAll(){
    if (this.clearTimer){ clearInterval(this.clearTimer); this.clearTimer=null; }
    this.overlay.innerHTML = '';
  }
}

/* ===== 输入管理：键盘 + 触屏虚拟按键 ===== */
class Input {
  constructor() {
    this.keys = { left:false, right:false, jump:false, run:false, fire:false, down:false };
    this.jumpPressed = false;   // 跳跃按下沿(供跳跃缓冲)
    this.firePressed = false;
    this.onTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    this.touchBtn = {};
    this._bind();
  }

  _bind() {
    window.addEventListener('keydown', e => this._key(e, true));
    window.addEventListener('keyup', e => this._key(e, false));
    // 触屏按钮
    if (this.onTouchDevice) {
      document.querySelectorAll('.tbtn').forEach(btn => {
        const k = btn.dataset.key;
        const press = (v) => {
          this.keys[k] = v;
          if (v && k === 'jump') this.jumpPressed = true;
          if (v && k === 'fire') this.firePressed = true;
          if (v && this.handler) this.handler('touch', k);
        };
        btn.addEventListener('touchstart', e => { e.preventDefault(); press(true); btn.classList.add('active'); }, {passive:false});
        btn.addEventListener('touchend', e => { e.preventDefault(); press(false); btn.classList.remove('active'); }, {passive:false});
        btn.addEventListener('touchcancel', e => { press(false); btn.classList.remove('active'); });
        btn.addEventListener('mousedown', e => { e.preventDefault(); press(true); btn.classList.add('active'); });
        btn.addEventListener('mouseup', e => { press(false); btn.classList.remove('active'); });
        btn.addEventListener('mouseleave', e => { press(false); btn.classList.remove('active'); });
      });
    } else {
      document.getElementById('touch-controls').classList.add('hidden');
    }
  }

  _key(e, down) {
    const map = {
      'ArrowLeft':'left','a':'left','A':'left',
      'ArrowRight':'right','d':'right','D':'right',
      'ArrowUp':'jump','w':'jump','W':'jump',' ':'jump',' ': 'jump',
      'ArrowDown':'down','s':'down','S':'down',
      'Shift':'run','x':'fire','X':'fire','Enter':'jump'
    };
    const k = map[e.key];
    if (!k) return;
    e.preventDefault();
    // 空间/箭头 不重复触发
    if (this.keys[k] === down) {
      // jump 仍要捕获按下沿
      if (down && k === 'jump') this.jumpPressed = true;
      return;
    }
    this.keys[k] = down;
    if (down && k === 'jump') this.jumpPressed = true;
    if (down && k === 'fire') this.firePressed = true;
  }

  // 消费沿信号
  consumeJump() { const v = this.jumpPressed; this.jumpPressed = false; return v; }
  consumeFire() { const v = this.firePressed; this.firePressed = false; return v; }
  reset() {
    for (const k in this.keys) this.keys[k] = false;
    this.jumpPressed = false;
    this.firePressed = false;
  }
}

export { Input };

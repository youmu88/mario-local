/* ===== 程序化音效 Web Audio ===== */
class AudioFX {
  constructor(){
    this.ctx = null;
    this.enabled = true;
    this._init();
  }
  _init(){
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){ this.enabled=false; }
  }
  resume(){
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }
  _tone(freq, dur, type='square', vol=0.15, slideTo=null){
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }
  jump(){ this._tone(330, 0.18, 'square', 0.1, 660); }
  coin(){ this._tone(988, 0.09,'square',0.12); setTimeout(()=>this._tone(1319,0.25,'square',0.12),80); }
  stomp(){ this._tone(200, 0.12, 'triangle', 0.18, 80); }
  hurt(){ this._tone(400, 0.3, 'sawtooth', 0.12, 120); }
  powerup(){ [660,880,1100,1320].forEach((f,i)=>setTimeout(()=>this._tone(f,0.08,'square',0.1),i*90)); }
  fire(){ this._tone(1400, 0.15, 'square', 0.08, 400); }
  bump(){ this._tone(140, 0.1, 'square', 0.12); }
  die(){ [400,300,200,120].forEach((f,i)=>setTimeout(()=>this._tone(f,0.15,'sawtooth',0.12),i*140)); }
  flag(){ this._tone(523,0.1,'square',0.1); setTimeout(()=>this._tone(659,0.1,'square',0.1),110); setTimeout(()=>this._tone(784,0.25,'square',0.12),220); }
  clear(){ [523,523,523,659,784,659,1046].forEach((f,i)=>setTimeout(()=>this._tone(f,0.12,'square',0.13),i*120)); }
}

export { AudioFX };

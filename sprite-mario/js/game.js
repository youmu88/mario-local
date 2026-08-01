/* ===== 游戏主状态机 ===== */
import { World } from './level.js';
import { Player } from './player.js';
import { aabb } from './physics.js';
import { SPRITES } from './sprites.js';
import { TILE } from './physics.js';
import { StartConfig } from './config.js';
import { PowerUp } from './entities.js';

export class Game {
  constructor(renderer, input, sfx, onStateChange){
    this.renderer = renderer;
    this.input = input;
    this.sfx = sfx;
    this.onStateChange = onStateChange;
    this.state = 'menu';      // menu | playing | dying | clear | gameover
    this.levelNo = 1;
    this.lives = StartConfig.lives;
    this.score = 0;
    this.world = null;
    this.player = null;
    this.clearT = 0;
    this.timer = 0;
    this.starMario = StartConfig.invincible;
  }

  startGame(cfg){
    this.lives = cfg.lives;
    this.score = 0;
    this.levelNo = 1;
    this.startLevel(cfg);
  }

  startLevel(cfg){
    if (this.lives <= 0 && !cfg){ this.gameOver(); return; }
    this.cfg = cfg || this.cfg || { lives:this.lives, startBig:StartConfig.startBig, startFire:StartConfig.startFire, invincible:StartConfig.invincible };
    // 保存当前玩家大小/火球状态（复活时保留），仅当是同关复活时
    const respawn = cfg && cfg.respawn;
    const keepBig = respawn && this.player ? !this.player.small : this.cfg.startBig;
    const keepFire = respawn && this.player ? this.player.fire : this.cfg.startFire;
    const seed = (respawn && this.world) ? this.world.seed : null;  // 复活用同一seed保持同关
    this.world = new World(this.levelNo, seed, this.cfg);
    this.world.score = this.score;
    this.player = new Player(this.world, { startBig: keepBig, startFire: keepFire, invincible: this.cfg.invincible });
    this.player.score = this.score;
    this.player.lives = this.lives;
    this.state = 'playing';
    this.timer = 0;
    this.clearT = 0;
    this.onStateChange && this.onStateChange('playing', this);
  }

  update(dt){
    if (this.state==='menu') return;
    if (this.state==='playing' || this.state==='clear'){
      this.timer += dt;
      // 时间限制
      this.world.time = Math.max(0, 300 - Math.floor(this.timer));
      this.updateWorld();
      this.updatePlayer();
      this.checkCollisions();
      this.updateCamera();
      // 分数同步
      this.score = this.player.score;
    } else if (this.state==='dying'){
      this.updatePlayer();
      if (!this.player.alive){
        this.lives--;
        if (this.lives<=0){ this.state='gameover'; this.onStateChange('gameover', this); }
        else { this.state='clear'; this.clearT=0; this.startLevel({...this.cfg, lives:this.lives, respawn:true}); }
      }
    }
  }

  updateWorld(){
    const w = this.world;
    // 道具
    for (const p of w.powerups){ if (p.alive) p.update(w); }
    // 敌人
    for (const e of w.enemies){ if (e.alive) e.update(w); }
    // 子弹
    for (const b of w.bullets){ if (b.alive) b.update(w); }
    // 金币/碎砖动画
    for (const c of w.coinFx) c.t--;
    for (const s of w.smashed){ s.t--; if (s.t<=0 && !s.bump) s.bump=true; } // 简化
    // 回收
    w.powerups = w.powerups.filter(p=>p.alive);
    w.enemies = w.enemies.filter(e=>e.alive || e.deadT>0);
    w.bullets = w.bullets.filter(b=>b.alive);
  }

  updatePlayer(){
    if (!this.player.alive && this.state==='playing'){ this.state='dying'; this.onStateChange('dying', this); return; }
    if (this.player.alive && this.state==='playing') this.player.update(this.input, this.sfx);
    else if (this.state==='dying') this.player.update(this.input, this.sfx);
  }

  checkCollisions(){
    const w = this.world, p = this.player;
    if (!p.alive || this.state!=='playing') return;
    const pa = {x:p.x,y:p.y,w:p.w,h:p.h};
    // 与道具
    for (const pu of w.powerups){
      if (!pu.alive) continue;
      if (aabb(pa, pu)){
        pu.alive=false;
        this.applyPower(pu.type);
      }
    }
    // 与敌人
    for (const e of w.enemies){
      if (!e.alive || e.dead) continue;
      const ebox = {x:e.x,y:e.y,w:e.w,h:e.h};
      if (!aabb(pa, ebox)) continue;
      // 踩踏判断(下落且脚在敌上方)
      const stomping = p.vy>0 && (p.y + p.h - e.y) < 14;
      if (stomping){
        this.stomp(e);
      } else {
        // 被碰
        if (p.starT<=0 && p.hurtFlashT<=0){
          this.hurtPlayer();
        }
      }
    }
    // 子弹击杀敌人(火球可消灭板栗与乌龟，+100分)
    for (const b of w.bullets){
      if (!b.alive) continue;
      for (const e of w.enemies){
        if (!e.alive || e.dead) continue;
        const ebox = {x:e.x,y:e.y,w:e.w,h:e.h};
        if (aabb(b, ebox) && this.killEnemyByBullet(b)){
          e.dead=true; e.deadT=20; e.vx=0;
          this.addScore(100);
          this.sfx.stomp();
          break;
        }
      }
    }
    // 到达旗杆
    if (!w.flagReached && p.x + p.w >= w.flagX*TILE + 8){
      this.reachFlag();
    }
  }

  // 子弹命中敌人：返回 true 表示命中并消耗该子弹
  killEnemyByBullet(b){
    if (b.hitFrames !== undefined) return false;
    b.alive = false;      // 触敌即消散(经典火球命中敌人消失)
    return true;
  }

  stomp(e){
    const w=this.world;
    const s=this.sfx;
    if (e.type==='goomba'){ e.dead=true; e.deadT=30; this.player.vy = -6; this.addScore(100); s.stomp(); }
    else {
      // koopa 踩成壳
      if (e.shell){ /* 已在壳上，踢 */ e.kicked=true; e.kickVX = this.player.dir*6; this.addScore(200); }
      else { e.shell=true; e.dead=false; this.player.vy=-6; this.addScore(100); s.stomp(); }
      this.player.vy = -7;
    }
  }

  hurtPlayer(){
    const p = this.player;
    if (p.hurtFlashT>0 || p.starT>0) return;  // 无敌期(星星)或受伤闪烁期不再受伤
    p.hurtFlashT=80;
    p.damage();   // 大变小 / 小死亡
    this.sfx.hurt();
    if (!p.alive){ this.sfx.die(); p.startDying(); this.state='dying'; }
  }

  applyPower(type){
    const p=this.player;
    if (type==='coin'){ p.coins++; p.score+=100; this.sfx.coin(); return; }
    if (type==='1up'){ this.lives++; this.addScore(1000); this.onStateChange('hud', this); this.sfx.clear(); return; }
    if (type==='mushroom'){ if (p.small){ p.small=false; p.setSize(); } p.score+=1000; this.sfx.powerup(); this.onStateChange('hud', this); return; }
    if (type==='flower'){ p.fire=true; p.small=false; p.setSize(); p.score+=1000; this.sfx.powerup(); this.onStateChange('hud', this); return; }
    if (type==='star'){ p.starT=9999; p.invincible=true; this.starMario=true; this.sfx.powerup(); return; }
  }

  addScore(n){ this.player.score += n; this.onStateChange('hud', this); }

  reachFlag(){
    if (this.world.flagReached) return;
    this.world.flagReached = true;
    this.sfx.flag();
    this.addScore(1000);
    this.state='clear';
    this.clearT=0;
    this.onStateChange('hud', this);
  }

  updateCamera(){
    const w=this.world, p=this.player;
    // 相机跟随(向右)
    w.camTarget = Math.max(w.camTarget, p.x - 200);
    w.camX += (w.camTarget - w.camX)*0.12;
    if (w.camX < -60) w.camX = -60;
    const maxCam = w.levelW - 640;
    if (w.camX > maxCam) w.camX = maxCam;
  }

  render(){
    const r = this.renderer;
    if (!this.world) { r.drawMenu(); return; }
    r.begin(this.world);
    r.draw(this.world);
    if (this.player && this.player.alive && this.state!=='menu'){
      r.drawPlayer(this.player, this.world.camX, this.state==='dying');
    }
    r.drawHUD(this);
  }

  gameOver(){ this.state='gameover'; this.onStateChange('gameover', this); }
  backToMenu(){ this.state='menu'; this.onStateChange('menu', this); }
}

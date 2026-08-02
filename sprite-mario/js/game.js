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
    const spawnX = (respawn && this.world) ? this.world.checkpointX : null;  // 复活点(像素)：上次激活的检查点
    this.world = new World(this.levelNo, seed, this.cfg);
    this.world.score = this.score;
    this.player = new Player(this.world, { startBig: keepBig, startFire: keepFire, invincible: this.cfg.invincible, spawnX });
    this.world.player = this.player;   // 挂载玩家引用（食人花等需要感知玩家位置）
    this.player.score = this.score;
    this.player.lives = this.lives;
    // 复活：镜头跳到出生点 + 5 秒无敌保护（300帧）
    if (respawn && spawnX!=null){
      this.world.camX = this.world.camTarget = Math.max(-60, spawnX - 200);
      this.player.respawnInvT = 300;
    }
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
      if (this.player.alive) this.world.updateCheckpoint(this.player.x);
      this.checkCollisions();
      this.updateCamera();
      // 分数同步
      this.score = this.player.score;
      if (this.state==='clear') this.updateClear(dt);   // 过关动画 + 自动倒计时跳关
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
    // 敌人（含食人花/尖刺龟/飞行敌人）
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
    if (this.state==='playing' || this.state==='clear') this.player.update(this.input, this.sfx);
    else if (this.state==='dying') this.player.update(this.input, this.sfx);
  }

  checkCollisions(){
    const w = this.world, p = this.player;
    if (!p.alive || this.state!=='playing') return;
    const pa = {x:p.x,y:p.y,w:p.w,h:p.h};
    // 金币满 100 加 1 命（原版规则：100 coins = 1UP）
    if (p.coins >= 100){
      p.coins -= 100;
      this.lives++;
      this.addScore(1000);
      this.sfx.oneup();
      this.onStateChange('hud', this);
    }
    const star = p.starT>0;                                      // 无敌星星：碰到敌人直接消灭（原版行为）
    const inv = star || p.hurtFlashT>0 || p.respawnInvT>0;       // 免伤(星星/受伤闪烁/复活保护)
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
      const ebox = e.type==='piranha' ? e.box : {x:e.x,y:e.y,w:e.w,h:e.h};
      if (!aabb(pa, ebox)) continue;
      if (star){  // 无敌星星：碰到即消灭敌人（含食人花，得 200 分）
        e.dead=true; e.deadT=20; e.vx=0;
        this.addScore(e.type==='piranha' ? 200 : 100); this.sfx.stomp();
        continue;
      }
      const stomping = p.vy>0 && (p.y + p.h - e.y) < 16;
      if (stomping){
        // 可踩：goomba/koopa/flyer；不可踩：piranha(花)/spiny(尖刺，踩踏受伤)
        if (e.type==='piranha' || e.type==='spiny'){
          if (!inv) this.hurtPlayer();
        } else {
          this.stomp(e);
        }
      } else {
        // 侧面碰撞
        if (e.type==='koopa' && e.shell && e.kicked){
          // 被踢出的壳撞到玩家：刚踢出瞬间不伤，之后受伤（原版行为）
          if (e.kickT > 10 && !inv) this.hurtPlayer();
          continue;
        }
        if (!inv) this.hurtPlayer();
      }
    }
    // 踢出的壳击杀其他敌人（撞墙反弹连杀）
    for (const k of w.enemies){
      if (!k.alive || !k.shell || !k.kicked) continue;
      for (const e of w.enemies){
        if (e===k || !e.alive || e.dead || e.shell) continue;
        if (aabb({x:k.x,y:k.y,w:k.w,h:k.h},{x:e.x,y:e.y,w:e.w,h:e.h})){
          e.dead=true; e.deadT=20; e.vx=0;
          this.addScore(200); this.sfx.stomp();
        }
      }
    }
    // 子弹击杀敌人(火球可消灭板栗/乌龟/尖刺/飞行/食人花，+100分)
    for (const b of w.bullets){
      if (!b.alive) continue;
      for (const e of w.enemies){
        if (!e.alive || e.dead) continue;
        const ebox = e.type==='piranha' ? e.box : {x:e.x,y:e.y,w:e.w,h:e.h};
        if (aabb(b, ebox) && this.killEnemyByBullet(b)){
          e.dead=true; e.deadT=20; e.vx=0;
          this.addScore(e.type==='piranha' ? 200 : 100);   // 食人花 200 分（原版）
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

  // 踩踏判定：goomba/flyer 踩扁；koopa 踩成壳/踢壳/停壳；spiny/piranha 不可踩(提前处理)
  stomp(e){
    const w=this.world;
    const s=this.sfx;
    if (e.type==='goomba' || e.type==='flyer'){
      e.dead=true; e.deadT=30; this.player.vy=-6; this.addScore(100); s.stomp();
    } else if (e.type==='koopa'){
      if (e.shell){
        // 已变壳：移动中→踩停；静止→踢出
        if (e.kicked){
          e.kicked=false; e.kickVX=0; this.player.vy=-6; this.addScore(100); s.stomp();
        } else {
          e.kicked=true; e.kickVX=this.player.dir*6; e.kickT=0; this.player.vy=-7; this.addScore(200); s.stomp();
        }
      } else {
        // 踩龟变壳
        e.shell=true; e.dead=false; this.player.vy=-7; this.addScore(100); s.stomp();
      }
    }
  }

  hurtPlayer(){
    const p = this.player;
    if (p.hurtFlashT>0 || p.starT>0 || p.respawnInvT>0) return;  // 无敌期(星星/复活保护)或受伤闪烁期不再受伤
    p.hurtFlashT=80;
    p.damage();   // 大变小 / 小死亡
    this.sfx.hurt();
    if (!p.alive){ this.sfx.die(); p.startDying(); this.state='dying'; }
  }

  applyPower(type){
    const p=this.player;
    if (type==='coin'){ p.coins++; p.score+=100; this.sfx.coin(); return; }
    if (type==='1up'){ this.lives++; this.addScore(1000); this.onStateChange('hud', this); this.sfx.oneup(); return; }
    if (type==='mushroom'){ if (p.small){ p.small=false; p.setSize(); } p.score+=1000; this.sfx.powerup(); this.onStateChange('hud', this); return; }
    if (type==='flower'){ p.fire=true; p.small=false; p.setSize(); p.score+=1000; this.sfx.powerup(); this.onStateChange('hud', this); return; }
    if (type==='star'){ p.starT=9999; p.invincible=true; this.starMario=true; this.sfx.powerup(); return; }
  }

  addScore(n){ this.player.score += n; this.onStateChange('hud', this); }

  reachFlag(){
    if (this.world.flagReached) return;
    this.world.flagReached = true;
    this.sfx.flag();
    const p=this.player;
    // 原版计分：按抓杆高度分档（杆底 100 → 杆顶 5000），抓得越高分越多
    const w=this.world, poleH=6*TILE, base=w.groundY*TILE;
    const grabH=Math.max(0, Math.min(poleH, base-(p.y+p.h)));
    const TIERS=[100,200,400,800,1000,2000,4000,5000];
    this.addScore(TIERS[Math.min(TIERS.length-1, Math.floor(grabH/poleH*TIERS.length))]);
    p.standUp();   // 蹲滑触杆时恢复站姿，对齐滑旗动画
    // 玩家抓旗：x 对齐旗杆左侧，进入滑旗动画；旗子从杆顶滑下
    p.clearMode='slide';
    p.vx=0; p.vy=0; p.dir=-1;                 // 面向旗杆
    p.x = this.world.flagX*TILE + 6;          // 贴杆
    this.world.flagSlide = 0;
    this.state='clear';
    this.clearT=0; this.animDone=false; this.resultT=0;
    // 不再立即弹过关界面：动画完成(走进城堡)后由 updateClear 发出 onStateChange('clear')
  }

  // 过关动画推进：旗子下滑(1.2s) + 玩家滑旗/走城堡；完成后显示 COURSE CLEAR 并自动进入下一关（全程无需点击）
  updateClear(dt){
    const w=this.world, p=this.player;
    this.clearT += dt;
    if (!w.flagDone){ w.flagSlide = Math.min(1, this.clearT/1.2); if (w.flagSlide>=1) w.flagDone=true; }
    if (!this.animDone){
      if (p.cleared){                          // 玩家已走进城堡
        this.animDone = true;
        this.resultT = 0;
        this.sfx.clear();                      // 走进城堡：播放过关旋律
        this.onStateChange('clear', this);     // 显示 COURSE CLEAR（无按钮，自动跳关）
      }
    } else {
      this.resultT += dt;
      if (this.resultT >= 3) this.nextLevel(); // 自动进入下一关（无需点击确认）
    }
  }

  // 剩余自动跳关秒数（供 UI 倒计时文本显示）
  get clearRemain(){ return Math.max(0, Math.ceil(3 - (this.resultT||0))); }

  nextLevel(){
    this.levelNo++;
    this.animDone=false; this.resultT=0;
    if (this.player) this.player.clearMode=null;
    this.startLevel({...this.cfg});
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

/* ===== 全局配置与开局配置 ===== */
const CFG = {
  // 逻辑分辨率（固定像素，物理恒定）
  VIEW_W: 640,
  VIEW_H: 360,
  // 像素块尺寸
  TILE: 32,
  GRAVITY: 0.55,        // 重力
  MAX_FALL: 14,
  RUN_SPEED: 1.8,       // 基础跑速（更慢，经典手感）
  DASH_SPEED: 3.0,      // 冲刺
  JUMP_VEL: -11.0,      // 跳跃初速（更高，跳得更远）
  DASH_JUMP_VEL: -13.0, // 冲刺大跳
  JUMP_HOLD_GRAV: 0.22, // 长按跳跃时的上升重力（越小跳得越高/越远，可变跳高）
  NORMAL_GRAV: 0.42,    // 常态重力（松开跳或下落时）
  // 时间限制(秒)
  TIME_LIMIT: 300,
};

/* 像素精灵地图缩放（每精灵内用 16x16 或 8x8 网格） */
const PX = 4; // 每个逻辑像素内精灵网格（提高分辨率，画面更精细）

/* ===== 开局配置（可被 UI 修改） ===== */
const StartConfig = {
  lives: 3,          // 3 | 30
  startBig: false,   // 开局是否大马里奥
  startFire: false,  // 开局是否带子弹(火球)
  invincible: false, // 无敌
};

/* 通过 localStorage 保存偏好可选项 */
let savedCfg = null;
try { savedCfg = JSON.parse(localStorage.getItem('mario_start_config')); } catch(e){}
if (savedCfg) Object.assign(StartConfig, savedCfg);

export function saveStartConfig(){
  try { localStorage.setItem('mario_start_config', JSON.stringify(StartConfig)); } catch(e){}
}

export { CFG, StartConfig, PX };

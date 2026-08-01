/* ===== 全局配置与开局配置 ===== */
const CFG = {
  // 逻辑分辨率（固定像素，物理恒定）
  VIEW_W: 640,
  VIEW_H: 360,
  // 像素块尺寸
  TILE: 32,
  GRAVITY: 0.55,        // 重力
  MAX_FALL: 14,
  RUN_SPEED: 2.0,       // 基础跑速（经典手感，下调避免过快）
  DASH_SPEED: 3.4,      // 冲刺
  JUMP_VEL: -9.5,
  DASH_JUMP_VEL: -11.5, // 冲刺大跳
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

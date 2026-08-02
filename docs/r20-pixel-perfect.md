# R20 像素级清晰度优化：整数倍缩放 snapping + devicePixelRatio 适配

## 背景
第 20 轮像素分析结论：当前 `render.js resize()` 存在两个清晰度根因——
1. **忽略 devicePixelRatio**：`canvas.width = innerWidth`（CSS 像素），Retina(dpr=2) 下浏览器把画布二次放大，必然模糊；
2. **任意浮点倍率**：`scale = min(cw/640, ch/360)`（如 2.25x），游戏像素在设备像素上 2px/3px 混排，块边缘不均匀，比整数倍更糙。

用户拍板：认可分析结论，实施低成本方案（resize 约 10 行改动，零玩法影响）。

## 达成目标
- 任意 dpr 下，1 个游戏像素 = 整数个设备像素（块边缘均匀）；
- Retina 高分屏边缘锐利（后备缓冲 = CSS×dpr，1:1 设备像素映射）；
- 玩法/输入/UI 零回归。

## 功能规格
| ID | 规格 |
|---|---|
| R-001 | `canvas.width/height = round(innerWidth/innerHeight × dpr)`；CSS 仍 100% 铺满视口（style.css 已有 `width:100%;height:100%`），显示尺寸不变 |
| R-002 | `scale = floor(min(canvasW/640, canvasH/360))`（设备像素整数倍）；`fit<1` 小窗兜底用浮点 fit 等比缩小 |
| R-003 | `offX/offY = floor((canvasW/H − 640/360×scale)/2)` 居中取整 |
| R-004 | `imageSmoothingEnabled=false` 保持（已有） |

## 实现方案
只改 `Renderer.resize()` 一个方法（约 14 行，替换原有 10 行，复杂度不变）：
- 所有绘制路径（draw/drawPlayer/drawHUD/drawMenu）已统一走 `this.offX/this.scale`，零改动；
- `main.js` 仅转发 window resize 事件、`input.js` 用 DOM 坐标、UI 为 DOM overlay——均不依赖画布后备缓冲，无需联动修改；
- 归属模块唯一：render.js。不在其他模块加任何防御性代码。

## 测试设计（TDD）
- `tmp/r20_cdp.js`（Chrome CDP 端到端）：
  - T1 dpr=1 基线：canvas 尺寸、scale 整数、off 整数、smoothing off；
  - T2 居中误差 ≤1px；
  - T3 游戏画面截图非空白（>8KB）；
  - T4 玩法回归：按住→移动；
  - T5 窗口变化 1024×768(dpr1)：scale=1、offX=192、offY=204；
  - T6 dpr=2（Emulation override）：canvas 1600×900、scale=2、offX=160、offY=90；
  - T7 小窗 500×300 兜底：0<scale<1；
- 回归：`tmp/r19_cdp.js` 12 项全过；
- 构建断言：game.all.js 含 `devicePixelRatio` 与整数 snapping 逻辑。

## 开发执行计划（todolist）
- [x] 1. 写 r20 CDP 测试并对旧构建跑红灯（T1/T5/T6 确认 FAIL）
- [x] 2. 修改 render.js resize（dpr + 整数 snapping）
- [x] 3. 版本 1.9.0→1.10.0、sw v7→v8、npm run build
- [x] 4. 静态检查 + 构建断言 + r20 CDP 12/12 全绿 + r19 回归 12/12 全绿
- [x] 5. git 归档推送

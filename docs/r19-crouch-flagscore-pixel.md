# R19 设计文档：下蹲能力 / 旗杆分档计分 / 问号块官方映射 / 像素精美度分析

## 一、问题背景
第 18 轮遗留 3 个可选优化点（用户本轮指定实施）+ 1 个分析项：
1. 大马里奥无下蹲能力（原版可蹲下、蹲穿 1 格高缝隙），缺蹲姿精灵。
2. 旗杆统一给 1000 分；原版按抓杆高度给 100~5000 分。
3. OFFICIAL_URLS 无问号块贴图（程序化精灵兜底），风格不统一。
4. 用户疑问：像素块太明显，能否通过等比缩小提升精美程度？

## 二、达成目标
- 大马里奥按住 ↓ 蹲下：碰撞盒 64px→32px（脚底不动），可滑入/蹲跳穿过 1 格高缝隙；头顶有砖时松开 ↓ 保持蹲姿（原版规则），空旷自动站起。
- 下蹲时渲染蹲姿精灵（程序化 mario_big_crouch 兜底 + 尽力接入官方蹲姿帧）。
- 旗杆按抓杆高度 8 档给分：100/200/400/800/1000/2000/4000/5000。
- OFFICIAL_URLS 补 brick_q 问号块映射（能取到官方 PNG 则落盘 assets/sprites/，取不到则诚实报告并保持程序化兜底）。
- 输出像素化分析结论（不做实现，给出可选方案）。

## 三、功能规格
### 3.1 下蹲状态机（player.js）
- 进入：大马里奥 && onGround && keys.down → crouching=true，h 64→32，y+=32（脚底对齐）。
- 维持：松开 ↓ 且 canStand()（头顶新增区域无实心瓦片）→ 站起 h 32→64，y-=32；否则保持蹲姿（原版低矮通道规则）。
- 主动蹲（按住 ↓）时水平方向不加速，按摩擦减速滑行；被迫蹲（头顶堵、已松开 ↓）可正常行走（原版可蹲着走）。
- 蹲姿可跳跃（跳跃中保持 ↓ 则保持蹲碰撞盒），可发射火球（弹道高度随 h 自适应）。
- 吃蘑菇长大时若头顶被堵 → 自动进入蹲姿（防头部嵌砖）。
- 变小（受伤）时清除 crouching；reachFlag 时强制站起（滑旗动画用站姿）。
- 精灵 key：crouching → 'mario_big_crouch'。

### 3.2 蹲姿精灵（sprites.js / render.js）
- 程序化字符画 mario_big_crouch（16×16，PAL 调色板），render.drawPlayer 增加 crouching 分支，fit=player.h（32）。
- 官方帧：本地 assets/sprites/mario_0~13 经逐帧像素分析确认全部为小马里奥（17~18px 高）或大马里奥站/跑（mario_6/7，26px 高），**无大马里奥蹲姿帧**；尝试从 Hammania689 源表下载切帧，失败则程序化兜底。

### 3.3 旗杆分档计分（game.js reachFlag）
- grabH = clamp(groundY*TILE - (p.y+p.h), 0, poleH=6*TILE)。
- 档位表 TIERS = [100,200,400,800,1000,2000,4000,5000]，idx = min(7, floor(grabH/poleH*8))。

### 3.4 brick_q 官方映射（sprites.js OFFICIAL_URLS）
- 仅当官方问号块 PNG 成功落盘 assets/sprites/ 时加入映射（加载器 onerror 保留程序化兜底；不引入指向不存在文件的死映射）。

## 四、像素精美度分析（结论，见最终报告完整版）
当前管线：精灵字符画 PX=4 离屏渲染 → 逻辑 640×360 → resize() 按 min(cw/640, ch/360) 任意浮点倍率放大 + imageSmoothingEnabled=false。
- 等比缩小**只能让像素块在屏幕上物理变小**（观感细腻些），不增加任何细节，代价是画面整体变小；且非整数倍缩放会产生 2px/3px 混排的不均匀像素块（摩尔纹感），比整数倍更糙。
- 真正提升精美度的路径：①整数倍缩放 snapping（1x/2x/3x，块边缘均匀）；②devicePixelRatio 适配（Retina 边缘锐利）；③提高精灵源分辨率（PX=8 + 字符画 2 倍网格重绘或换 SMM 高清素材）——这才是"细节变多"，工作量大。
- 建议：①+②为低成本高收益项；③为大工程，需用户拍板。

## 五、开发执行计划（todolist）✅ 全部完成（v1.9.0）
- [x] T1 player.js：crouching 状态 + canStand/bodyOverlaps/standUp + setSize 脚底保持（顺带修受伤/吃蘑菇空中瞬移到地面的历史缺陷）+ CROUCH_FRICTION 低摩擦蹲滑
- [x] T2 sprites.js：程序化 mario_big_crouch 兜底 + OFFICIAL_URLS 接入官方派生蹲姿帧 mario_crouch.png 与问号块 qblock_0.png
- [x] T3 render.js：drawPlayer 下蹲分支（fit=player.h）
- [x] T4 game.js：reachFlag 分档计分（100~5000 八档）+ 强制站起
- [x] T5 素材：本地 14 帧逐像素分析确认无大马里奥蹲姿帧；源表 _Mushroom 帧粘连难以干净切帧 → 改用官方站立帧 mario_6 派生（躯干压扁 16×16）落盘 mario_crouch.png；QuestionBlock.png 为 Godot 调色板 keyed 素材不可用 → AnniversaryQuestionBlock.png（真实色彩）切帧落盘 qblock_0.png
- [x] T6 测试：tmp/r19_cdp.js 12 项全过（T6 初败为测试脚本未重置 clearMode 所致，非产品缺陷）+ node --check 6 文件 + 构建断言 6 项
- [x] T7 归档：npm run build（74.0KB）、版本 1.8.0→1.9.0、sw v6→v7、git commit/push

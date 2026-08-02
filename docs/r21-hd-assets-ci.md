# R21 可选优化点立项：素材真彩化全覆盖 + CI 搭建 + 调试残留清理

## 1. 问题背景

第 20 轮报告挂起 3 项可选优化点：①提高精灵源分辨率（原设想「PX=8 重绘或换 SMM 高清素材」）；②清理 tmp/dbg_pipe.mjs；③搭建 CI/CD。本轮立项整单开发。

**①的调研结论（事实链，推翻字面前提）**：
- 当前素材全部为 16×16 级 NES 网格（mario 16×18/16×26、敌人 16 级、qblock 16×16）。
- 候选仓库实测：**SMB-Remastered**（AwkwaBear，53MB tarball 已本地化）精灵为 16 网格真彩色（Mario Small.png 256×96 = 32px 格距但可见内容仅 16~18px，系 NES 帧填充于 32 动画格）；**SMM-Assets-Archive**（NostalgicMysticalCat）仅 111 文件、敌人目录为主（SMB1/SMB1AS/SMB3/SMW 风格变体），同为 16 网格，无 Mario/道具/方块。
- **结论：不存在可合规获取的「真·高清」SMB1 精灵集**。字面的路线B不成立；路线A（手绘 2× 密度重绘）与官方帧风格冲突且工作量大，列为挂起。
- **可交付的最大精美度提升**：当前 17 个官方 key 与 11 个扁平程序化精灵（spiny/蘑菇/1up/花/星/金币/火球/砖块/地面块）并存，**风格断层才是精美度真实短板**。SMB-Remastered 为真彩色带阴影的统一风格重制，且拥有本项目从未有的帧（Fire Mario 全套、spiny、全道具、全砖块）→ 全量真彩化替换。
- queryUserOption 工具连续 3 次参数序列化故障（options 被剥离为空对象，相同错误签名），按停滞判定改以工程判断决策并显式记录，两条路线均 git 可逆，用户可随时推翻。

## 2. 达成目标

| 需求ID | 描述 | 验收要点 |
|--------|------|---------|
| R-001 | 角色/敌人/道具/砖块精灵全量真彩化（SMB-Remastered 单源） | OFFICIAL_URLS 指向新帧，CDP 实测色彩丰富度提升、玩法零回归 |
| R-002 | 新增火马里奥官方帧视觉（player.fire 时白色套装） | startFire 开局 render 选 fire 帧；CDP 断言精灵切换 |
| R-003 | 新增 spiny/道具/砖块官方帧（原程序化 key 接入替换机制） | SPRITES 对应 key 被官方帧替换 |
| R-004 | 素材加载失败程序化兜底不回归 | file:// 场景可玩（既有机制不动） |
| R-005 | 删除 tmp/dbg_pipe.mjs 及被替换的旧 PNG | 文件不存在，构建不受影响 |
| R-006 | GitHub Actions CI（语法+构建+断言+单测轻量门禁） | .github/workflows/ci.yml 落盘，本地模拟全绿 |
| R-007 | 回归脚本 tmp/r*.mjs/js 固化到 sprite-mario/tests/ + npm test | npm test 本地跑通 |
| R-008 | minor 版本递增 1.11.0 + sw v9 + git 归档 | commit 推送 main |

## 3. 功能规格

### 3.1 素材提取（tmp/extract_hd.py，PIL）
- **Mario**：Small.png/Big.png/Fire.png（8×3 格，32px 格距）逐格自裁剪内容 bbox；与现有 NES 帧（mario_0站/1~3跑/4跳、mario_6大站/7大跑）做缩放像素差匹配选型，同时输出翻转匹配分以判定源朝向；Fire.png 复用 Small/Big 的命中格索引（同版式，以透明列探针验证）。全部归一化**面向左**落盘（与现有素材约定一致），删除 loader 中 mario_big_run 不翻转特判。
- **敌人**：Goomba.png(12×4) 匹配 goomba_0/1/4；KoopaTroopa.png(18×6) 匹配 koopa_0/1/2（相似度自动锁定绿色变体）；Spiny.png(2×2) 取走A/走B/壳（新 key）；PiranhaPlant.png(96×72，16×24 格) 匹配 piranha_0/1。
- **道具**：SuperMushroom/1UP/FireFlower/SuperStar/SpinningCoin 首帧，Fireball 8×8（新 key ×6）。
- **砖块**：OverworldANN.png 按官方 JSON 坐标取 brick_b=[0,64,16,16]、brick_q_used=[64,0,16,16]；block(地面) 从 ANN 表候选格按色彩统计选型。brick_q 保留现有 qblock_0.png（已是 Anniversary 帧）。
- 产物：`assets/sprites/remastered/*.png` + 提取报告（命中格/相似度/朝向/尺寸）。

### 3.2 代码改动
- **sprites.js**：OFFICIAL_URLS 全量更新（17 旧 key 换路径 + 新增 spiny×3/mushroom/1up/flower/star/coin/fireball/brick_q_used/brick_b/block/mario_fire/mario_fire_run）；loader 删 mario_big_run 特判；mario_fire_run 派生 runB/runC（复用既有派生函数）；flyer 合成、crouch 兜底逻辑不变。
- **render.js**：大马里奥分支按 player.fire 选 mario_fire*（兜底 mario_big*），约 5 行。
- **player.js**：spriteKey() 第48行注释路径同步返回 fire key（若该方法被引用；否则仅 render.js）。
- 旧 PNG（mario_0~13/goomba_*/koopa_*/piranha_*/mario_crouch）删除，frame_map.json 与 assets/sprites/README.md 重写。
- **tmp/dbg_pipe.mjs 删除**。
- **tests/**：tmp/r18_unit.mjs、r17_cdp.js、r19_cdp.js、r20_cdp.js 移入 sprite-mario/tests/ 并修正相对路径；package.json 增加 `test`/`test:e2e` 脚本。
- **.github/workflows/ci.yml**：push/PR 触发 → node22 → 全 js 语法检查 → npm run build → 产物断言 → npm test（单测）。CDP 端到端保留本地（macOS Chrome 路径依赖，CI flaky 风险高）。
- sw.js v8→v9；package.json 1.10.0→1.11.0。

## 4. 实现方案要点

- 朝向归一化：提取时对每帧计算 原向/水平翻转 与基准帧的相似度，取优并记录；落盘统一面向左 → draw/loader 逻辑零改动（除删特判）。
- 匹配可信度：报告输出每 key 的 best/次优相似度差，差距 <阈值 的 key 人工复核（本轮以色彩直方图+尺寸复核）。
- 兜底红线：loadOfficialSprite onerror 保留程序化精灵（file:// 双击可玩）——机制不动，r21 CDP 含 file:// 或用例级验证。
- 视觉验证：CDP 断言 SPRITES[key] canvas 去重色数（真彩帧 ≫ 程序化扁平帧）。

## 5. 开发执行计划（todolist）

- [x] T1 调研：素材仓库可行性/帧结构/朝向/sw 预缓存/渲染选择逻辑 ✅
- [x] T2 设计文档落盘 ✅
- [ ] T3 tmp/extract_hd.py 提取脚本 + 运行 + 报告复核
- [ ] T4 sprites.js：OFFICIAL_URLS 更新 + 新 key + 删特判 + fire 派生
- [ ] T5 render.js/player.js：火马里奥精灵选择
- [ ] T6 旧 PNG/旧引用清理 + frame_map.json/README 重写 + 删 dbg_pipe.mjs
- [ ] T7 tests/ 固化 + npm 脚本 + .github/workflows/ci.yml
- [ ] T8 静态检查 + 构建 + 断言 + r18 单测
- [ ] T9 tmp/r21_cdp.js（素材替换/色彩丰富度/fire 视觉/兜底）+ r19/r20 回归全绿
- [ ] T10 sw v9 + 1.11.0 + 文档 todolist ✅ + git 归档

---

## 8. 实证修正·最终交付范围（R21 收尾）

**素材深度调研结论（三轮提取迭代 + ASCII 逐帧验证证伪原方案）**：
1. 三个候选仓库（SMB-Remastered / SMM-Archive / Unity教程库）SMB1 素材均为 16 级网格，**不存在真·高清源**。
2. SMB-Remastered 精灵表为「未rip占位绿格(0,255,0) + 全烘焙真帧格」混合（该 Godot 游戏运行时从 NES ROM 在线抽帧填绿格）。v3 RGB 匹配（画风淹没）、v4 .tres剪影IoU（不透明绿格致 mask 矩形化、IoU=1.00 假象）、v5 键控烘焙（占位绿误当色槽→红色块）逐轮证伪，最终以 **dekey(绿→透明)+全烘焙格筛选+ASCII 像素画人工验证** 定出货集。
3. **出货 7 帧**：火马里奥 站/跑/蹲（Fire(3,2) 22×27 全烘焙+派生）、蘑菇/1UP/星/火球（全烘焙洁净帧）。
4. **回退**：mario small/big、goomba、piranha 回退 NES 官帧（git 恢复）；spiny/coin/flower/砖块类保留程序化。

**最终 todolist 实际完成**：
- [x] T1 调研（3 仓库实证，API限流改 jsDelivr/codeload 通道）
- [x] T2 设计文档（本文档）
- [x] T3 提取管线 v3~v6（含 tools/extract_remastered.py 固化）+ ASCII 验证
- [x] T4 sprites.js：OFFICIAL_URLS 终版（7 新帧 + NES 回退守卫）、loader 火帧派生 runB/C、翻转特判恢复
- [x] T5 render.js：火马里奥选帧（fk 逻辑）+ 抓杆/蹲姿火感知；player.js spriteKey 同步
- [x] T6 范围裁剪：场景/砖块/spiny/coin/flower 实证后保留程序化（证据见上）
- [x] T7 ②tmp/dbg_pipe.mjs 删除；v1~v5 废帧清理；NES PNG git 恢复
- [x] T8 ③CI：tests/ 固化（r17~r21 迁移+import 修复）、npm test/test:e2e、.github/workflows/ci.yml（轻量门禁）
- [x] T9 验证：node --check×3、build 75.3KB、产物断言×6、r18 单测 12/12、r19 回归 ALL_PASS、r20 回归 ALL_PASS、r21 19/19（T3 时序竞态修复后轮询通过）
- [x] T10 sw v9、版本 1.11.0、git 归档

# 超级马里奥闯关游戏 - 设计文档

## 1. 项目背景与目标
全新开发一个全屏、高清、高精美的超级马里奥风格闯关游戏，高精度还原经典玩法（跳跃、吃蘑菇变大、吃花发子弹、金币、问号砖块、敌人、旗杆过关），并支持丰富的开局配置。采用纯前端 HTML5 Canvas 技术，程序化绘制全部图形（不依赖外部图片素材），保证任意分辨率下高清渲染与开箱即用。

## 2. 达成目标
- 全屏自适应 Canvas 渲染，像素风但高清细腻
- 高精度还原马里奥经典元素与手感
- 无限随机生成关卡，难度渐进
- 开局配置：命数(3/30)、开局大小(普通/变大)、默认是否带子弹、无敌
- 键盘 + 触屏虚拟按键双操作
- 可安装离线 PWA

## 3. 功能规格

### 3.1 开局配置（Config）
| 配置 | 选项 |
|------|------|
| 命数 | 3 命 / 30 命 |
| 开局大小 | 小马里奥 / 大马里奥(吃了蘑菇) |
| 默认子弹 | 无 / 带子弹(火球) |
| 无敌 | 关 / 开(不受伤害) |

### 3.2 核心玩法
- 移动（左右）、跳跃（空格/上）、蓄力大跳（长按）、加速跑（Shift）
- 发射子弹（带子弹时，X/触屏）
- 顶砖块：'?'砖出金币/蘑菇/花，普通砖可顶碎
- 敌人：板栗仔(Goomba)、乌龟(Koopa，踩踏可踢)、飞乌龟
- 道具：蘑菇(变大)、花(发子弹)、星星(短暂无敌加速)
- 金币收集计分
- 旗杆 + 城堡 过关结算
- 时间限制
- 掉落坑死亡、被敌人碰撞死亡（小马里奥死亡、大马里奥缩回）

### 3.3 随机关卡生成
- 分段落拼接：平地/台阶/坑/砖块排/道具块/敌人分布/终点旗杆城堡
- 段类型权重随关卡序号调整，难度渐进
- 每次生成唯一 seed，可复现

### 3.4 技术与渲染
- Canvas 2D，像素纹理程序化绘制（8-bit 风格）
- 相机卷轴跟随，平滑补间
- 固定像素逻辑分辨率 + CSS/高分屏适配，保持物理恒定

## 4. 实现方案
多文件 PWA 工程（见代码仓库结构）：
```
sprite-mario/
├── index.html
├── manifest.webmanifest
├── sw.js
├── css/style.css
├── js/
│   ├── main.js        # 入口与主循环
│   ├── config.js      # 开局配置
│   ├── input.js       # 键盘+触屏输入
│   ├── audio.js       # Web Audio 程序化音效
│   ├── sprites.js     # 程序化像素精灵绘制
│   ├── levelgen.js    # 随机关卡生成
│   ├── level.js       # 关卡数据与碰撞判定
│   ├── entities.js    # 玩家/敌人/道具/子弹
│   ├── physics.js     # 物理与碰撞
│   ├── render.js      # 渲染引擎
│   ├── game.js        # 游戏主状态机
│   └── ui.js          # 菜单/配置/结算 UI
└── assets/icon.svg    # PWA 图标
```

## 5. 开发执行计划（Todolist）
- [x] 1. 项目骨架：index.html、css、manifest、sw.js、目录结构
- [x] 2. config + sprites：开局配置、程序化像素精灵绘制
- [x] 3. physics + input：物理碰撞、键盘触屏输入
- [x] 4. levelgen + level：随机关卡生成与碰撞数据
- [x] 5. entities + player：玩家动作、敌人、道具、子弹
- [x] 6. render + camera：渲染引擎、卷轴相机
- [x] 7. audio：Web Audio 音效
- [x] 8. game + ui：游戏状态机、菜单配置/结算 UI、PWA 注册
- [x] 9. 全链路测试与收尾

## 6. 验收记录
- Node 语法检查 13/13 全部通过
- 逻辑单测（levelgen/physics/entities）全通过
- Playwright + Chrome 端到端：菜单渲染、4项配置切换、游戏启动、键盘操作，0 JS 错误
- 修复 list：choice const→let、entities 重复导出、index.html script 加 type=module、config 导出 StartConfig/PX、sprites 导入 PX

## 7. v1.1 黑屏修复记录
- **根因**：index.html 使用 `<script type="module">` 加载 ES module 脚本；用户直接双击 index.html（`file://` 协议）时，浏览器 CORS 同源策略拦截所有 module 加载（origin 'null'），JS 全部不执行 → 黑屏。
- **修复**：将 13 个 ES module 源码合并为单文件非模块脚本 `js/game.all.js`（剥离 import/export），index.html 改用普通 `<script src="js/game.all.js">` 加载；同步更新 sw.js 缓存清单为 game.all.js 并升缓存版本 v2。
- **验证**：Chrome 无头 `file://` 协议加载——菜单渲染、进入游戏画布非空、0 JS 错误；HTTP 场景同样 PASS。



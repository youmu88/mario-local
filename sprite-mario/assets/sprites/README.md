# 官方马里奥主题精灵素材（assets/sprites/）

本目录为《超级马里奥兄弟》官方精灵素材（第7轮"资源网站获取高清精灵图"交付），由以下社区资源站获取并切帧：

## 素材来源
- **mario_0~13.png**（马里奥全动作帧：站/跑1~3/跳1~2/大马里奥站/跑，16×16 与 16×24）
  - 来源：GitHub `Hammania689/Super-Mario-Bros-1-1-in-Unity`（Assets/Sprites/_Defualt Mario Sprites.png）
  - 任天堂 NES《超级马里奥兄弟》官方精灵提取
- **goomba_0~4.png**（板栗仔：走路A/走路B/踩扁，16×16）
  - 来源：`AwkwaBear/SMB-Remastered`（Assets/Sprites/Enemies/Goomba.png）
- **koopa_0~6.png**（乌龟：走路A/走路B/壳，16×16）
  - 来源：`NostalgicMysticalCat/Super-Mario-Maker-Assets-Archive`（Enemies/01 - SMB1/02a - Koopa Troopa (Green)）
- **piranha_0~1.png**（食人花张合 2 帧）
  - 来源：同上仓库（Enemies/01 - SMB1/03a - Piranha Plant）

## 帧映射（js/sprites.js → OFFICIAL_URLS）
| 游戏精灵 key | 文件 |
|---|---|
| mario_small (站) / _run2 / _run3 / _run4 / _jump | mario_0 / 1 / 2 / 3 / 4 |
| mario_big (站) / mario_big_run | mario_6 / 7 |
| mario_big_crouch (蹲) | mario_crouch.png（mario_6 派生：躯干压扁 16×16） |
| goomba / goomba_w2 / goomba_squash | goomba_0 / 1 / 4 |
| koopa / koopa_w2 / koopa_shell | koopa_0 / 1 / 2 |
| piranha / piranha_2 | piranha_0 / 1 |
| flyer / flyer_w2（飞行板栗） | goomba 帧 + 程序化红翅膀合成 |

## 版权声明
素材版权归 Nintendo 所有。本目录素材仅用于个人学习/自用项目，**禁止商用分发**。
运行时通过 `js/sprites.js` 的 `loadOfficialSprites()` 异步加载并替换程序化精灵（加载前程序化精灵兜底，file:// 双击可运行）。

`base64.json` 为切帧时的 base64 备份清单（28 帧），供离线/单文件场景参考。

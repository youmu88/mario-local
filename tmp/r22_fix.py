#!/usr/bin/env python3
# R22 模糊根因修复：render.js 像素对齐 + ui.js 版本号角标 + 版本升级
import re, sys

ROOT = '/Users/wilsonwen/.ai-chatAgent/workspace/45e4d2e4d23a4cdeb17aab17ef59c0fd'
fails = []

def sub(path, old, new, must=True, count=1):
    p = ROOT + '/' + path
    src = open(p, encoding='utf-8').read()
    n = src.count(old)
    if n != count:
        fails.append(f'{path}: 匹配数 {n} != 预期 {count} :: {old[:50]!r}')
        return
    open(p, 'w', encoding='utf-8').write(src.replace(old, new))
    print(f'OK {path}: {old[:40]!r}... -> {new[:40]!r}...')

# ---- 1. render.js draw(): camX 量化到设备像素网格 ----
sub('sprite-mario/js/render.js',
    '    const ctx=this.ctx, camX=world.camX;',
    '    // 相机量化到设备像素网格：浮点 camX 是精灵 3/5px 混排(模糊)根因之一\n'
    '    const ctx=this.ctx, camX=Math.round(world.camX*this.scale)/this.scale;')

# ---- 2. render.js drawSprite(): 尺寸吸附源像素整数倍 + 坐标量化 + 底部锚定 ----
sub('sprite-mario/js/render.js',
    "    let w=spl.width, h=spl.height;\n"
    "    if(o.fit){ const k=o.fit/spl.height; w=spl.width*k; h=o.fit; }\n"
    "    else if(o.scale){ w=spl.width*o.scale; h=spl.height*o.scale; }\n"
    "    ctx.save();",
    "    let w=spl.width, h=spl.height;\n"
    "    if(o.fit){ const k=o.fit/spl.height; w=spl.width*k; h=o.fit; }\n"
    "    else if(o.scale){ w=spl.width*o.scale; h=spl.height*o.scale; }\n"
    "    // 像素对齐（模糊根因修复）：整数倍缩放时，尺寸吸附到源像素整数倍（每源像素=整数设备像素，\n"
    "    // 根除 4.92x 等非整数源缩放比的 4/5px 混排）；坐标量化到设备像素网格（根除浮点矩形 nearest 取样错位）。\n"
    "    // 底部锚定：高度微调向上延伸，脚底不动（避免视觉上下沉）。\n"
    "    if(this.scale>=1){\n"
    "      const s=this.scale, h0=h;\n"
    "      h=Math.max(spl.height/s, Math.round(h*s/spl.height)*spl.height/s);\n"
    "      w=h/spl.height*spl.width;\n"
    "      const q=1/s;\n"
    "      sx=Math.round((sx-(h-h0)*0)/q)*q;  // x 量化\n"
    "      sy=Math.round(sy+(h0-h))/q*q;      // 底部锚定后 y 量化\n"
    "    }\n"
    "    ctx.save();")

# ---- 3. render.js drawPlayer(): camX 同网格量化 ----
sub('sprite-mario/js/render.js',
    '    ctx.save();ctx.translate(this.offX,this.offY);ctx.scale(this.scale,this.scale);\n'
    '    const sx=player.x-camX;',
    '    ctx.save();ctx.translate(this.offX,this.offY);ctx.scale(this.scale,this.scale);\n'
    '    camX=Math.round(camX*this.scale)/this.scale;  // 与 draw() 同网格量化\n'
    '    const sx=player.x-camX;')

# ---- 4. ui.js 菜单注入版本号角标（SW 缓存排障自检） ----
sub('sprite-mario/js/ui.js',
    '<div class="subtitle">▶ 无限随机闯关 · 高精度经典还原 ◀</div>',
    '<div class="subtitle">▶ 无限随机闯关 · 高精度经典还原 ◀</div>\n'
    '      <div class="ver-tag">v1.12.0 · 像素锐利版（若画面模糊请硬刷新 Cmd+Shift+R）</div>')

# ---- 5. style.css 追加 .ver-tag 样式 ----
p = ROOT + '/sprite-mario/css/style.css'
css = open(p, encoding='utf-8').read()
if '.ver-tag' not in css:
    open(p, 'a', encoding='utf-8').write(
        '\n/* 版本号角标：排障自检（确认是否最新版） */\n'
        '.ver-tag{text-align:center;color:#fff;font-size:12px;opacity:.75;margin-top:10px;text-shadow:1px 1px 0 #000}\n')
    print('OK style.css: .ver-tag 追加')

# ---- 6. package.json 版本 1.12.0 ----
sub('sprite-mario/package.json', '"version": "1.11.0"', '"version": "1.12.0"')

# ---- 7. sw.js 缓存 v10 ----
sub('sprite-mario/sw.js', "const CACHE = 'super-mario-v9';", "const CACHE = 'super-mario-v10';")

if fails:
    print('\n'.join('FAIL ' + f for f in fails)); sys.exit(1)
print('\nR22 fix ALL OK')

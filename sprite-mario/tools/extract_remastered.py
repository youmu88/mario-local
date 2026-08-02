#!/usr/bin/env python3
"""R21 提取 v4（终版）：.tres 权威姿态剪影 x 预着色格 IoU 匹配。
事实链：SMB-Remastered 精灵表 = 绿色占位格(0,255,0) + 预着色真帧格；
.tres 动画表给出姿态名->占位格（形状权威）；预着色格有色但姿态未知。
同表 32x32 网格、底部对齐的 alpha mask IoU 匹配 = 同画风同尺度的权威姿态识别。
koopa 走姿真彩帧全表不存在（仅 14px 壳）-> koopa 整套保留现状（删 v3 输出）。
coin/flower/brick/used/ground 确认裁剪（删 v3 输出）。朝向归一：与 NES 基线 flip 对比，统一面左。
"""
import os, re, json
from PIL import Image
import numpy as np

SRC = '/tmp/smb_r/SMB-Remastered-main'
SPR = SRC + '/Assets/Sprites'
CUR = '/Users/wilsonwen/.ai-chatAgent/workspace/45e4d2e4d23a4cdeb17aab17ef59c0fd/sprite-mario/assets/sprites'
OUT = os.path.join(CUR, 'remastered')

def load(p): return Image.open(p).convert('RGBA')

def autocrop(im):
    a = np.array(im)[:, :, 3]
    ys, xs = np.where(a > 0)
    if len(xs) == 0: return None
    return im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))

def flip_h(im): return im.transpose(Image.FLIP_LEFT_RIGHT)

def full_colors(im):
    a = np.array(im); m = a[:, :, 3] > 0
    if not m.any(): return 0, (0, 0, 0)
    return len(np.unique(a[m][:, :3], axis=0)), tuple(a[m][:, :3].mean(axis=0).astype(int))

def is_green(im):
    n, mean = full_colors(im)
    return n == 1 and mean[0] < 30 and mean[1] > 200 and mean[2] < 30

def bottom_mask(im, W=40, H=40):
    c = autocrop(im)
    if c is None: return np.zeros((H, W), bool)
    a = np.array(c)[:, :, 3] > 0
    h, w = a.shape
    canvas = np.zeros((H, W), bool)
    y0 = max(H - h, 0); x0 = max((W - w) // 2, 0)
    hh = min(h, H); ww = min(w, W - x0)
    canvas[y0:y0+hh, x0:x0+ww] = a[:hh, :ww]
    return canvas

def iou(a, b):
    inter = (a & b).sum(); union = (a | b).sum()
    return float(inter) / union if union else 0.0

def parse_tres(path):
    txt = open(path).read()
    id2sheet = {}
    for m in re.finditer(r'\[ext_resource type="Texture2D"[^\]]*?path="res://Assets/Sprites/([^"]+)" id="([^"]+)"', txt):
        id2sheet[m.group(2)] = m.group(1)
    subs = {}
    for m in re.finditer(r'\[sub_resource type="AtlasTexture" id="([^"]+)"\]\natlas = ExtResource\("([^"]+)"\)\nregion = Rect2\(([^)]+)\)', txt):
        x, y, w, h = [float(v) for v in m.group(3).split(',')]
        subs[m.group(1)] = (id2sheet.get(m.group(2)), int(x), int(y), int(w), int(h))
    anims = {}
    for m in re.finditer(r'"frames": \[(.*?)\],\n"loop": (?:true|false),\n"name": &"([^"]+)"', txt, re.S):
        ids = re.findall(r'SubResource\("([^"]+)"\)', m.group(1))
        anims[m.group(2)] = [subs[i] for i in ids if i in subs]
    return anims

def colored_cells(sheet_im, cw=32, ch=32):
    W, H = sheet_im.size; out = []
    for r in range(H // ch):
        for c in range(W // cw):
            im = sheet_im.crop((c*cw, r*ch, (c+1)*cw, (r+1)*ch))
            if autocrop(im) is None or is_green(im): continue
            if full_colors(im)[0] >= 2:
                out.append(((c, r), im))
    return out

def assign(sheet_name, poses):
    """poses: {pose: (anim_name, frame_idx)}。返回 {pose:(pos,img,iou)}"""
    sheet_im = load('%s/Players/Mario/%s.png' % (SPR, sheet_name))
    anims = parse_tres('%s/Resources/SpriteFrames/Player/Mario/%s.tres' % (SRC, sheet_name))
    cands = colored_cells(sheet_im)
    refs = {}
    for pose, (anim, idx) in poses.items():
        frames = anims.get(anim, [])
        if idx >= len(frames):
            print('  !! %s.%s[%d] 缺失' % (sheet_name, anim, idx)); continue
        sheet, x, y, w, h = frames[idx]
        ref_im = load('%s/%s' % (SPR, sheet)).crop((x, y, x+w, y+h))
        refs[pose] = bottom_mask(ref_im)
    pairs = []
    for pose, rm in refs.items():
        for pos, cim in cands:
            pairs.append((iou(rm, bottom_mask(cim)), pose, pos, cim))
    pairs.sort(key=lambda t: -t[0])
    result, used = {}, set()
    for sc, pose, pos, cim in pairs:
        if pose in result or pos in used: continue
        result[pose] = (pos, cim, sc); used.add(pos)
    for pose in poses:
        if pose in result:
            pos, cim, sc = result[pose]
            print('  %s.%s: 格%s IoU=%.2f size=%s' % (sheet_name, pose, pos, sc, list(autocrop(cim).size)))
        else:
            print('  %s.%s: 无参考帧' % (sheet_name, pose))
    return result

report = []
def save(name, im, src, score=None, flipped=False):
    im.save(os.path.join(OUT, name))
    report.append((name, list(im.size), full_colors(im)[0], src, round(score, 2) if score is not None else None, flipped))

def orient(im, basefile):
    base = load(os.path.join(CUR, basefile))
    bm = bottom_mask(base)
    return (flip_h(im), True) if iou(bm, bottom_mask(flip_h(im))) > iou(bm, bottom_mask(im)) else (im, False)

TH = 0.55  # IoU 接受阈值（同表同尺度形状匹配，0.55 以上可视作同一姿态）
print('== Small ==')
sm = assign('Small', {'stand': ('Idle', 0), 'run2': ('Move', 0), 'run3': ('Move', 1), 'run4': ('Move', 2), 'jump': ('Jump', 0)})
print('== Big ==')
bg = assign('Big', {'stand': ('Idle', 0), 'run': ('Move', 0), 'crouch': ('Crouch', 0)})
print('== Fire ==')
fr = assign('Fire', {'stand': ('Idle', 0), 'run': ('Move', 0)})

BASE = {'stand': 'mario_0.png', 'run2': 'mario_1.png', 'run3': 'mario_2.png', 'run4': 'mario_3.png', 'jump': 'mario_4.png', 'run': 'mario_7.png'}
BIGBASE = {'stand': 'mario_6.png', 'run': 'mario_7.png', 'crouch': 'mario_6.png'}

accepted = []
for pose, (pos, im, sc) in sm.items():
    if sc < TH: print('  [拒] small.%s IoU=%.2f<%.2f -> 保留NES帧' % (pose, sc, TH)); continue
    out, fl = orient(autocrop(im), BASE[pose])
    save('rem_small_%s.png' % pose, out, 'Small%s IoU' % (pos,), sc, fl); accepted.append('small.' + pose)
for pose, (pos, im, sc) in bg.items():
    if sc < TH: print('  [拒] big.%s IoU=%.2f -> 派生/保留' % (pose, sc)); continue
    out, fl = orient(autocrop(im), BIGBASE[pose])
    save('rem_big_%s.png' % pose, out, 'Big%s IoU' % (pos,), sc, fl); accepted.append('big.' + pose)
for pose, (pos, im, sc) in fr.items():
    if sc < TH: print('  [拒] fire.%s IoU=%.2f' % (pose, sc)); continue
    out, fl = orient(autocrop(im), BIGBASE[pose])
    save('rem_fire_%s.png' % pose, out, 'Fire%s IoU' % (pos,), sc, fl); accepted.append('fire.' + pose)

# 大马里奥蹲姿：原生匹配失败则由新站立帧压高派生
if 'big.crouch' not in accepted and os.path.exists(os.path.join(OUT, 'rem_big_stand.png')):
    st = load(os.path.join(OUT, 'rem_big_stand.png'))
    save('rem_big_crouch.png', st.resize((st.size[0], 16), Image.NEAREST), 'rem_big_stand 压高派生')

# 清理 v3 已裁剪输出
for f in ['rem_koopa_a.png','rem_koopa_b.png','rem_koopa_shell.png','rem_coin.png','rem_brick.png','rem_block_used.png','rem_ground.png']:
    p = os.path.join(OUT, f)
    if os.path.exists(p): os.remove(p); print('  [删除裁剪输出]', f)

print()
print('===== v4 报告（新写文件） =====')
for r in report: print(' ', r)
print('接受姿态:', accepted)
print()
print('===== remastered/ 最终清单 =====')
for f in sorted(os.listdir(OUT)):
    im = load(os.path.join(OUT, f))
    print('  %-26s %s colors=%d' % (f, list(im.size), full_colors(im)[0]))

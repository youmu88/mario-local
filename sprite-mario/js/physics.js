/* ===== 物理与碰撞 ===== */
export const TILE = 32;

// AABB 碰撞检测
export function aabb(a, b){
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// 水平推回：返回是否落地面
export function moveX(body, tiles, onCollide) {
  const tile = TILE;
  // 扫过所占 tile 范围
  const ys = Math.floor(body.y / tile);
  const ye = Math.floor((body.y + body.h - 0.001) / tile);
  const dir = body.vx > 0 ? 1 : -1;
  const edge = dir > 0 ? Math.floor((body.x + body.w) / tile) : Math.floor(body.x / tile);
  const nEdge = dir > 0 ? Math.floor((body.x + body.w + body.vx) / tile) : Math.floor((body.x + body.vx) / tile);
  for (let y = ys; y <= ye; y++){
    for (let x = Math.min(edge,nEdge); x <= Math.max(edge,nEdge); x++){
      if (tiles[y] && tiles[y][x]) {
        // 撞墙
        if (dir > 0) body.x = x * tile - body.w - 0.01;
        else body.x = (x + 1) * tile + 0.01;
        body.vx = 0;
        onCollide && onCollide(x, y, dir);
        return;
      }
    }
  }
  body.x += body.vx;
}

// 垂直推回 + 落面判定
// 返回结构 { grounded, hitCeil(col,row) }
export function moveY(body, tiles, hits) {
  const tile = TILE;
  const xs = Math.floor(body.x / tile);
  const xe = Math.floor((body.x + body.w - 0.001) / tile);
  let grounded = false;
  const hitCells = [];

  if (body.vy >= 0) {
    // 下落
    const row = Math.floor((body.y + body.h) / tile);
    const nrow = Math.floor((body.y + body.h + body.vy) / tile);
    for (let r = row; r <= nrow; r++){
      for (let x = xs; x <= xe; x++){
        if (tiles[r] && tiles[r][x]) {
          body.y = r * tile - body.h - 0.01;
          body.vy = 0;
          grounded = true;
          hitCells.push([x, r]);
          return { grounded, hits: hitCells };
        }
      }
    }
  } else {
    // 上升
    const row = Math.floor(body.y / tile);
    const nrow = Math.floor((body.y + body.vy) / tile);
    for (let r = row; r >= nrow; r--){
      for (let x = xs; x <= xe; x++){
        if (tiles[r] && tiles[r][x]) {
          body.y = (r + 1) * tile + 0.01;
          body.vy = 0;
          hitCells.push([x, r]);
          return { grounded:false, hits: hitCells };
        }
      }
    }
  }
  body.y += body.vy;
  return { grounded, hits: hitCells };
}

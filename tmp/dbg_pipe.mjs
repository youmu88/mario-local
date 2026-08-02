import { generateLevel } from '../sprite-mario/js/levelgen.js';
for (let lv=1; lv<=4; lv++){
  const gen = generateLevel(lv, 'seed'+lv);
  for (const s of gen.spawns){
    if (s.type !== 'piranha') continue;
    const py = s.y;
    for (let ty = py-1; ty >= 0; ty--){
      for (let tx = s.x; tx <= s.x+1; tx++){
        const t = gen.tiles[ty][tx];
        if (t !== 0){
          console.log(`LV${lv} 管道(x=${s.x},顶行=${py}) 上方残留 (${tx},${ty}) tile=${t}`);
          const b = gen.blocks.filter(b=>b.x===tx && b.y===ty);
          console.log('  blocks记录:', JSON.stringify(b));
          for (let r=5;r<=11;r++){
            let line = '';
            for (let c=Math.max(0,s.x-12); c<=s.x+14; c++) line += gen.tiles[r][c]||'.';
            console.log(`  行${r}: ${line}`);
          }
          console.log('  管道列 x..x+1 =', s.x, s.x+1);
        }
      }
    }
  }
}

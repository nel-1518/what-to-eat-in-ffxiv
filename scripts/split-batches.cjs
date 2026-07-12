/**
 * 拆分 recipes.json 为 50 条一批的小文件（仅含 item/name/description）
 *
 * 用法: node scripts/split-batches.cjs
 * 输出: public/data/batches/batch-01.json ~ batch-N.json
 */

const fs = require('fs');
const path = require('path');

const RECIPES_PATH = path.join(__dirname, '..', 'public', 'data', 'recipes.json');
const BATCH_DIR = path.join(__dirname, '..', 'public', 'data', 'batches');
const BATCH_SIZE = 50;

function main() {
  // 读取原始数据
  const raw = fs.readFileSync(RECIPES_PATH, 'utf-8');
  const recipes = JSON.parse(raw);

  // 确保 batches 目录存在
  if (!fs.existsSync(BATCH_DIR)) {
    fs.mkdirSync(BATCH_DIR, { recursive: true });
  }

  const total = recipes.length;
  const batchCount = Math.ceil(total / BATCH_SIZE);
  console.log(`共 ${total} 条数据，分为 ${batchCount} 批`);

  for (let i = 0; i < batchCount; i++) {
    const start = i * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, total);
    const batch = recipes.slice(start, end);

    // 仅保留 item, name, description
    const slim = batch.map(r => ({
      item: r.item,
      name: r.name,
      description: r.description
    }));

    const batchFile = path.join(BATCH_DIR, `batch-${String(i + 1).padStart(2, '0')}.json`);
    fs.writeFileSync(batchFile, JSON.stringify(slim, null, 2), 'utf-8');
    console.log(`  ✓ batch-${String(i + 1).padStart(2, '0')}.json (${slim.length} 条)`);
  }

  console.log('拆分完成！');
}

main();

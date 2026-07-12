/**
 * 合并 tagged batch 数据并直接按 tag 拆分为独立文件
 *
 * 用法: node scripts/combine-tags.cjs
 * 读取: recipes.json（原始）+ batches/batch-*.json（含 tag）
 * 输出: public/data/by-tag/{tag}.json（一个条目有多个 tag 则会出现在多个文件中）
 *       并清理 batches/ 目录下的临时文件
 */

const fs = require('fs');
const path = require('path');

const RECIPES_PATH = path.join(__dirname, '..', 'public', 'data', 'recipes.json');
const BATCH_DIR = path.join(__dirname, '..', 'public', 'data', 'batches');
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'data', 'by-tag');

function main() {
  // ── 第 1 步：读取原始数据 ──
  const raw = fs.readFileSync(RECIPES_PATH, 'utf-8');
  const recipes = JSON.parse(raw);

  // ── 第 2 步：读取所有 batch 文件 ──
  const batchFiles = fs.readdirSync(BATCH_DIR)
    .filter(f => /^batch-\d+\.json$/.test(f))
    .sort((a, b) => {
      const na = parseInt(a.match(/batch-(\d+)/)[1]);
      const nb = parseInt(b.match(/batch-(\d+)/)[1]);
      return na - nb;
    });

  console.log(`找到 ${batchFiles.length} 个 batch 文件`);

  // 构建 item → { tag, calories } 映射
  const tagMap = new Map();
  for (const file of batchFiles) {
    const data = JSON.parse(fs.readFileSync(path.join(BATCH_DIR, file), 'utf-8'));
    for (const entry of data) {
      if (entry.tag) {
        tagMap.set(entry.item, { tag: entry.tag, calories: entry.calories });
      }
    }
  }

  console.log(`解析到 ${tagMap.size} 条 tag 数据`);

  // ── 第 3 步：合并 tag + calories 到原始数据 ──
  let taggedCount = 0;
  let missingCount = 0;
  const merged = recipes.map(r => {
    if (tagMap.has(r.item)) {
      taggedCount++;
      const { tag, calories } = tagMap.get(r.item);
      return { ...r, tag, calories };
    } else {
      missingCount++;
      console.warn(`  ⚠ 未找到 tag: item=${r.item}, name=${r.name}`);
      return { ...r, tag: [], calories: 0 };
    }
  });

  console.log(`\n合并完成: 总条数 ${merged.length}，已标记 ${taggedCount}${missingCount > 0 ? `，未标记 ${missingCount}` : ''}`);

  // ── 第 4 步：按 tag 拆分为独立文件 ──
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const splitMap = new Map(); // tag → items[]

  for (const item of merged) {
    const tags = item.tag || [];
    for (const tag of tags) {
      if (!splitMap.has(tag)) {
        splitMap.set(tag, []);
      }
      splitMap.get(tag).push(item);
    }
  }

  const sortedTags = [...splitMap.keys()].sort((a, b) => splitMap.get(b).length - splitMap.get(a).length);

  for (const tag of sortedTags) {
    const items = splitMap.get(tag);
    const filePath = path.join(OUTPUT_DIR, `${tag}.json`);
    fs.writeFileSync(filePath, JSON.stringify(items, null, 2), 'utf-8');
    console.log(`  ✓ ${tag}.json  (${items.length} 条)`);
  }

  console.log(`\n完成！共 ${splitMap.size} 个分类文件`);
  console.log(`输出目录: ${OUTPUT_DIR}`);
}

main();

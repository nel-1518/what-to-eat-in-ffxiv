/**
 * FFXIV 物品图标下载脚本
 *
 * 功能:
 *   1. 读取 recipes.json 中所有不重复的 item ID
 *   2. 调用 XivAPI 获取图标路径 (path_hr1)
 *   3. 下载 JPG 图片到 public/data/icons/{itemId}.jpg
 *   4. 每处理一条数据间隔 10 秒（避免请求过快）
 *
 * API:
 *   https://v2.xivapi.com/api/sheet/Item/{id}?fields=Icon
 *   https://v2.xivapi.com/api/asset?path={path_hr1}&format=jpg
 *
 * 用法:
 *   node scripts/download-icons.cjs
 */

const fs = require('fs');
const path = require('path');

const RECIPES_PATH = path.resolve(__dirname, '..', 'public', 'data', 'recipes.json');
const ICONS_DIR = path.resolve(__dirname, '..', 'public', 'data', 'icons');

// 延迟辅助函数
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 从 recipes.json 提取所有不重复的 item ID
 */
function collectItemIds(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const recipes = JSON.parse(raw);
  const ids = new Set(recipes.map((r) => r.item));
  const sorted = [...ids].sort((a, b) => a - b);
  console.log(`[INFO] 从 recipes.json 中读取到 ${recipes.length} 条配方，共 ${sorted.length} 个不重复物品`);
  return sorted;
}

/**
 * 通过 XivAPI 获取指定 item 的图标路径
 * @returns {{ path_hr1: string } | null}
 */
async function fetchIconPath(itemId) {
  const url = `https://v2.xivapi.com/api/sheet/Item/${itemId}?fields=Icon`;
  const resp = await fetch(url);

  if (!resp.ok) {
    throw new Error(`XivAPI 返回 ${resp.status} ${resp.statusText}`);
  }

  const data = await resp.json();
  const iconField = data?.fields?.Icon;

  if (!iconField || !iconField.path_hr1) {
    throw new Error(`响应中未找到 fields.Icon.path_hr1，原始数据: ${JSON.stringify(data).slice(0, 200)}`);
  }

  return iconField.path_hr1;
}

/**
 * 从 XivAPI 下载图片并保存到本地
 */
async function downloadIcon(itemId, pathHr1) {
  const url = `https://v2.xivapi.com/api/asset?path=${encodeURIComponent(pathHr1)}&format=jpg`;
  const resp = await fetch(url);

  if (!resp.ok) {
    throw new Error(`图片下载返回 ${resp.status} ${resp.statusText}`);
  }

  const buffer = Buffer.from(await resp.arrayBuffer());
  const filePath = path.join(ICONS_DIR, `${itemId}.jpg`);
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

async function main() {
  // 确保目录存在
  if (!fs.existsSync(ICONS_DIR)) {
    fs.mkdirSync(ICONS_DIR, { recursive: true });
    console.log(`[INFO] 创建目录: ${ICONS_DIR}`);
  }

  const items = collectItemIds(RECIPES_PATH);
  console.log(`[INFO] 开始下载 ${items.length} 个图标，每个间隔 10 秒`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < items.length; i++) {
    const itemId = items[i];

    // 非第一个 item，等待 10 秒
    if (i > 0) {
      console.log(`[WAIT] 等待 10 秒...`);
      await sleep(5000);
    }

    const prefix = `[${i + 1}/${items.length}]`;

    try {
      console.log(`${prefix} 正在获取 Item#${itemId} 的图标路径...`);
      const pathHr1 = await fetchIconPath(itemId);
      console.log(`${prefix}  path_hr1 = ${pathHr1}`);

      console.log(`${prefix}  正在下载图片...`);
      const savedPath = await downloadIcon(itemId, pathHr1);
      console.log(`${prefix}  ✓ 已保存: ${savedPath}`);

      successCount++;
    } catch (err) {
      console.error(`${prefix}  ✗ Item#${itemId} 处理失败: ${err.message}`);
      failCount++;
    }
  }

  console.log(`\n[完成] 成功: ${successCount}, 失败: ${failCount}`);
}

main().catch((err) => {
  console.error('[FATAL] 脚本异常:', err);
  process.exit(1);
});

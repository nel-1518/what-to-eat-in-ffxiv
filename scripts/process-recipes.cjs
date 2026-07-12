/**
 * FFXIV 配方 CSV → JSON 转换脚本
 *
 * 功能:
 *   1. 从 Recipe.csv 中过滤 CraftType == 7（制作食物）的配方
 *   2. 获取 Item{Result} 及其配料 Item{Ingredient}[x]
 *   3. 从 Item.csv 查询物品名称、描述、图标
 *   4. 输出 JSON: { item, name, Description, Icon, Ingredient[], RecipeNotebookList }
 *
 * 用法:
 *   node scripts/process-recipes.cjs <Recipe.csv路径> <Item.csv路径>
 *
 * 输出到 public/data/recipes.json
 */

const fs = require('fs');
const path = require('path');

const CSV_DELIMITER = ',';

// 需要排除的 RecipeNotebookList 值
const EXCLUDED_RECIPE_NOTEBOOKS = [
  // 蛮族
  // 1143, 1151, 1159, 1527, 1439,
  // // 老主顾
  // 1175, 1183, 1191, 1543, 1167, 1111, 1199, 1247, 1263, 1239, 1303, 1407, 1431, 1455, 1511, 1487, 1135,
  // // 收藏品
  // 1319, 1343, 1271, 1463, 1279,
  // // 重建、肝武、宇宙
  // 1207, 1231, 1503, 1535, 1063, 1447,
  // // 染剂
  // 1095,
];

// 需要排除的成品名称（正则表达式字符串）
const EXCLUDED_NAME_PATTERNS = [
  /组合/,
  "三明治篮子",
  "早餐蛋包饭",
  "面包篮",
  "蛋糕托盘",
  "辛辣蛋沙拉碗",
  "仙子苹果篮子",
  "切开的西瓜",
  "鳗鱼食盒",
  "巧克力马克杯",
  "松软煎饼套餐",
  "风干火腿",
];

// 默认输出目录（脚本位于 scripts/，项目根目录的 public/data/）
const DEFAULT_OUT_DIR = path.resolve(__dirname, '..', 'public', 'data');

// ====== CSV 解析（支持引号内换行） ======

/**
 * 将整个 CSV 文本拆分成行数组，正确处理引号内的换行符
 */
function splitCSVLines(text) {
  const lines = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          current += '""';
          i++;
        } else {
          inQuotes = false;
          current += '"';
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        current += '"';
      } else if (ch === '\n') {
        lines.push(current);
        current = '';
      } else if (ch === '\r') {
        if (i + 1 < text.length && text[i + 1] === '\n') {
          i++;
        }
        lines.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
  }
  if (current.length > 0) {
    lines.push(current);
  }
  return lines;
}

/**
 * 解析一行 CSV，处理引号包裹的字段
 */
function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === CSV_DELIMITER) {
        fields.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
  }
  fields.push(current);
  return fields;
}

// ====== 主逻辑 ======

function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('用法: node scripts/process-recipes.cjs <Recipe.csv路径> <Item.csv路径> [输出目录]');
    process.exit(1);
  }

  const recipePath = path.resolve(args[0]);
  const itemPath = path.resolve(args[1]);
  const outDir = args[2] ? path.resolve(args[2]) : DEFAULT_OUT_DIR;

  if (!fs.existsSync(recipePath)) {
    console.error(`错误: 文件不存在 — ${recipePath}`);
    process.exit(1);
  }
  if (!fs.existsSync(itemPath)) {
    console.error(`错误: 文件不存在 — ${itemPath}`);
    process.exit(1);
  }

  fs.mkdirSync(outDir, { recursive: true });

  // ========== 1. 解析 Item.csv ==========
  console.log('📖 读取 Item.csv ...');
  const itemText = fs.readFileSync(itemPath, 'utf-8');
  const itemRawLines = splitCSVLines(itemText);

  if (itemRawLines.length < 3) {
    console.error('错误: Item.csv 格式不正确');
    process.exit(1);
  }

  const itemHeaders = parseCSVLine(itemRawLines[1]); // 第2行: 列名

  // 建立列名 → 索引 映射
  const itemColumnMap = {};
  for (let i = 0; i < itemHeaders.length; i++) {
    itemColumnMap[itemHeaders[i]] = i;
  }

  // Item.csv 关键列索引
  const COL_ITEM_ID = itemColumnMap['#'];           // 物品ID
  const COL_SINGULAR = itemColumnMap['Singular'];    // 物品名称（单数）
  const COL_DESC = itemColumnMap['Description'];     // 描述
  const COL_ICON = itemColumnMap['Icon'];            // 图标

  // 读取所有物品数据到 Map
  const itemMap = new Map(); // key: itemId → { name, description, icon }
  for (let i = 3; i < itemRawLines.length; i++) {
    const line = itemRawLines[i].trim();
    if (line.length === 0) continue;

    const fields = parseCSVLine(line);
    const id = fields[COL_ITEM_ID] || '';
    if (id === '' || id === '0') continue;

    itemMap.set(id, {
      name: fields[COL_SINGULAR] || '',
      description: fields[COL_DESC] || '',
      icon: fields[COL_ICON] || '',
    });
  }

  console.log(`✔ Item.csv 共加载 ${itemMap.size} 个物品`);

  // ========== 2. 解析 Recipe.csv ==========
  console.log('📖 读取 Recipe.csv ...');
  const recipeText = fs.readFileSync(recipePath, 'utf-8');
  const recipeRawLines = splitCSVLines(recipeText);

  if (recipeRawLines.length < 3) {
    console.error('错误: Recipe.csv 格式不正确');
    process.exit(1);
  }

  const recipeHeaders = parseCSVLine(recipeRawLines[1]); // 第2行: 列名

  const recipeColumnMap = {};
  for (let i = 0; i < recipeHeaders.length; i++) {
    recipeColumnMap[recipeHeaders[i]] = i;
  }

  const COL_CRAFT_TYPE = recipeColumnMap['CraftType'];
  const COL_RESULT = recipeColumnMap['Item{Result}'];
  const COL_AMOUNT_RESULT = recipeColumnMap['Amount{Result}'];
  const COL_RECIPE_NOTEBOOK = recipeColumnMap['RecipeNotebookList'];

  // Item{Ingredient}[0] 到 [7] 及对应 Amount
  const ingredientItemCols = [];
  const ingredientAmountCols = [];
  for (let i = 0; i <= 7; i++) {
    const itemCol = `Item{Ingredient}[${i}]`;
    const amountCol = `Amount{Ingredient}[${i}]`;
    if (itemCol in recipeColumnMap && amountCol in recipeColumnMap) {
      ingredientItemCols.push(recipeColumnMap[itemCol]);
      ingredientAmountCols.push(recipeColumnMap[amountCol]);
    }
  }

  console.log(`   检测到 ${ingredientItemCols.length} 个配料列`);

  // ========== 3. 过滤 CraftType == 7 的配方 ==========
  const results = [];

  for (let i = 3; i < recipeRawLines.length; i++) {
    const line = recipeRawLines[i].trim();
    if (line.length === 0) continue;

    const fields = parseCSVLine(line);

    // 检查 CraftType
    const craftType = fields[COL_CRAFT_TYPE] || '';
    if (craftType !== '7') continue;

    const resultId = fields[COL_RESULT] || '';
    if (resultId === '' || resultId === '0') continue;

    // 过滤产量大于 3 的配方（多为半成品）
    // const amountResult = parseInt(fields[COL_AMOUNT_RESULT] || '0', 10);
    // if (amountResult > 3) continue;

    // 获取成品的名称、描述、图标
    const resultItem = itemMap.get(resultId);
    if (!resultItem) {
      console.warn(`⚠ 警告: 成品物品 ${resultId} 在 Item.csv 中未找到，跳过`);
      continue;
    }

    // 按名称正则排除
    const resultName = resultItem.name;
    if (EXCLUDED_NAME_PATTERNS.some(pattern => new RegExp(pattern).test(resultName))) {
      continue;
    }

    // 过滤不含食物经验加成描述的配方
    if (!resultItem.description.includes('打倒敌人时、制作时以及采集时')) {
      continue;
    }

    // 收集配料
    const ingredients = [];
    for (let j = 0; j < ingredientItemCols.length; j++) {
      const ingId = fields[ingredientItemCols[j]] || '';
      const ingAmount = fields[ingredientAmountCols[j]] || '';
      if (ingId === '' || ingId === '0' || ingId === '-1') continue;

      const ingItem = itemMap.get(ingId);
      if (!ingItem) {
        console.warn(`⚠ 警告: 配料物品 ${ingId} 在 Item.csv 中未找到，跳过`);
        continue;
      }

      ingredients.push(`${ingItem.name}x${ingAmount}`);
    }

    const recipeNotebookList = fields[COL_RECIPE_NOTEBOOK] || '';
    const recipeNotebookListNum = parseInt(recipeNotebookList, 10) || 0;

    // 排除指定的 RecipeNotebookList
    // if (EXCLUDED_RECIPE_NOTEBOOKS.includes(recipeNotebookListNum)) {
    //   continue;
    // }

    // 过滤配料数小于等于 2 的半成品配方
    // if (ingredients.length <= 2) continue;

    results.push({
      item: parseInt(resultId, 10),
      name: resultItem.name,
      description: resultItem.description.split('\n')[0],
      icon: parseInt(resultItem.icon, 10) || 0,
      recipeNotebookList: recipeNotebookListNum,
      ingredient: ingredients,
    });
  }

  // ========== 4. 输出 JSON ==========
  const outPath = path.join(outDir, 'recipes.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf-8');
  
  console.log(`✔ 完成！共处理 ${results.length} 条食物配方`);
  console.log(`✔ 数据文件: ${outPath}`);
}

main();

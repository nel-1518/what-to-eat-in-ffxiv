/** 食谱数据项（来自 by-tag 目录的 JSON） */
export interface RecipeItem {
  /** 物品 ID */
  item: number
  /** 物品名称 */
  name: string
  /** 物品描述 */
  description: string
  /** 图标 ID，对应 /public/data/icons/{icon}.jpg */
  icon: number
  /** 配方手册 ID（0=基础配方） */
  recipeNotebookList: number
  /** 配料列表 */
  ingredient: string[]
  /** 分类标签（可能多个，如 ["肉类", "汤品"]） */
  tag: string[]
  /** 热量（卡路里） */
  calories: number
}

/** 今日菜谱方案：每组选出一道菜 */
export interface MealPlan {
  /** 四道菜的数组 */
  dishes: RecipeItem[]
  /** 总热量 */
  totalCalories: number
  /** 生成时间戳 */
  timestamp: number
}

/** 进度提示组 */
export interface ProgressTipGroup {
  /** 提示组 ID */
  id: number
  /** 该组包含的多条离谱提示 */
  tips: string[]
}

/** 点餐语义搜索结果项（来自 /api/recipes/search） */
export interface OrderResultItem {
  /** 物品 ID（也是图标文件名：/data/icons/{id}.jpg） */
  id: number
  /** 物品名称 */
  name: string
  /** 图标 ID（仅展示用；图标文件按 id 命名，勿用此字段拼路径） */
  icon: number
  /** 物品描述 */
  description: string
  /** 配料列表 */
  ingredient: string[]
  /** 余弦相似度（0~1） */
  score: number
}

/** 点餐搜索接口响应 */
export interface OrderSearchResponse {
  /** 相似度最高的菜品列表 */
  items: OrderResultItem[]
}

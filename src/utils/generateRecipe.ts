import type { RecipeItem, MealPlan, ProgressTipGroup, OrderSearchResponse } from '../types'
import { MEAL_GROUPS, ORDER_API_BASE } from '../constants'
import { assetUrl } from './path'

/** 按标签名加载 JSON 数据 */
async function fetchRecipesByTag(tag: string): Promise<RecipeItem[]> {
  const response = await fetch(assetUrl(`/data/by-tag/${tag}.json`))
  if (!response.ok) {
    throw new Error(`加载 ${tag} 数据失败: ${response.status}`)
  }
  return response.json()
}

/** 加载进度提示数据 */
export async function fetchProgressTips(): Promise<ProgressTipGroup[]> {
  const response = await fetch(assetUrl('/data/progress-tips.json'))
  if (!response.ok) {
    // 如果加载失败，返回默认提示
    return [
      { id: 0, tips: ['正在准备菜谱...', '请稍候...', '即将完成...', '马上就好...'] },
    ]
  }
  return response.json()
}

/**
 * 从数组中随机取一项
 */
function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * 生成今日菜谱方案
 * 从四组分类中各随机选 1 道菜，保证不重复
 */
export async function generateMealPlan(): Promise<MealPlan> {
  // 1) 每组先随机选一个标签（如"配菜/肉类/沙拉/汤品" → 随机选其一）
  const selectedTags = MEAL_GROUPS.map((group) => randomPick(group.tags))

  // 2) 只请求选中的 4 个标签数据
  const results = await Promise.all(
    selectedTags.map(async (tag) => {
      const data = await fetchRecipesByTag(tag)
      return { tag, data }
    }),
  )

  // 3) 从每个标签中随机选一道菜，全局去重
  const selectedNames = new Set<string>()
  const dishes: RecipeItem[] = []

  for (const { data } of results) {
    let dish: RecipeItem | null = null
    for (let retry = 0; retry < 50; retry++) {
      const candidate = data[Math.floor(Math.random() * data.length)]
      if (candidate && !selectedNames.has(candidate.name)) {
        dish = candidate
        break
      }
    }
    if (dish) {
      selectedNames.add(dish.name)
      dishes.push(dish)
    }
  }

  // 计算总热量
  const totalCalories = dishes.reduce((sum, d) => sum + (d.calories || 0), 0)

  return {
    dishes,
    totalCalories,
    timestamp: Date.now(),
  }
}

/**
 * 加载所有饮品名称（供老虎机动画滚动使用）
 */
export async function fetchAllDrinkNames(): Promise<string[]> {
  const data = await fetchRecipesByTag('饮品')
  return data.map((item) => item.name)
}

/**
 * 生成今日饮品方案
 * 从饮品数据中随机选 1 项
 */
export async function generateDrinkPlan(): Promise<MealPlan> {
  const data = await fetchRecipesByTag('饮品')
  const drink = data[Math.floor(Math.random() * data.length)]

  return {
    dishes: [drink],
    totalCalories: drink?.calories || 0,
    timestamp: Date.now(),
  }
}

/**
 * 点餐语义搜索：提示词 → how-much-history 后端嵌入匹配 → Top 5 菜品
 * @param prompt 提示词（1~50 字）
 * @returns 相似度最高的菜品列表
 */
export async function searchRecipes(prompt: string): Promise<OrderSearchResponse['items']> {
  const response = await fetch(`${ORDER_API_BASE}/api/recipes/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  })
  if (!response.ok) {
    let detail = ''
    try {
      const body = (await response.json()) as { error?: string }
      detail = body.error ? `：${body.error}` : ''
    } catch {
      // 忽略响应体解析失败，仅用状态码
    }
    throw new Error(`点餐请求失败 (${response.status})${detail}`)
  }
  const data = (await response.json()) as OrderSearchResponse
  return data.items ?? []
}

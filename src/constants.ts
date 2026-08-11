import type { RecipeItem } from './types'

/** 点餐语义搜索接口地址（how-much-history 后端） */
// export const ORDER_API_BASE: string = 'https://ffxiv-api.neeeel.com'
export const ORDER_API_BASE: string = 'http://localhost:5174'

/** 点餐预置提示词：点击后自动填入输入框并请求 */
export const PRESET_ORDER_PROMPTS: string[] = [
  '明天早上吃什么？',
  '一份健康早餐',
  '好友聚会',
  '我想吃烧烤！',
  '我想吃海鲜！',
  '有什么饭后甜点？',
  '适合夏日的冷饮~',
  '适合小朋友的果汁',  
  '伊修加德风格的食物',
  '家常小炒有哪些？',
  '来2^32杯咖啡',
  '来一份炒饭',
  '只要素食',
  '意大利面拌42号混凝土',
  '我要一些火腿和鸡蛋、一块上好的炸牛排加上所有的配菜、再浇上浓浓的汁',
]

/** 四组分类映射：每组包含的标签列表 */
export const MEAL_GROUPS: { label: string; tags: string[] }[] = [
  { label: '主食', tags: ['主食'] },
  { label: '配菜', tags: ['配菜', '肉类', '沙拉', '汤品'] },
  { label: '饮品', tags: ['饮品'] },
  { label: '零食/甜点', tags: ['零食', '甜点'] },
]

/** 每组对应的标签中文名（界面展示用） */
export const GROUP_LABELS: Record<string, string> = {
  主食: '🍚 主食',
  配菜: '🥗 配菜',
  肉类: '🥩 肉类',
  沙拉: '🥬 沙拉',
  汤品: '🍲 汤品',
  饮品: '🥤 饮品',
  零食: '🍪 零食',
  甜点: '🍰 甜点',
}

/** 进度条持续总时间（毫秒） */
export const PROGRESS_DURATION = 15000

/** 进度提示切换间隔（毫秒） */
export const TIP_INTERVAL = 3000

/** 生成失败概率（0~1） */
export const FAILURE_RATE = 0.05

/** 1拉 = 50kcal */
export const KCAL_PER_LA = 50

/** 将 kcal 转换为拉 */
export function kcalToLa(kcal: number): number {
  return Math.round(kcal / KCAL_PER_LA)
}

/** 根据菜品的 tag 返回对应的组标签名 */
export function getGroupLabel(tags: string[]): string {
  for (const group of MEAL_GROUPS) {
    for (const tag of tags) {
      if (group.tags.includes(tag)) {
        return group.label
      }
    }
  }
  return tags[0] || '未知'
}

/** 按标签从数据中筛选对应菜品 */
export function filterByTag(items: RecipeItem[], tags: string[]): RecipeItem[] {
  return items.filter((item) =>
    item.tag.some((t) => tags.includes(t)),
  )
}

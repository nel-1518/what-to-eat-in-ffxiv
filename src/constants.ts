import type { RecipeItem } from './types'

/** 四组分类映射：每组包含的标签列表 */
export const MEAL_GROUPS: { label: string; tags: string[] }[] = [
  { label: '主食', tags: ['主食'] },
  { label: '配菜/肉类/沙拉/汤品', tags: ['配菜', '肉类', '沙拉', '汤品'] },
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

import { useRef, useState, useEffect } from 'react'
import { Card, Tag, Button, Typography, Statistic, Space, Image, Badge, Tooltip } from 'antd'
import {
  ReloadOutlined,
  FireOutlined,
  LinkOutlined,
} from '@ant-design/icons'
import type { MealPlan } from '../types'
import { GROUP_LABELS, getGroupLabel, kcalToLa } from '../constants'
import { assetUrl } from '../utils/path'

const { Text, Title } = Typography

interface RecipeResultProps {
  /** 今日菜谱方案 */
  mealPlan: MealPlan
  /** 重新生成回调 */
  onRegenerate: () => void
}

/**
 * 菜谱结果展示组件
 * 展示四道菜 + 总热量 + 操作按钮
 */
function RecipeResult({
  mealPlan,
  onRegenerate,
}: RecipeResultProps) {
  const resultRef = useRef<HTMLDivElement>(null)
  const [cardMinHeight, setCardMinHeight] = useState(0)

  // 同步所有卡片的最小高度（取最高卡片）
  useEffect(() => {
    if (!resultRef.current) return

    const updateHeights = () => {
      const container = resultRef.current
      if (!container) return
      const cards = container.querySelectorAll<HTMLElement>('.recipe-grid > div')
      if (cards.length === 0) return
      const max = Array.from(cards).reduce(
        (maxH, el) => Math.max(maxH, el.getBoundingClientRect().height),
        0,
      )
      setCardMinHeight(max)
    }

    // 等待 DOM 渲染完成后再测量
    const raf = requestAnimationFrame(() => {
      updateHeights()
    })

    // 窗口/内容变化时重新测量
    const ro = new ResizeObserver(() => {
      requestAnimationFrame(updateHeights)
    })
    ro.observe(resultRef.current)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [mealPlan])

  // 图标路径
  const getIconPath = (icon: number) => assetUrl(`/data/icons/${icon}.jpg`)

  // 获取分类标签对象
  const getRecipeTags = (tags: string[]) => {
    const groupLabel = getGroupLabel(tags)
    return {
      groupLabel,
      color: getTagColor(groupLabel),
    }
  }

  // 标签颜色映射
  const getTagColor = (label: string) => {
    const colorMap: Record<string, string> = {
      '主食': 'orange',
      '配菜': 'red',
      '饮品': 'blue',
      '零食/甜点': 'purple',
    }
    return colorMap[label] || 'default'
  }

  return (
    <div ref={resultRef} style={{ marginTop: 32 }}>
      {/* 总热量统计 */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <Statistic
          title="今日摄入总热量"
          value={kcalToLa(mealPlan.totalCalories)}
          suffix="La"
        styles={{
          content: { color: 'var(--color-accent)', fontSize: 36, fontWeight: 'bold' },
        }}
          prefix={<FireOutlined />}
        />
        <div>
          <Text type="secondary" style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            🔸 约为成年拉拉菲尔族步行 {kcalToLa(mealPlan.totalCalories)} 星里所消耗的热量
          </Text>
        </div>
      </div>

      {/* 四道菜卡片网格 */}
      <div className="recipe-grid">
        {mealPlan.dishes.map((dish) => {
          const { groupLabel, color } = getRecipeTags(dish.tag)
          return (
            <div key={dish.item}>
              <Badge.Ribbon
                text={groupLabel}
                color={color === 'orange' ? '#d4a843' : color}
              >
                <Card
                  style={{
                    background: 'var(--color-bg-card)',
                    border: '1px solid var(--color-border)',
                    height: '100%',
                    minHeight: cardMinHeight || undefined,
                    cursor: 'default',
                  }}
                  styles={{
                    body: {
                      padding: 30,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      height: '100%',
                    },
                  }}
                >
                  {/* 图标 */}
                  <Image
                    src={getIconPath(dish.item)}
                    alt={dish.name}
                    width={80}
                    height={80}
                    style={{
                      borderRadius: 8,
                      objectFit: 'cover',
                      border: '2px solid var(--color-accent)',
                    }}
                    fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect fill='%23333' width='80' height='80'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-size='10'%3E暂无图标%3C/text%3E%3C/svg%3E"
                    preview={false}
                  />

                  {/* 菜名 */}
                  <Title level={5} style={{ margin: '8px 0 4px', color: 'var(--color-accent)', fontSize: 18 }}>
                    {dish.name}
                  </Title>

                  {/* 描述 */}
                  <Text
                    type="secondary"
                    style={{
                      fontSize: 15,
                      textAlign: 'center',
                      display: 'block',
                      lineHeight: 1.4,
                    }}
                  >
                    {dish.description}
                  </Text>

                  {/* 热量 + 标签 */}
                  <Space style={{ marginTop: 8 }} size={4}>
                    <Tag color="volcano" icon={<FireOutlined />}>
                      约 {kcalToLa(dish.calories)} La
                    </Tag>
                    {dish.tag.map((t) => (
                      <Tag key={t} style={{ fontSize: 14 }}>
                        {GROUP_LABELS[t] || t}
                      </Tag>
                    ))}
                    <Tag
                      style={{ fontSize: 14, cursor: 'pointer' }}
                      onClick={() => window.open(`https://ff14.huijiwiki.com/wiki/物品:${encodeURIComponent(dish.name)}`, '_blank')}
                    >
                      <LinkOutlined /> WIKI
                    </Tag>
                  </Space>

                  {/* 配料（完整显示所有食材） */}
                  {dish.ingredient && dish.ingredient.length > 0 && (
                    <Tooltip title={`食材: ${dish.ingredient.join('、')}`}>
                      <Text
                        type="secondary"
                        style={{
                          fontSize: 12,
                          marginTop: 4,
                          textAlign: 'center',
                          color: 'var(--color-text-muted)',
                          lineHeight: 1.4,
                          opacity: 0.65,
                        }}
                      >
                        食材: {dish.ingredient.slice(0, 3).join('、')}
                        {dish.ingredient.length > 3 ? '...' : ''}
                      </Text>
                    </Tooltip>
                  )}
                </Card>
              </Badge.Ribbon>
            </div>
          )
        })}
      </div>

      {/* 操作按钮 */}
      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Space size={16}>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            size="large"
            onClick={onRegenerate}
            style={{ fontWeight: 'bold' }}
          >
            重新生成
          </Button>

        </Space>
      </div>
    </div>
  )
}

export default RecipeResult

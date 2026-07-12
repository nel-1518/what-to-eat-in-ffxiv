import { Card, Tag, Button, Typography, Space, Image, Badge } from 'antd'
import {
  ReloadOutlined,
  ShareAltOutlined,
  LinkOutlined,
} from '@ant-design/icons'
import type { RecipeItem } from '../types'
import { GROUP_LABELS, getGroupLabel } from '../constants'

const { Text, Title } = Typography

interface DrinkResultProps {
  /** 选中饮品的完整数据 */
  drink: RecipeItem
  /** 重新生成回调 */
  onRegenerate: () => void
  /** 导出分享图回调 */
  onExport: () => void
  /** 是否正在导出 */
  exporting?: boolean
}

/**
 * 单饮品结果卡片组件
 * 展示饮品信息 + 操作按钮，风格与 RecipeResult 一致
 */
function DrinkResult({
  drink,
  onRegenerate,
  onExport,
  exporting = false,
}: DrinkResultProps) {
  const groupLabel = getGroupLabel(drink.tag)
  const tagColor = (() => {
    const colorMap: Record<string, string> = {
      '主食': 'orange',
      '配菜': 'red',
      '饮品': 'blue',
      '零食/甜点': 'purple',
    }
    return colorMap[groupLabel] || 'default'
  })()

  return (
    <div style={{ marginTop: 32 }}>
      {/* 单饮品卡片 */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ maxWidth: 400, width: '100%' }}>
          <Badge.Ribbon
            text={groupLabel}
            color={tagColor === 'orange' ? '#d4a843' : tagColor}
          >
            <Card
              style={{
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                cursor: 'default',
              }}
              styles={{
                body: {
                  padding: 30,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                },
              }}
            >
              {/* 图标 */}
              <Image
                src={`/data/icons/${drink.item}.jpg`}
                alt={drink.name}
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

              {/* 名称 */}
              <Title level={5} style={{ margin: '8px 0 4px', color: 'var(--color-accent)', fontSize: 18 }}>
                {drink.name}
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
                {drink.description}
              </Text>

              {/* 标签 */}
              <Space style={{ marginTop: 8 }} size={4}>
                {drink.tag.map((t) => (
                  <Tag key={t} style={{ fontSize: 14 }}>
                    {GROUP_LABELS[t] || t}
                  </Tag>
                ))}
                <Tag
                  style={{ fontSize: 14, cursor: 'pointer' }}
                  onClick={() => window.open(`https://ff14.huijiwiki.com/wiki/物品:${encodeURIComponent(drink.name)}`, '_blank')}
                >
                  <LinkOutlined /> WIKI
                </Tag>
              </Space>

              {/* 配料 */}
              {drink.ingredient && drink.ingredient.length > 0 && (
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
                  食材: {drink.ingredient.join('、')}
                </Text>
              )}
            </Card>
          </Badge.Ribbon>
        </div>
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
            再来一杯
          </Button>
          <Button
            icon={<ShareAltOutlined />}
            size="large"
            onClick={onExport}
            loading={exporting}
            style={{ fontWeight: 'bold' }}
          >
            分享结果
          </Button>
        </Space>
      </div>
    </div>
  )
}

export default DrinkResult

import { Card, Button, Typography, Space, Image, Tooltip, Tag } from 'antd'
import { LinkOutlined } from '@ant-design/icons'
import type { OrderResultItem } from '../types'
import { assetUrl } from '../utils/path'

const { Text, Title } = Typography

interface OrderResultProps {
  /** 点餐搜索结果 */
  items: OrderResultItem[]
  /** 用户输入的提示词 */
  prompt: string
  /** 返回重新点餐 */
  onBack: () => void
}

/** 图片加载失败时的占位 SVG（与现有卡片一致） */
const IMG_FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect fill='%23333' width='80' height='80'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-size='10'%3E暂无图标%3C/text%3E%3C/svg%3E"

/**
 * 点餐结果组件：每行一张横向卡片（图标左、文字右）。
 * 无右上角分类标识、不展示相似度，风格与其他页面保持一致。
 */
function OrderResult({ items, prompt, onBack }: OrderResultProps) {
  return (
    <div style={{ marginTop: 32, width: '100%', maxWidth: 720 }}>
      {/* 结果标题：用户输入的提示词 + 引导文案 */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0, color: 'var(--color-accent)' }}>
          为你找到这些
        </Title>
        {prompt && (
          <Text
            type="secondary"
            style={{
              display: 'block',
              marginTop: 4,
              fontSize: 14,
              color: 'var(--color-text-muted)',
            }}
          >
            「{prompt}」
          </Text>
        )}
      </div>

      {/* 结果卡片列表 */}
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        {items.map((item) => (
          <Card
            key={item.id}
            style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              cursor: 'default',
            }}
            styles={{
              body: {
                padding: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              },
            }}
          >
            {/* 图标（注意：用 id 拼路径，图标文件按 itemId 命名；icon 字段无对应文件） */}
            <Image
              src={assetUrl(`/data/icons/${item.id}.jpg`)}
              alt={item.name}
              width={72}
              height={72}
              style={{
                borderRadius: 8,
                objectFit: 'cover',
                border: '2px solid var(--color-accent)',
                flexShrink: 0,
              }}
              fallback={IMG_FALLBACK}
              preview={false}
            />

            {/* 右侧文字 */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* 名称 + WIKI 链接（同行） */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  minWidth: 0,
                }}
              >
                <Title
                  level={5}
                  style={{
                    margin: 0,
                    color: 'var(--color-accent)',
                    fontSize: 16,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {item.name}
                </Title>
                <Tag
                  style={{
                    fontSize: 12,
                    cursor: 'pointer',
                    margin: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    flexShrink: 0,
                  }}
                  onClick={() =>
                    window.open(
                      `https://ff14.huijiwiki.com/wiki/物品:${encodeURIComponent(item.name)}`,
                      '_blank',
                    )
                  }
                >
                  <LinkOutlined /> WIKI
                </Tag>
              </div>

              {/* 描述 */}
              <Text
                type="secondary"
                style={{
                  fontSize: 14,
                  display: 'block',
                  lineHeight: 1.4,
                  marginTop: 2,
                }}
              >
                {item.description}
              </Text>

              {/* 配料 */}
              {item.ingredient && item.ingredient.length > 0 && (
                <Tooltip title={`食材: ${item.ingredient.join('、')}`}>
                  <Text
                    type="secondary"
                    style={{
                      fontSize: 12,
                      display: 'block',
                      color: 'var(--color-text-muted)',
                      lineHeight: 1.4,
                      opacity: 0.65,
                      marginTop: 4,
                    }}
                  >
                    食材: {item.ingredient.slice(0, 3).join('、')}
                    {item.ingredient.length > 3 ? '...' : ''}
                  </Text>
                </Tooltip>
              )}
            </div>
          </Card>
        ))}
      </Space>

      {/* 操作按钮 */}
      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Space size={16}>
          <Button
            type="primary"
            icon={
              <span
                style={{
                  display: 'inline-block',
                  width: '1em',
                  height: '1em',
                  background: 'currentColor',
                  mask: `url(${assetUrl('/CommandChange.svg')}) center/contain no-repeat`,
                  WebkitMask: `url(${assetUrl('/CommandChange.svg')}) center/contain no-repeat`,
                  verticalAlign: '-0.125em',
                }}
              />
            }
            size="large"
            onClick={onBack}
            style={{ fontWeight: 'bold' }}
          >
            换个想法
          </Button>
        </Space>
      </div>
    </div>
  )
}

export default OrderResult

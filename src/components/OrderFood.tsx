import { useState, useCallback, useRef } from 'react'
import { Button, Input, Space, Spin, Typography, message } from 'antd'
import { ArrowUpOutlined } from '@ant-design/icons'
import type { OrderResultItem } from '../types'
import { PRESET_ORDER_PROMPTS } from '../constants'
import { searchRecipes } from '../utils/generateRecipe'
import OrderResult from './OrderResult'

const { Title, Text } = Typography

/** 点餐页状态：input=输入提示词 / loading=请求中 / result=展示结果 */
type OrderState = 'input' | 'loading' | 'result'

/** 加载动画最短展示时长（毫秒），避免结果一闪而过 */
const MIN_LOADING_MS = 1500

/**
 * 点餐页面：AI 语义搜索菜品。
 * 输入提示词（≤50 字）→ 请求后端嵌入匹配 → 返回 Top 5 横向卡片。
 * 由 App 条件渲染控制挂载/卸载，切换 tab 后重新进入即回到输入态。
 */
function OrderFood() {
  const [state, setState] = useState<OrderState>('input')
  const [prompt, setPrompt] = useState('')
  const [items, setItems] = useState<OrderResultItem[]>([])
  const [searching, setSearching] = useState(false)
  // 当前展示的预置提示词（初始随机选一条）
  const [currentPreset, setCurrentPreset] = useState(
    () => PRESET_ORDER_PROMPTS[Math.floor(Math.random() * PRESET_ORDER_PROMPTS.length)],
  )
  // 最近一次搜索的提示词：loading 页展示用
  const lastPromptRef = useRef('')

  /** 发起搜索：空提示词提示；>50 字由输入框 maxLength 拦截；加载动画至少展示 1 秒 */
  const doSearch = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (trimmed === '') {
        message.warning('还没有输入内容哦')
        return
      }
      setSearching(true)
      setState('loading')
      lastPromptRef.current = trimmed
      const startedAt = Date.now()
      try {
        const result = await searchRecipes(trimmed)
        // 若请求提前返回，补齐剩余时间再展示结果，保证 loading 至少 1 秒
        const elapsed = Date.now() - startedAt
        if (elapsed < MIN_LOADING_MS) {
          await new Promise((resolve) => setTimeout(resolve, MIN_LOADING_MS - elapsed))
        }
        setItems(result)
        setState('result')
      } catch (err) {
        // 失败不强制等待，直接提示并回到输入页
        message.error(err instanceof Error ? err.message : '点餐请求失败，请重试')
        setState('input')
      } finally {
        setSearching(false)
      }
    },
    [],
  )

  // 提交按钮
  const handleSubmit = useCallback(() => {
    void doSearch(prompt)
  }, [prompt, doSearch])

  // 随机切换当前预置提示词（避免与当前相同）；返回新的提示词
  const swapPreset = useCallback((prev: string): string => {
    if (PRESET_ORDER_PROMPTS.length <= 1) return prev
    let next = prev
    while (next === prev) {
      next = PRESET_ORDER_PROMPTS[Math.floor(Math.random() * PRESET_ORDER_PROMPTS.length)]
    }
    return next
  }, [])

  // 点击预置提示词：自动填入并立即请求；提交后随机换一条预置提示词
  const handlePreset = useCallback(
    (preset: string) => {
      setPrompt(preset)
      setCurrentPreset((prev) => swapPreset(prev))
      void doSearch(preset)
    },
    [doSearch, swapPreset],
  )

  // 换一换：随机切换当前预置提示词，不触发请求
  const handleSwapPreset = useCallback(() => {
    setCurrentPreset((prev) => swapPreset(prev))
  }, [swapPreset])

  // 返回重新点餐
  const handleBack = useCallback(() => {
    setItems([])
    setState('input')
  }, [])

  return (
    <>
      {/* 输入页 */}
      <div className={`page-transition ${state === 'input' ? 'page-enter' : 'page-exit'}`}>
        {state === 'input' && (
          <div className="order-input-area">
            <Title level={1} className="app-title order-title">
              想来点什么?
            </Title>
            <Text type="secondary" className="app-subtitle">
              一句话描述你的口味
            </Text>
            <Text className="app-quote">
              这独特的气味……是黄金松露吧。<br />
              如果能烤得恰到好处，就不会有臭味了。
              <span className="quote-attribution">希尔迪布兰德</span>
            </Text>

            {/* 预置提示词（输入框上方一条，靠左；右侧换一换随机切换） */}
            <div className="order-presets">
              <Button
                size="small"
                className="order-preset-btn"
                onClick={() => handlePreset(currentPreset)}
                disabled={searching}
              >
                {currentPreset}
              </Button>
              <span className="order-preset-swap" onClick={handleSwapPreset} role="button">
                换一换
              </span>
            </div>

            {/* 输入框 + 提交（Space.Compact 组合，输入框与圆形按钮连体） */}
            <div className="order-input-row">
              <Space.Compact size="large" style={{ width: '100%' }}>
                <Input
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onPressEnter={handleSubmit}
                  maxLength={50}
                  placeholder="例如：想吃辣的"
                  className="order-input"
                  disabled={searching}
                  allowClear
                />
                <Button
                  type="primary"
                  icon={<ArrowUpOutlined />}
                  onClick={handleSubmit}
                  loading={searching}
                  className="order-submit-btn"
                  aria-label="提交点餐"
                />
              </Space.Compact>
            </div>
          </div>
        )}
      </div>

      {/* 加载页 */}
      <div className={`page-transition ${state === 'loading' ? 'page-enter' : 'page-exit'}`}>
        {state === 'loading' && (
          <div className="order-loading">
            <Spin size="large" />
            <Text className="order-loading-text">骑师傅烹饪中...</Text>
            <Text type="secondary" className="order-loading-hint">
              {lastPromptRef.current ? `「${lastPromptRef.current}」` : ''}
            </Text>
          </div>
        )}
      </div>

      {/* 结果页 */}
      <div className={`page-transition ${state === 'result' ? 'page-enter' : 'page-exit'}`}>
        {state === 'result' && items.length > 0 && (
          <OrderResult
            items={items}
            prompt={lastPromptRef.current}
            onBack={handleBack}
          />
        )}
        {state === 'result' && items.length === 0 && (
          <div className="order-empty">
            <Text type="secondary">没有找到合适的菜品，换个说法试试？</Text>
            <div style={{ marginTop: 16 }}>
              <Button type="primary" onClick={handleBack}>
                换个想法
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default OrderFood

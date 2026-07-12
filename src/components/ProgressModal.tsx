import { useState, useEffect, useRef, useCallback } from 'react'
import { Progress, Button, Typography } from 'antd'
import { WarningOutlined } from '@ant-design/icons'
import type { ProgressTipGroup } from '../types'
import { PROGRESS_DURATION, FAILURE_RATE } from '../constants'

const { Text } = Typography

interface ProgressViewProps {
  /** 是否可见 */
  visible: boolean
  /** 提示组列表 */
  tipGroups: ProgressTipGroup[]
  /** 进度完成回调（成功时） */
  onComplete: () => void
  /** 生成失败回调 */
  onFail: () => void
}

/**
 * 全屏进度视图组件
 * 点击按钮后替换主页内容，进度走完后显示结果
 */
function ProgressView({
  visible,
  tipGroups,
  onComplete,
  onFail,
}: ProgressViewProps) {
  const [percent, setPercent] = useState(0)
  const [currentTips, setCurrentTips] = useState<string[]>([])
  const [currentTipIndex, setCurrentTipIndex] = useState(0)
  const [failed, setFailed] = useState(false)
  const [showAdButton, setShowAdButton] = useState(false)
  const completedRef = useRef(false)

  // 重置状态
  const reset = useCallback(() => {
    setPercent(0)
    setCurrentTipIndex(0)
    setFailed(false)
    setShowAdButton(false)
    completedRef.current = false

    if (tipGroups.length > 0) {
      const group = tipGroups[Math.floor(Math.random() * tipGroups.length)]
      setCurrentTips(group.tips)
    }
  }, [tipGroups])

  // 打开时重置
  useEffect(() => {
    if (visible) reset()
  }, [visible, reset])

  // 进度条与提示切换
  useEffect(() => {
    if (!visible || failed) return

    const startTime = Date.now()

    // 戏剧性缓动：先慢 → 中间加速 → 最后慢
    const dramaticProgress = (elapsed: number): number => {
      const t = Math.min(elapsed / PROGRESS_DURATION, 1)
      let pct
      if (t < 0.3) {
        pct = 10 * Math.pow(t / 0.3, 2)
      } else if (t < 0.7) {
        const midT = (t - 0.3) / 0.4
        pct = 10 + 75 * Math.pow(midT, 1.5)
      } else {
        const endT = (t - 0.7) / 0.3
        pct = 85 + 15 * Math.pow(endT, 3)
      }
      return Math.min(pct, 99.5)
    }

    const progressTimer = setInterval(() => {
      const elapsed = Date.now() - startTime
      const pct = dramaticProgress(elapsed)
      setPercent(pct)

      // 根据进度推进提示（不循环，走完所有提示后停在最后一个）
      const ratio = Math.min(elapsed / PROGRESS_DURATION, 1)
      const tipIndex = Math.min(
        Math.floor(ratio * currentTips.length),
        currentTips.length - 1,
      )
      setCurrentTipIndex(tipIndex)

      if (elapsed >= PROGRESS_DURATION && !completedRef.current) {
        completedRef.current = true
        setPercent(100)
        clearInterval(progressTimer)

        if (Math.random() < FAILURE_RATE) {
          setFailed(true)
          setShowAdButton(true)
          onFail()
        } else {
          onComplete()
        }
      }
    }, 50)

    return () => {
      clearInterval(progressTimer)
    }
  }, [visible, failed, currentTips, onComplete, onFail])

  // 根据进度显示对应提示（不循环）
  const displayTip = currentTips.length > 0
    ? currentTips[Math.min(currentTipIndex, currentTips.length - 1)]
    : '正在准备中...'

  // 观看广告后重新生成
  const handleWatchAd = () => {
    setShowAdButton(false)
    setFailed(false)
    reset()
  }

  if (!visible) return null

  return (
    <div className="progress-view">
      <div className="progress-view-content">
        {/* 标题 */}
        <Text strong style={{ fontSize: 22, color: failed ? 'var(--color-error)' : 'var(--color-accent)' }}>
          {failed ? '⚠️ 生成失败' : '🍽️ 正在为你搭配今日美食'}
        </Text>

        {/* 进度条 */}
        <div style={{ margin: '32px 0 8px', width: '100%', maxWidth: 400 }}>
          <Progress
            percent={failed ? 100 : percent}
            status={failed ? 'exception' : 'active'}
            strokeColor={failed ? 'var(--color-error)' : 'var(--color-accent)'}
            railColor="var(--color-border)"
            showInfo={false}
            strokeWidth={20}
          />
        </div>

        {/* 提示 */}
        {!failed && (
          <div style={{ minHeight: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Text
              type="secondary"
              style={{ fontSize: 15, fontStyle: 'italic' }}
            >
              {displayTip}
            </Text>
          </div>
        )}

        {/* 失败提示 */}
        {failed && (
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <WarningOutlined style={{ fontSize: 48, color: 'var(--color-error)', display: 'block', marginBottom: 12 }} />
            <Text style={{ color: 'var(--color-error)', fontSize: 15 }}>
              以太波动导致菜谱生成失败！
            </Text>
            {showAdButton && (
              <div style={{ marginTop: 24 }}>
                <Button
                  type="primary"
                  danger
                  size="large"
                  onClick={handleWatchAd}
                  style={{
                    fontWeight: 'bold',
                    fontSize: 16,
                    padding: '8px 32px',
                    animation: 'pulse 1s infinite',
                  }}
                >
                  观看广告 重新生成
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProgressView

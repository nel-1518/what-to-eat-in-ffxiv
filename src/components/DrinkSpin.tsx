import { useState, useEffect, useRef, useCallback } from 'react'
import { Typography } from 'antd'

const { Title } = Typography

const SPIN_DURATION = 10000 // 10 秒滚动
const SETTLE_DURATION = 2000 // 原地定格 2 秒

interface DrinkSpinProps {
  /** 所有饮品名称列表（供滚动显示） */
  allNames: string[]
  /** 最终选中的饮品名称 */
  selectedName: string
  /** 动画完成回调 */
  onComplete: () => void
}

/**
 * 文字滚动组件
 * - spinning 阶段：快速切换随机饮品名，逐渐变慢
 * - settled 阶段：定格在选中项，2 秒后回调
 */
function DrinkSpin({ allNames, selectedName, onComplete }: DrinkSpinProps) {
  const [displayName, setDisplayName] = useState('')
  const [phase, setPhase] = useState<'spinning' | 'settled'>('spinning')
  const [showSubtitle, setShowSubtitle] = useState(false)
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
  }, [])

  useEffect(() => {
    const startTime = Date.now()

    // 近 10 次显示过的名称，避免重复
    const recentHistory: string[] = []

    // 从 allNames 中随机选一项，排除 recentHistory 中近 10 次的名称
    const pickUnique = (): string => {
      const pool = allNames.filter((name) => !recentHistory.includes(name))
      const source = pool.length > 0 ? pool : allNames
      return source[Math.floor(Math.random() * source.length)]
    }

    // 根据经过时间计算当前间隔（二次缓出：保持快速更久，最后急剧降速）
    const getInterval = (elapsed: number) => {
      const t = Math.min(elapsed / SPIN_DURATION, 1)
      // 陡峭二次曲线：初始 ~50ms，中部 ~237ms，结尾 ~800ms
      return 50 + 750 * (t * t)
    }

    const scheduleNext = () => {
      const elapsed = Date.now() - startTime

      if (elapsed >= SPIN_DURATION) {
        // 滚动结束，定格显示选中项
        setDisplayName(selectedName)
        setPhase('settled')
        // 先停留一会儿再弹出副标题
        const subtitleT = setTimeout(() => {
          setShowSubtitle(true)
        }, 1000)
        timeoutsRef.current.push(subtitleT)
        // 定格 2 秒后回调
        const t = setTimeout(() => {
          onComplete()
        }, SETTLE_DURATION)
        timeoutsRef.current.push(t)
        return
      }

      // 随机选一个名字显示，保证近 10 次不重复
      const randomName = pickUnique()
      setDisplayName(randomName)
      recentHistory.push(randomName)
      if (recentHistory.length > 10) {
        recentHistory.shift()
      }

      const interval = getInterval(elapsed)
      const t = setTimeout(scheduleNext, interval)
      timeoutsRef.current.push(t)
    }

    scheduleNext()

    return () => {
      clearTimeouts()
    }
  }, [allNames, selectedName, onComplete, clearTimeouts])

  return (
    <div className="drink-spin-container">
      <Title
        level={1}
        className="app-title"
        style={{
          transition: phase === 'settled' ? 'color 0.3s ease' : 'none',
          color: phase === 'settled' ? 'var(--color-accent)' : undefined,
        }}
      >
        {displayName || '🥤'}
      </Title>
      {showSubtitle && (
        <Typography.Text type="secondary" className="app-subtitle" style={{ marginTop: 8 }}>
          就这杯了！
        </Typography.Text>
      )}
    </div>
  )
}

export default DrinkSpin

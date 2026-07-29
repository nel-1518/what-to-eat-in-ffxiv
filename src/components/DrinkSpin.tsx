import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

// ==================== 常量 ====================

const ITEM_HEIGHT = 90
const VISIBLE_COUNT = 2
const WINDOW_HEIGHT = ITEM_HEIGHT * VISIBLE_COUNT

const SPIN_DURATION = 5000
const DECEL_MS = 3000
const SETTLE_MS = 1500

/** 每列列表份数 */
const LIST_COPIES = 5

// ==================== 工具 ====================

function buildReelList(names: string[], copies: number): string[] {
  const result: string[] = []
  for (let i = 0; i < copies; i++) {
    result.push(...names)
  }
  return result
}

/**
 * 从 startIndex 向后找 target；找不到则回绕到开头继续找，
 * 返回「虚拟索引」（可能 >= list.length，表示跨轮次的位置）
 */
function findNextVirtualIndex(list: string[], target: string, startIndex: number): number {
  const len = list.length
  for (let i = startIndex; i < len; i++) {
    if (list[i] === target) return i
  }
  for (let i = 0; i < startIndex; i++) {
    if (list[i] === target) return i + len
  }
  return startIndex + len
}

// ==================== 单个滚轮 ====================

interface SlotReelProps {
  list: string[]
  selectedName: string
  delay: number
  /** 快转 + 减速的总时长 (ms) */
  spinDuration: number
  onStopped: () => void
}

/**
 * 三次缓出曲线：1 - (1 - x)^3
 * 起始速度快，末尾速度趋近于 0
 */
function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - x, 3)
}

function SlotReel({ list, selectedName, delay, spinDuration, onStopped }: SlotReelProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<'idle' | 'spinning' | 'stopped'>('idle')
  const rafRef = useRef(0)
  const startTimeRef = useRef(0)
  const stoppedRef = useRef(false)
  const phaseRef = useRef<'idle' | 'spinning' | 'stopped'>('idle')

  // 将 transform 写入 DOM，完全跳过 React
  const setTrackY = useCallback((y: number) => {
    if (trackRef.current) {
      trackRef.current.style.transform = `translateY(${y}px)`
    }
  }, [])

  useEffect(() => {
    const total = DECEL_MS + spinDuration
    const start = performance.now() + delay
    let active = true
    let from = 0
    let to = 0

    const animate = (now: number) => {
      if (!active) return

      if (now < start) {
        rafRef.current = requestAnimationFrame(animate)
        return
      }

      if (phaseRef.current === 'idle') {
        phaseRef.current = 'spinning'
        setPhase('spinning')
        startTimeRef.current = now

        // 反向滚动，目标停在 selectedName 居中位置
        const targetIdx = findNextVirtualIndex(list, selectedName, 0)
        from = -((list.length - VISIBLE_COUNT) * ITEM_HEIGHT * 0.5)
        to = -(targetIdx * ITEM_HEIGHT) + (WINDOW_HEIGHT - ITEM_HEIGHT) / 2
      }

      const elapsed = now - startTimeRef.current
      const progress = Math.min(elapsed / total, 1)
      const eased = easeOutCubic(progress)

      setTrackY(from + (to - from) * eased)

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        // 停稳
        setTrackY(to)
        phaseRef.current = 'stopped'
        setPhase('stopped')
        if (!stoppedRef.current) {
          stoppedRef.current = true
          onStopped()
        }
      }
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => { active = false; cancelAnimationFrame(rafRef.current) }
  }, [list, selectedName, delay, spinDuration, onStopped, setTrackY])

  return (
    <div className="slot-reel-window" style={{ height: WINDOW_HEIGHT }}>
      <div className="slot-reel-track" ref={trackRef}>
        {list.map((name, i) => (
          <div
            key={i}
            className={`slot-reel-item${name === selectedName && phase === 'stopped' ? ' slot-reel-item--hit' : ''}`}
            style={{ height: ITEM_HEIGHT }}
          >
            {name}
          </div>
        ))}
      </div>
    </div>
  )
}

// ==================== 主组件 ====================

interface DrinkSpinProps {
  allNames: string[]
  selectedName: string
  onComplete: () => void
}

function DrinkSpin({ allNames, selectedName, onComplete }: DrinkSpinProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const list = useMemo(
    () => buildReelList(allNames, LIST_COPIES),
    [allNames]
  )

  const handleStopped = useCallback(() => {
    timerRef.current = setTimeout(() => {
      onComplete()
    }, SETTLE_MS)
  }, [onComplete])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <div className="drink-spin-container">
      <div className="slot-machine">
        <SlotReel
          list={list}
          selectedName={selectedName}
          delay={0}
          spinDuration={SPIN_DURATION}
          onStopped={handleStopped}
        />
      </div>
    </div>
  )
}

export default DrinkSpin

import { useState, useEffect, useCallback, useRef } from 'react'

export type ThemeMode = 'system' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'

const STORAGE_KEY = 'ffxiv-theme'

/**
 * 获取 localStorage 中保存的主题模式，默认 'system'
 */
function getStoredMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored
    }
  } catch {
    // localStorage 不可用时静默回退
  }
  return 'system'
}

/**
 * 解析最终主题：system 模式跟随系统偏好
 */
function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === 'light') return 'light'
  if (mode === 'dark') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

/**
 * 主题管理 Hook
 *
 * 管理三种模式：跟随系统 / 浅色 / 深色
 * - 持久化到 localStorage
 * - system 模式下自动监听系统主题变化
 * - 自动同步 data-theme 属性到 <html>
 *
 * @returns {{ mode, setMode, resolvedTheme }}
 */
export function useTheme() {
  const [mode, setModeState] = useState<ThemeMode>(getStoredMode)
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    resolveTheme(getStoredMode()),
  )

  // 避免初始时多余的 DOM 写入
  const initialized = useRef(false)

  // 保存到 localStorage + 更新 resolvedTheme
  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode)
    try {
      localStorage.setItem(STORAGE_KEY, newMode)
    } catch {
      // ignore
    }
    setResolvedTheme(resolveTheme(newMode))
  }, [])

  // 监听系统主题变化（仅 system 模式时生效）
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = () => {
      // 重新读取 mode（闭包可能过期，从 state 读）
      setModeState((prev) => {
        setResolvedTheme(resolveTheme(prev))
        return prev
      })
    }

    mq.addEventListener('change', handleChange)
    return () => mq.removeEventListener('change', handleChange)
  }, [])

  // 同步 data-theme 到 <html>
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
    }
    document.documentElement.dataset.theme = resolvedTheme
  }, [resolvedTheme])

  return { mode, setMode, resolvedTheme }
}

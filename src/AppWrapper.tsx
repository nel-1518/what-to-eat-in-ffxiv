import { ConfigProvider, theme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import type { ReactNode } from 'react'
import type { ResolvedTheme } from './hooks/useTheme'

interface AppWrapperProps {
  children: ReactNode
  resolvedTheme: ResolvedTheme
}

/**
 * 应用主题包裹组件
 * 提供 antd ConfigProvider + 中文本地化 + 动态主题（深色/浅色）
 */
function AppWrapper({ children, resolvedTheme }: AppWrapperProps) {
  const isDark = resolvedTheme === 'dark'

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#a24730',
          colorInfo: '#a24730',
          colorLink: '#a24730',
          borderRadius: 8,
          fontFamily: "'Inter', 'Microsoft YaHei', system-ui, sans-serif",
        },
        components: {
          Button: {
            primaryColor: '#f2d3b6',
          },
          Card: {
            colorBgContainer: isDark ? '#2a2a2a' : '#f8fafa',
          },
          Modal: {
            colorBgElevated: isDark ? '#2a2a2a' : '#f8fafa',
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  )
}

export default AppWrapper

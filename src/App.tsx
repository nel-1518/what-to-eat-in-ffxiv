import { useState, useCallback, useEffect, useRef } from 'react'
import { Button, Typography, ConfigProvider, theme } from 'antd'
import { message } from 'antd'
import { CoffeeOutlined } from '@ant-design/icons'
import zhCN from 'antd/locale/zh_CN'
import ProgressView from './components/ProgressModal'
import AdModal from './components/AdModal'
import RecipeResult from './components/RecipeResult'
import ThemeSwitcher from './components/ThemeSwitcher'
import { generateMealPlan, fetchProgressTips } from './utils/generateRecipe'
import { exportShareImage } from './utils/exportImage'
import { useTheme } from './hooks/useTheme'
import type { MealPlan, ProgressTipGroup } from './types'
import './App.css'

const { Title } = Typography

// 页面状态：initial=初始页 / generating=进度中 / result=展示结果
type PageState = 'initial' | 'generating' | 'result'

function App() {
  const [pageState, setPageState] = useState<PageState>('initial')
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null)
  const [showAd, setShowAd] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [tipGroups, setTipGroups] = useState<ProgressTipGroup[]>([])

  // 主题
  const { mode, setMode, resolvedTheme } = useTheme()

  // 缓存已生成的菜谱，等进度条走完直接展示
  const pendingPlanRef = useRef<MealPlan | null>(null)

  // 加载提示数据
  useEffect(() => {
    fetchProgressTips().then(setTipGroups)
  }, [])

  // 开始生成：立即异步生成菜谱 + 进入进度页
  const handleGenerate = useCallback(() => {
    setPageState('generating')
    setMealPlan(null)
    pendingPlanRef.current = null

    // 立即开始异步生成
    generateMealPlan().then((plan) => {
      pendingPlanRef.current = plan
      // 预加载菜谱图标，结果页展示时直接走缓存
      plan.dishes.forEach((dish) => {
        const img = new Image()
        img.src = `/data/icons/${dish.item}.jpg`
      })
    }).catch(() => {
      // 生成失败由进度完成时的回调处理
      pendingPlanRef.current = null
    })
  }, [])

  // 进度完成：使用已生成好的菜谱直接展示
  const handleProgressComplete = useCallback(() => {
    const plan = pendingPlanRef.current
    if (plan) {
      setMealPlan(plan)
      setPageState('result')
    } else {
      // 极端情况：生成还没完成，重新等待
      message.warning('数据加载中，请稍候')
      setPageState('initial')
    }
  }, [])

  // 进度失败回调
  const handleProgressFail = useCallback(() => {
    setShowAd(true)
  }, [])

  // 广告关闭后回到初始页
  const handleAdClose = useCallback(() => {
    setShowAd(false)
    setPageState('initial')
  }, [])

  // 重新生成
  const handleRegenerate = useCallback(() => {
    handleGenerate()
  }, [handleGenerate])

  // 导出分享图
  const handleExport = useCallback(async () => {
    const element = document.getElementById('recipe-result')
    if (!element || !mealPlan) {
      message.warning('暂无菜谱可导出')
      return
    }
    setExporting(true)
    try {
      await exportShareImage(
        element,
        mealPlan.totalCalories,
        mealPlan.dishes.map((d) => d.name),
      )
      message.success('分享图已保存')
    } catch {
      message.error('导出失败，请重试')
    } finally {
      setExporting(false)
    }
  }, [mealPlan])

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
          Button: { primaryColor: '#f2d3b6' },
          Card: { colorBgContainer: isDark ? '#2a2a2a' : '#f8fafa' },
          Modal: { colorBgElevated: isDark ? '#2a2a2a' : '#f8fafa' },
        },
      }}
    >
    <div className="app-container">
      {/* 主题切换按钮（固定右上角） */}
      <ThemeSwitcher mode={mode} resolvedTheme={resolvedTheme} onChange={setMode} />

      {/* 初始页：标题 + 按钮 */}
      <div className={`page-transition ${pageState === 'initial' ? 'page-enter' : 'page-exit'}`}>
        {pageState === 'initial' && (
          <>
            <div className="app-header">
              <Title level={1} className="app-title">
                🍽️ 今天吃什么
              </Title>
              <Typography.Text type="secondary" className="app-subtitle">
                — 光之战士家今天的饭 —
              </Typography.Text>
            </div>
            <div className="app-button-area">
              <Button
                type="primary"
                size="large"
                icon={<CoffeeOutlined />}
                onClick={handleGenerate}
                className="main-button"
              >
                是啊，吃什么
              </Button>
            </div>
          </>
        )}
      </div>

      {/* 进度页：全屏进度条 */}
      <div className={`page-transition ${pageState === 'generating' ? 'page-enter' : 'page-exit'}`}>
        {pageState === 'generating' && (
          <ProgressView
            visible
            tipGroups={tipGroups}
            onComplete={handleProgressComplete}
            onFail={handleProgressFail}
          />
        )}
      </div>

      {/* 结果页：菜谱 + 历史 */}
      <div className={`page-transition ${pageState === 'result' ? 'page-enter' : 'page-exit'}`}>
        {pageState === 'result' && mealPlan && (
          <>
            <div id="recipe-result">
              <RecipeResult
                mealPlan={mealPlan}
                onRegenerate={handleRegenerate}
                onExport={handleExport}
                exporting={exporting}
              />
            </div>

          </>
        )}
      </div>

      {/* 广告弹窗 */}
      <AdModal
        visible={showAd}
        onRealClose={handleAdClose}
      />
    </div>
    </ConfigProvider>
  )
}

export default App

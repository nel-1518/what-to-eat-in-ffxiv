import { useState, useCallback, useEffect, useRef } from 'react'
import { Button, Typography, ConfigProvider, theme } from 'antd'
import { message } from 'antd'
import { CoffeeOutlined } from '@ant-design/icons'
import zhCN from 'antd/locale/zh_CN'
import ProgressView from './components/ProgressModal'
import AdModal from './components/AdModal'
import RecipeResult from './components/RecipeResult'
import DrinkSpin from './components/DrinkSpin'
import DrinkResult from './components/DrinkResult'
import NavBar from './components/NavBar'
import { generateMealPlan, fetchProgressTips, generateDrinkPlan, fetchAllDrinkNames } from './utils/generateRecipe'
import { exportShareImage } from './utils/exportImage'
import { useTheme } from './hooks/useTheme'
import type { MealPlan, ProgressTipGroup, RecipeItem } from './types'
import './App.css'

const { Title } = Typography

// 页面状态：initial=初始页 / generating=进度中 / result=展示结果
type PageState = 'initial' | 'generating' | 'result'

function App() {
  const [activeTab, setActiveTab] = useState<'eat' | 'drink'>('eat')
  const [pageState, setPageState] = useState<PageState>('initial')
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null)
  const [showAd, setShowAd] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [tipGroups, setTipGroups] = useState<ProgressTipGroup[]>([])

  // 喝什么状态
  const [drinkState, setDrinkState] = useState<'initial' | 'spinning' | 'result'>('initial')
  const [selectedDrink, setSelectedDrink] = useState<RecipeItem | null>(null)
  const [allDrinkNames, setAllDrinkNames] = useState<string[]>([])

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

  // 加载饮品名称列表
  useEffect(() => {
    fetchAllDrinkNames().then(setAllDrinkNames)
  }, [])

  // 开始生成饮品：立即异步生成 + 进入 spinning 动画页
  const handleDrinkGenerate = useCallback(() => {
    setDrinkState('spinning')
    setSelectedDrink(null)

    generateDrinkPlan().then((plan) => {
      const drink = plan.dishes[0]
      if (drink) {
        setSelectedDrink(drink)
        // 预加载饮品图标
        const img = new Image()
        img.src = `/data/icons/${drink.item}.jpg`
      }
    }).catch(() => {
      message.error('饮品数据加载失败，请重试')
      setDrinkState('initial')
    })
  }, [])

  // 饮品老虎机动画完成
  const handleDrinkSpinComplete = useCallback(() => {
    setDrinkState('result')
  }, [])

  // 重新生成饮品
  const handleDrinkRegenerate = useCallback(() => {
    handleDrinkGenerate()
  }, [handleDrinkGenerate])

  // 导出饮品分享图
  const handleDrinkExport = useCallback(async () => {
    const element = document.getElementById('recipe-result')
    if (!element || !selectedDrink) {
      message.warning('暂无饮品可导出')
      return
    }
    setExporting(true)
    try {
      await exportShareImage(
        element,
        selectedDrink.calories,
        [selectedDrink.name],
      )
      message.success('分享图已保存')
    } catch {
      message.error('导出失败，请重试')
    } finally {
      setExporting(false)
    }
  }, [selectedDrink])

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
    {/* 顶部导航栏 */}
    <NavBar
      activeTab={activeTab}
      onTabChange={setActiveTab}
      themeMode={mode}
      resolvedTheme={resolvedTheme}
      onThemeChange={setMode}
    />

    <div className="app-container">
      {/* 吃什么页面 */}
      {activeTab === 'eat' && (
        <>
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
        </>
      )}

      {/* 喝什么页面 */}
      {activeTab === 'drink' && (
        <>
          {/* 初始页：标题 + 按钮 */}
          <div className={`page-transition ${drinkState === 'initial' ? 'page-enter' : 'page-exit'}`}>
            {drinkState === 'initial' && (
              <>
                <div className="app-header">
                  <Title level={1} className="app-title">
                    🥤 今天喝什么
                  </Title>
                  <Typography.Text type="secondary" className="app-subtitle">
                    — 调制人生 改变饮料 —
                  </Typography.Text>
                </div>
                <div className="app-button-area">
                  <Button
                    type="primary"
                    size="large"
                    icon={<CoffeeOutlined />}
                    onClick={handleDrinkGenerate}
                    className="main-button"
                  >
                    是啊，喝什么
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* 老虎机动画页 */}
          <div className={`page-transition ${drinkState === 'spinning' ? 'page-enter' : 'page-exit'}`}>
            {drinkState === 'spinning' && allDrinkNames.length > 0 && selectedDrink && (
              <DrinkSpin
                allNames={allDrinkNames}
                selectedName={selectedDrink.name}
                onComplete={handleDrinkSpinComplete}
              />
            )}
            {drinkState === 'spinning' && !selectedDrink && (
              <div className="drink-spin-container">
                <Title level={1} className="app-title">🥤 调制中...</Title>
              </div>
            )}
          </div>

          {/* 结果页：饮品卡片 */}
          <div className={`page-transition ${drinkState === 'result' ? 'page-enter' : 'page-exit'}`}>
            {drinkState === 'result' && selectedDrink && (
              <>
                <div id="recipe-result">
                  <DrinkResult
                    drink={selectedDrink}
                    onRegenerate={handleDrinkRegenerate}
                    onExport={handleDrinkExport}
                    exporting={exporting}
                  />
                </div>
              </>
            )}
          </div>
        </>
      )}

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

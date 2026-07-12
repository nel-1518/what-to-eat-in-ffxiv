import { useState } from 'react'
import { Modal, Typography } from 'antd'

const { Text } = Typography

interface AdModalProps {
  /** 是否可见 */
  visible: boolean
  /** 真正关闭回调 */
  onRealClose: () => void
}

/**
 * "一刀999"垃圾广告弹窗组件
 * 多个关闭按钮，只有最隐蔽的才能关闭
 */
function AdModal({ visible, onRealClose }: AdModalProps) {
  const [clickedFake, setClickedFake] = useState<string[]>([])

  const handleFakeClick = (id: string) => {
    setClickedFake((prev) => [...prev, id])
  }

  // 重置状态
  const handleRealClose = () => {
    setClickedFake([])
    onRealClose()
  }

  // 假关闭按钮文案
  const fakeButtons = [
    { id: 'close1', label: '✕ 关闭', x: '85%', y: '8%' },
    { id: 'close2', label: '点击领取', x: '10%', y: '15%' },
    { id: 'close3', label: '我知道了', x: '70%', y: '75%' },
    { id: 'close4', label: '跳过广告 >', x: '50%', y: '85%', style: { color: '#666' } },
    { id: 'close5', label: '立即关闭', x: '15%', y: '70%' },
  ]

  return (
    <Modal
      open={visible}
      footer={null}
      closable={false}
      width={500}
      centered
      mask={{ closable: false }}
      destroyOnHidden
      styles={{
        body: {
          padding: 0,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #ff0000 0%, #ff6600 25%, #ffcc00 50%, #ff0066 75%, #9900ff 100%)',
          border: '4px solid #ffd700',
          boxShadow: '0 0 40px rgba(255, 215, 0, 0.6), inset 0 0 60px rgba(255, 255, 255, 0.1)',
          animation: 'adFlash 0.5s infinite',
          position: 'relative',
        },
      }}
    >
      {/* 顶部闪烁大字 */}
      <div style={{
        textAlign: 'center',
        padding: '30px 20px 10px',
        position: 'relative',
      }}>
        {/* 真正的关闭按钮 - 极小且半透明，藏在左上角阴影里 */}
        <div
          onClick={handleRealClose}
          style={{
            position: 'absolute',
            top: 4,
            left: 4,
            width: 16,
            height: 16,
            opacity: 0.15,
            cursor: 'pointer',
            background: 'transparent',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
          }}
          title="关掉"
        >
          ✕
        </div>

        <Text style={{
          fontSize: 32,
          fontWeight: 'bold',
          color: '#fff',
          textShadow: '3px 3px 6px rgba(0,0,0,0.5), 0 0 20px #ff0',
          display: 'block',
          animation: 'adTextPulse 0.8s infinite',
        }}>
          🔥 一 刀 9 9 9 🔥
        </Text>
        <Text style={{
          fontSize: 18,
          color: '#ff0',
          display: 'block',
          marginTop: 8,
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
        }}>
          装备回收 · 交易自由 · 提现到手
        </Text>
      </div>

      {/* 虚假关闭按钮 - 散布各处 */}
      {fakeButtons.map((btn) => (
        <div
          key={btn.id}
          onClick={() => handleFakeClick(btn.id)}
          style={{
            position: 'absolute',
            left: btn.x,
            top: btn.y,
            cursor: 'pointer',
            padding: '4px 8px',
            background: clickedFake.includes(btn.id)
              ? 'rgba(0,0,0,0.6)'
              : 'rgba(255,255,255,0.2)',
            borderRadius: 4,
            color: clickedFake.includes(btn.id) ? '#666' : '#fff',
            fontSize: 12,
            ...(btn.style || {}),
          }}
        >
          {clickedFake.includes(btn.id) ? '已点过' : btn.label}
        </div>
      ))}

      {/* 广告核心内容 */}
      <div style={{
        padding: '50px 20px 30px',
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: 60,
          marginBottom: 10,
          animation: 'adBounce 1s infinite',
        }}>
          💎
        </div>
        <Text style={{
          fontSize: 20,
          color: '#fff',
          display: 'block',
          fontWeight: 'bold',
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
        }}>
          恭喜获得 <span style={{ color: '#ff0', fontSize: 28 }}>VIP</span> 特权！
        </Text>
        <div style={{
          margin: '16px 0',
          padding: '12px',
          background: 'rgba(0,0,0,0.3)',
          borderRadius: 8,
        }}>
          <Text style={{ color: '#ff0', fontSize: 14, display: 'block' }}>
            上线就送 +15 屠龙宝刀
          </Text>
          <Text style={{ color: '#0f0', fontSize: 14, display: 'block', marginTop: 4 }}>
            充值任意金额送海量元宝
          </Text>
          <Text style={{ color: '#f0f', fontSize: 14, display: 'block', marginTop: 4 }}>
            等级上限已开放至 9999 级
          </Text>
        </div>
        <div style={{
          marginTop: 20,
          padding: '12px 24px',
          background: 'linear-gradient(135deg, #ffd700, #ff8c00)',
          borderRadius: 8,
          display: 'inline-block',
          animation: 'adPulse 0.6s infinite',
        }}>
          <Text style={{
            color: '#000',
            fontSize: 18,
            fontWeight: 'bold',
          }}>
            🎮 点击此处立即下载 🎮
          </Text>
        </div>
      </div>

      {/* 底部虚假信息 */}
      <div style={{
        padding: '8px 16px',
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 10,
        color: '#999',
      }}>
        <span>已有 999999+ 人安装</span>
        <span>风险提示：请理性消费</span>
        <span>广告 ID: 20240711_FFXIV</span>
      </div>
    </Modal>
  )
}

export default AdModal

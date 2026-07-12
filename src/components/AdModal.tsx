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
  // 重置状态
  const handleRealClose = (e: React.MouseEvent) => {
    e.stopPropagation()
    onRealClose()
  }

  // 点击弹窗任意位置打开广告页（左上角关闭按钮已阻止冒泡）
  const handleBodyClick = () => {
    window.open('https://actff1.web.sdo.com/project/20260425evercold/', '_blank')
  }

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
          userSelect: 'none',
          cursor: 'pointer',
          background: 'linear-gradient(135deg, #ff0000 0%, #ff6600 25%, #ffcc00 50%, #ff0066 75%, #9900ff 100%)',
          border: '4px solid #ffd700',
          boxShadow: '0 0 40px rgba(255, 215, 0, 0.6), inset 0 0 60px rgba(255, 255, 255, 0.1)',
          animation: 'adFlash 0.5s infinite',
          position: 'relative',
        },
      }}
    >
      {/* 整个弹窗点击打开广告页 */}
      <div onClick={handleBodyClick}>
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
            opacity: 0.6,
            cursor: 'pointer',
            background: 'transparent',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            color: '#fff',
          }}
          title=""
        >
          ✕
        </div>

        {/* 右上角虚假关闭按钮 - 点击无任何效果 */}
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            cursor: 'pointer',
            padding: '4px 8px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: 4,
            color: '#fff',
            fontSize: 13,
          }}
        >
          ✕ 关闭
        </div>

        <Text style={{
          fontSize: 32,
          fontWeight: 'bold',
          color: '#fff',
          textShadow: '3px 3px 6px rgba(0,0,0,0.5), 0 0 20px #ff0',
          display: 'block',
          animation: 'adTextPulse 0.8s infinite',
        }}>
          🔥 零 元 畅 玩 🔥
        </Text>
        <Text style={{
          fontSize: 18,
          color: '#ff0',
          display: 'block',
          marginTop: 8,
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
        }}>
          装备强化 · 交易自由 · 团队PK
        </Text>
      </div>

      {/* 广告核心内容 */}
      <div style={{
        padding: '50px 20px 30px',
        textAlign: 'center',
      }}>
        <img
          src="/evercold.jpg"
          alt=""
          style={{
            width: '100%',
            maxHeight: 200,
            objectFit: 'contain',
            marginBottom: 12,
            borderRadius: 4,
            animation: 'adTextPulse 0.8s infinite',
          }}
        />
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
            充值任意金额赠送百万金币
          </Text>
          <Text style={{ color: '#f0f', fontSize: 14, display: 'block', marginTop: 4 }}>
            召唤神兽 AI 陪玩
          </Text>
          <Text style={{ color: '#0f0', fontSize: 14, display: 'block', marginTop: 4 }}>
            时装坐骑上线就送
          </Text>
        </div>
        <div style={{
          marginTop: 20,
          padding: '12px 24px',
          background: 'linear-gradient(90deg, #ffd700 0%, #ffec80 25%, #fff5c0 50%, #ffec80 75%, #ffd700 100%)',
          backgroundSize: '200% 100%',
          borderRadius: 8,
          display: 'inline-block',
          animation: 'goldShimmer 1.2s linear infinite',
        }}>
          <Text style={{
            color: '#000',
            fontSize: 18,
            fontWeight: 'bold',
          }}>
            点击此处立即下载
          </Text>
        </div>
      </div>
      </div>
    </Modal>
  )
}

export default AdModal

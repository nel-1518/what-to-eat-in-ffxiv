import html2canvas from 'html2canvas'
import QRCode from 'qrcode'
import { kcalToLa } from '../constants'

/**
 * 生成分享图并触发下载
 * @param element 要截图的 DOM 元素
 * @param totalCalories 总热量
 * @param dishNames 菜品名称列表
 */
export async function exportShareImage(
  element: HTMLElement,
  totalCalories: number,
  dishNames: string[],
): Promise<void> {
  // 生成二维码 data URL
  const qrDataUrl = await QRCode.toDataURL(window.location.href, {
    width: 120,
    margin: 1,
    color: {
      dark: '#d4a843',
      light: '#1a1a2e',
    },
  })

  // 截取菜谱区域
  const canvas = await html2canvas(element, {
    backgroundColor: '#1a1a2e',
    scale: 2,
    useCORS: true,
    allowTaint: false,
    logging: false,
  })

  // 创建新 canvas 合成分享图
  const shareCanvas = document.createElement('canvas')
  const padding = 40
  const qrSize = 120
  const titleHeight = 60
  const footerHeight = 100

  shareCanvas.width = canvas.width + padding * 2
  shareCanvas.height = canvas.height + padding * 2 + titleHeight + footerHeight

  const ctx = shareCanvas.getContext('2d')
  if (!ctx) throw new Error('无法创建 Canvas 上下文')

  // 背景
  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(0, 0, shareCanvas.width, shareCanvas.height)

  // 标题
  ctx.fillStyle = '#d4a843'
  ctx.font = 'bold 28px "Microsoft YaHei", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('🍽️ 今天吃什么 - FFXIV', shareCanvas.width / 2, padding + 36)

  // 绘制菜谱截图
  ctx.drawImage(canvas, padding, padding + titleHeight)

  // 底部信息
  const bottomY = padding + titleHeight + canvas.height + 20

  // 总热量
  ctx.fillStyle = '#fff'
  ctx.font = '18px "Microsoft YaHei", sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(`总热量: ${kcalToLa(totalCalories)} 拉`, padding, bottomY + 30)

  // 菜品摘要
  ctx.fillStyle = '#999'
  ctx.font = '14px "Microsoft YaHei", sans-serif'
  ctx.fillText(dishNames.join(' · '), padding, bottomY + 55)

  // 二维码
  const qrImg = new Image()
  qrImg.src = qrDataUrl
  await new Promise<void>((resolve, reject) => {
    qrImg.onload = () => {
      ctx.drawImage(
        qrImg,
        shareCanvas.width - padding - qrSize,
        bottomY,
        qrSize,
        qrSize,
      )
      resolve()
    }
    qrImg.onerror = reject
  })

  // 二维码提示文字
  ctx.fillStyle = '#666'
  ctx.font = '10px "Microsoft YaHei", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('扫码查看', shareCanvas.width - padding - qrSize / 2, bottomY + qrSize + 16)

  // 触发下载
  const link = document.createElement('a')
  link.download = `今天吃什么_${new Date().toISOString().slice(0, 10)}.png`
  link.href = shareCanvas.toDataURL('image/png')
  link.click()
}

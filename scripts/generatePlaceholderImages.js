/**
 * 生成占位卡牌图片
 * 使用Canvas生成带有emoji和渐变背景的卡牌图片
 */
import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 卡牌配置
const cards = [
    { id: 'sheep', emoji: '🐑', color: '#E3F2FD', name: '羊' },
    { id: 'cow', emoji: '🐄', color: '#F3E5F5', name: '牛' },
    { id: 'pig', emoji: '🐷', color: '#FCE4EC', name: '猪' },
    { id: 'dog', emoji: '🐶', color: '#FFF3E0', name: '狗' },
    { id: 'cat', emoji: '🐱', color: '#E8F5E9', name: '猫' },
    { id: 'rabbit', emoji: '🐰', color: '#FFF9C4', name: '兔' }
];

const imageSize = 256; // 图片尺寸

// 创建输出目录
const outputDir = path.join(__dirname, '../public/images/cards');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// 生成每张卡牌图片
cards.forEach((card, index) => {
    const canvas = createCanvas(imageSize, imageSize);
    const ctx = canvas.getContext('2d');

    // 绘制渐变背景
    const gradient = ctx.createRadialGradient(
        imageSize / 2, imageSize / 2, 0,
        imageSize / 2, imageSize / 2, imageSize / 2
    );

    // 解析颜色
    const color = card.color;
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, adjustColorBrightness(color, -20));

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, imageSize, imageSize);

    // 绘制圆形边框
    ctx.beginPath();
    ctx.arc(imageSize / 2, imageSize / 2, imageSize / 2 - 10, 0, Math.PI * 2);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 8;
    ctx.stroke();

    // 绘制emoji文字（作为占位）
    ctx.font = 'bold 120px Arial, "Apple Color Emoji", "Segoe UI Emoji"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#333333';
    ctx.fillText(card.emoji, imageSize / 2, imageSize / 2);

    // 绘制小标签
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#666666';
    ctx.fillText(card.name, imageSize / 2, imageSize - 30);

    // 保存为PNG
    const filename = `card_${String(index + 1).padStart(2, '0')}.png`;
    const filepath = path.join(outputDir, filename);

    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(filepath, buffer);

    console.log(`✓ 生成: ${filename} (${card.name})`);
});

console.log('\n所有占位图片生成完成！');
console.log(`输出目录: ${outputDir}`);

/**
 * 调整颜色亮度
 */
function adjustColorBrightness(hex, percent) {
    // 移除 # 号
    hex = hex.replace('#', '');

    // 转换为RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // 调整亮度
    const newR = Math.max(0, Math.min(255, r + percent));
    const newG = Math.max(0, Math.min(255, g + percent));
    const newB = Math.max(0, Math.min(255, b + percent));

    // 转换回hex
    return '#' +
        newR.toString(16).padStart(2, '0') +
        newG.toString(16).padStart(2, '0') +
        newB.toString(16).padStart(2, '0');
}

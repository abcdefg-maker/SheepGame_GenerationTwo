import Phaser from 'phaser';
import MenuScene from './scenes/MenuScene';
import LevelSelectScene from './scenes/LevelSelectScene';
import GameScene from './scenes/GameScene';
import GameOverScene from './scenes/GameOverScene';

const config = {
    type: Phaser.AUTO,
    width: 720,
    height: 1280,
    parent: 'game-container',
    backgroundColor: '#87CEEB',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [MenuScene, LevelSelectScene, GameScene, GameOverScene]
};

const game = new Phaser.Game(config);

// 浏览器缩放补偿：保持游戏在屏幕中的物理占比不变
// 使用 devicePixelRatio 检测浏览器缩放
let baseDevicePixelRatio = window.devicePixelRatio || 1;

function compensateBrowserZoom() {
    const mainWrapper = document.getElementById('main-wrapper');
    if (!mainWrapper) {
        console.warn('[缩放补偿] 找不到 main-wrapper 元素');
        return;
    }

    // 获取当前 devicePixelRatio
    const currentDPR = window.devicePixelRatio || 1;

    // 计算缩放比例（相对于初始值）
    const browserZoomLevel = currentDPR / baseDevicePixelRatio;

    // 反向缩放以补偿
    const compensationScale = 1 / browserZoomLevel;

    // 应用到主容器（游戏和广告一起缩放）
    mainWrapper.style.transform = `scale(${compensationScale})`;
    mainWrapper.style.transformOrigin = 'center center';

    console.log(`[缩放补偿] 浏览器缩放: ${(browserZoomLevel * 100).toFixed(0)}%, 补偿缩放: ${(compensationScale * 100).toFixed(0)}%, DPR: ${currentDPR.toFixed(2)}`);
}

// 初始补偿（等待 DOM 加载完成）
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(compensateBrowserZoom, 200);
});

// 监听窗口大小变化（包括缩放）
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(compensateBrowserZoom, 100);
});

// 监听 Ctrl+滚轮缩放
window.addEventListener('wheel', (e) => {
    if (e.ctrlKey || e.metaKey) {
        setTimeout(compensateBrowserZoom, 50);
    }
}, { passive: true });

// 监听 devicePixelRatio 变化（Chrome 专用）
if ('matchMedia' in window) {
    const updatePixelRatio = () => {
        const mqString = `(resolution: ${window.devicePixelRatio}dppx)`;
        matchMedia(mqString).addEventListener('change', compensateBrowserZoom, { once: true });
    };
    updatePixelRatio();
}

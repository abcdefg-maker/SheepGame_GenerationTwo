# Browser Zoom Compensation Skill

## 描述
为HTML5游戏或Web应用添加浏览器缩放补偿功能，使游戏界面在用户使用Ctrl+/-缩放浏览器时保持物理尺寸不变。

## 适用场景
- Phaser游戏项目
- Canvas应用
- 需要固定尺寸的Web应用
- 包含广告组件的游戏

## 实现步骤

### 1. 重构HTML结构

**文件**: `index.html`

#### 修改前的典型结构：
```html
<body>
    <div id="game-container"></div>
    <div id="ad-banner-container"></div>
    <script src="main.js"></script>
</body>
```

#### 修改后的结构：
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>Your Game Title</title>
    <link rel="stylesheet" href="ad-component/ad-banner.css">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            background-color: #2d2d2d;
            overflow: hidden;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        /* 主容器：包含游戏和其他组件 */
        #main-wrapper {
            position: relative;
            transform-origin: center center;
        }
        #game-container {
            position: relative;
        }
    </style>
</head>
<body>
    <!-- 主容器：包含所有需要同步缩放的元素 -->
    <div id="main-wrapper">
        <div id="game-container"></div>
        <div id="ad-banner-container"></div>
    </div>

    <!-- 游戏主脚本 -->
    <script type="module" src="/src/main.js"></script>

    <!-- 其他脚本 -->
    <script src="ad-component/ad-banner.js"></script>
    <script>
        // 初始化其他组件...
    </script>
</body>
</html>
```

**关键点**：
- 添加 `#main-wrapper` 作为统一父容器
- 设置 `transform-origin: center center`
- 所有需要同步缩放的元素都放在 `main-wrapper` 内

### 2. 添加缩放补偿代码

**文件**: `src/main.js` (或你的主JavaScript文件末尾)

```javascript
// ============================================
// 浏览器缩放补偿功能
// ============================================
// 保持游戏在屏幕中的物理占比不变
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

    // 应用到主容器（所有子元素一起缩放）
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
```

## 技术原理

### 为什么使用 devicePixelRatio？

1. **可靠性**: 比 `window.innerWidth/outerWidth` 更稳定
2. **浏览器兼容性**: 所有现代浏览器都支持
3. **准确性**: 直接反映浏览器缩放级别

### 缩放计算公式

```
浏览器缩放倍数 = 当前DPR / 初始DPR
补偿缩放倍数 = 1 / 浏览器缩放倍数
```

**示例**：
- 用户按 `Ctrl +` 放大到 125%
- `currentDPR = 1.25`, `baseDPR = 1.0`
- `browserZoomLevel = 1.25`
- `compensationScale = 0.8` (反向缩放)
- 结果：游戏保持原始物理尺寸

## 兼容性

| 浏览器 | 支持情况 | 备注 |
|--------|---------|------|
| Chrome | ✅ 完全支持 | 包括 matchMedia 监听 |
| Firefox | ✅ 完全支持 | DPR 检测正常 |
| Safari | ✅ 完全支持 | macOS 和 iOS |
| Edge | ✅ 完全支持 | Chromium 内核 |

## 测试方法

1. **测试缩放**：
   - Windows: `Ctrl +` / `Ctrl -`
   - macOS: `Cmd +` / `Cmd -`

2. **验证效果**：
   - 打开浏览器控制台
   - 查看 `[缩放补偿]` 日志
   - 观察游戏界面物理尺寸是否保持不变

3. **测试滚轮缩放**：
   - 按住 `Ctrl` (或 `Cmd`)
   - 滚动鼠标滚轮

## 常见问题

### Q1: 为什么要把游戏和广告放在同一容器？
**A**: 只对容器应用缩放，内部所有元素会同步缩放，避免单独处理每个元素。

### Q2: 如果我的项目没有广告怎么办？
**A**: 只需要把游戏容器放在 `main-wrapper` 中即可，原理相同。

### Q3: 能否只在特定条件下启用缩放补偿？
**A**: 可以在 `compensateBrowserZoom` 函数开头添加条件判断：
```javascript
// 仅在桌面浏览器启用
if (window.innerWidth < 768) return;
```

## 自定义参数

### 调整延迟时间
```javascript
// DOMContentLoaded 延迟 (默认 200ms)
setTimeout(compensateBrowserZoom, 200);

// resize 防抖延迟 (默认 100ms)
resizeTimeout = setTimeout(compensateBrowserZoom, 100);

// wheel 事件延迟 (默认 50ms)
setTimeout(compensateBrowserZoom, 50);
```

### 修改 transform-origin
```css
#main-wrapper {
    transform-origin: top left;    /* 左上角为基点 */
    transform-origin: bottom center; /* 底部中心为基点 */
}
```

## 应用到其他项目

### Construct 2/3 项目
```javascript
// 替换 main-wrapper 为你的游戏容器ID
const mainWrapper = document.getElementById('c2canvasdiv');
```

### Unity WebGL 项目
```javascript
// 替换 main-wrapper 为 Unity 容器
const mainWrapper = document.getElementById('unity-container');
```

### 纯Canvas项目
```html
<div id="main-wrapper">
    <canvas id="gameCanvas"></canvas>
</div>
```

## Git 提交信息模板

```
实现浏览器缩放补偿功能

- 重构HTML结构：创建统一的main-wrapper容器
- 使用devicePixelRatio检测浏览器缩放
- 对容器应用反向缩放以保持物理尺寸不变
- 添加多重事件监听：DOMContentLoaded, resize, wheel, matchMedia
- 游戏画布和其他组件同步缩放

技术特点：
- 使用 devicePixelRatio 比 innerWidth/outerWidth 更可靠
- 统一容器架构，确保所有元素同步缩放
- 添加防抖机制避免频繁触发

效果：当用户使用 Ctrl+/- 缩放浏览器时，界面反向缩放以保持物理尺寸不变

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

## 参考实现

本skill基于以下项目的实践经验：
- SheepGame Generation 2 (Phaser 3)
- 空战游戏 (Construct 2)

Commit: af1eee9
Repository: https://github.com/abcdefg-maker/SheepGame_GenerationTwo

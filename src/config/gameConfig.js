// 其他游戏参数配置
const gameConfig = {
    // 游戏基础设置
    game: {
        name: 'Sheep Game Generation 2',
        version: '1.0.0',
        fps: 60,
        debug: false,
    },

    // 物理参数
    physics: {
        gravity: 0,
        friction: 0.5,
        bounce: 0.3,
        velocity: {
            max: 500,
            default: 200,
        },
    },

    // 动画参数
    animation: {
        duration: 300,
        ease: 'Power2',
        frameRate: 12,
    },

    // 音效参数
    audio: {
        musicVolume: 0.7,
        sfxVolume: 0.8,
        muted: false,
    },

    // 游戏难度参数
    difficulty: {
        easy: {
            level: 1,
            sheepCount: 10,
            timeLimit: 180,
            scoreMultiplier: 1,
        },
        normal: {
            level: 2,
            sheepCount: 15,
            timeLimit: 120,
            scoreMultiplier: 1.5,
        },
        hard: {
            level: 3,
            sheepCount: 20,
            timeLimit: 90,
            scoreMultiplier: 2,
        },
    },

    // 计分系统
    scoring: {
        matchBonus: 100,
        comboMultiplier: 1.5,
        timeBonus: 50,
        perfectClearBonus: 1000,
    },

    // 颜色主题
    colors: {
        primary: '#4CAF50',
        secondary: '#2196F3',
        accent: '#FF9800',
        background: '#87CEEB',
        text: '#FFFFFF',
        error: '#F44336',
        // 游戏区域颜色
        infoBar: '#2196F3',
        selectionArea: '#E8F5E9',
        eliminationArea: '#FFF3E0',
        areaBorder: '#999999',
    },

    // 字体设置
    fonts: {
        primary: 'Arial',
        title: {
            size: 48,
            weight: 'bold',
        },
        body: {
            size: 24,
            weight: 'normal',
        },
        small: {
            size: 16,
            weight: 'normal',
        },
    },

    // 特效参数
    effects: {
        particles: {
            count: 20,
            speed: 100,
            lifespan: 1000,
        },
        screen: {
            shake: {
                duration: 300,
                intensity: 0.01,
            },
            flash: {
                duration: 200,
                alpha: 0.5,
            },
        },
    },

    // 调试选项
    debug: {
        showFPS: false,
        showHitboxes: false,
        showGrid: false,
        logEvents: false,
    },

    // 卡牌系统配置
    card: {
        // 棋盘配置
        gridSize: 8,                    // 8x8棋盘

        // 卡牌类型
        cardTypeCount: 8,               // 卡牌类型数量
        cardTypes: [
            { id: 'sheep', emoji: '🐑', image: 'Icon1.png' },
            { id: 'cow',   emoji: '🐄', image: 'Icon2.png' },
            { id: 'pig',   emoji: '🐷', image: 'Icon3.png' },
            { id: 'dog',   emoji: '🐶', image: 'Icon4.png' },
            { id: 'cat',   emoji: '🐱', image: 'Icon5.png' },
            { id: 'rabbit',emoji: '🐰', image: 'Icon6.png' },
            { id: 'fox',   emoji: '🦊', image: 'Icon7.png' },
            { id: 'bear',  emoji: '🐻', image: 'Icon8.png' }
        ],

        // 图片配置
        cardImagePath: 'src/images/cards/',  // 图片路径前缀
        cardImageScale: 0.95,              // 图片缩放比例(根据实际尺寸调整)

        // 卡牌尺寸 (黄金分割比 1:1.618)
        cardWidth: 60,                  // 宽度(短边)
        cardHeight: 97,                 // 高度 = 60 * 1.618 ≈ 97

        // 层级配置
        layerCount: 10,                 // 总层数（默认值，会被关卡配置覆盖）

        // 重叠判定
        overlapCheckDepth: 2,           // 向下穿透层数

        // Depth配置
        depthConfig: {
            baseDepth: 0,               // 被锁卡牌起始depth
            lockedStep: 10,             // 被锁卡牌depth步长
            floatingBase: 10000         // 浮动卡牌起始depth
        },

        // 视觉配置
        visual: {
            // 被锁状态
            locked: {
                alpha: 0.5,              // 更透明
                scale: 0.9,              // 更小
                tint: 0xAAAAAA,          // 更深的灰色背景
                strokeWidth: 2,
                strokeColor: 0x666666,   // 更深的边框
                imageTint: 0x888888,     // 图片灰色滤镜
                imageAlpha: 0.4          // 图片更透明
            },
            // 解锁状态
            unlocked: {
                alpha: 1.0,
                scale: 1.0,
                tint: 0xFFFFFF,
                strokeWidth: 3,
                strokeColor: 0xFFD700,   // 金色边框
                imageTint: 0xFFFFFF,     // 图片正常颜色
                imageAlpha: 1.0          // 图片不透明
            },
            // 悬停状态
            hover: {
                alpha: 1.0,
                scale: 1.05,
                tint: 0xFFFFFF,
                strokeWidth: 4,
                strokeColor: 0x00FF00,   // 绿色边框
                imageTint: 0xFFFFFF,
                imageAlpha: 1.0
            }
        },

        // 动画配置
        cardAnimation: {
            floatDuration: 300,           // 浮起动画时长(ms)
            floatDistance: 5,             // 浮起距离(px)
            breatheDuration: 1000,        // 呼吸动画时长(ms)
            breatheScale: 1.02,           // 呼吸动画缩放
            clickFeedbackDuration: 150,   // 点击反馈时长(ms)
            moveToSlotDuration: 400,      // 移动到消除槽的时长(ms)
            eliminateDuration: 300        // 消除动画时长(ms)
        }
    },

    // 关卡难度配置
    levels: [
        { level: 1, layerCount: 3, gridSize: 5, cardTypes: 3, name: '入门' },
        { level: 2, layerCount: 4, gridSize: 5, cardTypes: 3, name: '简单' },
        { level: 3, layerCount: 5, gridSize: 6, cardTypes: 4, name: '简单' },
        { level: 4, layerCount: 6, gridSize: 6, cardTypes: 4, name: '普通' },
        { level: 5, layerCount: 7, gridSize: 7, cardTypes: 4, name: '普通' },
        { level: 6, layerCount: 8, gridSize: 7, cardTypes: 5, name: '困难' },
        { level: 7, layerCount: 9, gridSize: 8, cardTypes: 5, name: '困难' },
        { level: 8, layerCount: 10, gridSize: 8, cardTypes: 5, name: '挑战' },
        { level: 9, layerCount: 11, gridSize: 8, cardTypes: 6, name: '挑战' },
        { level: 10, layerCount: 12, gridSize: 8, cardTypes: 6, name: '极难' }
    ],

    // 消除区域配置
    elimination: {
        maxSlots: 8,                    // 消除槽最大容量
        slotWidth: 70,                  // 槽位宽度
        slotHeight: 100,                // 槽位高度
        slotSpacing: 5,                 // 槽位间距
        matchCount: 3,                  // 消除所需相同卡牌数量
        slotBackground: 0xFFEBCD,       // 槽位背景色
        slotBorder: 0xFF9800,           // 槽位边框色
        slotBorderWidth: 2              // 槽位边框宽度
    },

    // 计分系统配置
    scoring: {
        eliminationBonus: 100,          // 每次消除3张卡牌的得分
        comboMultiplier: 1.5,           // 连消倍数(预留)
        perfectClearBonus: 1000         // 完美通关奖励(预留)
    }
};

export default gameConfig;

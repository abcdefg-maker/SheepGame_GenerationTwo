// 位置和大小参数配置
const layout = {
    // 游戏场景尺寸
    game: {
        width: 720,
        height: 1280,
    },

    // 角色位置和大小
    characters: {
        sheep: {
            x: 360,
            y: 640,
            width: 100,
            height: 100,
            scale: 1,
        },
        player: {
            x: 360,
            y: 1100,
            width: 80,
            height: 80,
            scale: 1,
        },
    },

    // 背景位置和大小
    backgrounds: {
        main: {
            x: 0,
            y: 0,
            width: 720,
            height: 1280,
        },
    },

    // UI元素位置和大小
    ui: {
        button: {
            x: 360,
            y: 1200,
            width: 200,
            height: 60,
            scale: 1,
        },
        panel: {
            x: 360,
            y: 100,
            width: 600,
            height: 200,
            scale: 1,
        },
        progressBar: {
            x: 60,
            y: 50,
            width: 600,
            height: 30,
        },
    },

    // 游戏区域布局
    gameArea: {
        // 信息栏
        infoBar: {
            x: 0,
            y: 0,
            width: 720,
            height: 120,
        },
        // 选择区域（正方形，宽度由场景宽度限制）
        selectionArea: {
            x: 0,
            y: 120,
            width: 720,
            height: 720,
            padding: 20, // 内边距
        },
        // 消除区域（占据剩余空间）
        eliminationArea: {
            x: 0,
            y: 840, // 120 + 720
            width: 720,
            height: 440, // 1280 - 120 - 720 = 440
            padding: 20,
        },
        gridSize: 60,
        rows: 10,
        cols: 8,
    },

    // 边距和间距
    spacing: {
        margin: 20,
        padding: 10,
        gridGap: 10,
    },
};

export default layout;

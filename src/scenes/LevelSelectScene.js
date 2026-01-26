import Phaser from 'phaser';
import { layout, gameConfig } from '../config';

export default class LevelSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LevelSelectScene' });
    }

    preload() {
        // 预加载资源
        this.load.image('background', 'src/images/background/background_play.png');
    }

    create() {
        const { width, height } = layout.game;
        const centerX = width / 2;

        // 背景
        const background = this.add.image(0, 0, 'background').setOrigin(0);
        // 缩放背景以适应屏幕
        background.setDisplaySize(width, height);

        // 标题
        const title = this.add.text(centerX, 100, '选择关卡', {
            fontSize: '48px',
            color: gameConfig.colors.text,
            fontFamily: gameConfig.fonts.primary,
            fontStyle: 'bold'
        });
        title.setOrigin(0.5);
        title.setShadow(2, 2, '#000000', 5);

        // 创建关卡按钮（从配置读取所有关卡）
        const levels = gameConfig.levels;
        const cols = 5; // 每行5个关卡
        const buttonWidth = 130;
        const buttonHeight = 100;
        const spacingX = 10; // 按钮之间的间距
        const spacingY = 15; // 行之间的间距

        // 计算总宽度并居中
        const totalWidth = cols * buttonWidth + (cols - 1) * spacingX;
        const startX = (width - totalWidth) / 2 + buttonWidth / 2;
        const startY = 220;

        levels.forEach((levelConfig, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            const x = startX + col * (buttonWidth + spacingX);
            const y = startY + row * (buttonHeight + spacingY);

            this.createLevelButton(
                x,
                y,
                `关卡 ${levelConfig.level}`,
                levelConfig.name,
                levelConfig.level,
                buttonWidth,
                buttonHeight
            );
        });

        // 返回按钮（放在关卡按钮下方）
        this.createButton(centerX, 500, '返回菜单', () => {
            this.scene.start('MenuScene');
        });
    }

    createLevelButton(x, y, levelText, difficulty, levelNumber, buttonWidth = 500, buttonHeight = 120) {

        // 按钮背景（根据难度选择颜色）
        const colors = {
            '入门': 0x8BC34A,
            '简单': 0x4CAF50,
            '普通': 0xFF9800,
            '困难': 0xF44336,
            '挑战': 0x9C27B0,
            '极难': 0x212121
        };
        const button = this.add.rectangle(x, y, buttonWidth, buttonHeight, colors[difficulty] || 0x2196F3);
        button.setStrokeStyle(3, 0xFFFFFF);

        // 关卡文字（居中显示）
        const text = this.add.text(x, y - 12, levelText, {
            fontSize: '20px',
            color: '#FFFFFF',
            fontFamily: gameConfig.fonts.primary,
            fontStyle: 'bold'
        });
        text.setOrigin(0.5);

        // 难度文字（居中显示在下方）
        const difficultyText = this.add.text(x, y + 12, difficulty, {
            fontSize: '16px',
            color: '#FFFFFF',
            fontFamily: gameConfig.fonts.primary
        });
        difficultyText.setOrigin(0.5);

        // 添加交互
        button.setInteractive({ useHandCursor: true });

        button.on('pointerover', () => {
            button.setScale(1.05);
            text.setScale(1.05);
            difficultyText.setScale(1.05);
        });

        button.on('pointerout', () => {
            button.setScale(1);
            text.setScale(1);
            difficultyText.setScale(1);
        });

        button.on('pointerdown', () => {
            button.setScale(0.95);
            text.setScale(0.95);
            difficultyText.setScale(0.95);
        });

        button.on('pointerup', () => {
            button.setScale(1);
            text.setScale(1);
            difficultyText.setScale(1);
            // 启动游戏场景，传递关卡信息
            this.scene.start('GameScene', { level: levelNumber, difficulty: difficulty });
        });

        return { button, text, difficultyText };
    }

    createButton(x, y, text, callback) {
        const buttonWidth = 300;
        const buttonHeight = 80;

        const button = this.add.rectangle(x, y, buttonWidth, buttonHeight, 0x2196F3);
        button.setStrokeStyle(4, 0xFFFFFF);

        const buttonText = this.add.text(x, y, text, {
            fontSize: '32px',
            color: '#FFFFFF',
            fontFamily: gameConfig.fonts.primary,
            fontStyle: 'bold'
        });
        buttonText.setOrigin(0.5);

        button.setInteractive({ useHandCursor: true });

        button.on('pointerover', () => {
            button.setFillStyle(0x42A5F5);
            button.setScale(1.05);
            buttonText.setScale(1.05);
        });

        button.on('pointerout', () => {
            button.setFillStyle(0x2196F3);
            button.setScale(1);
            buttonText.setScale(1);
        });

        button.on('pointerdown', () => {
            button.setScale(0.95);
            buttonText.setScale(0.95);
        });

        button.on('pointerup', () => {
            button.setScale(1.05);
            buttonText.setScale(1.05);
            if (callback) callback();
        });

        return { button, buttonText };
    }
}

import Phaser from 'phaser';
import { layout, gameConfig } from '../config';

export default class LevelSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LevelSelectScene' });
    }

    preload() {
        // 预加载资源
    }

    create() {
        const { width, height } = layout.game;
        const centerX = width / 2;

        // 背景
        this.add.rectangle(0, 0, width, height, 0x87CEEB).setOrigin(0);

        // 标题
        const title = this.add.text(centerX, 100, '选择关卡', {
            fontSize: '48px',
            color: gameConfig.colors.text,
            fontFamily: gameConfig.fonts.primary,
            fontStyle: 'bold'
        });
        title.setOrigin(0.5);
        title.setShadow(2, 2, '#000000', 5);

        // 创建关卡按钮（3x3网格）
        const levels = ['简单', '普通', '困难'];
        const startY = 250;
        const buttonSpacing = 150;

        levels.forEach((levelName, index) => {
            const y = startY + index * buttonSpacing;
            this.createLevelButton(centerX, y, `第 ${index + 1} 关`, levelName, index + 1);
        });

        // 返回按钮
        this.createButton(centerX, height - 150, '返回菜单', () => {
            this.scene.start('MenuScene');
        });
    }

    createLevelButton(x, y, levelText, difficulty, levelNumber) {
        const buttonWidth = 500;
        const buttonHeight = 120;

        // 按钮背景
        const colors = {
            '简单': 0x4CAF50,
            '普通': 0xFF9800,
            '困难': 0xF44336
        };
        const button = this.add.rectangle(x, y, buttonWidth, buttonHeight, colors[difficulty]);
        button.setStrokeStyle(4, 0xFFFFFF);

        // 关卡文字
        const text = this.add.text(x - 150, y, levelText, {
            fontSize: '36px',
            color: '#FFFFFF',
            fontFamily: gameConfig.fonts.primary,
            fontStyle: 'bold'
        });
        text.setOrigin(0, 0.5);

        // 难度文字
        const difficultyText = this.add.text(x + 150, y, difficulty, {
            fontSize: '28px',
            color: '#FFFFFF',
            fontFamily: gameConfig.fonts.primary
        });
        difficultyText.setOrigin(1, 0.5);

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

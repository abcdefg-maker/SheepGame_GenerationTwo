import Phaser from 'phaser';
import { layout, gameConfig } from '../config';

export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        // 接收游戏数据
        this.currentLevel = data.level || 1;
        this.difficulty = data.difficulty || 'Easy';
        this.finalScore = data.score || 0;
        this.isWin = data.isWin || false;
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

        // 半透明遮罩
        this.add.rectangle(0, 0, width, height, 0x000000, 0.3).setOrigin(0);

        // 结果标题
        const resultTitle = this.add.text(centerX, 200, this.isWin ? 'Victory!' : 'Game Over', {
            fontSize: '64px',
            color: '#FFFFFF',
            fontFamily: gameConfig.fonts.primary,
            fontStyle: 'bold'
        });
        resultTitle.setOrigin(0.5);
        resultTitle.setShadow(3, 3, '#000000', 8);

        // 统计信息面板
        this.createStatsPanel(centerX, 400);

        // 按钮组
        this.createButton(centerX - 160, height - 200, 'Restart', () => {
            this.scene.start('GameScene', {
                level: this.currentLevel,
                difficulty: this.difficulty
            });
        }, 0xFF9800);

        this.createButton(centerX + 160, height - 200, 'Back to Menu', () => {
            this.scene.start('MenuScene');
        }, 0x2196F3);

        // 添加入场动画
        this.tweens.add({
            targets: resultTitle,
            scale: { from: 0, to: 1 },
            duration: 500,
            ease: 'Back.easeOut'
        });
    }

    createStatsPanel(x, y) {
        const panelWidth = 600;
        const panelHeight = 400;

        // 面板背景
        const panel = this.add.rectangle(x, y, panelWidth, panelHeight, 0xFFFFFF, 0.9);
        panel.setStrokeStyle(6, 0x333333);

        // 统计信息
        const statsY = y - 150;
        const lineHeight = 80;

        // 关卡信息
        this.add.text(x, statsY, `Level: ${this.currentLevel}`, {
            fontSize: '32px',
            color: '#333333',
            fontFamily: gameConfig.fonts.primary,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 难度信息
        this.add.text(x, statsY + lineHeight, `Difficulty: ${this.difficulty}`, {
            fontSize: '32px',
            color: '#333333',
            fontFamily: gameConfig.fonts.primary,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 分数信息
        this.add.text(x, statsY + lineHeight * 2, `Score: ${this.finalScore}`, {
            fontSize: '32px',
            color: '#333333',
            fontFamily: gameConfig.fonts.primary,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 状态信息
        const statusText = this.isWin ? 'Victory ✓' : 'Failed ✗';
        const statusColor = this.isWin ? '#4CAF50' : '#F44336';
        this.add.text(x, statsY + lineHeight * 3, statusText, {
            fontSize: '36px',
            color: statusColor,
            fontFamily: gameConfig.fonts.primary,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        return panel;
    }

    createButton(x, y, text, callback, color = 0x4CAF50) {
        const buttonWidth = 280;
        const buttonHeight = 80;

        // 按钮背景
        const button = this.add.rectangle(x, y, buttonWidth, buttonHeight, color);
        button.setStrokeStyle(4, 0xFFFFFF);

        // 按钮文字
        const buttonText = this.add.text(x, y, text, {
            fontSize: '28px',
            color: '#FFFFFF',
            fontFamily: gameConfig.fonts.primary,
            fontStyle: 'bold'
        });
        buttonText.setOrigin(0.5);

        // 添加交互
        button.setInteractive({ useHandCursor: true });

        button.on('pointerover', () => {
            button.setScale(1.1);
            buttonText.setScale(1.1);
        });

        button.on('pointerout', () => {
            button.setScale(1);
            buttonText.setScale(1);
        });

        button.on('pointerdown', () => {
            button.setScale(0.95);
            buttonText.setScale(0.95);
        });

        button.on('pointerup', () => {
            button.setScale(1.1);
            buttonText.setScale(1.1);
            if (callback) callback();
        });

        // 入场动画
        button.setAlpha(0);
        buttonText.setAlpha(0);
        this.tweens.add({
            targets: [button, buttonText],
            alpha: 1,
            duration: 400,
            delay: 300,
            ease: 'Power2'
        });

        return { button, buttonText };
    }
}

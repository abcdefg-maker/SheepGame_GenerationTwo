import Phaser from 'phaser';
import { layout, gameConfig } from '../config';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    preload() {
        // 预加载资源
        this.load.image('background_start', 'src/images/background/background_start.png');
        this.load.image('startButton', 'src/images/startButton.png');
    }

    create() {
        const { width, height } = layout.game;
        const centerX = width / 2;
        const centerY = height / 2;

        // 背景
        const background = this.add.image(0, 0, 'background_start').setOrigin(0);
        // 缩放背景以适应屏幕
        background.setDisplaySize(width, height);

        // 开始游戏按钮（使用图片）
        const startButton = this.add.image(centerX, centerY, 'startButton');
        startButton.setOrigin(0.5);

        // 添加交互效果
        startButton.setInteractive({ useHandCursor: true });

        startButton.on('pointerover', () => {
            startButton.setScale(1.1);
        });

        startButton.on('pointerout', () => {
            startButton.setScale(1.0);
        });

        startButton.on('pointerdown', () => {
            startButton.setScale(0.95);
        });

        startButton.on('pointerup', () => {
            startButton.setScale(1.1);
            this.scene.start('LevelSelectScene');
        });

        // 版本信息
        this.add.text(centerX, height - 50, `Version ${gameConfig.game.version}`, {
            fontSize: gameConfig.fonts.small.size + 'px',
            color: '#FFFFFF',
            fontFamily: gameConfig.fonts.primary
        }).setOrigin(0.5);
    }

    createButton(x, y, text, callback) {
        const buttonWidth = 300;
        const buttonHeight = 80;

        // 按钮背景
        const button = this.add.rectangle(x, y, buttonWidth, buttonHeight, 0x4CAF50);
        button.setStrokeStyle(4, 0xFFFFFF);

        // 按钮文字
        const buttonText = this.add.text(x, y, text, {
            fontSize: '32px',
            color: '#FFFFFF',
            fontFamily: gameConfig.fonts.primary,
            fontStyle: 'bold'
        });
        buttonText.setOrigin(0.5);

        // 添加交互
        button.setInteractive({ useHandCursor: true });

        button.on('pointerover', () => {
            button.setFillStyle(0x66BB6A);
            button.setScale(1.05);
            buttonText.setScale(1.05);
        });

        button.on('pointerout', () => {
            button.setFillStyle(0x4CAF50);
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

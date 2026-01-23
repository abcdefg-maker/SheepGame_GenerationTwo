import Phaser from 'phaser';

export default class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    preload() {
        // 在这里预加载资源
    }

    create() {
        // 添加欢迎文字
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;

        const text = this.add.text(centerX, centerY, 'Phaser 3 Game\n720 x 1280', {
            fontSize: '48px',
            color: '#ffffff',
            align: 'center',
            fontFamily: 'Arial'
        });
        text.setOrigin(0.5);

        // 添加一个简单的图形示例
        const graphics = this.add.graphics();
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(centerX, centerY + 150, 50);
    }

    update() {
        // 游戏循环更新逻辑
    }
}

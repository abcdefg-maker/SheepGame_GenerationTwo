import Phaser from 'phaser';
import { layout, gameConfig } from '../config';
import DataGenerator from '../utils/DataGenerator.js';
import LockManager from '../utils/LockManager.js';
import CardRenderer from '../utils/CardRenderer.js';
import InteractionManager from '../utils/InteractionManager.js';
import EliminationManager from '../utils/EliminationManager.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init(data) {
        // 接收从关卡选择场景传来的数据
        this.currentLevel = data.level || 1;
        this.difficulty = data.difficulty || 'Easy';

        // 获取关卡配置
        const levelConfig = gameConfig.levels.find(l => l.level === this.currentLevel) || gameConfig.levels[0];

        // 初始化卡牌系统变量
        this.layers = [];
        this.allCards = [];

        // 合并关卡配置到卡牌配置
        this.cardConfig = {
            ...gameConfig.card,
            gridSize: levelConfig.gridSize,
            layerCount: levelConfig.layerCount,
            cardTypes: gameConfig.card.cardTypes.slice(0, levelConfig.cardTypes)
        };

        // 初始化消除槽
        this.eliminationSlots = [];  // 消除槽中的卡牌
        this.slotSprites = [];        // 消除槽UI元素

        // 初始化分数
        this.score = 0;
    }

    preload() {
        // 预加载背景图片
        this.load.image('background_play', 'src/images/background/background_play.png');
        this.load.image('background_select', 'src/images/background/background_select.png');
        this.load.image('levelAndScore', 'src/images/background/LevelAndScore.png');

        // 预加载卡牌图片
        const { cardTypes, cardImagePath } = gameConfig.card;

        cardTypes.forEach((type, index) => {
            const imageFile = typeof type === 'string' ? `card_0${index + 1}.png` : type.image;
            const imagePath = cardImagePath + imageFile;

            // 使用id或索引作为key
            const key = typeof type === 'string' ? `card_${index}` : type.id;

            // 监听加载失败
            this.load.on('loaderror', (file) => {
                if (file.key === key) {
                    console.warn(`[图片加载失败] ${imagePath}, 将使用emoji降级显示`);
                }
            });

            this.load.image(key, imagePath);
        });
    }

    create() {
        const { width, height } = layout.game;
        const centerX = width / 2;

        // 背景
        const background = this.add.image(0, 0, 'background_play').setOrigin(0);
        // 缩放背景以适应屏幕
        background.setDisplaySize(width, height);

        // 顶部信息栏
        this.createInfoBar();

        // 选择区域
        this.createSelectionArea();

        // 初始化卡牌系统
        this.initCardSystem();

        // 消除区域
        this.createEliminationArea();
    }

    /**
     * 初始化卡牌系统
     */
    initCardSystem() {
        // 根据关卡选择形状模板
        const shapeMap = {
            1: 'circle',    // 圆形
            2: 'heart',     // 心形
            3: 'diamond',   // 菱形
            4: 'cross',     // 十字形
            5: 'flower',    // 花朵
            6: 'letterH',   // 字母H
            7: 'letterO',   // 字母O
            8: 'letterX',   // 字母X
            9: 'letterC',   // 字母C
            10: 'letterT'   // 字母T
        };

        const shapeType = shapeMap[this.currentLevel] || 'circle';
        console.log(`[GameScene] 关卡${this.currentLevel}使用形状: ${shapeType}`);

        // 1. 生成数据
        this.layers = DataGenerator.generateAllLayers(
            this.cardConfig.gridSize,
            this.cardConfig.layerCount,
            this.cardConfig.cardTypes,
            this.cardConfig.cardWidth,
            this.cardConfig.cardHeight,
            shapeType
        );

        // 2. 创建卡牌对象
        this.createCards();

        // 3. 初始化锁系统
        LockManager.initializeLocks(
            this.layers,
            this.cardConfig.cardWidth,
            this.cardConfig.cardHeight
        );

        // 4. 渲染卡牌
        this.renderCards();

        // 5. 设置交互
        this.setupInteractions();
    }

    /**
     * 创建卡牌对象
     */
    createCards() {
        const { selectionArea } = layout.gameArea;
        const { gridSize, cardWidth, cardHeight } = this.cardConfig;

        // 让卡牌紧邻排列，格子大小等于卡牌大小
        const cellWidth = cardWidth;
        const cellHeight = cardHeight;

        // 计算起始位置(居中整个网格)
        const gridTotalWidth = cellWidth * gridSize;
        const gridTotalHeight = cellHeight * gridSize;
        const startX = selectionArea.x + (selectionArea.width - gridTotalWidth) / 2;
        const startY = selectionArea.y + 80 + (selectionArea.height - 80 - gridTotalHeight) / 2;

        this.layers.forEach(layer => {
            layer.cards = [];

            for (let row = 0; row < gridSize; row++) {
                layer.cards[row] = [];

                for (let col = 0; col < gridSize; col++) {
                    if (!layer.boolGrid[row][col]) {
                        layer.cards[row][col] = null;
                        continue;
                    }

                    const baseX = startX + col * cellWidth + cellWidth / 2;
                    const baseY = startY + row * cellHeight + cellHeight / 2;

                    const card = {
                        layerIndex: layer.layerIndex,
                        row: row,
                        col: col,
                        isNormalCard: true,
                        cardType: layer.typeGrid[row][col],
                        lockCount: 0,
                        lockedCards: [],
                        baseX: baseX,
                        baseY: baseY,
                        x: baseX + layer.offsetX,
                        y: baseY + layer.offsetY,
                        sprite: null,
                        text: null,
                        isFloating: false,
                        isRemoved: false,
                        depth: 0
                    };

                    layer.cards[row][col] = card;
                }
            }
        });
    }

    /**
     * 渲染卡牌
     */
    renderCards() {
        // 从底层到顶层渲染
        this.layers.forEach(layer => {
            layer.cards.forEach(rowCards => {
                rowCards.forEach(card => {
                    if (card) {
                        CardRenderer.createCardSprite(this, card, this.cardConfig);
                    }
                });
            });
        });
    }

    /**
     * 设置交互
     */
    setupInteractions() {
        this.allCards = this.getAllCards();

        // 在registry中存储config供EliminationManager使用
        this.registry.set('config', gameConfig);

        this.allCards.forEach(card => {
            InteractionManager.setupCardClick(
                card,
                card.sprite,
                this.cardConfig,
                (clickedCard) => {
                    this.onCardClicked(clickedCard);
                }
            );
        });
    }

    /**
     * 卡牌点击处理（新的消除逻辑）
     */
    onCardClicked(card) {
        console.log('[GameScene] 卡牌被点击:', card.cardType);

        // 1. 尝试添加到消除槽
        const added = EliminationManager.addCardToSlot(card, this, gameConfig);

        if (!added) {
            // 槽位已满（7张），游戏失败
            console.log('[GameScene] 槽位已满，游戏失败');
            EliminationManager.checkLoseCondition(this);
            return;
        }

        // 2. 标记卡牌在消除槽中（用于胜利条件判断）
        card.inEliminationSlot = true;

        // 3. 解锁被这张卡牌锁住的其他卡牌
        card.lockedCards.forEach(ref => {
            const lockedCard = InteractionManager.findCard(this.allCards, ref);
            if (lockedCard && !lockedCard.isRemoved) {
                InteractionManager.unlockCard(lockedCard, this, this.cardConfig);
            }
        });

        // 5. 延迟检查消除（等待移动动画完成）
        const delay = this.cardConfig.cardAnimation.moveToSlotDuration + 50;
        console.log('[GameScene] 延迟', delay, 'ms后检查消除');
        this.time.delayedCall(delay, () => {
            console.log('[GameScene] 延迟时间到，开始检查消除');
            // 检查并执行三张消除
            EliminationManager.checkAndEliminate(this, gameConfig);
        });
    }

    /**
     * 获取所有卡牌
     */
    getAllCards() {
        const cards = [];
        this.layers.forEach(layer => {
            layer.cards.forEach(rowCards => {
                rowCards.forEach(card => {
                    if (card) cards.push(card);
                });
            });
        });
        return cards;
    }

    createInfoBar() {
        const { infoBar } = layout.gameArea;

        // 使用 LevelAndScore.png 作为信息栏背景
        const barImage = this.add.image(
            infoBar.x + infoBar.width / 2,
            infoBar.y + infoBar.height / 2,
            'levelAndScore'
        );
        barImage.setOrigin(0.5);

        // 缩放图片以适应信息栏区域
        const scaleX = infoBar.width / barImage.width;
        const scaleY = infoBar.height / barImage.height;
        barImage.setScale(Math.min(scaleX, scaleY) * 0.9);

        // 计算三个框的中心X坐标（基于图片比例）
        const centerY = infoBar.y + infoBar.height / 2;
        const leftFrameX = infoBar.x + infoBar.width * 0.17;
        const middleFrameX = infoBar.x + infoBar.width * 0.5;
        const rightFrameX = infoBar.x + infoBar.width * 0.83;

        // 左框：Level（关卡）
        const levelText = this.add.text(leftFrameX, centerY, `Level: ${this.currentLevel}`, {
            fontSize: '24px',
            color: '#000000',
            fontFamily: gameConfig.fonts.primary,
            fontStyle: 'bold'
        });
        levelText.setOrigin(0.5);

        // 中框：Difficulty（难度）
        const difficultyText = this.add.text(middleFrameX, centerY, `Difficulty: \n ${this.difficulty}`, {
            fontSize: '24px',
            color: '#000000',
            fontFamily: gameConfig.fonts.primary,
            fontStyle: 'bold'
        });
        difficultyText.setOrigin(0.5);

        // 右框：Score（分数）
        this.scoreText = this.add.text(rightFrameX, centerY, 'Score: 0', {
            fontSize: '24px',
            color: '#000000',
            fontFamily: gameConfig.fonts.primary,
            fontStyle: 'bold'
        });
        this.scoreText.setOrigin(0.5);
    }

    createSelectionArea() {
        const { selectionArea } = layout.gameArea;

        // 选择区域背景
        const background = this.add.rectangle(
            selectionArea.x,
            selectionArea.y,
            selectionArea.width,
            selectionArea.height,
            Phaser.Display.Color.HexStringToColor(gameConfig.colors.selectionArea).color
        );
        background.setOrigin(0);
        background.setDepth(-1); // 放在最底层

        // 边框
        const border = this.add.rectangle(
            selectionArea.x,
            selectionArea.y,
            selectionArea.width,
            selectionArea.height
        );
        border.setOrigin(0);
        border.setStrokeStyle(3, Phaser.Display.Color.HexStringToColor(gameConfig.colors.areaBorder).color);
        border.setFillStyle();
        border.setDepth(-1); // 放在最底层
    }

    createEliminationArea() {
        const { eliminationArea } = layout.gameArea;
        const { elimination } = gameConfig;

        // 消除区域背景（使用图片）
        const background = this.add.image(
            eliminationArea.x + eliminationArea.width / 2,
            eliminationArea.y + eliminationArea.height / 2,
            'background_select'
        );
        background.setOrigin(0.5);

        // 缩放图片以适应消除区域
        const scaleX = eliminationArea.width / background.width;
        const scaleY = eliminationArea.height / background.height;
        background.setScale(Math.min(scaleX, scaleY) * 1.025);

        // 保存背景引用供槽位对齐使用
        this.eliminationBackground = background;

        // 创建消除槽位
        this.createEliminationSlots();
    }

    /**
     * 创建消除槽位（显示红色边框，严格对齐背景图片）
     */
    createEliminationSlots() {
        const { eliminationArea } = layout.gameArea;
        const { elimination } = gameConfig;

        // 从配置读取位置微调参数
        const offsetX = elimination.offsetX;
        const offsetY = elimination.offsetY;
        const frameYRatio = elimination.frameYRatio;

        // 计算槽位总宽度
        const totalWidth = elimination.maxSlots * elimination.slotWidth +
                          (elimination.maxSlots - 1) * elimination.slotSpacing;

        // 计算起始X位置（居中 + 偏移）
        const startX = eliminationArea.x + (eliminationArea.width - totalWidth) / 2 + offsetX;

        // 计算Y位置（对齐背景图片中的框 + 偏移）
        const slotY = eliminationArea.y + eliminationArea.height * frameYRatio + offsetY;

        // 创建8个槽位（带红色边框）
        for (let i = 0; i < elimination.maxSlots; i++) {
            const slotX = startX + i * (elimination.slotWidth + elimination.slotSpacing);
            const centerX = slotX + elimination.slotWidth / 2;

            // 保存槽位坐标（不显示边框）
            this.slotSprites.push({
                x: centerX,
                y: slotY,
                border: null  // 不需要边框引用
            });
        }
    }

    createButton(x, y, text, callback) {
        const buttonWidth = 300;
        const buttonHeight = 80;

        // 按钮背景
        const button = this.add.rectangle(x, y, buttonWidth, buttonHeight, 0xF44336);
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
            button.setFillStyle(0xE53935);
            button.setScale(1.05);
            buttonText.setScale(1.05);
        });

        button.on('pointerout', () => {
            button.setFillStyle(0xF44336);
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

    /**
     * 更新分数显示
     */
    updateScore(points) {
        this.score += points;
        if (this.scoreText) {
            this.scoreText.setText(`Score: ${this.score}`);
        }
        console.log('[GameScene] 分数更新:', this.score);
    }

    update() {
        // 游戏循环更新逻辑（待实现）
    }
}

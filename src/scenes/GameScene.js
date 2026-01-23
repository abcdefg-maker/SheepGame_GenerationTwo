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
        this.difficulty = data.difficulty || '简单';

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
        this.add.rectangle(0, 0, width, height, 0x87CEEB).setOrigin(0);

        // 顶部信息栏
        this.createInfoBar();

        // 选择区域
        this.createSelectionArea();

        // 初始化卡牌系统
        this.initCardSystem();

        // 消除区域
        this.createEliminationArea();

        // 跳转到结束场景的按钮（放在消除区域底部）
        const { eliminationArea } = layout.gameArea;
        this.createButton(
            centerX,
            eliminationArea.y + eliminationArea.height - 60,
            '结束游戏',
            () => {
                this.scene.start('GameOverScene', {
                    level: this.currentLevel,
                    difficulty: this.difficulty,
                    score: this.score || 0,
                    isWin: false
                });
            }
        );
    }

    /**
     * 初始化卡牌系统
     */
    initCardSystem() {
        // 1. 生成数据
        this.layers = DataGenerator.generateAllLayers(
            this.cardConfig.gridSize,
            this.cardConfig.layerCount,
            this.cardConfig.cardTypes,
            this.cardConfig.cardWidth,
            this.cardConfig.cardHeight
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

        // 计算可用区域（考虑偏移量，预留半个卡牌的空间）
        const availableWidth = selectionArea.width - selectionArea.padding * 2 - cardWidth;
        const availableHeight = selectionArea.height - 80 - selectionArea.padding - cardHeight; // 留出标题和底部空间

        const cellSize = Math.min(
            availableWidth / gridSize,
            availableHeight / gridSize
        );

        // 计算起始位置(居中整个网格)
        const gridTotalWidth = cellSize * gridSize;
        const gridTotalHeight = cellSize * gridSize;
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

                    const baseX = startX + col * cellSize + cellSize / 2;
                    const baseY = startY + row * cellSize + cellSize / 2;

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
            // 槽位已满，游戏失败
            console.log('[GameScene] 槽位已满，检查失败条件');
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

        // 4. 延迟检查消除（等待移动动画完成）
        const delay = this.cardConfig.cardAnimation.moveToSlotDuration + 50;
        console.log('[GameScene] 延迟', delay, 'ms后检查消除');
        this.time.delayedCall(delay, () => {
            console.log('[GameScene] 延迟时间到，开始检查消除');
            // 检查并执行三张消除
            const eliminated = EliminationManager.checkAndEliminate(this, gameConfig);

            // 如果消除后槽位仍然满了，检查失败条件
            if (!eliminated && this.eliminationSlots.length >= gameConfig.elimination.maxSlots) {
                console.log('[GameScene] 未消除且槽位满，检查失败条件');
                EliminationManager.checkLoseCondition(this);
            }
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

        // 信息栏背景
        const bar = this.add.rectangle(
            infoBar.x,
            infoBar.y,
            infoBar.width,
            infoBar.height,
            Phaser.Display.Color.HexStringToColor(gameConfig.colors.infoBar).color
        );
        bar.setOrigin(0);

        // 关卡信息
        const levelText = this.add.text(30, 30, `关卡: ${this.currentLevel}`, {
            fontSize: '28px',
            color: '#FFFFFF',
            fontFamily: gameConfig.fonts.primary,
            fontStyle: 'bold'
        });

        // 难度信息
        const difficultyText = this.add.text(30, 70, `难度: ${this.difficulty}`, {
            fontSize: '24px',
            color: '#FFFFFF',
            fontFamily: gameConfig.fonts.primary
        });

        // 分数信息
        this.scoreText = this.add.text(infoBar.width - 30, 30, '分数: 0', {
            fontSize: '28px',
            color: '#FFFFFF',
            fontFamily: gameConfig.fonts.primary,
            fontStyle: 'bold'
        });
        this.scoreText.setOrigin(1, 0);

        // 时间信息
        const timeText = this.add.text(infoBar.width - 30, 70, '时间: 00:00', {
            fontSize: '24px',
            color: '#FFFFFF',
            fontFamily: gameConfig.fonts.primary
        });
        timeText.setOrigin(1, 0);
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

        // 消除区域背景
        const background = this.add.rectangle(
            eliminationArea.x,
            eliminationArea.y,
            eliminationArea.width,
            eliminationArea.height,
            Phaser.Display.Color.HexStringToColor(gameConfig.colors.eliminationArea).color
        );
        background.setOrigin(0);

        // 边框
        const border = this.add.rectangle(
            eliminationArea.x,
            eliminationArea.y,
            eliminationArea.width,
            eliminationArea.height
        );
        border.setOrigin(0);
        border.setStrokeStyle(3, Phaser.Display.Color.HexStringToColor(gameConfig.colors.areaBorder).color);
        border.setFillStyle();

        // 区域标题
        const title = this.add.text(
            eliminationArea.x + eliminationArea.width / 2,
            eliminationArea.y + 20,
            '消除区域 (0/8)',
            {
                fontSize: '32px',
                color: '#333333',
                fontFamily: gameConfig.fonts.primary,
                fontStyle: 'bold'
            }
        );
        title.setOrigin(0.5, 0);
        this.eliminationTitle = title; // 保存引用用于更新计数

        // 创建消除槽位
        this.createEliminationSlots();
    }

    /**
     * 创建消除槽位
     */
    createEliminationSlots() {
        const { eliminationArea } = layout.gameArea;
        const { elimination } = gameConfig;

        // 计算槽位总宽度
        const totalWidth = elimination.maxSlots * elimination.slotWidth +
                          (elimination.maxSlots - 1) * elimination.slotSpacing;

        // 计算起始X位置（居中）
        const startX = eliminationArea.x + (eliminationArea.width - totalWidth) / 2;
        const slotY = eliminationArea.y + eliminationArea.height / 2 + 20;

        // 创建8个槽位框
        for (let i = 0; i < elimination.maxSlots; i++) {
            const slotX = startX + i * (elimination.slotWidth + elimination.slotSpacing);

            // 槽位背景
            const slotBg = this.add.rectangle(
                slotX,
                slotY,
                elimination.slotWidth,
                elimination.slotHeight,
                elimination.slotBackground
            );
            slotBg.setOrigin(0, 0.5);
            slotBg.setStrokeStyle(elimination.slotBorderWidth, elimination.slotBorder);
            slotBg.setAlpha(0.3);

            // 槽位编号
            const slotNumber = this.add.text(
                slotX + elimination.slotWidth / 2,
                slotY + elimination.slotHeight / 2 + 10,
                `${i + 1}`,
                {
                    fontSize: '20px',
                    color: '#999999',
                    fontFamily: gameConfig.fonts.primary
                }
            );
            slotNumber.setOrigin(0.5);
            slotNumber.setAlpha(0.5);

            this.slotSprites.push({
                background: slotBg,
                number: slotNumber,
                x: slotX + elimination.slotWidth / 2,
                y: slotY
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
            this.scoreText.setText(`分数: ${this.score}`);
        }
        console.log('[GameScene] 分数更新:', this.score);
    }

    update() {
        // 游戏循环更新逻辑（待实现）
    }
}

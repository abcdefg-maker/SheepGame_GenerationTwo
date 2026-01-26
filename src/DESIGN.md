# 羊了个羊游戏 - 技术设计文档

## 文档说明
本文档基于 [REQUIREMENTS.md](./REQUIREMENTS.md) 需求文档,详细说明卡牌系统的技术实现方案。

---

## 一、系统架构设计

### 1.1 核心模块划分

```
CardSystem (卡牌系统)
├── DataGenerator (数据生成器)
│   ├── generateBoolGrid()      - 生成1号bool数组
│   ├── generateTypeGrid()      - 生成2号类型数组
│   └── generateLayers()        - 生成多层数组
│
├── CardRenderer (卡牌渲染器)
│   ├── createCardSprite()      - 创建卡牌精灵
│   ├── updateCardVisual()      - 更新卡牌视觉状态
│   └── floatCardToTop()        - 卡牌浮到顶层动画
│
├── LockManager (锁管理器)
│   ├── initializeLocks()       - 初始化锁系统
│   ├── calculateOverlap()      - 计算重叠判定
│   ├── lockCard()              - 锁住卡牌
│   └── unlockCard()            - 解锁卡牌
│
└── InteractionManager (交互管理器)
    ├── setupCardClick()        - 设置点击事件
    ├── onCardClick()           - 点击处理
    └── checkClickable()        - 检查可点击性
```

---

## 二、数据结构设计

### 2.1 Card 对象（扩展版）

```javascript
class Card {
  // 基础属性
  layerIndex: number;          // 所属层级 (0-9)
  row: number;                 // 行索引 (0-n)
  col: number;                 // 列索引 (0-n)

  // 类型属性
  isNormalCard: boolean;       // 是否为正常卡牌
  cardType: string | null;     // 卡牌类型 ('sheep', 'cow', 'pig' 或 null)

  // 锁相关
  lockCount: number;           // 当前锁数 (0表示可点击)
  lockedCards: CardReference[]; // 该卡牌锁住的下层卡牌列表

  // 渲染属性
  x: number;                   // 世界坐标X (考虑偏移后)
  y: number;                   // 世界坐标Y (考虑偏移后)
  baseX: number;               // 基础坐标X (未偏移)
  baseY: number;               // 基础坐标Y (未偏移)
  sprite: Phaser.GameObjects.Rectangle; // Phaser精灵对象

  // 状态属性
  isFloating: boolean;         // 是否已浮到顶层
  depth: number;               // 当前渲染深度
}

// 卡牌引用
interface CardReference {
  layerIndex: number;
  row: number;
  col: number;
}
```

### 2.2 Layer 对象

```javascript
class Layer {
  layerIndex: number;              // 层级索引 (0-9)
  boolGrid: boolean[][];           // 1号数组 (n×n)
  typeGrid: (string|null)[][];     // 2号数组 (n×n)
  cards: (Card|null)[][];          // 卡牌对象二维数组
  offsetX: number;                 // X轴偏移量 (px)
  offsetY: number;                 // Y轴偏移量 (px)
  offsetDirection: string;         // 偏移方向 ('none', 'topLeft', 'topRight', 'bottomLeft', 'bottomRight')
}
```

### 2.3 CardSystem 主类

```javascript
class CardSystem {
  scene: Phaser.Scene;             // Phaser场景引用
  layers: Layer[];                 // 所有层级
  allCards: Card[];                // 所有正常卡牌的扁平数组
  config: CardConfig;              // 配置对象

  // Depth管理
  baseDepth: number = 0;           // 被锁卡牌基础depth
  floatingDepth: number = 10000;   // 浮动卡牌基础depth
}
```

---

## 三、渲染层级方案（方案1）

### 3.1 Depth分配策略

```javascript
/**
 * Depth分配规则:
 *
 * 被锁卡牌: layerIndex * 10
 * - 第0层: depth = 0
 * - 第1层: depth = 10
 * - 第2层: depth = 20
 * - ...
 * - 第9层: depth = 90
 *
 * 解锁卡牌: 10000 + layerIndex
 * - 第0层解锁: depth = 10000
 * - 第1层解锁: depth = 10001
 * - ...
 * - 第9层解锁: depth = 10009
 *
 * 优势:
 * - 所有解锁卡牌始终在被锁卡牌上方
 * - 保持原有层级的相对顺序
 * - 无需重新创建精灵对象
 */

class DepthManager {
  static getLockedDepth(layerIndex) {
    return layerIndex * 10;
  }

  static getUnlockedDepth(layerIndex) {
    return 10000 + layerIndex;
  }

  static isFloating(depth) {
    return depth >= 10000;
  }
}
```

### 3.2 视觉状态定义

```javascript
// 卡牌视觉状态枚举
const CardVisualState = {
  // 被锁状态
  LOCKED: {
    alpha: 0.6,           // 透明度
    scale: 0.95,          // 缩放
    tint: 0xCCCCCC,       // 灰色调
    strokeWidth: 2,       // 边框宽度
    strokeColor: 0x999999 // 边框颜色
  },

  // 解锁状态(浮动)
  UNLOCKED: {
    alpha: 1.0,
    scale: 1.0,
    tint: 0xFFFFFF,
    strokeWidth: 3,
    strokeColor: 0xFFD700  // 金色边框
  },

  // 悬停状态
  HOVER: {
    alpha: 1.0,
    scale: 1.05,
    tint: 0xFFFFFF,
    strokeWidth: 4,
    strokeColor: 0x00FF00  // 绿色边框
  }
};
```

---

## 四、核心算法实现

### 4.1 数据生成流程

```javascript
class DataGenerator {
  /**
   * 生成完整的卡牌数据
   * @param {number} gridSize - 棋盘大小 (n×n)
   * @param {number} layerCount - 层数
   * @param {string[]} cardTypes - 卡牌类型数组
   * @returns {Layer[]} 所有层级数据
   */
  static generateAllLayers(gridSize, layerCount, cardTypes) {
    const layers = [];

    // 生成基础bool数组模板(所有层共享相同模板)
    const baseBoolGrid = this.generateBoolGrid(gridSize);

    for (let i = 0; i < layerCount; i++) {
      const layer = {
        layerIndex: i,
        boolGrid: this.cloneGrid(baseBoolGrid),
        typeGrid: this.generateTypeGrid(baseBoolGrid, cardTypes),
        cards: [],
        offsetX: 0,
        offsetY: 0,
        offsetDirection: 'none'
      };

      // 计算偏移
      if (i % 2 === 1) { // 偶数层(索引为奇数)
        const offset = this.calculateRandomOffset();
        layer.offsetX = offset.x;
        layer.offsetY = offset.y;
        layer.offsetDirection = offset.direction;
      }

      layers.push(layer);
    }

    return layers;
  }

  /**
   * 生成1号bool数组
   * 策略: 中心密集,边缘稀疏
   */
  static generateBoolGrid(size) {
    const grid = [];
    const center = size / 2;

    for (let row = 0; row < size; row++) {
      grid[row] = [];
      for (let col = 0; col < size; col++) {
        // 计算到中心的距离
        const distanceToCenter = Math.sqrt(
          Math.pow(row - center, 2) +
          Math.pow(col - center, 2)
        );

        // 距离越远,生成true的概率越低
        const probability = 1 - (distanceToCenter / (size * 0.7));
        const isNormalCard = Math.random() < Math.max(0.3, probability);

        grid[row][col] = isNormalCard;
      }
    }

    return grid;
  }

  /**
   * 生成2号类型数组
   */
  static generateTypeGrid(boolGrid, cardTypes) {
    const size = boolGrid.length;
    const typeGrid = [];

    for (let row = 0; row < size; row++) {
      typeGrid[row] = [];
      for (let col = 0; col < size; col++) {
        if (boolGrid[row][col]) {
          // 随机选择卡牌类型
          const randomType = cardTypes[
            Math.floor(Math.random() * cardTypes.length)
          ];
          typeGrid[row][col] = randomType;
        } else {
          typeGrid[row][col] = null;
        }
      }
    }

    return typeGrid;
  }

  /**
   * 计算随机偏移
   * @returns {{x: number, y: number, direction: string}}
   */
  static calculateRandomOffset() {
    const cardWidth = 60;   // 从配置读取
    const cardHeight = 97;

    const halfWidth = Math.round(cardWidth / 2);
    const halfHeight = Math.round(cardHeight / 2);

    const directions = [
      { x: halfWidth, y: halfHeight, direction: 'bottomRight' },
      { x: halfWidth, y: -halfHeight, direction: 'topRight' },
      { x: -halfWidth, y: halfHeight, direction: 'bottomLeft' },
      { x: -halfWidth, y: -halfHeight, direction: 'topLeft' }
    ];

    return directions[Math.floor(Math.random() * directions.length)];
  }
}
```

### 4.2 重叠判定算法

```javascript
class LockManager {
  /**
   * 初始化锁系统
   * 遍历所有层级,计算重叠关系
   */
  static initializeLocks(layers, cardWidth, cardHeight) {
    const allCards = this.flattenCards(layers);

    // 从最上层开始向下遍历
    for (let i = layers.length - 1; i >= 0; i--) {
      const currentLayer = layers[i];

      currentLayer.cards.forEach((rowCards, row) => {
        rowCards.forEach((card, col) => {
          if (!card || !card.isNormalCard) return;

          // 检测下方2层
          this.checkAndLockBelow(card, layers, cardWidth, cardHeight);
        });
      });
    }
  }

  /**
   * 检测并锁住下方卡牌
   */
  static checkAndLockBelow(card, layers, cardWidth, cardHeight) {
    const currentLayerIndex = card.layerIndex;
    const checkDepth = 2; // 穿透2层

    // 计算四个角坐标
    const corners = this.getCorners(card, cardWidth, cardHeight);

    // 遍历下方2层
    for (let depth = 1; depth <= checkDepth; depth++) {
      const targetLayerIndex = currentLayerIndex - depth;

      if (targetLayerIndex < 0) break;

      const targetLayer = layers[targetLayerIndex];

      // 检测每个角
      corners.forEach(corner => {
        const targetCard = this.findCardAtPoint(
          targetLayer,
          corner.x,
          corner.y,
          cardWidth,
          cardHeight
        );

        if (targetCard && targetCard.isNormalCard) {
          // 锁住目标卡牌
          targetCard.lockCount++;

          // 记录锁定关系
          card.lockedCards.push({
            layerIndex: targetCard.layerIndex,
            row: targetCard.row,
            col: targetCard.col
          });
        }
      });
    }
  }

  /**
   * 获取卡牌四个角坐标
   */
  static getCorners(card, width, height) {
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    return [
      { x: card.x - halfWidth, y: card.y - halfHeight }, // 左上
      { x: card.x + halfWidth, y: card.y - halfHeight }, // 右上
      { x: card.x - halfWidth, y: card.y + halfHeight }, // 左下
      { x: card.x + halfWidth, y: card.y + halfHeight }  // 右下
    ];
  }

  /**
   * 在指定层级查找指定坐标的卡牌
   */
  static findCardAtPoint(layer, x, y, cardWidth, cardHeight) {
    const halfWidth = cardWidth / 2;
    const halfHeight = cardHeight / 2;

    for (let row = 0; row < layer.cards.length; row++) {
      for (let col = 0; col < layer.cards[row].length; col++) {
        const card = layer.cards[row][col];

        if (!card || !card.isNormalCard) continue;

        // 检测点是否在卡牌范围内
        if (x >= card.x - halfWidth &&
            x <= card.x + halfWidth &&
            y >= card.y - halfHeight &&
            y <= card.y + halfHeight) {
          return card;
        }
      }
    }

    return null;
  }
}
```

### 4.3 渲染与视觉更新

```javascript
class CardRenderer {
  /**
   * 创建卡牌精灵
   */
  static createCardSprite(scene, card, config) {
    const { cardWidth, cardHeight } = config;

    // 创建矩形精灵
    const sprite = scene.add.rectangle(
      card.x,
      card.y,
      cardWidth,
      cardHeight,
      0xFFFFFF  // 白色背景
    );

    sprite.setOrigin(0.5);

    // 设置初始depth
    const initialDepth = DepthManager.getLockedDepth(card.layerIndex);
    sprite.setDepth(initialDepth);
    card.depth = initialDepth;

    // 添加卡牌类型文字
    if (card.cardType) {
      const text = scene.add.text(card.x, card.y, card.cardType, {
        fontSize: '24px',
        color: '#333333',
        fontFamily: 'Arial'
      });
      text.setOrigin(0.5);
      text.setDepth(initialDepth + 1);

      card.text = text;
    }

    // 应用初始视觉状态
    this.updateCardVisual(card, sprite, config);

    card.sprite = sprite;
    return sprite;
  }

  /**
   * 更新卡牌视觉状态
   */
  static updateCardVisual(card, sprite, config) {
    if (card.lockCount === 0) {
      // 解锁状态
      const state = CardVisualState.UNLOCKED;
      sprite.setAlpha(state.alpha);
      sprite.setScale(state.scale);
      sprite.setTint(state.tint);
      sprite.setStrokeStyle(state.strokeWidth, state.strokeColor);
    } else {
      // 被锁状态
      const state = CardVisualState.LOCKED;
      sprite.setAlpha(state.alpha);
      sprite.setScale(state.scale);
      sprite.setTint(state.tint);
      sprite.setStrokeStyle(state.strokeWidth, state.strokeColor);
    }
  }

  /**
   * 卡牌浮到顶层动画
   */
  static floatCardToTop(scene, card, config) {
    const sprite = card.sprite;

    // 更新depth
    const newDepth = DepthManager.getUnlockedDepth(card.layerIndex);
    sprite.setDepth(newDepth);
    card.depth = newDepth;
    card.isFloating = true;

    // 同步文字depth
    if (card.text) {
      card.text.setDepth(newDepth + 1);
    }

    // 浮起动画
    scene.tweens.add({
      targets: sprite,
      y: sprite.y - 5,
      scale: 1.0,
      alpha: 1.0,
      duration: 300,
      ease: 'Back.easeOut',
      onStart: () => {
        // 应用解锁视觉状态
        const state = CardVisualState.UNLOCKED;
        sprite.setStrokeStyle(state.strokeWidth, state.strokeColor);
        sprite.setTint(state.tint);
      },
      onComplete: () => {
        // 添加轻微呼吸动画
        scene.tweens.add({
          targets: sprite,
          scale: { from: 1.0, to: 1.02 },
          duration: 1000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
    });

    // 文字同步动画
    if (card.text) {
      scene.tweens.add({
        targets: card.text,
        y: card.text.y - 5,
        duration: 300,
        ease: 'Back.easeOut'
      });
    }
  }
}
```

### 4.4 交互处理

```javascript
class InteractionManager {
  /**
   * 设置卡牌点击事件
   */
  static setupCardClick(card, sprite, onClickCallback) {
    sprite.setInteractive({ useHandCursor: true });

    // 悬停进入
    sprite.on('pointerover', () => {
      if (card.lockCount === 0) {
        const state = CardVisualState.HOVER;
        sprite.setScale(state.scale);
        sprite.setStrokeStyle(state.strokeWidth, state.strokeColor);
      }
    });

    // 悬停离开
    sprite.on('pointerout', () => {
      if (card.lockCount === 0) {
        const state = CardVisualState.UNLOCKED;
        sprite.setScale(state.scale);
        sprite.setStrokeStyle(state.strokeWidth, state.strokeColor);
      }
    });

    // 点击
    sprite.on('pointerdown', () => {
      if (card.lockCount === 0) {
        onClickCallback(card);
      }
    });
  }

  /**
   * 点击处理
   */
  static onCardClick(card, allCards, scene) {
    // 1. 移除被点击的卡牌
    this.removeCard(card, scene);

    // 2. 解锁所有被它锁住的卡牌
    card.lockedCards.forEach(ref => {
      const lockedCard = this.findCard(allCards, ref);

      if (lockedCard) {
        this.unlockCard(lockedCard, scene);
      }
    });
  }

  /**
   * 解锁卡牌
   */
  static unlockCard(card, scene) {
    card.lockCount--;

    if (card.lockCount === 0) {
      // 完全解锁,浮到顶层
      CardRenderer.floatCardToTop(scene, card);
    } else {
      // 部分解锁,更新视觉(透明度略微提升)
      const alpha = 0.6 + (1 - card.lockCount / 5) * 0.4;
      card.sprite.setAlpha(Math.min(alpha, 1.0));
    }
  }

  /**
   * 移除卡牌(移到消除区域)
   */
  static removeCard(card, scene) {
    // TODO: 移动到消除区域的逻辑
    // 暂时先销毁
    if (card.sprite) {
      card.sprite.destroy();
    }
    if (card.text) {
      card.text.destroy();
    }
  }
}
```

---

## 五、配置参数设计

### 5.1 gameConfig.js 新增配置

```javascript
// 在 src/config/gameConfig.js 中添加

card: {
  // 棋盘配置
  gridSize: 8,                    // 8x8棋盘

  // 卡牌类型
  cardTypeCount: 3,               // 卡牌类型数量
  cardTypes: ['🐑', '🐄', '🐷'],   // 卡牌类型(使用emoji作为占位)

  // 卡牌尺寸 (黄金分割比)
  cardWidth: 60,                  // 宽度(短边)
  cardHeight: 97,                 // 高度 = 60 * 1.618 ≈ 97

  // 层级配置
  layerCount: 10,                 // 总层数

  // 重叠判定
  overlapCheckDepth: 2,           // 向下穿透层数

  // Depth配置
  depthConfig: {
    baseDepth: 0,                 // 被锁卡牌起始depth
    lockedStep: 10,               // 被锁卡牌depth步长
    floatingBase: 10000           // 浮动卡牌起始depth
  },

  // 视觉配置
  visual: {
    // 被锁状态
    locked: {
      alpha: 0.6,
      scale: 0.95,
      tint: 0xCCCCCC,
      strokeWidth: 2,
      strokeColor: 0x999999
    },
    // 解锁状态
    unlocked: {
      alpha: 1.0,
      scale: 1.0,
      tint: 0xFFFFFF,
      strokeWidth: 3,
      strokeColor: 0xFFD700
    },
    // 悬停状态
    hover: {
      alpha: 1.0,
      scale: 1.05,
      tint: 0xFFFFFF,
      strokeWidth: 4,
      strokeColor: 0x00FF00
    }
  },

  // 动画配置
  animation: {
    floatDuration: 300,           // 浮起动画时长(ms)
    floatDistance: 5,             // 浮起距离(px)
    breatheDuration: 1000,        // 呼吸动画时长(ms)
    breatheScale: 1.02,           // 呼吸动画缩放
    clickFeedbackDuration: 150    // 点击反馈时长(ms)
  }
}
```

---

## 六、实现流程

### 6.1 初始化流程

```javascript
class GameScene extends Phaser.Scene {
  create() {
    // 1. 加载配置
    this.cardConfig = gameConfig.card;

    // 2. 生成数据
    this.layers = DataGenerator.generateAllLayers(
      this.cardConfig.gridSize,
      this.cardConfig.layerCount,
      this.cardConfig.cardTypes
    );

    // 3. 创建卡牌对象
    this.createCards();

    // 4. 初始化锁系统
    LockManager.initializeLocks(
      this.layers,
      this.cardConfig.cardWidth,
      this.cardConfig.cardHeight
    );

    // 5. 渲染卡牌
    this.renderCards();

    // 6. 设置交互
    this.setupInteractions();
  }

  createCards() {
    const { selectionArea } = layout.gameArea;
    const { gridSize, cardWidth, cardHeight } = this.cardConfig;

    // 计算起始位置(居中)
    const startX = selectionArea.x + selectionArea.padding;
    const startY = selectionArea.y + 80; // 留出标题空间
    const cellSize = (selectionArea.width - selectionArea.padding * 2) / gridSize;

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
            depth: 0
          };

          layer.cards[row][col] = card;
        }
      }
    });
  }

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

  setupInteractions() {
    const allCards = this.getAllCards();

    allCards.forEach(card => {
      InteractionManager.setupCardClick(
        card,
        card.sprite,
        (clickedCard) => {
          InteractionManager.onCardClick(clickedCard, allCards, this);
        }
      );
    });
  }

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
}
```

---

## 七、性能优化

### 7.1 优化策略

1. **一次性锁计算**: 重叠判定只在初始化时执行一次
2. **扁平化索引**: 维护`allCards`数组便于快速查找
3. **事件委托**: 考虑使用场景级别的点击事件
4. **对象池**: 如果需要频繁创建/销毁精灵,使用对象池
5. **深度批处理**: 批量更新depth而不是逐个更新

### 7.2 内存管理

```javascript
// 销毁卡牌时清理所有引用
destroyCard(card) {
  if (card.sprite) {
    card.sprite.destroy();
    card.sprite = null;
  }
  if (card.text) {
    card.text.destroy();
    card.text = null;
  }
  card.lockedCards = [];
}
```

---

## 八、调试支持

### 8.1 调试模式

```javascript
// 在 gameConfig.js 中
debug: {
  showLockCount: true,      // 显示锁数
  showLayerIndex: true,     // 显示层级
  showDepth: true,          // 显示depth值
  showCorners: true,        // 显示检测角
  highlightLocked: true,    // 高亮被锁卡牌
  logClick: true            // 记录点击事件
}
```

### 8.2 可视化工具

```javascript
class DebugRenderer {
  static drawLockCount(scene, card) {
    const text = scene.add.text(
      card.x - 20,
      card.y - 20,
      card.lockCount.toString(),
      { fontSize: '16px', color: '#FF0000', fontStyle: 'bold' }
    );
    text.setDepth(20000);
  }

  static drawCorners(scene, card, cardWidth, cardHeight) {
    const corners = LockManager.getCorners(card, cardWidth, cardHeight);
    corners.forEach(corner => {
      const dot = scene.add.circle(corner.x, corner.y, 3, 0xFF0000);
      dot.setDepth(20000);
    });
  }
}
```

---

## 九、测试用例

### 9.1 单元测试

```javascript
describe('CardSystem', () => {
  test('生成正确大小的bool数组', () => {
    const grid = DataGenerator.generateBoolGrid(8);
    expect(grid.length).toBe(8);
    expect(grid[0].length).toBe(8);
  });

  test('偶数层生成正确偏移', () => {
    const offset = DataGenerator.calculateRandomOffset();
    expect(Math.abs(offset.x)).toBe(30);
    expect(Math.abs(offset.y)).toBe(49);
  });

  test('四角坐标计算正确', () => {
    const card = { x: 100, y: 100 };
    const corners = LockManager.getCorners(card, 60, 97);
    expect(corners.length).toBe(4);
    expect(corners[0]).toEqual({ x: 70, y: 51.5 });
  });
});
```

---

## 十、后续扩展

### 10.1 可扩展点

1. **不同布局策略**: 支持环形、螺旋等布局
2. **动态难度**: 根据玩家表现调整锁数
3. **特殊卡牌**: 炸弹、万能卡等
4. **多点触控**: 支持同时选择多张卡牌
5. **粒子效果**: 解锁时的粒子爆发

### 10.2 性能目标

- 初始化时间: < 500ms (10层, 8x8棋盘)
- 点击响应: < 16ms (60fps)
- 内存占用: < 50MB

---

## 十一、总结

本设计文档采用**方案1（动态Depth调整）**实现卡牌层级管理,核心优势:

✅ 实现简单,代码清晰
✅ 性能优异,无需重新创建对象
✅ 动画流畅,视觉效果好
✅ 易于调试和扩展

所有解锁的卡牌将自动浮到视觉顶层,实现"同层效果"的需求。

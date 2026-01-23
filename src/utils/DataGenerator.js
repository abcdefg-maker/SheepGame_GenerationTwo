/**
 * 数据生成器
 * 负责生成卡牌数据：bool数组、类型数组、多层数组
 */
export default class DataGenerator {
    /**
     * 生成完整的卡牌数据
     * @param {number} gridSize - 棋盘大小 (n×n)
     * @param {number} layerCount - 层数
     * @param {string[]} cardTypes - 卡牌类型数组
     * @param {number} cardWidth - 卡牌宽度
     * @param {number} cardHeight - 卡牌高度
     * @returns {Array} 所有层级数据
     */
    static generateAllLayers(gridSize, layerCount, cardTypes, cardWidth, cardHeight) {
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

            // 计算偏移 (偶数层需要偏移，索引从0开始，所以索引为奇数的是偶数层)
            if (i % 2 === 1) {
                const offset = this.calculateRandomOffset(cardWidth, cardHeight);
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
    static calculateRandomOffset(cardWidth, cardHeight) {
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

    /**
     * 克隆二维数组
     */
    static cloneGrid(grid) {
        return grid.map(row => [...row]);
    }
}

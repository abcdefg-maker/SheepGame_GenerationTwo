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
     * @param {string} shapeType - 形状类型 (可选)
     * @returns {Array} 所有层级数据
     */
    static generateAllLayers(gridSize, layerCount, cardTypes, cardWidth, cardHeight, shapeType = 'circle') {
        const layers = [];

        // 使用预定义形状模板(所有层共享相同模板)
        const baseBoolGrid = this.getShapeTemplate(shapeType, gridSize);

        for (let i = 0; i < layerCount; i++) {
            // 为每一层克隆一个独立的boolGrid
            const layerBoolGrid = this.cloneGrid(baseBoolGrid);

            const layer = {
                layerIndex: i,
                boolGrid: layerBoolGrid,
                typeGrid: this.generateTypeGrid(layerBoolGrid, cardTypes),
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
     * 生成1号bool数组 (旧版本，已弃用)
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
     * 将0/1数组转换为布尔数组
     */
    static convertToBoolGrid(numericGrid) {
        return numericGrid.map(row => row.map(cell => cell === 1));
    }

    /**
     * 获取预定义形状模板
     * @param {string} shapeType - 形状类型
     * @param {number} size - 网格大小
     * @returns {boolean[][]} 形状的bool数组
     */
    static getShapeTemplate(shapeType, size) {
        const shapes = {
            'circle': this.createCircleShape(size),
            'heart': this.createHeartShape(size),
            'flower': this.createFlowerShape(size),
            'diamond': this.createDiamondShape(size),
            'cross': this.createCrossShape(size),
            'square': this.createSquareShape(size),
            'letterA': this.createLetterAShape(size),
            'letterH': this.createLetterHShape(size),
            'letterO': this.createLetterOShape(size),
            'letterX': this.createLetterXShape(size),
            'letterC': this.createLetterCShape(size),
            'letterT': this.createLetterTShape(size)
        };

        const shape = shapes[shapeType];
        if (!shape) {
            console.warn(`[DataGenerator] 未知形状类型: ${shapeType}, 使用圆形`);
            return this.createCircleShape(size);
        }

        console.log(`[DataGenerator] 使用形状模板: ${shapeType} (${size}×${size})`);
        return shape;
    }

    /**
     * 创建圆形
     */
    static createCircleShape(size) {
        // 预定义的圆形模板（用0和1直接定义）
        const templates = {
            5: [
                [0, 1, 1, 1, 0],
                [1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1],
                [0, 1, 1, 1, 0]
            ],
            6: [
                [0, 1, 1, 1, 1, 0],
                [1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1],
                [0, 1, 1, 1, 1, 0]
            ],
            7: [
                [0, 0, 1, 1, 1, 0, 0],
                [0, 1, 1, 1, 1, 1, 0],
                [1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1],
                [0, 1, 1, 1, 1, 1, 0],
                [0, 0, 1, 1, 1, 0, 0]
            ],
            8: [
                [0, 0, 1, 1, 1, 1, 0, 0],
                [0, 1, 1, 1, 1, 1, 1, 0],
                [1, 1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1, 1],
                [0, 1, 1, 1, 1, 1, 1, 0],
                [0, 0, 1, 1, 1, 1, 0, 0]
            ]
        };

        return this.convertToBoolGrid(templates[size] || templates[5]);
    }

    /**
     * 创建心形
     */
    static createHeartShape(size) {
        const templates = {
            5: [
                [0, 1, 0, 1, 0],
                [1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1],
                [0, 1, 1, 1, 0],
                [0, 0, 1, 0, 0]
            ],
            6: [
                [0, 1, 1, 1, 1, 0],
                [1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1],
                [0, 1, 1, 1, 1, 0],
                [0, 0, 1, 1, 0, 0]
            ],
            7: [
                [0, 1, 1, 0, 1, 1, 0],
                [1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1],
                [0, 1, 1, 1, 1, 1, 0],
                [0, 0, 1, 1, 1, 0, 0],
                [0, 0, 0, 1, 0, 0, 0]
            ],
            8: [
                [0, 1, 1, 0, 0, 1, 1, 0],
                [1, 1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1, 1],
                [0, 1, 1, 1, 1, 1, 1, 0],
                [0, 0, 1, 1, 1, 1, 0, 0],
                [0, 0, 0, 1, 1, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0]
            ]
        };

        return this.convertToBoolGrid(templates[size] || templates[5]);
    }

    /**
     * 创建花朵形状（5瓣）
     */
    static createFlowerShape(size) {
        const templates = {
            5: [
                [0, 1, 0, 1, 0],
                [1, 1, 1, 1, 1],
                [0, 1, 1, 1, 0],
                [1, 1, 1, 1, 1],
                [0, 1, 0, 1, 0]
            ],
            6: [
                [0, 1, 0, 0, 1, 0],
                [1, 1, 1, 1, 1, 1],
                [0, 1, 1, 1, 1, 0],
                [0, 1, 1, 1, 1, 0],
                [1, 1, 1, 1, 1, 1],
                [0, 1, 0, 0, 1, 0]
            ],
            7: [
                [0, 0, 1, 0, 1, 0, 0],
                [0, 1, 1, 1, 1, 1, 0],
                [1, 1, 1, 1, 1, 1, 1],
                [0, 1, 1, 1, 1, 1, 0],
                [1, 1, 1, 1, 1, 1, 1],
                [0, 1, 1, 1, 1, 1, 0],
                [0, 0, 1, 0, 1, 0, 0]
            ],
            8: [
                [0, 0, 1, 0, 0, 1, 0, 0],
                [0, 1, 1, 1, 1, 1, 1, 0],
                [1, 1, 1, 1, 1, 1, 1, 1],
                [0, 1, 1, 1, 1, 1, 1, 0],
                [0, 1, 1, 1, 1, 1, 1, 0],
                [1, 1, 1, 1, 1, 1, 1, 1],
                [0, 1, 1, 1, 1, 1, 1, 0],
                [0, 0, 1, 0, 0, 1, 0, 0]
            ]
        };

        return this.convertToBoolGrid(templates[size] || templates[5]);
    }

    /**
     * 创建菱形
     */
    static createDiamondShape(size) {
        const templates = {
            5: [
                [0, 0, 1, 0, 0],
                [0, 1, 1, 1, 0],
                [1, 1, 1, 1, 1],
                [0, 1, 1, 1, 0],
                [0, 0, 1, 0, 0]
            ],
            6: [
                [0, 0, 1, 1, 0, 0],
                [0, 1, 1, 1, 1, 0],
                [1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1],
                [0, 1, 1, 1, 1, 0],
                [0, 0, 1, 1, 0, 0]
            ],
            7: [
                [0, 0, 0, 1, 0, 0, 0],
                [0, 0, 1, 1, 1, 0, 0],
                [0, 1, 1, 1, 1, 1, 0],
                [1, 1, 1, 1, 1, 1, 1],
                [0, 1, 1, 1, 1, 1, 0],
                [0, 0, 1, 1, 1, 0, 0],
                [0, 0, 0, 1, 0, 0, 0]
            ],
            8: [
                [0, 0, 0, 1, 1, 0, 0, 0],
                [0, 0, 1, 1, 1, 1, 0, 0],
                [0, 1, 1, 1, 1, 1, 1, 0],
                [1, 1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1, 1],
                [0, 1, 1, 1, 1, 1, 1, 0],
                [0, 0, 1, 1, 1, 1, 0, 0],
                [0, 0, 0, 1, 1, 0, 0, 0]
            ]
        };

        return this.convertToBoolGrid(templates[size] || templates[5]);
    }

    /**
     * 创建十字形
     */
    static createCrossShape(size) {
        const templates = {
            5: [
                [0, 0, 1, 0, 0],
                [0, 0, 1, 0, 0],
                [1, 1, 1, 1, 1],
                [0, 0, 1, 0, 0],
                [0, 0, 1, 0, 0]
            ],
            6: [
                [0, 0, 1, 1, 0, 0],
                [0, 0, 1, 1, 0, 0],
                [1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1],
                [0, 0, 1, 1, 0, 0],
                [0, 0, 1, 1, 0, 0]
            ],
            7: [
                [0, 0, 0, 1, 0, 0, 0],
                [0, 0, 0, 1, 0, 0, 0],
                [0, 0, 0, 1, 0, 0, 0],
                [1, 1, 1, 1, 1, 1, 1],
                [0, 0, 0, 1, 0, 0, 0],
                [0, 0, 0, 1, 0, 0, 0],
                [0, 0, 0, 1, 0, 0, 0]
            ],
            8: [
                [0, 0, 0, 1, 1, 0, 0, 0],
                [0, 0, 0, 1, 1, 0, 0, 0],
                [0, 0, 0, 1, 1, 0, 0, 0],
                [1, 1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1, 1],
                [0, 0, 0, 1, 1, 0, 0, 0],
                [0, 0, 0, 1, 1, 0, 0, 0],
                [0, 0, 0, 1, 1, 0, 0, 0]
            ]
        };

        return this.convertToBoolGrid(templates[size] || templates[5]);
    }

    /**
     * 创建方形
     */
    static createSquareShape(size) {
        const templates = {
            5: [
                [1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1]
            ],
            6: [
                [1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1]
            ],
            7: [
                [0, 1, 1, 1, 1, 1, 0],
                [1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1],
                [0, 1, 1, 1, 1, 1, 0]
            ],
            8: [
                [0, 1, 1, 1, 1, 1, 1, 0],
                [1, 1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1, 1],
                [0, 1, 1, 1, 1, 1, 1, 0]
            ]
        };

        return this.convertToBoolGrid(templates[size] || templates[5]);
    }

    /**
     * 创建字母A
     */
    static createLetterAShape(size) {
        const templates = {
            5: [
                [0, 1, 1, 1, 0],
                [1, 1, 0, 1, 1],
                [1, 0, 0, 0, 1],
                [1, 1, 1, 1, 1],
                [1, 0, 0, 0, 1]
            ],
            6: [
                [0, 1, 1, 1, 1, 0],
                [1, 1, 0, 0, 1, 1],
                [1, 0, 0, 0, 0, 1],
                [1, 1, 1, 1, 1, 1],
                [1, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 1]
            ],
            7: [
                [0, 0, 1, 1, 1, 0, 0],
                [0, 1, 1, 0, 1, 1, 0],
                [1, 1, 0, 0, 0, 1, 1],
                [1, 0, 0, 0, 0, 0, 1],
                [1, 1, 1, 1, 1, 1, 1],
                [1, 0, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 0, 1]
            ],
            8: [
                [0, 0, 1, 1, 1, 1, 0, 0],
                [0, 1, 1, 0, 0, 1, 1, 0],
                [1, 1, 0, 0, 0, 0, 1, 1],
                [1, 0, 0, 0, 0, 0, 0, 1],
                [1, 1, 1, 1, 1, 1, 1, 1],
                [1, 0, 0, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 0, 0, 1]
            ]
        };

        return this.convertToBoolGrid(templates[size] || templates[5]);
    }

    /**
     * 创建字母H
     */
    static createLetterHShape(size) {
        const templates = {
            5: [
                [1, 0, 0, 0, 1],
                [1, 0, 0, 0, 1],
                [1, 1, 1, 1, 1],
                [1, 0, 0, 0, 1],
                [1, 0, 0, 0, 1]
            ],
            6: [
                [1, 1, 0, 0, 1, 1],
                [1, 1, 0, 0, 1, 1],
                [1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1],
                [1, 1, 0, 0, 1, 1],
                [1, 1, 0, 0, 1, 1]
            ],
            7: [
                [1, 0, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 0, 1],
                [1, 1, 1, 1, 1, 1, 1],
                [1, 0, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 0, 1]
            ],
            8: [
                [1, 1, 0, 0, 0, 0, 1, 1],
                [1, 1, 0, 0, 0, 0, 1, 1],
                [1, 1, 0, 0, 0, 0, 1, 1],
                [1, 1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1, 1],
                [1, 1, 0, 0, 0, 0, 1, 1],
                [1, 1, 0, 0, 0, 0, 1, 1],
                [1, 1, 0, 0, 0, 0, 1, 1]
            ]
        };

        return this.convertToBoolGrid(templates[size] || templates[7]);
    }

    /**
     * 创建字母O
     */
    static createLetterOShape(size) {
        const templates = {
            5: [
                [0, 1, 1, 1, 0],
                [1, 0, 0, 0, 1],
                [1, 0, 0, 0, 1],
                [1, 0, 0, 0, 1],
                [0, 1, 1, 1, 0]
            ],
            6: [
                [0, 1, 1, 1, 1, 0],
                [1, 1, 0, 0, 1, 1],
                [1, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 1],
                [1, 1, 0, 0, 1, 1],
                [0, 1, 1, 1, 1, 0]
            ],
            7: [
                [0, 0, 1, 1, 1, 0, 0],
                [0, 1, 0, 0, 0, 1, 0],
                [1, 0, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 0, 1],
                [0, 1, 0, 0, 0, 1, 0],
                [0, 0, 1, 1, 1, 0, 0]
            ],
            8: [
                [0, 0, 1, 1, 1, 1, 0, 0],
                [0, 1, 1, 0, 0, 1, 1, 0],
                [1, 1, 0, 0, 0, 0, 1, 1],
                [1, 0, 0, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 0, 0, 1],
                [1, 1, 0, 0, 0, 0, 1, 1],
                [0, 1, 1, 0, 0, 1, 1, 0],
                [0, 0, 1, 1, 1, 1, 0, 0]
            ]
        };

        return this.convertToBoolGrid(templates[size] || templates[7]);
    }

    /**
     * 创建字母X
     */
    static createLetterXShape(size) {
        const templates = {
            5: [
                [1, 0, 0, 0, 1],
                [0, 1, 0, 1, 0],
                [0, 0, 1, 0, 0],
                [0, 1, 0, 1, 0],
                [1, 0, 0, 0, 1]
            ],
            6: [
                [1, 1, 0, 0, 1, 1],
                [0, 1, 1, 1, 1, 0],
                [0, 0, 1, 1, 0, 0],
                [0, 0, 1, 1, 0, 0],
                [0, 1, 1, 1, 1, 0],
                [1, 1, 0, 0, 1, 1]
            ],
            7: [
                [1, 0, 0, 0, 0, 0, 1],
                [0, 1, 0, 0, 0, 1, 0],
                [0, 0, 1, 0, 1, 0, 0],
                [0, 0, 0, 1, 0, 0, 0],
                [0, 0, 1, 0, 1, 0, 0],
                [0, 1, 0, 0, 0, 1, 0],
                [1, 0, 0, 0, 0, 0, 1]
            ],
            8: [
                [1, 1, 0, 0, 0, 0, 1, 1],
                [0, 1, 1, 0, 0, 1, 1, 0],
                [0, 0, 1, 1, 1, 1, 0, 0],
                [0, 0, 0, 1, 1, 0, 0, 0],
                [0, 0, 0, 1, 1, 0, 0, 0],
                [0, 0, 1, 1, 1, 1, 0, 0],
                [0, 1, 1, 0, 0, 1, 1, 0],
                [1, 1, 0, 0, 0, 0, 1, 1]
            ]
        };

        return this.convertToBoolGrid(templates[size] || templates[8]);
    }

    /**
     * 创建字母C
     */
    static createLetterCShape(size) {
        const templates = {
            5: [
                [0, 1, 1, 1, 0],
                [1, 0, 0, 0, 0],
                [1, 0, 0, 0, 0],
                [1, 0, 0, 0, 0],
                [0, 1, 1, 1, 0]
            ],
            6: [
                [0, 1, 1, 1, 1, 0],
                [1, 1, 0, 0, 0, 0],
                [1, 0, 0, 0, 0, 0],
                [1, 0, 0, 0, 0, 0],
                [1, 1, 0, 0, 0, 0],
                [0, 1, 1, 1, 1, 0]
            ],
            7: [
                [0, 0, 1, 1, 1, 0, 0],
                [0, 1, 0, 0, 0, 0, 0],
                [1, 0, 0, 0, 0, 0, 0],
                [1, 0, 0, 0, 0, 0, 0],
                [1, 0, 0, 0, 0, 0, 0],
                [0, 1, 0, 0, 0, 0, 0],
                [0, 0, 1, 1, 1, 0, 0]
            ],
            8: [
                [0, 0, 1, 1, 1, 1, 0, 0],
                [0, 1, 1, 0, 0, 0, 0, 0],
                [1, 1, 0, 0, 0, 0, 0, 0],
                [1, 0, 0, 0, 0, 0, 0, 0],
                [1, 0, 0, 0, 0, 0, 0, 0],
                [1, 1, 0, 0, 0, 0, 0, 0],
                [0, 1, 1, 0, 0, 0, 0, 0],
                [0, 0, 1, 1, 1, 1, 0, 0]
            ]
        };

        return this.convertToBoolGrid(templates[size] || templates[8]);
    }

    /**
     * 创建字母T
     */
    static createLetterTShape(size) {
        const templates = {
            5: [
                [1, 1, 1, 1, 1],
                [0, 0, 1, 0, 0],
                [0, 0, 1, 0, 0],
                [0, 0, 1, 0, 0],
                [0, 0, 1, 0, 0]
            ],
            6: [
                [1, 1, 1, 1, 1, 1],
                [0, 0, 1, 1, 0, 0],
                [0, 0, 1, 1, 0, 0],
                [0, 0, 1, 1, 0, 0],
                [0, 0, 1, 1, 0, 0],
                [0, 0, 1, 1, 0, 0]
            ],
            7: [
                [1, 1, 1, 1, 1, 1, 1],
                [0, 0, 0, 1, 0, 0, 0],
                [0, 0, 0, 1, 0, 0, 0],
                [0, 0, 0, 1, 0, 0, 0],
                [0, 0, 0, 1, 0, 0, 0],
                [0, 0, 0, 1, 0, 0, 0],
                [0, 0, 0, 1, 0, 0, 0]
            ],
            8: [
                [1, 1, 1, 1, 1, 1, 1, 1],
                [0, 0, 0, 1, 1, 0, 0, 0],
                [0, 0, 0, 1, 1, 0, 0, 0],
                [0, 0, 0, 1, 1, 0, 0, 0],
                [0, 0, 0, 1, 1, 0, 0, 0],
                [0, 0, 0, 1, 1, 0, 0, 0],
                [0, 0, 0, 1, 1, 0, 0, 0],
                [0, 0, 0, 1, 1, 0, 0, 0]
            ]
        };

        return this.convertToBoolGrid(templates[size] || templates[8]);
    }

    /**
     * 生成2号类型数组 (保证每种类型数量都是3的倍数)
     * @param {boolean[][]} boolGrid - bool数组
     * @param {string[]} cardTypes - 卡牌类型数组
     * @returns {(string|null)[][]} 类型数组
     */
    static generateTypeGrid(boolGrid, cardTypes) {
        const size = boolGrid.length;

        // 步骤1: 统计需要生成的卡牌总数
        let totalCards = 0;
        const positions = []; // 记录所有true的位置

        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                if (boolGrid[row][col]) {
                    totalCards++;
                    positions.push({ row, col });
                }
            }
        }

        console.log('[DataGenerator] 统计卡牌总数:', totalCards);

        // 步骤2: 调整为3的倍数
        const remainder = totalCards % 3;
        if (remainder !== 0) {
            console.log('[DataGenerator] 调整卡牌数量,移除:', remainder);
            // 随机移除多余的位置
            for (let i = 0; i < remainder; i++) {
                const randomIndex = Math.floor(Math.random() * positions.length);
                const pos = positions[randomIndex];
                boolGrid[pos.row][pos.col] = false; // 移除该位置
                positions.splice(randomIndex, 1);
            }
            totalCards -= remainder;
        }

        console.log('[DataGenerator] 最终卡牌总数:', totalCards);

        // 步骤3: 生成卡牌池
        const cardPool = this.generateCardPool(totalCards, cardTypes);

        // 步骤4: 洗牌
        this.shuffleArray(cardPool);

        // 步骤5: 填充到typeGrid
        const typeGrid = [];
        for (let row = 0; row < size; row++) {
            typeGrid[row] = new Array(size).fill(null);
        }

        let poolIndex = 0;
        for (const pos of positions) {
            typeGrid[pos.row][pos.col] = cardPool[poolIndex++];
        }

        // 验证结果
        this.validateTypeGrid(typeGrid, cardTypes);

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

    /**
     * 生成卡牌池 (保证每种类型都是3的倍数)
     * @param {number} totalCards - 总卡牌数 (必须是3的倍数)
     * @param {string[]} cardTypes - 卡牌类型数组
     * @returns {string[]} 卡牌池数组
     */
    static generateCardPool(totalCards, cardTypes) {
        const cardPool = [];
        const typeCount = cardTypes.length;

        // 基础分配: 每种类型至少分配 floor(totalCards / typeCount / 3) * 3 张
        const baseCountPerType = Math.floor(totalCards / typeCount / 3) * 3;

        for (let i = 0; i < typeCount; i++) {
            for (let j = 0; j < baseCountPerType; j++) {
                cardPool.push(cardTypes[i]);
            }
        }

        // 剩余卡牌数
        let remaining = totalCards - cardPool.length;

        // 随机分配剩余卡牌 (每次分配3张给随机类型)
        while (remaining >= 3) {
            const randomType = cardTypes[Math.floor(Math.random() * typeCount)];
            for (let i = 0; i < 3; i++) {
                cardPool.push(randomType);
            }
            remaining -= 3;
        }

        console.log('[DataGenerator] 卡牌池统计:', this.countCardTypes(cardPool, cardTypes));

        return cardPool;
    }

    /**
     * Fisher-Yates洗牌算法
     * @param {Array} array - 要洗牌的数组
     */
    static shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    /**
     * 验证typeGrid中每种类型都是3的倍数
     * @param {(string|null)[][]} typeGrid - 类型数组
     * @param {string[]} cardTypes - 卡牌类型数组
     */
    static validateTypeGrid(typeGrid, cardTypes) {
        const typeCounts = this.countCardTypesInGrid(typeGrid, cardTypes);

        console.log('[DataGenerator] 验证类型分布:', typeCounts);

        let isValid = true;
        for (const [type, count] of Object.entries(typeCounts)) {
            if (count % 3 !== 0) {
                console.error(`[DataGenerator] 错误: ${type} 数量 ${count} 不是3的倍数!`);
                isValid = false;
            }
        }

        if (isValid) {
            console.log('[DataGenerator] ✓ 验证通过: 所有类型都是3的倍数');
        }

        return isValid;
    }

    /**
     * 统计数组中各类型的数量
     * @param {string[]|Object[]} cardPool - 卡牌池
     * @param {string[]|Object[]} cardTypes - 卡牌类型
     * @returns {Object} 类型统计对象
     */
    static countCardTypes(cardPool, cardTypes) {
        const counts = {};
        cardTypes.forEach(type => {
            const key = typeof type === 'string' ? type : type.id;
            counts[key] = 0;
        });
        cardPool.forEach(card => {
            const key = typeof card === 'string' ? card : card.id;
            counts[key]++;
        });
        return counts;
    }

    /**
     * 统计typeGrid中各类型的数量
     * @param {(string|Object|null)[][]} typeGrid - 类型数组
     * @param {string[]|Object[]} cardTypes - 卡牌类型
     * @returns {Object} 类型统计对象
     */
    static countCardTypesInGrid(typeGrid, cardTypes) {
        const counts = {};
        cardTypes.forEach(type => {
            const key = typeof type === 'string' ? type : type.id;
            counts[key] = 0;
        });

        for (let row = 0; row < typeGrid.length; row++) {
            for (let col = 0; col < typeGrid[row].length; col++) {
                const type = typeGrid[row][col];
                if (type !== null) {
                    const key = typeof type === 'string' ? type : type.id;
                    if (counts.hasOwnProperty(key)) {
                        counts[key]++;
                    }
                }
            }
        }

        return counts;
    }
}

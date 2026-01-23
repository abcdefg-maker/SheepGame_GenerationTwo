/**
 * 锁管理器
 * 负责重叠判定和锁机制
 */
export default class LockManager {
    /**
     * 初始化锁系统
     * 遍历所有层级,计算重叠关系
     */
    static initializeLocks(layers, cardWidth, cardHeight) {
        // 从最上层开始向下遍历
        for (let i = layers.length - 1; i >= 0; i--) {
            const currentLayer = layers[i];

            currentLayer.cards.forEach((rowCards) => {
                rowCards.forEach((card) => {
                    if (!card || !card.isNormalCard) return;

                    // 检测并锁住下方卡牌
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
                    // 避免重复锁定同一张卡牌
                    const alreadyLocked = card.lockedCards.some(
                        ref => ref.layerIndex === targetCard.layerIndex &&
                               ref.row === targetCard.row &&
                               ref.col === targetCard.col
                    );

                    if (!alreadyLocked) {
                        // 锁住目标卡牌
                        targetCard.lockCount++;

                        // 记录锁定关系
                        card.lockedCards.push({
                            layerIndex: targetCard.layerIndex,
                            row: targetCard.row,
                            col: targetCard.col
                        });
                    }
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

    /**
     * 扁平化所有卡牌
     */
    static flattenCards(layers) {
        const allCards = [];
        layers.forEach(layer => {
            layer.cards.forEach(rowCards => {
                rowCards.forEach(card => {
                    if (card && card.isNormalCard) {
                        allCards.push(card);
                    }
                });
            });
        });
        return allCards;
    }
}

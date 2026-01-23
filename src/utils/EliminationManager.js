/**
 * 消除管理器
 * 负责消除槽的卡牌管理、三张消除、胜负判定
 */
export default class EliminationManager {
    /**
     * 添加卡牌到消除槽
     * @returns {boolean} 是否添加成功（未满8张）
     */
    static addCardToSlot(card, scene, config) {
        const { elimination } = config;
        const slots = scene.eliminationSlots;

        // 计算有效槽位数量（排除正在消除的卡牌）
        const activeCards = slots.filter(c => !c.isRemoved);
        const actualIndex = activeCards.length;

        const cardTypeDisplay = typeof card.cardType === 'string'
            ? card.cardType
            : `${card.cardType.emoji}(${card.cardType.id})`;

        console.log('[消除] 添加卡牌到槽位:', {
            cardType: cardTypeDisplay,
            槽位总数: slots.length,
            有效槽位数: actualIndex,
            最大容量: elimination.maxSlots
        });

        // 检查有效槽位是否已满
        if (actualIndex >= elimination.maxSlots) {
            console.log('[消除] 有效槽位已满，无法添加');
            return false;
        }

        // 添加到槽中
        slots.push(card);
        console.log('[消除] 卡牌已添加，新槽位数量:', slots.length);

        // 移动卡牌到实际的有效位置
        this.moveCardToSlot(card, actualIndex, scene, config);

        // 更新标题计数
        this.updateSlotCountDisplay(scene);

        return true;
    }

    /**
     * 移动卡牌到槽位
     */
    static moveCardToSlot(card, slotIndex, scene, config) {
        const { elimination, card: cardConfig } = config;
        const slotInfo = scene.slotSprites[slotIndex];

        // 禁用交互
        if (card.sprite) {
            card.sprite.disableInteractive();
        }

        // 移动动画
        scene.tweens.add({
            targets: card.sprite,
            x: slotInfo.x,
            y: slotInfo.y,
            scale: 0.9,
            duration: cardConfig.cardAnimation.moveToSlotDuration,
            ease: 'Back.easeOut',
            onComplete: () => {
                // 移动完成后,设置深度确保在槽位上方
                if (card.sprite) {
                    card.sprite.setDepth(20000 + slotIndex);
                }
            }
        });

        // 文字同步移动
        if (card.text) {
            scene.tweens.add({
                targets: card.text,
                x: slotInfo.x,
                y: slotInfo.y,
                duration: cardConfig.cardAnimation.moveToSlotDuration,
                ease: 'Back.easeOut',
                onComplete: () => {
                    if (card.text) {
                        card.text.setDepth(20001 + slotIndex);
                    }
                }
            });
        }
    }

    /**
     * 检查并执行三张消除
     * @returns {boolean} 是否有卡牌被消除
     */
    static checkAndEliminate(scene, config) {
        const slots = scene.eliminationSlots;
        const { elimination } = config;

        // 辅助函数：获取卡牌类型的唯一标识
        const getCardTypeKey = (cardType) => {
            return typeof cardType === 'string' ? cardType : cardType.id;
        };

        console.log('[消除] 开始检查消除，当前槽位:', {
            槽位总数: slots.length,
            卡牌列表: slots.map(c => ({
                type: typeof c.cardType === 'string' ? c.cardType : c.cardType.id,
                isRemoved: c.isRemoved
            }))
        });

        // 统计每种类型的卡牌
        const typeCount = {};
        slots.forEach(card => {
            if (!card.isRemoved) {
                const key = getCardTypeKey(card.cardType);
                typeCount[key] = (typeCount[key] || 0) + 1;
            }
        });

        console.log('[消除] 卡牌类型统计:', typeCount);
        console.log('[消除] 需要消除数量:', elimination.matchCount);

        // 查找达到3张的类型
        let eliminatedType = null;
        for (const [type, count] of Object.entries(typeCount)) {
            if (count >= elimination.matchCount) {
                eliminatedType = type;
                console.log('[消除] 找到可消除类型:', type, '数量:', count);
                break;
            }
        }

        // 如果没有可消除的
        if (!eliminatedType) {
            console.log('[消除] 没有可消除的卡牌');
            return false;
        }

        // 找出要消除的卡牌
        const cardsToEliminate = [];
        for (const card of slots) {
            if (!card.isRemoved && getCardTypeKey(card.cardType) === eliminatedType) {
                cardsToEliminate.push(card);
                if (cardsToEliminate.length >= elimination.matchCount) {
                    break;
                }
            }
        }

        // 执行消除动画
        this.eliminateCards(cardsToEliminate, scene, config);

        return true;
    }

    /**
     * 执行消除动画
     */
    static eliminateCards(cards, scene, config) {
        const { card: cardConfig } = config;

        cards.forEach((card, index) => {
            card.isRemoved = true;

            // 延迟消除动画(制造连续感)
            scene.time.delayedCall(index * 50, () => {
                // 消除动画
                scene.tweens.add({
                    targets: card.sprite,
                    alpha: 0,
                    scale: 1.5,
                    y: card.sprite.y - 50,
                    duration: cardConfig.cardAnimation.eliminateDuration,
                    ease: 'Back.easeIn',
                    onComplete: () => {
                        if (card.sprite) {
                            card.sprite.destroy();
                            card.sprite = null;
                        }
                        if (card.text) {
                            card.text.destroy();
                            card.text = null;
                        }
                    }
                });

                // 文字动画
                if (card.text) {
                    scene.tweens.add({
                        targets: card.text,
                        alpha: 0,
                        y: card.text.y - 50,
                        duration: cardConfig.cardAnimation.eliminateDuration,
                        ease: 'Back.easeIn'
                    });
                }
            });
        });

        // 消除完成后重新排列
        scene.time.delayedCall(cardConfig.cardAnimation.eliminateDuration + 100, () => {
            // 增加分数 (每消除3张卡牌得100分)
            const points = config.scoring?.eliminationBonus || 100;
            if (scene.updateScore) {
                scene.updateScore(points);
            }

            this.rearrangeSlots(scene, config);
        });
    }

    /**
     * 重新排列消除槽
     */
    static rearrangeSlots(scene, config) {
        const slots = scene.eliminationSlots;

        // 移除已消除的卡牌
        const remainingCards = slots.filter(card => !card.isRemoved);
        scene.eliminationSlots = remainingCards;

        // 重新定位剩余卡牌
        remainingCards.forEach((card, index) => {
            if (card.sprite) {
                const slotInfo = scene.slotSprites[index];

                scene.tweens.add({
                    targets: card.sprite,
                    x: slotInfo.x,
                    y: slotInfo.y,
                    duration: 200,
                    ease: 'Power2'
                });

                if (card.text) {
                    scene.tweens.add({
                        targets: card.text,
                        x: slotInfo.x,
                        y: slotInfo.y,
                        duration: 200,
                        ease: 'Power2'
                    });
                }

                card.sprite.setDepth(20000 + index);
                if (card.text) {
                    card.text.setDepth(20001 + index);
                }
            }
        });

        // 更新计数显示
        this.updateSlotCountDisplay(scene);

        // 检查胜利条件
        this.checkWinCondition(scene);
    }

    /**
     * 更新槽位计数显示
     */
    static updateSlotCountDisplay(scene) {
        const count = scene.eliminationSlots.filter(c => !c.isRemoved).length;
        console.log('[消除] 更新槽位显示:', {
            槽位总数: scene.eliminationSlots.length,
            未移除数量: count
        });
        if (scene.eliminationTitle) {
            scene.eliminationTitle.setText(`消除区域 (${count}/8)`);
        }
    }

    /**
     * 检查胜利条件
     */
    static checkWinCondition(scene) {
        // 检查消除槽是否为空
        const slotsEmpty = scene.eliminationSlots.length === 0;

        // 检查选择区域是否还有卡牌（排除已消除和在消除槽中的）
        const hasRemainingCards = scene.allCards.some(card =>
            !card.isRemoved && !card.inEliminationSlot
        );

        console.log('[消除] 检查胜利条件:', {
            消除槽为空: slotsEmpty,
            选择区剩余卡牌: hasRemainingCards
        });

        if (slotsEmpty && !hasRemainingCards) {
            // 胜利
            console.log('[消除] 游戏胜利！');
            scene.time.delayedCall(500, () => {
                scene.scene.start('GameOverScene', {
                    level: scene.currentLevel,
                    isWin: true,
                    score: scene.score || 0,
                    message: '恭喜通关!'
                });
            });
        }
    }

    /**
     * 检查失败条件
     */
    static checkLoseCondition(scene) {
        const slots = scene.eliminationSlots;
        const maxSlots = scene.registry.get('config')?.elimination?.maxSlots || 8;

        // 如果槽位满了
        if (slots.length >= maxSlots) {
            // 检查是否有可消除的
            const canEliminate = this.canEliminateAny(slots, scene.registry.get('config'));

            if (!canEliminate) {
                // 失败
                scene.time.delayedCall(500, () => {
                    scene.scene.start('GameOverScene', {
                        level: scene.currentLevel,
                        isWin: false,
                        score: scene.score || 0,
                        message: '消除槽已满,游戏失败!'
                    });
                });
                return true;
            }
        }

        return false;
    }

    /**
     * 检查是否有可消除的组合
     */
    static canEliminateAny(slots, config) {
        const { elimination } = config;
        const typeCount = {};

        // 辅助函数：获取卡牌类型的唯一标识
        const getCardTypeKey = (cardType) => {
            return typeof cardType === 'string' ? cardType : cardType.id;
        };

        slots.forEach(card => {
            if (!card.isRemoved) {
                const key = getCardTypeKey(card.cardType);
                typeCount[key] = (typeCount[key] || 0) + 1;
            }
        });

        // 检查是否有类型达到3张
        for (const count of Object.values(typeCount)) {
            if (count >= elimination.matchCount) {
                return true;
            }
        }

        return false;
    }
}

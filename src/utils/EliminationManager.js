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
     * 移动卡牌到槽位 (Container架构)
     */
    static moveCardToSlot(card, slotIndex, scene, config) {
        const { elimination, card: cardConfig } = config;
        const slotInfo = scene.slotSprites[slotIndex];

        // 禁用交互
        if (card.sprite) {
            card.sprite.disableInteractive();
        }

        // 移动 Container (子元素会自动跟随)
        scene.tweens.add({
            targets: card.sprite,
            x: slotInfo.x,
            y: slotInfo.y,
            duration: cardConfig.cardAnimation.moveToSlotDuration,
            ease: 'Back.easeOut',
            onComplete: () => {
                // 移动完成后,设置深度确保在槽位上方
                if (card.sprite) {
                    card.sprite.setDepth(20000 + slotIndex);
                }
            }
        });

        // 缩放背景和图片 (不缩放Container)
        if (card.background) {
            scene.tweens.add({
                targets: card.background,
                scale: 0.9,
                duration: cardConfig.cardAnimation.moveToSlotDuration,
                ease: 'Back.easeOut'
            });
        }

        if (card.image) {
            const baseScale = cardConfig.cardImageScale || 0.5;
            scene.tweens.add({
                targets: card.image,
                scale: baseScale * 0.9,
                duration: cardConfig.cardAnimation.moveToSlotDuration,
                ease: 'Back.easeOut'
            });
        }

        // 移除对 card.text 的单独动画 (已随Container移动)
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
     * 执行消除动画 (Container架构)
     */
    static eliminateCards(cards, scene, config) {
        const { card: cardConfig } = config;

        cards.forEach((card, index) => {
            card.isRemoved = true;

            // 延迟消除动画(制造连续感)
            scene.time.delayedCall(index * 50, () => {
                // Container 淡出和上移
                scene.tweens.add({
                    targets: card.sprite,
                    alpha: 0,
                    y: card.sprite.y - 50,
                    duration: cardConfig.cardAnimation.eliminateDuration,
                    ease: 'Back.easeIn',
                    onComplete: () => {
                        if (card.sprite) {
                            card.sprite.destroy();  // 销毁Container会自动销毁所有子元素
                            card.sprite = null;
                            card.background = null;
                            card.image = null;
                            card.text = null;
                        }
                    }
                });

                // 背景放大动画
                if (card.background) {
                    scene.tweens.add({
                        targets: card.background,
                        scale: 1.5,
                        duration: cardConfig.cardAnimation.eliminateDuration,
                        ease: 'Back.easeIn'
                    });
                }

                // 图片同步放大
                if (card.image) {
                    const baseScale = cardConfig.cardImageScale || 0.5;
                    scene.tweens.add({
                        targets: card.image,
                        scale: baseScale * 1.5,
                        duration: cardConfig.cardAnimation.eliminateDuration,
                        ease: 'Back.easeIn'
                    });
                }

                // 移除对 card.text 的单独动画 (已随Container移动)
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
     * 重新排列消除槽 (Container架构)
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

                // 只移动 Container (子元素会自动跟随)
                scene.tweens.add({
                    targets: card.sprite,
                    x: slotInfo.x,
                    y: slotInfo.y,
                    duration: 200,
                    ease: 'Power2'
                });

                // 移除对 card.text 的单独移动

                card.sprite.setDepth(20000 + index);
                // 移除对 card.text 的 setDepth (Container的子元素自动继承深度)
            }
        });

        // 更新计数显示
        this.updateSlotCountDisplay(scene);

        // 检查胜利条件
        this.checkWinCondition(scene);

        // 检查失败条件：如果槽位满了且无法消除
        if (remainingCards.length >= config.elimination.maxSlots) {
            console.log('[消除] 消除后槽位仍满，检查是否有可消除组合');
            const canEliminate = this.canEliminateAny(remainingCards, config);

            if (!canEliminate) {
                console.log('[消除] 无可消除组合，游戏失败');
                this.checkLoseCondition(scene);
            }
        }
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
            console.log('[消除] 关卡完成！');

            // 获取配置
            const config = scene.registry.get('config');
            const currentLevel = scene.currentLevel;
            const maxLevel = config.levels.length;  // 10
            const hasNextLevel = currentLevel < maxLevel;

            if (hasNextLevel) {
                // 有下一关：执行关卡切换动画
                const nextLevel = currentLevel + 1;
                console.log(`[消除] 准备进入第${nextLevel}关`);

                scene.time.delayedCall(500, () => {
                    this.transitionToNextLevel(scene, nextLevel, config);
                });
            } else {
                // 最后一关：进入胜利界面
                console.log('[消除] 已通关所有关卡！');
                scene.time.delayedCall(500, () => {
                    scene.scene.start('GameOverScene', {
                        level: currentLevel,
                        difficulty: scene.difficulty,
                        isWin: true,
                        score: scene.score || 0,
                        message: 'Congratulations! All levels completed!'
                    });
                });
            }
        }
    }

    /**
     * 关卡切换动画并进入下一关
     * @param {Phaser.Scene} scene - 当前场景
     * @param {number} nextLevel - 下一关卡号
     * @param {object} config - 游戏配置对象
     */
    static transitionToNextLevel(scene, nextLevel, config) {
        const camera = scene.cameras.main;
        const width = camera.width;
        const height = camera.height;

        // 1. 创建黑色遮罩并淡入
        const blackOverlay = scene.add.rectangle(0, 0, width, height, 0x000000, 0);
        blackOverlay.setOrigin(0);
        blackOverlay.setDepth(99999);  // 在所有元素之上，但低于提示层

        // 淡入黑色遮罩（800ms）
        scene.tweens.add({
            targets: blackOverlay,
            alpha: 1,
            duration: 800,
            ease: 'Power2',
            onComplete: () => {
                // 2. 黑屏完成后，显示关卡提示
                this.showLevelTransitionHint(scene, nextLevel);

                // 3. 等待提示动画完成后切换场景（400ms弹出 + 300ms保持 + 300ms淡出）
                scene.time.delayedCall(1000, () => {
                    console.log(`[场景切换] 启动第${nextLevel}关`);

                    // 启动下一关（每关分数重置）
                    scene.scene.start('GameScene', {
                        level: nextLevel,
                        difficulty: scene.difficulty,
                        score: 0  // 每关重置分数
                    });
                });
            }
        });
    }

    /**
     * 显示关卡过渡提示
     * @param {Phaser.Scene} scene - 当前场景
     * @param {number} nextLevel - 下一关卡号
     */
    static showLevelTransitionHint(scene, nextLevel) {
        const camera = scene.cameras.main;
        const width = camera.width;
        const height = camera.height;
        const centerX = width / 2;
        const centerY = height / 2;

        // 获取关卡名称
        const config = scene.registry.get('config');
        const levelConfig = config.levels.find(l => l.level === nextLevel);
        const levelName = levelConfig ? levelConfig.name : '';

        // 主标题：关卡号
        const levelText = scene.add.text(centerX, centerY - 30, `Level ${nextLevel}`, {
            fontSize: '72px',
            color: '#FFFFFF',
            fontFamily: config.fonts.primary,
            fontStyle: 'bold'
        });
        levelText.setOrigin(0.5);
        levelText.setDepth(100001);
        levelText.setShadow(4, 4, '#000000', 10);

        // 副标题：难度名称
        const difficultyText = scene.add.text(centerX, centerY + 50, levelName, {
            fontSize: '36px',
            color: '#FFD700',
            fontFamily: config.fonts.primary,
            fontStyle: 'bold'
        });
        difficultyText.setOrigin(0.5);
        difficultyText.setDepth(100001);
        difficultyText.setShadow(2, 2, '#000000', 5);

        // 动画：缩放弹出效果
        scene.tweens.add({
            targets: [levelText, difficultyText],
            scale: { from: 0, to: 1.2 },
            alpha: { from: 0, to: 1 },
            duration: 400,
            ease: 'Back.easeOut',  // 符合现有卡牌动画风格
            onComplete: () => {
                // 保持显示300ms后淡出
                scene.time.delayedCall(300, () => {
                    scene.tweens.add({
                        targets: [levelText, difficultyText],
                        alpha: 0,
                        duration: 300,
                        ease: 'Power2'
                    });
                });
            }
        });
    }

    /**
     * 检查新卡牌能否与槽位中的卡牌消除
     * @param {object} card - 待检查的卡牌
     * @param {Array} slots - 当前槽位中的卡牌数组
     * @param {object} config - 游戏配置
     * @returns {boolean} 是否可以消除
     */
    static canEliminateWithNewCard(card, slots, config) {
        const { elimination } = config;

        // 辅助函数：获取卡牌类型的唯一标识
        const getCardTypeKey = (cardType) => {
            return typeof cardType === 'string' ? cardType : cardType.id;
        };

        const newCardKey = getCardTypeKey(card.cardType);

        console.log('[消除] 检查新卡牌能否消除:', {
            新卡牌类型: newCardKey,
            当前槽位数: slots.length
        });

        // 统计槽位中相同类型的卡牌数量
        let count = 0;
        for (const slotCard of slots) {
            if (!slotCard.isRemoved && getCardTypeKey(slotCard.cardType) === newCardKey) {
                count++;
            }
        }

        // 加上新卡牌后是否达到消除数量
        const canEliminate = (count + 1) >= elimination.matchCount;

        console.log('[消除] 检查结果:', {
            槽位中相同类型数量: count,
            加上新卡牌后: count + 1,
            需要数量: elimination.matchCount,
            可以消除: canEliminate
        });

        return canEliminate;
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

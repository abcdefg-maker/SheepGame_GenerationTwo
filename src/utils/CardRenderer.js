/**
 * 卡牌渲染器
 * 负责卡牌的创建、渲染和视觉更新
 */
export default class CardRenderer {
    /**
     * 创建卡牌精灵
     */
    static createCardSprite(scene, card, config) {
        const { cardWidth, cardHeight, visual, depthConfig } = config;

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
        const initialDepth = depthConfig.baseDepth + card.layerIndex * depthConfig.lockedStep;
        sprite.setDepth(initialDepth);
        card.depth = initialDepth;

        // 添加卡牌类型文字
        if (card.cardType) {
            const text = scene.add.text(card.x, card.y, card.cardType, {
                fontSize: '32px',
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
        const { visual } = config;

        if (card.lockCount === 0) {
            // 解锁状态
            const state = visual.unlocked;
            sprite.setAlpha(state.alpha);
            sprite.setScale(state.scale);
            sprite.setFillStyle(state.tint);  // Rectangle使用setFillStyle而非setTint
            sprite.setStrokeStyle(state.strokeWidth, state.strokeColor);
        } else {
            // 被锁状态
            const state = visual.locked;
            sprite.setAlpha(state.alpha);
            sprite.setScale(state.scale);
            sprite.setFillStyle(state.tint);  // Rectangle使用setFillStyle而非setTint
            sprite.setStrokeStyle(state.strokeWidth, state.strokeColor);
        }
    }

    /**
     * 卡牌浮到顶层动画（方案1的核心）
     */
    static floatCardToTop(scene, card, config) {
        const sprite = card.sprite;
        const { depthConfig, visual, cardAnimation } = config;

        // 更新depth - 解锁卡牌移到顶层
        const newDepth = depthConfig.floatingBase + card.layerIndex;
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
            y: sprite.y - cardAnimation.floatDistance,
            scale: visual.unlocked.scale,
            alpha: visual.unlocked.alpha,
            duration: cardAnimation.floatDuration,
            ease: 'Back.easeOut',
            onStart: () => {
                // 应用解锁视觉状态
                sprite.setStrokeStyle(visual.unlocked.strokeWidth, visual.unlocked.strokeColor);
                sprite.setFillStyle(visual.unlocked.tint);  // Rectangle使用setFillStyle
            },
            onComplete: () => {
                // 添加轻微呼吸动画
                scene.tweens.add({
                    targets: sprite,
                    scale: {
                        from: visual.unlocked.scale,
                        to: cardAnimation.breatheScale
                    },
                    duration: cardAnimation.breatheDuration,
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
                y: card.text.y - cardAnimation.floatDistance,
                duration: cardAnimation.floatDuration,
                ease: 'Back.easeOut'
            });
        }
    }

    /**
     * 应用悬停效果
     */
    static applyHoverEffect(sprite, config) {
        const { visual } = config;
        const state = visual.hover;

        sprite.setScale(state.scale);
        sprite.setStrokeStyle(state.strokeWidth, state.strokeColor);
    }

    /**
     * 移除悬停效果
     */
    static removeHoverEffect(sprite, config) {
        const { visual } = config;
        const state = visual.unlocked;

        sprite.setScale(state.scale);
        sprite.setStrokeStyle(state.strokeWidth, state.strokeColor);
    }
}

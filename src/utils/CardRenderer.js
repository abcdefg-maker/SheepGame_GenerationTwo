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

        // 添加卡牌类型图片或文字
        if (card.cardType) {
            // 获取图片key
            const imageKey = typeof card.cardType === 'string'
                ? card.cardType  // 兼容旧的emoji字符串
                : card.cardType.id;

            // 检查图片是否加载成功
            if (scene.textures.exists(imageKey)) {
                // 使用图片
                const image = scene.add.image(card.x, card.y, imageKey);
                image.setOrigin(0.5);
                image.setDepth(initialDepth + 1);

                // 应用缩放
                const imageScale = config.cardImageScale || 0.5;
                image.setScale(imageScale);

                // 保存引用(替代原来的card.text)
                card.image = image;
                card.text = image;  // 兼容性,保持接口一致
            } else {
                // 降级到emoji文字
                const emoji = typeof card.cardType === 'string'
                    ? card.cardType
                    : card.cardType.emoji;
                const text = scene.add.text(card.x, card.y, emoji, {
                    fontSize: '32px',
                    fontFamily: 'Arial'
                });
                text.setOrigin(0.5);
                text.setDepth(initialDepth + 1);
                card.text = text;
                console.warn(`[降级显示] 使用emoji ${emoji} 替代图片`);
            }
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

            // 更新图片状态
            if (card.image) {
                card.image.setTint(state.imageTint);
                card.image.setAlpha(state.imageAlpha);
            }
        } else {
            // 被锁状态
            const state = visual.locked;
            sprite.setAlpha(state.alpha);
            sprite.setScale(state.scale);
            sprite.setFillStyle(state.tint);  // Rectangle使用setFillStyle而非setTint
            sprite.setStrokeStyle(state.strokeWidth, state.strokeColor);

            // 更新图片状态（添加灰色滤镜）
            if (card.image) {
                card.image.setTint(state.imageTint);
                card.image.setAlpha(state.imageAlpha);
            }
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

                // 更新图片状态（恢复正常颜色）
                if (card.image) {
                    card.image.setTint(visual.unlocked.imageTint);
                    card.image.setAlpha(visual.unlocked.imageAlpha);
                }
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
    static applyHoverEffect(sprite, card, config) {
        const { visual } = config;
        const state = visual.hover;

        sprite.setScale(state.scale);
        sprite.setStrokeStyle(state.strokeWidth, state.strokeColor);

        // 图片也应用悬停效果
        if (card && card.image) {
            card.image.setTint(state.imageTint);
            card.image.setAlpha(state.imageAlpha);
        }
    }

    /**
     * 移除悬停效果
     */
    static removeHoverEffect(sprite, card, config) {
        const { visual } = config;
        const state = visual.unlocked;

        sprite.setScale(state.scale);
        sprite.setStrokeStyle(state.strokeWidth, state.strokeColor);

        // 图片也恢复正常状态
        if (card && card.image) {
            card.image.setTint(state.imageTint);
            card.image.setAlpha(state.imageAlpha);
        }
    }
}

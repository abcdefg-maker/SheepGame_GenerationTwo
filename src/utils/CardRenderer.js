/**
 * 卡牌渲染器
 * 负责卡牌的创建、渲染和视觉更新
 */
export default class CardRenderer {
    /**
     * 创建卡牌精灵 (Container架构)
     */
    static createCardSprite(scene, card, config) {
        const { cardWidth, cardHeight, visual, depthConfig } = config;

        // 1. 创建 Container 作为卡牌容器(固定大小,不缩放)
        const container = scene.add.container(card.x, card.y);

        // 2. 设置初始 depth
        const initialDepth = depthConfig.baseDepth + card.layerIndex * depthConfig.lockedStep;
        container.setDepth(initialDepth);
        card.depth = initialDepth;

        // 3. 创建背景矩形(作为Container的子元素)
        const background = scene.add.rectangle(0, 0, cardWidth, cardHeight, 0xFFFFFF);
        background.setOrigin(0.5);
        container.add(background);

        // 4. 添加卡牌类型图片或文字
        if (card.cardType) {
            // 获取图片key
            const imageKey = typeof card.cardType === 'string'
                ? card.cardType  // 兼容旧的emoji字符串
                : card.cardType.id;

            // 检查图片是否加载成功
            if (scene.textures.exists(imageKey)) {
                // 使用图片
                const image = scene.add.image(0, -2, imageKey);  // Y轴向上偏移2px
                image.setOrigin(0.5);

                // 应用缩放
                const imageScale = config.cardImageScale || 0.5;
                image.setScale(imageScale);

                container.add(image);
                card.image = image;
                card.text = image;  // 兼容性,保持接口一致
            } else {
                // 降级到emoji文字
                const emoji = typeof card.cardType === 'string'
                    ? card.cardType
                    : card.cardType.emoji;
                const text = scene.add.text(0, 0, emoji, {
                    fontSize: '32px',
                    fontFamily: 'Arial'
                });
                text.setOrigin(0.5);
                container.add(text);
                card.text = text;
                console.warn(`[降级显示] 使用emoji ${emoji} 替代图片`);
            }
        }

        // 5. 保存背景引用
        card.background = background;

        // 6. 应用初始视觉状态
        this.updateCardVisual(card, container, config);

        card.sprite = container;
        return container;
    }

    /**
     * 更新卡牌视觉状态
     */
    static updateCardVisual(card, container, config) {
        const { visual } = config;
        const background = card.background;
        const image = card.image;

        // 根据锁定状态选择视觉配置
        const state = card.lockCount === 0 ? visual.unlocked : visual.locked;

        // 应用背景视觉状态(包括缩放)
        background.setAlpha(state.alpha);
        background.setScale(state.scale);  // 只缩放背景,不缩放容器
        background.setFillStyle(state.tint);  // Rectangle使用setFillStyle而非setTint
        background.setStrokeStyle(state.strokeWidth, state.strokeColor);

        // 应用图片视觉状态
        if (image) {
            // 图片缩放 = 基础缩放 × 状态缩放
            const baseScale = config.cardImageScale || 0.5;
            image.setScale(baseScale * state.scale);
            image.setTint(state.imageTint);
            image.setAlpha(state.imageAlpha);
        }

        // 文本同样处理
        if (card.text && card.text !== image) {
            card.text.setAlpha(state.imageAlpha);
        }
    }

    /**
     * 卡牌浮到顶层动画（方案1的核心）
     */
    static floatCardToTop(scene, card, config) {
        const container = card.sprite;
        const background = card.background;
        const { depthConfig, visual, cardAnimation } = config;

        // 更新 depth - 解锁卡牌移到顶层
        const newDepth = depthConfig.floatingBase + card.layerIndex;
        container.setDepth(newDepth);
        card.depth = newDepth;
        card.isFloating = true;

        // Container 位置动画(Y轴浮起)
        scene.tweens.add({
            targets: container,
            y: container.y - cardAnimation.floatDistance,
            duration: cardAnimation.floatDuration,
            ease: 'Back.easeOut',
            onStart: () => {
                // 应用解锁视觉状态到背景
                background.setScale(visual.unlocked.scale);
                background.setAlpha(visual.unlocked.alpha);
                background.setStrokeStyle(visual.unlocked.strokeWidth, visual.unlocked.strokeColor);
                background.setFillStyle(visual.unlocked.tint);

                // 更新图片状态（恢复正常颜色）
                if (card.image) {
                    const baseScale = config.cardImageScale || 0.5;
                    card.image.setScale(baseScale * visual.unlocked.scale);
                    card.image.setTint(visual.unlocked.imageTint);
                    card.image.setAlpha(visual.unlocked.imageAlpha);
                }
            },
            onComplete: () => {
                // 呼吸动画应用到背景
                scene.tweens.add({
                    targets: background,
                    scale: {
                        from: visual.unlocked.scale,
                        to: cardAnimation.breatheScale
                    },
                    duration: cardAnimation.breatheDuration,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });

                // 图片同步呼吸
                if (card.image) {
                    const baseScale = config.cardImageScale || 0.5;
                    scene.tweens.add({
                        targets: card.image,
                        scale: {
                            from: baseScale * visual.unlocked.scale,
                            to: baseScale * cardAnimation.breatheScale
                        },
                        duration: cardAnimation.breatheDuration,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut'
                    });
                }
            }
        });
    }

    /**
     * 应用悬停效果 (Container架构)
     */
    static applyHoverEffect(container, card, config) {
        const { visual } = config;
        const state = visual.hover;
        const background = card.background;

        // 应用到背景
        background.setScale(state.scale);
        background.setStrokeStyle(state.strokeWidth, state.strokeColor);

        // 应用到图片
        if (card && card.image) {
            const baseScale = config.cardImageScale || 0.5;
            card.image.setScale(baseScale * state.scale);
            card.image.setTint(state.imageTint);
            card.image.setAlpha(state.imageAlpha);
        }
    }

    /**
     * 移除悬停效果 (Container架构)
     */
    static removeHoverEffect(container, card, config) {
        const { visual } = config;
        const state = visual.unlocked;
        const background = card.background;

        // 恢复背景
        background.setScale(state.scale);
        background.setStrokeStyle(state.strokeWidth, state.strokeColor);

        // 恢复图片
        if (card && card.image) {
            const baseScale = config.cardImageScale || 0.5;
            card.image.setScale(baseScale * state.scale);
            card.image.setTint(state.imageTint);
            card.image.setAlpha(state.imageAlpha);
        }
    }
}

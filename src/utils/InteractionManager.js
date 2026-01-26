import CardRenderer from './CardRenderer.js';

/**
 * 交互管理器
 * 负责卡牌的点击、悬停等交互
 */
export default class InteractionManager {
    /**
     * 设置卡牌点击事件 (Container架构)
     */
    static setupCardClick(card, container, config, onClickCallback) {
        const { cardWidth, cardHeight } = config;

        // 显式设置固定 hitArea 到 Container
        const hitArea = new Phaser.Geom.Rectangle(
            -cardWidth/2,   // Container origin默认为0,需要从负半宽开始
            -cardHeight/2,
            cardWidth,
            cardHeight
        );

        container.setInteractive({
            hitArea: hitArea,
            hitAreaCallback: Phaser.Geom.Rectangle.Contains,
            useHandCursor: true
        });

        // 悬停进入
        container.on('pointerover', () => {
            if (card.lockCount === 0 && !card.isRemoved) {
                CardRenderer.applyHoverEffect(container, card, config);
            }
        });

        // 悬停离开
        container.on('pointerout', () => {
            if (card.lockCount === 0 && !card.isRemoved) {
                CardRenderer.removeHoverEffect(container, card, config);
            }
        });

        // 点击
        container.on('pointerdown', () => {
            if (card.lockCount === 0 && !card.isRemoved) {
                onClickCallback(card);
            }
        });
    }

    /**
     * 点击处理
     */
    static onCardClick(card, allCards, scene, config) {
        // 1. 移除被点击的卡牌
        this.removeCard(card, scene);

        // 2. 解锁所有被它锁住的卡牌
        card.lockedCards.forEach(ref => {
            const lockedCard = this.findCard(allCards, ref);

            if (lockedCard && !lockedCard.isRemoved) {
                this.unlockCard(lockedCard, scene, config);
            }
        });
    }

    /**
     * 解锁卡牌
     */
    static unlockCard(card, scene, config) {
        card.lockCount--;

        if (card.lockCount === 0) {
            // 完全解锁,浮到顶层
            CardRenderer.floatCardToTop(scene, card, config);
        } else {
            // 仍然被锁,保持灰色状态（使用CardRenderer统一更新）
            CardRenderer.updateCardVisual(card, card.sprite, config);
        }
    }

    /**
     * 移除卡牌 (Container架构)
     */
    static removeCard(card, scene) {
        card.isRemoved = true;
        const container = card.sprite;
        const background = card.background;

        // 添加移除动画(应用到背景)
        scene.tweens.add({
            targets: background,
            alpha: 0,
            scale: 0.8,
            duration: 200,
            ease: 'Power2'
        });

        // Container 同步淡出
        scene.tweens.add({
            targets: container,
            alpha: 0,
            duration: 200,
            ease: 'Power2',
            onComplete: () => {
                // 销毁 Container (会自动销毁所有子元素)
                if (container) {
                    container.destroy();
                    card.sprite = null;
                    card.background = null;
                    card.image = null;
                    card.text = null;
                }
            }
        });
    }

    /**
     * 查找卡牌
     */
    static findCard(allCards, ref) {
        return allCards.find(card =>
            card.layerIndex === ref.layerIndex &&
            card.row === ref.row &&
            card.col === ref.col
        );
    }
}

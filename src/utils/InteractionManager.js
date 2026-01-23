import CardRenderer from './CardRenderer.js';

/**
 * 交互管理器
 * 负责卡牌的点击、悬停等交互
 */
export default class InteractionManager {
    /**
     * 设置卡牌点击事件
     */
    static setupCardClick(card, sprite, config, onClickCallback) {
        sprite.setInteractive({ useHandCursor: true });

        // 悬停进入
        sprite.on('pointerover', () => {
            if (card.lockCount === 0 && !card.isRemoved) {
                CardRenderer.applyHoverEffect(sprite, config);
            }
        });

        // 悬停离开
        sprite.on('pointerout', () => {
            if (card.lockCount === 0 && !card.isRemoved) {
                CardRenderer.removeHoverEffect(sprite, config);
            }
        });

        // 点击
        sprite.on('pointerdown', () => {
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
            // 部分解锁,更新视觉(透明度略微提升)
            const baseAlpha = config.visual.locked.alpha;
            const unlockProgress = 1 - (card.lockCount / 5);
            const alpha = baseAlpha + (1 - baseAlpha) * unlockProgress;
            card.sprite.setAlpha(Math.min(alpha, 1.0));
        }
    }

    /**
     * 移除卡牌
     */
    static removeCard(card, scene) {
        card.isRemoved = true;

        // 添加移除动画
        scene.tweens.add({
            targets: card.sprite,
            alpha: 0,
            scale: 0.8,
            duration: 200,
            ease: 'Power2',
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

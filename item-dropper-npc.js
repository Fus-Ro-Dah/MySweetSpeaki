import { STATE } from './config.js';
import { NPCCharacter } from './npc-character.js';

/**
 * ItemDropperNPCクラス
 * 空腹度を検知せず、気ままに移動しながら定期的に指定のアイテムを配置するNPCの基底クラス
 */
export class ItemDropperNPC extends NPCCharacter {
    constructor(game, id, parentElement, x, y, options = {}) {
        super(game, id, parentElement, x, y, options);

        this.dropItemTypes = options.dropItemTypes || ['Mocaron'];
        this.dropInterval = options.dropInterval || 15000; // デフォルト15秒
        this.lastDropTime = Date.now();
    }

    update(dt) {
        super.update(dt);

        // 特殊行動中や死亡中でない場合に、タイマーチェックしてアイテムを配置
        if (this.status.state !== STATE.ABILITY_ACTION && this.status.state !== STATE.DYING) {
            const now = Date.now();
            if (now - this.lastDropTime > this.dropInterval) {
                this.lastDropTime = now;
                this.dropItem();
            }
        }
    }

    /** アイテムの配置アクションを開始 */
    dropItem() {
        const itemType = this.dropItemTypes[Math.floor(Math.random() * this.dropItemTypes.length)];
        this.executeAbility('place_item', {
            itemType: itemType,
            duration: 1500
        });
    }

    /** 能力の効果実行 (アイテムを実際に生成) */
    _onAbilityEffect(abilityId, options) {
        if (abilityId === 'place_item') {
            const game = this.game;
            if (game) {
                const placeX = this.pos.x;
                const placeY = this.pos.y + 20;
                game.addItem(options.itemType, 'item', placeX, placeY);
            }
        }
    }
}

import { FeederNPC } from './feeder-npc.js';

/**
 * Ashurクラス
 * 満腹度が低い(30以下)スピキを見つけ、近くに移動してモカロンを配置するNPC
 */
export class Ashur extends FeederNPC {
    constructor(id, parentElement, x, y, options = {}) {
        options.characterType = options.characterType || 'ashur';
        options.speed = options.speed || 1.5;
        options.size = options.size || 200;
        options.name = options.name || 'エシュール';

        // 給餌係の設定
        options.rescueItemType = 'Mocaron';
        options.dashSpeedMultiplier = 2.0;

        super(id, parentElement, x, y, options);
    }

    /** UI表示用ラベル (エシュール固有) */
    getStateLabel() {
        if (this.targetSpeaki) return "エシュール(救助中)";
        return super.getStateLabel().replace("NPC", "エシュール");
    }
}

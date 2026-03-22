import { FeederNPC } from './feeder-npc.js';

/**
 * Posherクラス
 * 満腹度が低い(30以下)スピキを見つけ、近くに移動してさつまいもを配置するNPC
 */
export class Posher extends FeederNPC {
    constructor(game, id, parentElement, x, y, options = {}) {
        options.characterType = options.characterType || 'posher';
        options.speed = options.speed || 1.5;
        options.size = options.size || 300;
        options.name = options.name || 'ポーシャー';

        // 給餌係の設定
        options.rescueItemType = 'Poteto';
        options.dashSpeedMultiplier = 3.0;

        super(game, id, parentElement, x, y, options);
    }

    /** UI表示用ラベル (ポーシャー固有) */
    getStateLabel() {
        if (this.targetSpeaki) return "ポーシャー(救助中)";
        return super.getStateLabel().replace("NPC", "ポーシャー");
    }
}

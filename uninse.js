import { ItemDropperNPC } from './item-dropper-npc.js';

/**
 * Uninseクラス
 * 空腹検知せず気ままに移動して、定期的にウニンセアイテム(Uninse1, Uninse2, Uninse3)を配置するNPC
 */
export class Uninse extends ItemDropperNPC {
    constructor(game, id, parentElement, x, y, options = {}) {
        options.characterType = options.characterType || 'uninse';
        options.speed = options.speed || 1.2;
        options.size = options.size || 200;
        options.name = options.name || 'ウニンセ';

        // 配置するアイテムの種類と間隔
        options.dropItemTypes = ['NPC_action_Uninse'];
        options.dropInterval = 15000; // 15秒

        super(game, id, parentElement, x, y, options);
    }

    /** UI表示用ラベル (ウニンセ固有) */
    getStateLabel() {
        return super.getStateLabel().replace("NPC", "ウニンセ");
    }
}

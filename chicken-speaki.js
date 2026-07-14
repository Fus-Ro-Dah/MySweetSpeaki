import { ItemDropperNPC } from './item-dropper-npc.js';

/**
 * ChickenSpeakiクラス (トリスピキ)
 * 空腹検知せず気ままに移動して、定期的にトリスピキのぬいぐるみを配置するNPC
 */
export class ChickenSpeaki extends ItemDropperNPC {
    constructor(game, id, parentElement, x, y, options = {}) {
        options.characterType = options.characterType || 'chickenspeaki';
        options.speed = options.speed || 1.2;
        options.size = options.size || 200;
        options.name = options.name || 'トリスピキ';

        // 配置するアイテムの種類と間隔
        options.dropItemTypes = ['NPC_action_ChickenSpeaki'];
        options.dropInterval = 20000; // 20秒

        super(game, id, parentElement, x, y, options);
    }

    /** UI表示用ラベル (トリスピキ固有) */
    getStateLabel() {
        return super.getStateLabel().replace("NPC", "トリスピキ");
    }
}

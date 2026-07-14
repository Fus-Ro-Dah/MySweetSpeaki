import { ItemDropperNPC } from './item-dropper-npc.js';

/**
 * SheepSpeakiクラス (羊スピキ)
 * 空腹検知せず気ままに移動して、定期的に羊スピキのぬいぐるみを配置するNPC
 */
export class SheepSpeaki extends ItemDropperNPC {
    constructor(game, id, parentElement, x, y, options = {}) {
        options.characterType = options.characterType || 'sheepspeaki';
        options.speed = options.speed || 1.2;
        options.size = options.size || 200;
        options.name = options.name || '羊スピキ';

        // 配置するアイテムの種類と間隔
        options.dropItemTypes = ['NPC_action_SheepSpeaki'];
        options.dropInterval = 20000; // 20秒

        super(game, id, parentElement, x, y, options);
    }

    /** UI表示用ラベル (羊スピキ固有) */
    getStateLabel() {
        return super.getStateLabel().replace("NPC", "羊スピキ");
    }
}

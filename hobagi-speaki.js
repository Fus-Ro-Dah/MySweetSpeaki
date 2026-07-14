import { ItemDropperNPC } from './item-dropper-npc.js';

/**
 * HobagiSpeakiクラス (ホバギスピキ)
 * 空腹検知せず気ままに移動して、定期的にホバギスピキの人形を配置するNPC
 */
export class HobagiSpeaki extends ItemDropperNPC {
    constructor(game, id, parentElement, x, y, options = {}) {
        options.characterType = options.characterType || 'hobagispeaki';
        options.speed = options.speed || 1.2;
        options.size = options.size || 200;
        options.name = options.name || 'ホバギスピキ';

        // 配置するアイテムの種類と間隔
        options.dropItemTypes = ['NPC_action_HobagiSpeaki'];
        options.dropInterval = 20000; // 20秒

        super(game, id, parentElement, x, y, options);
    }

    /** UI表示用ラベル (ホバギスピキ固有) */
    getStateLabel() {
        return super.getStateLabel().replace("NPC", "ホバギスピキ");
    }
}

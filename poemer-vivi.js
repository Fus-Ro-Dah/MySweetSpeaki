import { ItemDropperNPC } from './item-dropper-npc.js';

/**
 * PoemerViviクラス (俳人ヴィヴィ)
 * 空腹検知せず気ままに移動して、定期的にヴィヴィの人形を配置するNPC
 */
export class PoemerVivi extends ItemDropperNPC {
    constructor(game, id, parentElement, x, y, options = {}) {
        options.characterType = options.characterType || 'poemervivi';
        options.speed = options.speed || 1.2;
        options.size = options.size || 200;
        options.name = options.name || '俳人ヴィヴィ';

        // 配置するアイテムの種類と間隔
        options.dropItemTypes = ['NPC_action_PoemerVivi'];
        options.dropInterval = 20000; // 20秒

        super(game, id, parentElement, x, y, options);
    }

    /** UI表示用ラベル (俳人ヴィヴィ固有) */
    getStateLabel() {
        return super.getStateLabel().replace("NPC", "俳人ヴィヴィ");
    }
}

import { ItemDropperNPC } from './item-dropper-npc.js';

/**
 * VibingGabiaクラス (バイブスガヴィア)
 * 奇妙なレコードの再生中に一時的に現れるNPC
 */
export class VibingGabia extends ItemDropperNPC {
    constructor(game, id, parentElement, x, y, options = {}) {
        options.characterType = options.characterType || 'vibinggabia';
        options.speed = options.speed || 1.2;
        options.size = options.size || 200;
        options.name = options.name || 'ガヴィア';

        // 配置するアイテムの種類と間隔
        options.dropItemTypes = ['StrangeRecord1'];
        options.dropInterval = 20000; // 20秒

        super(game, id, parentElement, x, y, options);
    }

    /** UI表示用ラベル (ガヴィア固有) */
    getStateLabel() {
        return super.getStateLabel().replace("NPC", "ガヴィア");
    }
}

import { STATE, ASSETS, ITEMS } from './config.js';
import { BaseCharacter } from './base-character.js';

/**
 * 子供のスピキクラス
 * BaseCharacterを継承し、小さく高い声、および自律的なアイテム配置ロジックを持つ
 */
export class BabySpeaki extends BaseCharacter {
    constructor(id, parentElement, x, y, options = {}) {
        options.characterType = 'baby';
        options.size = options.size || 80;             // 通常の半分程度のサイズ
        options.voicePitch = options.voicePitch || 1.6; // 高い声
        options.speed = options.speed || (1.0 + Math.random() * 2.0);
        super(id, parentElement, x, y, options);
        this.bornTime = Date.now(); // 誕生時刻の記録
    }

    /** 状態遷移の拡張: 自律的な行動を追加 */
    _updateStateTransition() {
        // 0. 進化チェック (60秒経過 && 満腹度75以上)
        if (Date.now() - this.bornTime > 60000 && this.status.hunger >= 75) {
            if (window.game && window.game.evolveBaby) {
                window.game.evolveBaby(this);
                return; // 進化したら以降の処理は不要
            }
        }

        super._updateStateTransition();

        // 親クラス（BaseCharacter）にはない、Speaki同様の隠れ家ロジックを追加
        if (this.status.state === STATE.IDLE) {
            this._tryHideWhenFriendshipLow();
        }

        const now = Date.now();
        // IDLE状態で一定時間経過後、低確率でアイテムを配置する（遊び）
        if (this.status.state === STATE.IDLE && now - this.timers.stateStart > 10000) {
            if (Math.random() < 0.005) { // 約 0.5% の確率
                this._placeRandomCandy();
            }
        }
    }

    /** 目的地決定（散歩）の拡張: 低好感度時の隠れ家優先 */
    _decideWanderingDestination(w, h) {
        if (this.status.friendship <= -31) {
            this.interaction.targetItem = null;
            this.pos.targetX = 50 + (Math.random() * 40 - 20);
            this.pos.targetY = 100 + (Math.random() * 40 - 20);
            this.pos.destinationSet = true;
            return;
        }
        super._decideWanderingDestination(w, h);
    }

    /** 低好感度時の隠れ家移動 (Speakiと同等) */
    _tryHideWhenFriendshipLow() {
        if (this.status.friendship > -31) return false;

        const hiddenX = 60;
        const hiddenY = 80;
        const distToHidden = Math.sqrt((this.pos.x - hiddenX) ** 2 + (this.pos.y - hiddenY) ** 2);

        if (distToHidden <= 30) return false;

        this.status.state = STATE.WALKING;
        this._onStateChanged(this.status.state);
        this.pos.targetX = hiddenX;
        this.pos.targetY = hiddenY;
        this.pos.destinationSet = true;
        // this.pos.speed = 8.0; // BaseCharacter側で好感度を見て速度制御するため削除
        return true;
    }

    /** キャンディを自律的に配置する */
    _placeRandomCandy() {
        if (!window.game) return;

        // 自分の足元にキャンディを置く
        window.game.addItem('Candy', 'item', this.pos.x, this.pos.y);

        // 置いた後は少し離れる
        this.status.state = STATE.WALKING;
        this._onStateChanged(this.status.state);
        this.status.emotion = 'happy';
        // this._onStateChanged()内でアセットが適用されるため、ここでは再呼び出しを避ける
    }

    /** リスト表示用のラベル */
    getStateLabel() {
        switch (this.status.state) {
            case STATE.IDLE: return "こども(のんびり)";
            case STATE.WALKING: return "こども(てくてく)";
            case STATE.ITEM_APPROACHING: return "なにかある！";
            case STATE.ITEM_ACTION: return "あそんでる！";
            default: return "こどもスピキ";
        }
    }
}

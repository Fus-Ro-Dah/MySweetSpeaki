import { STATE, ASSETS } from './config.js';
import { BaseCharacter } from './base-character.js';

/**
 * 赤ちゃんスピキクラス
 * 動かず、常に喋り続ける。
 */
export class BabySpeaki extends BaseCharacter {
    constructor(id, parentElement, x, y, options = {}) {
        options.characterType = 'baby';
        options.size = options.size || 60;             // さらに小さい
        options.voicePitch = options.voicePitch || 2.0; // 極めて高い声
        options.speed = 0;                             // 動かない
        super(id, parentElement, x, y, options);
        this.idleGrowthTime = 0; // 実時間ではなくIDLE状態の累積時間で成長させる
        this.hasHunger = false;  // 赤ちゃんは空腹度が減らない
    }

    /** フレーム更新: IDLE時のみ成長タイマーを進める */
    update(dt) {
        // IDLE状態、かつユーザーと直接触れ合っていない（なでられていない）間だけ成長
        if (this.status.state === STATE.IDLE && !this.interaction.isInteracting) {
            this.idleGrowthTime += dt;
        }
        super.update(dt);
    }

    /** 状態遷移の制限と自動進化、喋りループ */
    _updateStateTransition() {
        // 1. 進化チェック (累積IDLE時間が60秒経過で子供へ)
        if (this.idleGrowthTime > 60000) {
            if (window.game && window.game.evolveBabyToChild) {
                window.game.evolveBabyToChild(this);
                return;
            }
        }

        // 2. 特殊状態（ユーザー交流、他スピキとの交流、死亡）の時は基底クラスに任せる
        const interactiveStates = [STATE.USER_INTERACTING, STATE.GAME_APPROACHING, STATE.GAME_REACTION, STATE.DYING];
        if (interactiveStates.includes(this.status.state)) {
            super._updateStateTransition();
            return;
        }

        // 3. それ以外は常にIDLE状態を維持（WALKINGへの遷移を封印）
        this.status.state = STATE.IDLE;

        // 4. 喋りループ: 音声が再生終了したら、次のアセットを再生（BABY専用の常時お喋り）
        if (!this.isVoicePlaying()) {
            this._onStateChanged(STATE.IDLE);
        }
    }


    /** 移動を封印 */
    _decideWanderingDestination(w, h) {
        this.pos.destinationSet = false;
    }

    /** 目的地決定を封印 */
    _decideNextDestination() {
        this.pos.destinationSet = false;
    }

    /** アイテムへの接近を封印 */
    approachItem(item, distance) {
        // 赤ちゃんはアイテムに反応しない
        return;
    }

    /** リスト表示用のラベル */
    getStateLabel() {
        return "赤ちゃん";
    }
}

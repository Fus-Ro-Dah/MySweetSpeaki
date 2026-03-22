import { STATE, ASSETS } from './config.js';
import { BaseCharacter } from './base-character.js';

/**
 * 赤ちゃんスピキクラス
 * 動かず、常に喋り続ける。
 */
export class BabySpeaki extends BaseCharacter {
    constructor(game, id, parentElement, x, y, options = {}) {
        options.characterType = 'baby';
        options.size = options.size || 60;             // さらに小さい
        options.voicePitch = options.voicePitch || 2.0; // 極めて高い声
        options.speed = 0;                             // 動かない
        super(game, id, parentElement, x, y, options);
        this.idleGrowthTime = 0; // 実時間ではなくIDLE状態の累積時間で成長させる
        this.hasHunger = false;  // 赤ちゃんは空腹度が減らない
    }

    /** フレーム更新: IDLE時のみ成長タイマーを進める */
    update(dt) {
        // ユーザーと直接触れ合っていない（なでられていない）間だけ成長（ステートに関わらずタイマーは進める）
        // 成長停止設定がONの場合はカウントを進めない
        const isGrowthStopped = this.game && this.game.settings && this.game.settings.growthStopEnabled;
        if (!this.interaction.isInteracting && !isGrowthStopped) {
            this.idleGrowthTime += dt;
            this._updateSocialRequest(dt);
        }
        super.update(dt);
    }

    /** 自律的な交流リクエストの更新 */
    _updateSocialRequest(dt) {
        if (!this.canInteract || this.status.state === STATE.DYING) return;
        if (this.status.state !== STATE.IDLE) return;
        if (this.interaction.isInteracting) return;

        const now = Date.now();
        if (now - this.timers.lastSocialRequestAttempt < 15000) return;
        this.timers.lastSocialRequestAttempt = now;

        // 赤ちゃんはヒマだとたまに大人を呼ぶ
        const chance = this._getSocialProbability(0.15);
        if (Math.random() < chance) {
            if (this.game && this.game.social) {
                // 特定のアクションを指定せず、システムに最適なものを選択させる
                this.game.social.requestSocialAction(this, null);
            }
        }
    }

    /** 状態遷移の制限と自動進化、喋りループ */
    _updateStateTransition() {
        // 1. 進化チェック (累積IDLE時間が60秒経過で子供へ)
        // 直接evolveBabyToChildを呼ぶと、destroy()後もupdate()が続行してクラッシュする。
        // isPendingEvolutionフラグを立て、CharacterManagerのループで安全に処理する。
        if (this.status.state === STATE.IDLE && this.idleGrowthTime > 60000) {
            this.isPendingEvolution = true;
            return;
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

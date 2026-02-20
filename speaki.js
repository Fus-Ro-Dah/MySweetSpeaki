import { STATE, ASSETS, ITEMS } from './config.js';
import { BaseCharacter } from './base-character.js';

/**
 * 従来のSpeaki個体を表すクラス
 * BaseCharacter を継承し、お土産イベントや特定の好感度行動を保持
 */
export class Speaki extends BaseCharacter {
    constructor(id, parentElement, x, y, options = {}) {
        options.characterType = 'speaki';
        super(id, parentElement, x, y, options);
    }

    /** 状態遷移の判定 (Speaki固有のギフトイベント、隠れ行動を追加) */
    _updateStateTransition() {
        const now = Date.now();
        const dist = this.pos.destinationSet ? Math.sqrt(Math.pow(this.pos.targetX - this.pos.x, 2) + Math.pow(this.pos.targetY - this.pos.y, 2)) : 999;
        const arrived = dist <= 10;

        // 1. プレゼントイベントの割り込みチェック
        if (this._checkGiftEventInterruption(now)) return;

        // 2. 基本的な遷移（IDLE, WALKING, ITEM_*）を親クラスに任せる
        super._updateStateTransition();

        // 3. Speaki固有の状態遷移
        switch (this.status.state) {
            case STATE.IDLE:
                this._tryHideWhenFriendshipLow();
                break;

            case STATE.GIFT_LEAVING:
                if (arrived) {
                    this.status.state = STATE.GIFT_SEARCHING;
                    this._onStateChanged(this.status.state);
                }
                break;

            case STATE.GIFT_SEARCHING:
                if (now - this.timers.stateStart > 5000) {
                    this.status.state = STATE.GIFT_RETURNING;
                    this._onStateChanged(this.status.state);
                }
                break;

            case STATE.GIFT_RETURNING:
                if (arrived) {
                    this.status.state = STATE.GIFT_WAIT_FOR_USER_REACTION;
                    if (typeof window !== 'undefined' && window.game) {
                        window.game.startGiftReceiveEvent(this);
                    }
                    this._onStateChanged(this.status.state);
                }
                break;

            case STATE.GIFT_WAIT_FOR_USER_REACTION:
                if (now - this.timers.stateStart > 10000) {
                    this.status.state = STATE.GIFT_TIMEOUT;
                    if (typeof window !== 'undefined' && window.game) {
                        window.game.updateGiftUI('hide');
                    }
                    this._onStateChanged(this.status.state);
                }
                break;

            case STATE.GIFT_REACTION:
            case STATE.GIFT_TIMEOUT:
                const dur = (this.status.state === STATE.GIFT_REACTION) ? (this.timers.actionDuration || 4000) : 5000;
                if (now - this.timers.stateStart > dur) {
                    // 完了処理 (IDLEへ戻る)
                    this.status.state = STATE.IDLE;
                    if (typeof window !== 'undefined' && window.game) {
                        window.game.completeGiftEvent(this);
                    }
                    this._onStateChanged(this.status.state);
                }
                break;
        }
    }

    /** 目的地決定の拡張 */
    _decideNextDestination() {
        if (this.status.state === STATE.GIFT_LEAVING) {
            this.pos.targetX = -250;
            const h = (this.parentElement && this.parentElement.clientHeight) || (typeof window !== 'undefined' ? window.innerHeight : 800);
            this.pos.targetY = h / 2;
            this.pos.destinationSet = true;
            return;
        }

        if (this.status.state === STATE.GIFT_RETURNING) {
            const w = (this.parentElement && this.parentElement.clientWidth) || (typeof window !== 'undefined' ? window.innerWidth : 1200);
            const h = (this.parentElement && this.parentElement.clientHeight) || (typeof window !== 'undefined' ? window.innerHeight : 800);
            this.pos.targetX = w * 0.4 + (Math.random() * 100 - 50);
            this.pos.targetY = h * 0.5 + (Math.random() * 100 - 50);
            this.pos.destinationSet = true;
            return;
        }

        super._decideNextDestination();
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

    /** 状態に基づいた外見設定の拡張: ギフト関係 */
    _applyStateAppearance(state) {
        super._applyStateAppearance(state);

        switch (state) {
            case STATE.GIFT_LEAVING:
            case STATE.GIFT_RETURNING:
                this.status.emotion = 'happy';
                this.status.action = 'walking';
                break;
            case STATE.GIFT_WAIT_FOR_USER_REACTION:
                this.status.emotion = 'happy';
                this.status.action = 'giftwait';
                break;
            case STATE.GIFT_REACTION:
                this.status.emotion = 'happy';
                this.status.action = 'giftreaction';
                break;
            case STATE.GIFT_TIMEOUT:
                this.status.emotion = 'sad';
                this.status.action = 'gifttimeout';
                break;
        }
    }

    /** DOM同期の拡張: ギフト画像の表示 */
    syncDOM() {
        super.syncDOM();
        const dom = this.visual.dom;
        if (!dom.gift) return;

        let isShowingGift = [STATE.GIFT_RETURNING, STATE.GIFT_WAIT_FOR_USER_REACTION, STATE.GIFT_REACTION].includes(this.status.state);

        if (isShowingGift) {
            dom.gift.classList.remove('hidden');
            const flip = this.pos.facingLeft ? 1 : -1;
            const scale = (this.visual.distortion && this.visual.distortion.scale) || 1.0;
            dom.gift.style.transform = `translateX(-50%) translateZ(100px) scale(${1.0 / scale}) scaleX(${flip})`;
        } else {
            dom.gift.classList.add('hidden');
        }
    }

    /** 低好感度時の隠れ家移動 */
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

    /** ギフトイベントの割り込みチェック */
    _checkGiftEventInterruption(now) {
        if (this.status.hunger <= 0) return false;

        const nonInterruptibleStates = [
            STATE.GIFT_LEAVING, STATE.GIFT_SEARCHING, STATE.GIFT_RETURNING,
            STATE.GIFT_WAIT_FOR_USER_REACTION, STATE.GIFT_REACTION, STATE.GIFT_TIMEOUT,
            STATE.USER_INTERACTING
        ];

        if (nonInterruptibleStates.includes(this.status.state)) {
            return false;
        }

        return this._tryStartGiftEvent(now);
    }

    _tryStartGiftEvent(now) {
        if (typeof window === 'undefined' || !window.game) return false;
        const game = window.game;

        // 【自己修復】もし自分がギフト担当になっているのに、このメソッドが呼ばれた（＝ギフト状態ではない）場合、
        // 状態不整合（ゾンビ）とみなして担当を解除する
        if (game.giftPartner === this) {
            console.warn(`[Speaki] Self-healing: Cleared zombie gift partner state for ${this.id}`);
            game.giftPartner = null;
        }

        const timeSinceLastGift = now - game.lastGiftTime;
        const canStartGift = this.status.friendship >= 31 && timeSinceLastGift >= 30000 && !game.giftPartner;

        if (!canStartGift) return false;

        this.status.state = STATE.GIFT_LEAVING;
        game.giftPartner = this;
        this._onStateChanged(this.status.state);
        return true;
    }

    /** UI表示用のラベル取得 */
    getStateLabel() {
        switch (this.status.state) {
            case STATE.IDLE: return "のんびり";
            case STATE.WALKING: return "お散歩";
            case STATE.GIFT_LEAVING:
            case STATE.GIFT_SEARCHING:
            case STATE.GIFT_RETURNING: return "お土産探し";
            case STATE.GIFT_WAIT_FOR_USER_REACTION: return "お土産！";
            case STATE.ITEM_APPROACHING: return "発見！";
            case STATE.ITEM_ACTION: return "遊び中";
            case STATE.USER_INTERACTING: return "ふれあい中";
            default: return "ぼーっと";
        }
    }
}

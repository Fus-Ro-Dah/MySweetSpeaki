import { STATE, ASSETS, ITEMS } from './config.js';
import { BaseCharacter } from './base-character.js';

/**
 * 特殊NPCクラス
 * プレイヤーが直接操作できず、独自のAIロジックで行動するキャラクター
 */
export class NPCCharacter extends BaseCharacter {
    constructor(id, parentElement, x, y, options = {}) {
        // NPCのデフォルト設定
        options.canInteract = false;
        options.hasHunger = false;
        options.hasEmotion = false;
        options.characterType = options.characterType || 'npc_wizard';
        options.speed = options.speed || 1.2;

        super(id, parentElement, x, y, options);
    }

    /** 状態遷移の判定 (NPC独自の行動ロジック) */
    _updateStateTransition() {
        const now = Date.now();
        const dist = this.pos.destinationSet ? Math.sqrt(Math.pow(this.pos.targetX - this.pos.x, 2) + Math.pow(this.pos.targetY - this.pos.y, 2)) : 999;
        const arrived = dist <= 10;

        switch (this.status.state) {
            case STATE.IDLE:
                const elapsed = now - this.timers.stateStart;

                if (elapsed > this.timers.waitDuration) {
                    this.status.state = STATE.WALKING;
                    this._onStateChanged(this.status.state);
                }
                break;

            case STATE.WALKING:
                if (arrived) {
                    this.status.state = STATE.IDLE;
                    this._onStateChanged(this.status.state);
                    this._handleArrival();
                }
                break;

            case STATE.ABILITY_ACTION:
                // BaseCharacter側の共通ロジックでIDLEに戻る
                super._updateStateTransition();
                break;

            default:
                // その他の状態（アイテムアクション等）も一応親に任せる
                super._updateStateTransition();
                break;
        }
    }

    /** 目的地決定ロジック (ｽﾋﾟｷより単純なランダム移動) */
    _decideWanderingDestination(w, h) {
        this.interaction.targetItem = null;
        this.pos.targetX = Math.random() * (w - 200) + 100;
        this.pos.targetY = Math.random() * (h - 200) + 100;
        this.pos.destinationSet = true;
    }


    /** UI表示用のラベル取得 */
    getStateLabel() {
        switch (this.status.state) {
            case STATE.IDLE: return "NPC(待機中)";
            case STATE.WALKING: return "NPC(移動中)";
            case STATE.ABILITY_ACTION: return "NPC(特殊行動)";
            default: return "NPC";
        }
    }
}

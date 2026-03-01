import { STATE } from './config.js';
import { NPCCharacter } from './npc-character.js';

/**
 * FeederNPCクラス (給餌係)
 * 共通の「空腹スピキを探索し、アイテムを配る」ロジックを持つ基底クラス
 */
export class FeederNPC extends NPCCharacter {
    constructor(id, parentElement, x, y, options = {}) {
        super(id, parentElement, x, y, options);

        this.baseSpeed = this.pos.speed;
        this.rescueItemType = options.rescueItemType || 'Mocaron';
        this.dashSpeedMultiplier = options.dashSpeedMultiplier || 2.0;
        this.dashSpeed = this.baseSpeed * this.dashSpeedMultiplier;

        this.targetSpeaki = null;
    }

    /** 目的地決定ロジック (空腹スピキ探索) */
    _decideWanderingDestination(w, h) {
        const hungrySpeaki = this._findHungrySpeaki();

        if (hungrySpeaki) {
            this.targetSpeaki = hungrySpeaki;
            this.pos.targetX = hungrySpeaki.pos.x;
            this.pos.targetY = hungrySpeaki.pos.y;
            this.pos.speed = this.dashSpeed;
            this.pos.destinationSet = true;
        } else {
            this.targetSpeaki = null;
            this.pos.speed = this.baseSpeed;
            super._decideWanderingDestination(w, h);
        }
    }

    /** 状態遷移の判定 - 救助対象がいる場合は早めに立ち止まるようにオーバーライド */
    _updateStateTransition() {
        const now = Date.now();
        const dist = this.pos.destinationSet ? Math.sqrt(Math.pow(this.pos.targetX - this.pos.x, 2) + Math.pow(this.pos.targetY - this.pos.y, 2)) : 999;

        // 救助対象（targetSpeaki）を追いかけている時は、150px手前で「到着」とみなす
        const threshold = this.targetSpeaki ? 150 : 10;
        const arrived = dist <= threshold;

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
                super._updateStateTransition();
                break;

            default:
                super._updateStateTransition();
                break;
        }
    }

    /** 到着時の処理 */
    _handleArrival() {
        if (this.targetSpeaki) {
            // 到着時の相手の位置を保存して、能力実行に渡す（後で中間地点を計算するため）
            this.executeAbility('place_item', {
                targetPos: { x: this.targetSpeaki.pos.x, y: this.targetSpeaki.pos.y },
                itemType: this.rescueItemType,
                duration: 1500
            });
        }

        this.targetSpeaki = null;
        this.pos.speed = this.baseSpeed;

        // NPCCharacter._handleArrivalの代わりにBaseCharacterの基本処理を呼ぶ
        // (NPCCharacter._handleArrivalは単に座標リセットのみ)
        this.timers.stateStart = Date.now();
        this.pos.destinationSet = false;
        this.timers.waitDuration = 2000 + Math.random() * 6000;
    }

    /** 能力の効果実行 */
    _onAbilityEffect(abilityId, options) {
        if (abilityId === 'place_item') {
            const game = window.game;
            if (game) {
                let placeX = this.pos.x;
                let placeY = this.pos.y + 20;

                // 【修正】相手との中間地点にアイテムを配置する
                if (options.targetPos) {
                    placeX = (this.pos.x + options.targetPos.x) / 2;
                    placeY = (this.pos.y + options.targetPos.y) / 2;
                }

                game.addItem(options.itemType || this.rescueItemType, 'item', placeX, placeY);
            }
        }
    }

    /** 救助対象（空腹のスピキ）を探す */
    _findHungrySpeaki() {
        const game = window.game;
        if (!game) return null;
        return game.speakis.find(s =>
            s !== this &&
            s.hasHunger &&
            s.status.hunger <= 30
        );
    }
}

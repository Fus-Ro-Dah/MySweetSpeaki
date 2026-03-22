import { MESSAGES } from '../config/messages.js';
import { STATE } from '../config.js';

/**
 * 観察メッセージの生成と管理を行うクラス
 */
export class MessageManager {
    constructor(game) {
        this.game = game;
        this.lastLogTimes = new Map(); // キャラクターごとの最終ログ時刻
        this.throttleInterval = 10000;  // 同一キャラクターの連投制限（ミリ秒）
        this.throttles = {
            state: 0,       // 状態変化による自動ログ用
            interaction: 0  // ユーザー操作（撫でる・叩く）用
        };
    }

    /**
     * キャラクターの状態変化に基づいたログを生成
     * @param {BaseCharacter} char 対象のキャラクター
     */
    logStateChange(char) {
        // ハイライトチェックと5秒制限（stateカテゴリ）の確認
        if (!this._isHighlighted(char) || !this._checkThrottle('state')) return;

        const isBaby = char.characterType === 'baby';
        const typeKey = isBaby ? 'baby' : 'speaki';
        const state = char.status.state;
        const emotion = char.status.emotion || 'normal';

        let templates = null;

        if (state === STATE.IDLE || state === STATE.WALKING) {
            const stateKey = state.toUpperCase(); // IDLE or WALKING
            const category = MESSAGES[typeKey][stateKey];

            // 優先順位ロジック
            // ①空腹値が30以下かどうか判定
            if (char.status.hunger <= 30 && category.hunger?.low) {
                templates = category.hunger.low;
            }
            // ②好感度が-20以下かどうか判定
            else if (char.status.friendship <= -20 && category.friendship?.low) {
                templates = category.friendship.low;
            }
            // ③④ 感情による表示
            else {
                const pool = [];
                if (emotion === 'sad') {
                    pool.push(...(category.default?.sad || []));
                } else if (emotion === 'normal') {
                    pool.push(...(category.default?.normal || []));
                } else {
                    // happy時
                    pool.push(...(category.default?.happy || []));
                    // 候補追加条件
                    if (char.status.friendship >= 20 && category.friendship?.high) {
                        pool.push(...category.friendship.high);
                    }
                    if (char.status.hunger >= 70 && category.hunger?.high) {
                        pool.push(...category.hunger.high);
                    }
                }
                templates = pool;
            }
        }
        else if (state === STATE.GIFT_LEAVING) {
            templates = MESSAGES[typeKey].GIFT_LEAVING;
        }
        else if (state === STATE.GIFT_RETURNING) {
            templates = MESSAGES[typeKey].GIFT_RETURNING;
        }

        if (templates && templates.length > 0) {
            this._send(char, this._getRandom(templates), null, 'state');
        }
    }

    /**
     * ユーザーとのインタラクションログ（撫でる・叩く）
     */
    logUserInteraction(char, type) {
        // ハイライトチェックと5秒制限（interactionカテゴリ）の確認
        if (!this._isHighlighted(char) || !this._checkThrottle('interaction')) return;

        const isBaby = char.characterType === 'baby';
        const typeKey = isBaby ? 'baby' : 'speaki';
        const templates = MESSAGES[typeKey].USER_INTERACTING?.[type];

        if (templates && templates.length > 0) {
            this._send(char, this._getRandom(templates), null, 'interaction');
        }
    }

    /**
     * アイテムへの反応ログ
     */
    logItemReaction(char, item) {
        // ハイライトチェックのみ（制限なし）
        if (!this._isHighlighted(char)) return;

        const typeKey = char.characterType === 'baby' ? 'baby' : 'speaki';
        const itemType = item.id || item.type;

        // ユーザー指定のキー名に合わせる
        const templates = MESSAGES[typeKey].ITEM_ACTION?.[itemType];

        if (templates && templates.length > 0) {
            this._send(char, this._getRandom(templates), null, null); // 制限なし
        }
    }

    /**
     * キャラクター同士の交流ログ
     */
    logSocialInteraction(initiator, target, actionId) {
        // ハイライトされているスピキがいれば表示（制限なし）
        const isInitiatorHighlighted = this._isHighlighted(initiator);
        const isTargetHighlighted = this._isHighlighted(target);
        if (!isInitiatorHighlighted && !isTargetHighlighted) return;

        const typeKey = initiator.characterType === 'baby' ? 'baby' : 'speaki';
        const socialData = MESSAGES[typeKey].GAME_REACTION?.[actionId];

        if (!socialData) return;

        // 1. initiator(誘った側)のメッセージ
        if (isInitiatorHighlighted) {
            let templates;
            if (Array.isArray(socialData)) {
                templates = socialData;
            } else {
                templates = socialData.initiator;
            }

            if (templates && templates.length > 0) {
                this._send(initiator, this._getRandom(templates), target, null); // 制限なし
            }
        }

        // 2. target(誘われた側)の反応
        const targetTypeKey = target.characterType === 'baby' ? 'baby' : 'speaki';
        const targetSocialData = MESSAGES[targetTypeKey].GAME_REACTION?.[actionId];

        if (isTargetHighlighted && targetSocialData && targetSocialData.target) {
            setTimeout(() => {
                this._send(target, this._getRandom(targetSocialData.target), initiator, null); // 制限なし
            }, 1000);
        }
    }

    /**
     * キャラクターの死亡ログ
     * @param {BaseCharacter} char 死亡したキャラクター
     */
    logDeath(char) {
        // 観察対象のみ（制限なし）
        if (!this._isHighlighted(char)) return;
        this._send(char, "その子はいなくなってしまった", null, null);
    }

    /**
     * ハイライトされているかチェック
     */
    _isHighlighted(char) {
        return char && this.game.highlightedCharId === char.id;
    }

    /**
     * 5秒間の制限チェック
     * @param {string} type 制限カテゴリ ('state'|'interaction')
     */
    _checkThrottle(type) {
        if (!type || !this.throttles[type]) return true;
        return Date.now() - this.throttles[type] >= 5000;
    }

    /**
     * 制限時刻を更新
     * @param {string} type 制限カテゴリ ('state'|'interaction')
     */
    _updateThrottle(type) {
        if (!type || !this.throttles.hasOwnProperty(type)) return;
        this.throttles[type] = Date.now();
    }

    /**
     * メッセージ送信の実体
     * @param {BaseCharacter} char 対象のキャラクター
     * @param {string} template メッセージテンプレート
     * @param {BaseCharacter} target ターゲットキャラクター (オプション)
     * @param {string|null} throttleType 更新する制限カテゴリ (nullなら更新しない)
     */
    _send(char, template, target = null, throttleType = 'state') {
        if (!this.game.ui) return;

        let text = template.replace(/{name}/g, char.name);
        if (target) {
            text = text.replace(/{targetName}/g, target.name);
        }

        // メッセージを表示
        this.game.ui.addConsoleMessage(text);

        // スロットル更新
        if (throttleType) {
            this._updateThrottle(throttleType);
        }
    }

    _getRandom(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
}

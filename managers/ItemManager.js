import { STATE, ITEMS, JOBS } from '../config.js';
import { Item } from '../item.js';

/**
 * アイテム管理クラス
 * アイテムの配置、ライフサイクル管理、変化処理を担当する
 */
export class ItemManager {
    constructor(game) {
        this.game = game;
    }

    /** アイテムの配置 */
    addItem(id, type, x, y) {
        const game = this.game;
        let def;

        // クールダウンチェック
        const now = Date.now();
        if (game.itemCooldowns[id] && now < game.itemCooldowns[id]) {
            game.sound.playSound('アーウ.mp3', 0.5);
            return;
        }

        // バイト(Job)の場合は専用オブジェクトから取得してNPC呼出
        if (type === 'job') {
            def = JOBS[id];
            if (def) {
                game.characters.callNPC(def.npcType);
            }
            return;
        }

        // --- ここから通常のアイテムロジック ---
        if (id === 'RandomGift') {
            // プラスチックを消費
            if (game.plastics <= 0) {
                game.sound.playSound('アーウ.mp3', 0.5);
                return;
            }
            const pool = Object.entries(ITEMS).filter(([key, d]) => d.isLockedItem);
            if (pool.length > 0) {
                const [randomId, randomDef] = pool[Math.floor(Math.random() * pool.length)];
                id = randomId;
                def = randomDef;
                game.plastics--;
                game.ui.initItemMenu();
                game.ui.updatePlasticStockUI();
            } else {
                return;
            }
        } else {
            def = ITEMS[id];
        }

        if (!def) return;

        // 教主像の唯一性チェック: すでに存在する場合は古い方を削除
        if (id === 'MasterStatue') {
            const existingStatue = game.placedItems.find(it => it.id === 'MasterStatue');
            if (existingStatue) {
                this.removeItem(existingStatue);
            }
        }

        // 配置処理
        const item = new Item(id, x, y, {
            type: def.type || type,
            ownerId: null
        });

        // リロード時間の適用
        if (def.reloadTime) {
            const reduction = (game.unlocks.reloadReductionLv || 0) * 1000;
            const duration = Math.max(500, def.reloadTime - reduction);
            game.itemCooldowns[id] = now + duration;
        }

        // 手動配置されたアイテムに初回ギフトフラグを付与
        item.isInitialGift = true;

        game.placedItems.push(item);

        if (def.soundfile) {
            game.sound.playSound(def.soundfile, def.pitch || 1.0);
        }

        if (def.ignoreReaction) return;

        // スピキのアイテムへの反応
        game.speakis.forEach(speaki => {
            if (!speaki.hasEmotion) return;

            const distToItem = Math.sqrt((speaki.pos.x - x) ** 2 + (speaki.pos.y - y) ** 2);

            let reactionRange = 500;
            let reactionChance = 1.0;

            if (id === 'MasterStatue') {
                // 教主像の場合：好感度に応じて確率と範囲を広げる
                // 好感度 0以下 = 反応しない / 50 = 全域(2000px)から100%反応
                if (speaki.status.friendship <= 0) return;
                reactionRange = 500 + (speaki.status.friendship * 30);
                reactionChance = speaki.status.friendship / 50;
            }

            if (distToItem > reactionRange) return;
            if (Math.random() > reactionChance) return;

            if (speaki.status.friendship <= -31) return;
            if (speaki.status.hunger <= 0 && !def.isFood) return;
            if (speaki.status.hunger >= 90 && def.isFood) return;

            const nonInterruptibleStates = [
                STATE.GIFT_SEARCHING,
                STATE.GIFT_LEAVING,
                STATE.GIFT_RETURNING,
                STATE.GIFT_WAIT_FOR_USER_REACTION,
                STATE.GIFT_REACTION,
                STATE.GIFT_TIMEOUT,
                STATE.USER_INTERACTING,
                STATE.GAME_APPROACHING,
                STATE.GAME_REACTION,
                STATE.ITEM_ACTION
            ];
            if (nonInterruptibleStates.includes(speaki.status.state)) return;

            const isGiftEventActive = [STATE.GIFT_LEAVING, STATE.GIFT_SEARCHING].includes(speaki.status.state);
            const isItemEventActive = [STATE.ITEM_APPROACHING, STATE.ITEM_ACTION].includes(speaki.status.state);

            if (isGiftEventActive || isItemEventActive) {
                speaki.status.stateStack.push(speaki.status.state);
            }

            speaki.approachItem(item, 50);
        });
    }

    /** アイテムの更新処理 (寿命等の管理) */
    update(dt) {
        this.game.placedItems = this.game.placedItems.filter(item => {
            // アイテム自身の更新ロジックを呼び出す
            const result = item.update(dt);

            if (result.action === 'delete') {
                return false; // フィルターで削除
            } else if (result.action === 'transform') {
                // 変換処理
                this._processItemTransform(item, result.transform);
                // ｽﾋﾟｷ化(isAdult)した場合はアイテムリストから消すが、ID変化のみ(nextId)の場合は残す
                return result.transform.isAdult ? false : true;
            }

            // キャラクターに運ばれているアイテムはキャラクターの位置に同期 (タイマー更新の後に行う)
            if (item.carriedBy) {
                const char = item.carriedBy;
                item.x = char.pos.x;
                item.y = char.pos.y - (char.status.size * 0.4);
            }

            return true; // 削除・変化以外は維持
        });
    }

    /** 
     * 指定されたIDのアイテムがフィールドに存在するか確認する
     * @param {string} id - アイテムID (例: 'ToyPumpkin')
     */
    hasItemOnField(id) {
        return this.game.placedItems.some(it => it.id === id);
    }

    _processItemTransform(item, transform) {
        const game = this.game;
        if (transform.isAdult) {
            const type = typeof transform.isAdult === 'string' ? transform.isAdult : 'speaki';
            console.log(`[ItemManager] Reincarnating item ${item.id} into Speaki type: ${type}`);
            game.characters.addSpeaki(item.x, item.y, type);
            // ここで splice はしない (filterの戻り値で制御される)
            return;
        }
        if (transform.nextId) {
            this._transformItemTo(item, transform.nextId);
        }
    }

    _transformItemTo(item, nextId) {
        const game = this.game;
        const nextDef = ITEMS[nextId];
        if (!nextDef) return;

        item.id = nextId;
        item.size = nextDef.size || item.size;
        item.placedTime = Date.now();

        if (nextDef.soundfile) game.sound.playSound(nextDef.soundfile, nextDef.pitch || 1.0);
        if (nextDef.text) {
            item.displayText = nextDef.text;
            item.textDisplayUntil = Date.now() + 15000;
        }
    }

    /** 指定座標にあるアイテムを削除 */
    removeItemAt(x, y) {
        const game = this.game;
        for (let i = game.placedItems.length - 1; i >= 0; i--) {
            if (game.placedItems[i].isHit(x, y)) {
                this.removeItem(game.placedItems[i]);
                return true;
            }
        }
        return false;
    }

    /** 指定アイテムを削除 */
    removeItem(item) {
        const game = this.game;
        const index = game.placedItems.indexOf(item);
        if (index !== -1) {
            game.placedItems.splice(index, 1);
            return true;
        }
        return false;
    }

    /** キャラクターからのアイテム使用リクエストを処理 */
    requestItemUsage(character, item) {
        const game = this.game;
        const def = ITEMS[item.id];

        // 1. アイテムがまだ存在するか
        const isStillThere = game && game.placedItems.includes(item);
        if (!isStillThere) {
            // 他のスピキに先に食べられた、または削除された
            character.status.emotion = 'sad';
            character.status.action = 'idle';
            character.timers.actionDuration = 3000;
            return false;
        }

        // 2. 使用の実行
        character.status.emotion = 'ITEM';
        character.status.action = item.id;

        // 好感度変化 (手動配置の初回のみ)
        if (item.isInitialGift && def && def.friendshipChange !== undefined) {
            character.status.friendship = Math.max(-50, Math.min(50, character.status.friendship + def.friendshipChange));
            item.isInitialGift = false;
        }

        // 強制感情の発動
        if (def && def.forcedEmotion) {
            character.status.forcedEmotion = def.forcedEmotion;
            character.timers.forcedEmotionUntil = Date.now() + 10000;
            character._updateBaseEmotion();
        }

        // 食べ物の場合の処理
        if (def && def.isFood) {
            if (def.nutrition) {
                character.status.hunger = Math.min(100, character.status.hunger + def.nutrition);
            }

            if (item.consume()) {
                const idx = game.placedItems.indexOf(item);
                if (idx !== -1) game.placedItems.splice(idx, 1);
            }

            if (!def.forcedEmotion) {
                character.status.emotion = 'happy';
            }
        }

        // 機嫌の変化 (moodGain または moodLoss が定義されていれば適用)
        if (def && (def.moodGain || def.moodLoss)) {
            const gain = (def.moodGain || 0) + (def.moodLoss || 0);
            character.changeMood(gain);
        }

        // アクション時間を設定
        character.timers.actionDuration = 3000; // デフォルト。必要ならアセット側で上書き
        return true;
    }

    /** アイテムの描画 */
    draw(ctx) {
        const game = this.game;
        game.placedItems.forEach(item => {
            item.draw(ctx, game.sound.images);
        });
    }
}

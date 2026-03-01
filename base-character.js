import { STATE, ASSETS, ITEMS } from './config.js';

/**
 * すべてのキャラクター（動体オブジェクト）の基底クラス
 */
export class BaseCharacter {
    constructor(id, parentElement, x, y, options = {}) {
        this.id = id;
        this.parentElement = parentElement;
        this.characterType = options.characterType || 'speaki'; // アセットのプレフィックス (speaki, mob 等)
        // const defaultNamePrefix = (this.characterType === 'baby') ? '赤ちゃんスピキ' : 'ｽﾋﾟｷ';
        // こどもでも大人でも「ｽﾋﾟｷ_番号」で統一
        const defaultNamePrefix = 'ｽﾋﾟｷ';
        this.name = options.name || `${id + 1}ﾋﾟｷめの${defaultNamePrefix}`;

        // 0. 機能フラグ
        this.canInteract = options.canInteract !== undefined ? options.canInteract : true;
        this.hasHunger = options.hasHunger !== undefined ? options.hasHunger : true;
        this.hasEmotion = options.hasEmotion !== undefined ? options.hasEmotion : true;

        // 1. 位置と物理状態
        this.pos = {
            x: x,
            y: y,
            targetX: x,
            targetY: y,
            angle: 0,
            speed: options.speed || (1.5 + Math.random() * 2.5),
            facingLeft: true,
            destinationSet: false
        };

        // 2. 基本ステータス
        this.status = {
            state: STATE.IDLE,
            stateStack: [],
            friendship: options.friendship || 0,
            hunger: options.hunger || 50,
            emotion: 'happy',
            forcedEmotion: null, // NEW: アイテム等による強制感情
            action: 'idle',
            socialTurnCount: 0, // 交流中の再生回数
            isMySocialTurn: false, // 自分の喋る番かどうか
            size: options.size || 160,
            voicePitch: options.voicePitch || 1.0,
            deathProgress: 0, // 死亡演出の進行度 (0.0 - 1.0)
        };
        this.isPendingDeletion = false; // 死亡演出完了後に削除するためのフラグ

        // 3. 表示とアニメーション
        this.visual = {
            dom: {},
            distortion: { skewX: 0, rotateX: 0, scale: 1.0 },
            targetDistortion: { skewX: 0, rotateX: 0, scale: 1.0 },
            motionType: 'none',
            motionTimer: 0,
            currentAssetKey: '',
            currentAsset: null,
            currentVoice: null
        };

        // 4. 操作状態
        this.interaction = {
            isInteracting: false,
            isPetting: false,
            isActuallyDragging: false,
            targetItem: null,
            lastMouseX: 0,
            lastMouseY: 0
        };

        this.timers = {
            stateStart: Date.now(),
            actionStart: 0,
            actionDuration: 0,
            interactStart: 0,
            waitDuration: 1000 + Math.random() * 4000,
            lastHeartTime: 0,
            forcedEmotionUntil: 0 // NEW: 強制感情の終了時刻
        };

        if (this.parentElement) {
            this.createDOM();
            this.syncDOM(); // 初期位置を即座に反映
        }
        this._onStateChanged(this.status.state);
    }

    /** DOM要素の生成 */
    createDOM() {
        this.visual.dom = {};

        const container = document.createElement('div');
        container.className = `${this.characterType}-sprite-container char-sprite-container`;

        const img = document.createElement('img');
        img.className = 'char-sprite';

        const emoji = document.createElement('div');
        emoji.className = 'char-emoji-overlay';

        // セリフ表示用テキスト
        const chatText = document.createElement('div');
        chatText.className = 'char-chat-text';

        // ギフト表示用（オーバーレイ画像）
        const gift = document.createElement('img');
        gift.className = 'char-gift-overlay hidden';
        gift.src = 'assets/images/gift.png';

        // 名前表示用ラベル
        const nameTag = document.createElement('div');
        nameTag.className = 'char-name-tag';

        container.appendChild(img);
        container.appendChild(gift);
        container.appendChild(emoji);
        container.appendChild(chatText);
        container.appendChild(nameTag);
        this.parentElement.appendChild(container);

        this.visual.dom.container = container;
        this.visual.dom.sprite = img;
        this.visual.dom.gift = gift;
        this.visual.dom.emoji = emoji;
        this.visual.dom.chatText = chatText;
        this.visual.dom.nameTag = nameTag;
    }

    /** フレームごとの更新処理 */
    update(dt) {
        // 1. 表示関連（状態に関わらず毎フレーム実行）
        this._updateDistortion(dt);
        this.syncDOM();

        // 2. インタラクト中はAI処理を停止
        if (this.interaction.isInteracting) return;

        // 3. 判断フェーズ：状況に応じてSTATEを切り替える
        this._updateStateTransition();

        // 4. 実行フェーズ：現在のSTATEに応じた行動をとる
        this._executeStateAction(dt);

        // 5. 社会的相互作用（中央管理に移行したため削除）

        // 空腹度の進行
        if (this.hasHunger) {
            const hungerDecayLv = (window.game && window.game.unlocks.hungerDecayLv) || 0;
            const secondsPerPoint = 2 + hungerDecayLv;
            this.status.hunger = Math.max(0, this.status.hunger - (dt / (secondsPerPoint * 1000)));
        }

        // 死亡判定 (DYING状態でないときのみ判定)
        if (this.status.state !== STATE.DYING) {
            const isStarving = this.hasHunger && this.status.hunger <= 0;
            const isDespaired = this.status.friendship <= -49.5; // 自動回復に食われないよう少し余裕を持たせる

            if (isStarving || isDespaired) {
                this.status.state = STATE.DYING;
                this.status.deathProgress = 0;
                this.timers.stateStart = Date.now();
                // 死亡時は他の音を止める
                if (this.visual.currentVoice) {
                    this.visual.currentVoice.pause();
                }
                console.log(`[BaseCharacter] ${this.name} is dying. (Starving: ${isStarving}, Despaired: ${isDespaired})`);
            }
        }

        // 好感度の自動回復 (負の値の場合のみ 0 に向かって回復)
        if (this.status.friendship < 0) {
            this.status.friendship = Math.min(0, this.status.friendship + dt / 10000); // 10秒で1回復
        }

        // 好感度の自然減少 (正の値の場合)
        if (this.status.friendship > 0) {
            const affectionDecayLv = (window.game && window.game.unlocks.affectionDecayLv) || 0;
            const secondsPerPoint = 2 + affectionDecayLv;
            // 指定された秒数で 1ポイント下がるよう計算 (dt / (秒数 * 1000))
            this.status.friendship = Math.max(0, this.status.friendship - (dt / (secondsPerPoint * 1000)));
        }

        // 表情の基本更新（オーバーライド可能）
        this._updateAppearanceByStatus();

        // しあわせスピキ状態の視覚効果用フラグ更新
        if (this.visual.dom.container) {
            const isRelaxed = window.game && window.game.gameMode === 'relaxed';
            const isHappySpeaki = !isRelaxed && this.canInteract && this.status.friendship >= 40 && this.status.hunger >= 80;
            if (isHappySpeaki) {
                this.visual.dom.container.classList.add('is-happy');
            } else {
                this.visual.dom.container.classList.remove('is-happy');
            }
        }
    }

    /** 状態遷移の判定 (サブクラスで拡張可能) */
    _updateStateTransition() {
        if (this.status.state === STATE.DYING) return; // 死亡中は遷移しない
        const now = Date.now();
        const dist = this.pos.destinationSet ? Math.sqrt(Math.pow(this.pos.targetX - this.pos.x, 2) + Math.pow(this.pos.targetY - this.pos.y, 2)) : 999;
        const arrived = !this.pos.destinationSet || dist <= 10;

        // 空腹時の挙動
        if (this.status.hunger <= 0) {
            // WALKING中 または 「食べ物でないアイテム」への接近中なら停止する
            const isApproachingNonFood = this.status.state === STATE.ITEM_APPROACHING &&
                this.interaction.targetItem &&
                !ITEMS[this.interaction.targetItem.id]?.isFood;

            if (this.status.state === STATE.WALKING || isApproachingNonFood) {
                this.status.state = STATE.IDLE;
                this._onStateChanged(this.status.state);
                return;
            }
        }

        switch (this.status.state) {
            case STATE.IDLE:
                const elapsed = now - this.timers.stateStart;

                // 指定時間が経過し、かつ音声が再生中でない場合のみ移動を開始する
                if (elapsed > this.timers.waitDuration && !this.isVoicePlaying()) {
                    // 空腹時に食べ物がない場合は、待機状態を継続する (歩きだしモーションの誤爆を防ぐ)
                    if (this.status.hunger <= 0 && !this._getNearbyFood()) {
                        this.timers.stateStart = now; // タイマーリセット
                        this._onStateChanged(this.status.state); // アセット再抽選
                        return;
                    }

                    this.status.state = STATE.WALKING;
                    this._onStateChanged(this.status.state);
                }
                break;

            case STATE.USER_INTERACTING:
                // インタラクト中フラグが降りている（マウスを離した等）場合
                if (!this.interaction.isInteracting) {
                    const elapsed = now - this.timers.stateStart;
                    // 音声が再生中、または開始直後（500ms未満）の場合は状態を維持する
                    // これにより、クリック直後の音声読み込み待ちによる瞬時終了を防ぐ
                    const isVoice = this.isVoicePlaying();
                    // NEW: 音声準備中(readyState < 1) も再生中とみなす + ラグ対策の最低保証時間(500ms)
                    const isPreparing = (this.visual.currentVoice && this.visual.currentVoice.readyState < 1);

                    if (elapsed < 500) {
                        // 強制待機期間：ラグでelapsedが飛んでも、ここを通るまでは遷移させない
                        // (ただし、更新自体が500ms以上止まっていた場合は次のフレームでここを抜ける可能性があるため、
                        //  isPreparing も合わせてチェックすることで安全性を高める)
                        return;
                    }

                    if (!isVoice && !isPreparing && elapsed > 2000) {
                        const v = this.visual.currentVoice;
                        console.log(`[Debug][${this.id}] Transitioning to IDLE. isVoice=${isVoice}, isPreparing=${isPreparing}, elapsed=${elapsed}`);
                        if (v) console.log(`[Debug][${this.id}] Voice state at transition: ended=${v.ended}, paused=${v.paused}, ready=${v.readyState}, time=${v.currentTime}`);

                        this.status.state = (this.status.stateStack.length > 0) ? this.status.stateStack.pop() : STATE.IDLE;
                        this._onStateChanged(this.status.state);
                    } else if (Math.random() < 0.01) {
                        // Debug log occasionally to avoid spam
                        console.log(`[Debug][${this.id}] Maintaining state. isVoice=${isVoice}, isPreparing=${isPreparing}, elapsed=${elapsed}`);
                    }
                }
                break;

            case STATE.WALKING:
                if (arrived) {
                    this.status.state = STATE.IDLE;
                    this._onStateChanged(this.status.state);
                    this._handleArrival();
                }
                break;

            case STATE.ITEM_APPROACHING:
                // 移動中にアイテムが消えたかチェック (割り込み等で消される場合がある)
                const itemIsStillThere = window.game && window.game.placedItems.includes(this.interaction.targetItem);

                if (!itemIsStillThere || arrived) {
                    this.status.state = STATE.ITEM_ACTION;
                    if (this.interaction.targetItem) {
                        this._performItemAction(this.interaction.targetItem);
                    }
                    this._onStateChanged(this.status.state);
                }
                break;

            case STATE.ITEM_ACTION:
                const duration = this.timers.actionDuration || 3000;
                if (now - this.timers.actionStart > duration) {
                    this.status.state = (this.status.stateStack.length > 0) ? this.status.stateStack.pop() : STATE.IDLE;
                    this._onStateChanged(this.status.state);
                }
                break;

            case STATE.GAME_APPROACHING:
            case STATE.GAME_REACTION:
                // 安全策: パートナーがいない、または削除されている場合はIDLEに戻す
                const socialPartner = this.socialConfig ? this.socialConfig.partner : null;
                const isPartnerValid = socialPartner && socialPartner.visual && socialPartner.visual.dom && socialPartner.visual.dom.container;
                const isPartnerInSocialState = socialPartner && [STATE.GAME_APPROACHING, STATE.GAME_REACTION].includes(socialPartner.status.state);

                if (!isPartnerValid || !isPartnerInSocialState) {
                    console.warn(`[BaseCharacter] Social partner lost or invalid for ${this.id}. Resetting to IDLE.`);
                    this.status.state = (this.status.stateStack.length > 0) ? this.status.stateStack.pop() : STATE.IDLE;
                    this.status.socialTurnCount = 0;
                    this.status.isMySocialTurn = false;
                    this._onStateChanged(this.status.state);
                    return;
                }

                if (this.status.state === STATE.GAME_APPROACHING) {
                    if (arrived) {
                        this.status.state = STATE.GAME_REACTION;
                        this.timers.actionStart = Date.now();
                        // game.jsで設定されたactionDurationを維持（なければデフォルト9秒）
                        if (!this.timers.actionDuration) this.timers.actionDuration = 9000;
                        this._onStateChanged(this.status.state);
                    }
                } else {
                    // STATE.GAME_REACTION の処理
                    // 自分の番でない場合はタイマーをリセットし続けて待機
                    if (!this.status.isMySocialTurn) {
                        this.timers.actionStart = now;
                        return;
                    }

                    const timeInAction = now - this.timers.actionStart;
                    const currentDuration = this.timers.actionDuration || 3000;

                    if (timeInAction > currentDuration) {
                        this.status.socialTurnCount++;
                        this.status.isMySocialTurn = false;

                        const partner = this.socialConfig.partner; // ここでは存在が保証されている
                        const bothFinished = (this.status.socialTurnCount >= 3 && (!partner || partner.status.socialTurnCount >= 3));

                        if (!bothFinished) {
                            if (partner) {
                                partner.status.isMySocialTurn = true;
                                partner.timers.actionStart = Date.now();
                                partner._applySelectedAsset(STATE.GAME_REACTION);
                            } else {
                                this.status.isMySocialTurn = true;
                                this.timers.actionStart = Date.now();
                                this._applySelectedAsset(STATE.GAME_REACTION);
                            }
                        } else {
                            // 終了処理
                            this.status.state = (this.status.stateStack.length > 0) ? this.status.stateStack.pop() : STATE.IDLE;
                            this.status.socialTurnCount = 0;
                            this.status.isMySocialTurn = false;
                            this._onStateChanged(this.status.state);

                            if (partner) {
                                partner.status.state = (partner.status.stateStack.length > 0) ? partner.status.stateStack.pop() : STATE.IDLE;
                                partner.status.socialTurnCount = 0;
                                partner.status.isMySocialTurn = false;
                                partner._onStateChanged(partner.status.state);
                            }
                        }
                    }
                }
                break;

            case STATE.ABILITY_ACTION:
                if (now - this.timers.actionStart > (this.timers.actionDuration || 3000)) {
                    this.status.state = (this.status.stateStack.length > 0) ? this.status.stateStack.pop() : STATE.IDLE;
                    this._onStateChanged(this.status.state);
                }
                break;
        }
    }

    /** ステータスに基づ外見の決定 */
    _updateAppearanceByStatus() {
        if (!this.hasEmotion) return;
        const isStarving = this.status.hunger <= 0;
        const isSpecialState = [STATE.ITEM_ACTION, STATE.GAME_REACTION].includes(this.status.state);

        if ((this.status.friendship <= -11 || isStarving) && !isSpecialState) {
            if (this.status.emotion !== 'sad') {
                this.status.emotion = 'sad';
                // 実際に感情が変わった時だけアセットを更新する (無限ループ防止)
                this._applySelectedAsset(this.status.state);
            }
        }
    }

    /** 現在の状態に応じた行動の実行 */
    _executeStateAction(dt) {
        if (this.status.state === STATE.DYING) {
            // 死亡演出: 3秒かけて真っ黒になる
            const duration = 3000;
            const elapsed = Date.now() - this.timers.stateStart;
            this.status.deathProgress = Math.min(1.0, elapsed / duration);

            if (this.status.deathProgress >= 1.0) {
                this.isPendingDeletion = true;
            }
            return;
        }

        const movementStates = [
            STATE.WALKING, STATE.ITEM_APPROACHING, STATE.GAME_APPROACHING,
            STATE.GIFT_LEAVING, STATE.GIFT_RETURNING
        ];
        const staticStates = [
            STATE.IDLE, STATE.USER_INTERACTING, STATE.ITEM_ACTION, STATE.GAME_REACTION,
            STATE.GIFT_SEARCHING, STATE.GIFT_WAIT_FOR_USER_REACTION, STATE.GIFT_TIMEOUT,
            STATE.ABILITY_ACTION
        ];

        if (movementStates.includes(this.status.state)) {
            if (!this.pos.destinationSet) {
                this._decideNextDestination();
            }
            this._processMovement();
        }
        else if (staticStates.includes(this.status.state)) {
            if (this.pos.destinationSet) {
                this._handleArrival();
            }
        }
    }

    /** DOMの同期表示 */
    syncDOM() {
        const dom = this.visual.dom;
        if (!dom.container) return;

        // ハイライトの反映
        if (typeof window !== 'undefined' && window.game && window.game.highlightedCharId === this.id) {
            dom.container.classList.add('highlighted');
        } else {
            dom.container.classList.remove('highlighted');
        }

        // 画像の切り替え
        if (this.visual.currentAsset && this.visual.currentAsset.imagefile && typeof window !== 'undefined' && window.game) {
            const game = window.game;
            const img = game.images[this.visual.currentAsset.imagefile];
            if (img && dom.sprite.src !== img.src) {
                dom.sprite.src = img.src;
            }
        }

        // 死亡演出の反映 (真っ黒にする)
        if (this.status.deathProgress > 0) {
            const p = this.status.deathProgress;
            // 進行度に合わせて明るさを下げ、グレースケールを上げる
            const brightness = 1.0 - p;
            const grayscale = p;
            dom.sprite.style.filter = `brightness(${brightness}) grayscale(${grayscale})`;
        } else {
            dom.sprite.style.filter = '';
        }

        // 位置とサイズ
        dom.container.style.width = `${this.status.size}px`;
        dom.container.style.height = `${this.status.size}px`;

        const bob = Math.sin(Date.now() / 200 + this.id * 100) * (this.status.size / 30);
        const screenX = this.pos.x - this.status.size / 2;
        const screenY = this.pos.y - this.status.size / 2 + bob;

        dom.container.style.transform = `translate(${screenX}px, ${screenY}px)`;

        const flip = this.pos.facingLeft ? 1 : -1;
        const transform = `perspective(800px) rotateX(${this.visual.distortion.rotateX}deg) skewX(${this.visual.distortion.skewX}deg) scale(${this.visual.distortion.scale}) scaleX(${flip})`;
        dom.sprite.style.transform = transform;

        // セリフ表示
        let displayText = (this.visual.currentAsset && this.visual.currentAsset.text) || '';
        dom.chatText.textContent = displayText;

        // 名前表示
        if (dom.nameTag) {
            dom.nameTag.textContent = this.name;
        }
    }

    /** 目的地到着時の処理 */
    _handleArrival() {
        this.timers.stateStart = Date.now();
        this.pos.destinationSet = false;
        this.pos.socialSpeed = null; // 同期移動が終わったらクリア
        this.timers.waitDuration = 2000 + Math.random() * 6000;
        if (this.status.state === STATE.WALKING) {
            this.status.action = 'idle';
        }
    }

    /** 目的地決定ロジック */
    _decideNextDestination() {
        const canvasWidth = this.parentElement ? this.parentElement.clientWidth : (typeof window !== 'undefined' ? window.innerWidth : 1200);
        const canvasHeight = this.parentElement ? this.parentElement.clientHeight : (typeof window !== 'undefined' ? window.innerHeight : 800);

        this.status.action = 'walking';
        this.pos.destinationSet = true;

        if (this.status.state === STATE.ITEM_APPROACHING && this.interaction.targetItem) {
            this.pos.targetX = this.interaction.targetItem.x;
            this.pos.targetY = this.interaction.targetItem.y;
            return;
        }

        this._decideWanderingDestination(canvasWidth, canvasHeight);
    }

    /** ランダム散歩の目的地決定 */
    _decideWanderingDestination(w, h) {
        const game = window.game;

        // 1. 食べ物の探索 (空腹時: 近くにあれば100%の確率で向かう)
        if (this.status.hunger <= 0) {
            const food = this._getNearbyFood();

            if (food) {
                this.approachItem(food);
                return;
            }

            // 空腹時に食べ物が見つからない場合はここで停止（散歩や家具への興味をスキップ）
            if (this.status.state !== STATE.IDLE) {
                this.status.state = STATE.IDLE;
                this.pos.destinationSet = false;
                this._onStateChanged(this.status.state);
            }
            return;
        }

        // 2. アイテムへの興味 (20% の確率で近くのアイテムに寄る)
        if (game && game.placedItems.length > 0 && Math.random() < 0.2) {
            const itemsInRange = game.placedItems.filter(it => {
                const dist = Math.sqrt((it.x - this.pos.x) ** 2 + (it.y - this.pos.y) ** 2);
                if (dist > 500) return false;

                // お腹いっぱいの時は食べ物を除外
                if (this.status.hunger >= 90) {
                    const def = ITEMS[it.id];
                    if (def && def.isFood) return false;
                }
                return true;
            });
            if (itemsInRange.length > 0) {
                this.approachItem(itemsInRange[Math.floor(Math.random() * itemsInRange.length)]);
                return;
            }
        }

        // 3. 通常のランダム位置
        this.interaction.targetItem = null;
        this.pos.targetX = Math.random() * (w - 100) + 50;
        this.pos.targetY = Math.random() * (h - 100) + 50;
        this.pos.destinationSet = true;
    }

    /** 近くにある食べ物を取得する */
    _getNearbyFood(range = 500) {
        const game = window.game;
        if (!game) return null;

        const foodItems = game.placedItems.filter(it => {
            const def = ITEMS[it.id];
            const dist = Math.sqrt((it.x - this.pos.x) ** 2 + (it.y - this.pos.y) ** 2);
            return def && def.isFood && dist <= range;
        });

        if (foodItems.length === 0) return null;
        return foodItems[Math.floor(Math.random() * foodItems.length)];
    }

    /** 移動処理 */
    _processMovement() {
        if (!this.pos.destinationSet) return;

        const dx = this.pos.targetX - this.pos.x;
        const dy = this.pos.targetY - this.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= 5) {
            this._handleArrival();
            return;
        }

        // 好感度が低い(怯えている)場合は常に高速移動。交流時は計算された同期速度を使用。
        let moveSpeed = (this.status.friendship <= -31) ? 8.0 : this.pos.speed;
        if (this.status.state === STATE.GAME_APPROACHING) {
            moveSpeed = this.pos.socialSpeed || (moveSpeed * 1.5);
        }

        const angle = Math.atan2(dy, dx);
        this.pos.x += Math.cos(angle) * moveSpeed;
        this.pos.y += Math.sin(angle) * moveSpeed;
        this.pos.angle = angle;

        if (Math.abs(dx) > 1) {
            this.pos.facingLeft = dx < 0;
        }
    }

    /** 状態変更時の初期化 */
    _onStateChanged(newState) {
        // _applySelectedAsset内で_stopCurrentVoiceが呼ばれるため、ここでは明示的に呼ばない
        this.timers.stateStart = Date.now();
        this.pos.destinationSet = false; // 状態が変わったら（または再設定されたら）必ずリセットして、次の実行フレームで目的地を再計算させる

        this._applyStateAppearance(newState);
        this.visual.motionTimer = 0;

        // 状態リセット
        if (newState === STATE.GAME_REACTION) {
            this.status.socialTurnCount = 0;
            // 自分の番の時だけアセットを適用する（後攻はここでは再生しない）
            if (this.status.isMySocialTurn) {
                this._applySelectedAsset(newState);
            } else {
                // 自分の番でない時はIDLEポーズで待機
                this.status.action = 'idle';
                this._applySelectedAsset(newState);
                this._stopCurrentVoice(); // 余分な音声が鳴らないように念のため
            }
        } else {
            this._applySelectedAsset(newState);
        }

        // 交流開始時、パートナーの方を向く
        if ([STATE.GAME_APPROACHING, STATE.GAME_REACTION].includes(newState) && this.socialConfig && this.socialConfig.partner) {
            const partner = this.socialConfig.partner;
            this.pos.facingLeft = (this.pos.x > partner.pos.x);
        }
    }

    /** 音声の停止 */
    _stopCurrentVoice() {
        if (this.visual.currentVoice) {
            this.visual.currentVoice.loop = false;
            this.visual.currentVoice.pause();
            this.visual.currentVoice = null;
        }
    }

    /** 状態に基づいた基本感情・アクション設定 */
    _applyStateAppearance(state) {
        const isSpecialEmotion = [STATE.ITEM_ACTION, STATE.GAME_REACTION].includes(state);
        let emotionChanged = false;
        if (!isSpecialEmotion) {
            emotionChanged = this._updateBaseEmotion();
        }

        switch (state) {
            case STATE.IDLE: this.status.action = 'idle'; break;
            case STATE.WALKING:
            case STATE.ITEM_APPROACHING: this.status.action = 'walking'; break;
            case STATE.USER_INTERACTING:
                if (this.status.action === 'walking') this.status.action = 'idle';
                break;
            case STATE.GAME_APPROACHING:
                this.status.action = 'walking';
                this.status.emotion = 'happy';
                break;
            case STATE.GAME_REACTION:
                this.status.action = 'idle';
                // 交流リアクション中は感情をランダムに（sad: 20%, happy: 60%, normal: 20%）
                const r1 = Math.random();
                if (r1 < 0.2) this.status.emotion = 'sad';
                else if (r1 < 0.8) this.status.emotion = 'happy';
                else this.status.emotion = 'normal';
                break;
        }
    }

    /** 好感度に基づく基本感情更新 */
    _updateBaseEmotion() {
        if (!this.hasEmotion) {
            this.status.emotion = 'normal';
            return false;
        }
        const oldEmotion = this.status.emotion;
        const now = Date.now();

        // 優先度 1: 空腹 (最優先)
        if (this.status.hunger <= 0) {
            this.status.emotion = 'sad';
            // 空腹時は強制感情タイマーを無効化する
            this.timers.forcedEmotionUntil = 0;
            this.status.forcedEmotion = null;
        }
        // 優先度 2: アイテム等による強制感情 (10秒間など)
        else if (this.status.forcedEmotion && now < this.timers.forcedEmotionUntil) {
            this.status.emotion = this.status.forcedEmotion;
        }
        // 優先度 3: 通常の好感度ロジック
        else {
            if (this.status.friendship <= -11) {
                this.status.emotion = 'sad';
            } else if (this.status.friendship <= 10) {
                this.status.emotion = 'normal';
            } else {
                this.status.emotion = 'happy';
            }
            // 強制感情が終了した場合はクリア
            if (this.status.forcedEmotion) {
                this.status.forcedEmotion = null;
            }
        }

        return this.status.emotion !== oldEmotion;
    }

    /** アセットの選択と適用 */
    _applySelectedAsset(state) {
        // 状態変更時は必ず以前の音声を停止する (Strict Stop)
        this._stopCurrentVoice();

        const type = [
            STATE.ITEM_ACTION,
            STATE.USER_INTERACTING,
            STATE.GAME_REACTION,
            STATE.GIFT_REACTION,
            STATE.GIFT_TIMEOUT,
            STATE.ABILITY_ACTION // NEW: 特殊能力もパフォーマンス扱いに
        ].includes(state) ? 'performance' : 'mood';

        let emotion = this.status.emotion;
        let action = this.status.action;

        // 【修正】アイテム実行中は、専用演出(ITEMカテゴリ)を優先的に探しに行くようにする。
        // ただし、actionが'idle'（横取りガッカリ状態）の場合は、設定されたsad感情を優先する。
        if (state === STATE.ITEM_ACTION && action !== 'idle') {
            emotion = 'ITEM';
        }

        // 交流リアクション中は常に（毎ターン）感情とアクションをランダムに決定する
        if (state === STATE.GAME_REACTION) {
            const r2 = Math.random();
            if (r2 < 0.2) emotion = this.status.emotion = 'sad';
            else if (r2 < 0.8) emotion = this.status.emotion = 'happy';
            else emotion = this.status.emotion = 'normal';
            action = this.status.action = 'idle';
        }

        // アセット取得の内部ヘルパー
        const getVariations = (charType, category, e, a) => {
            const charAssets = ASSETS[charType];
            if (charAssets && charAssets[category] && charAssets[category][e] && charAssets[category][e][a]) {
                return charAssets[category][e][a];
            }
            return null;
        };

        // 1. 指定されたキャラ・感情・アクションで検索
        let variations = getVariations(this.characterType, type, emotion, action);

        // 2. なければ 'normal' 感情で再試行
        if (!variations) {
            variations = getVariations(this.characterType, type, 'normal', action);
        }

        // 2.5 【NEW】 performanceで見つからない場合、moodカテゴリで再試行 (同じキャラタイプ内でのフォールバックを優先)
        if (!variations && type === 'performance') {
            variations = getVariations(this.characterType, 'mood', emotion, action) ||
                getVariations(this.characterType, 'mood', 'normal', action);
        }

        // 3. それでもなければ汎用アイテムリアクション
        if (!variations && state === STATE.ITEM_ACTION) {
            variations = getVariations(this.characterType, 'performance', 'ITEM', 'generic'); // performanceカテゴリ内
        }

        // 4. 【NEW】 キャラ指定で見つからない場合、基本の 'speaki' アセットで再試行 (継承)
        if (!variations && this.characterType !== 'speaki') {
            variations = getVariations('speaki', type, emotion, action) ||
                getVariations('speaki', type, 'normal', action);

            // speakiのperformanceにもなければ、speakiのmoodを探す
            if (!variations && type === 'performance') {
                variations = getVariations('speaki', 'mood', emotion, action) ||
                    getVariations('speaki', 'mood', 'normal', action);
            }

            if (!variations && state === STATE.ITEM_ACTION) {
                variations = getVariations('speaki', 'performance', 'ITEM', 'generic');
            }
        }



        if (!variations || variations.length === 0) {
            this.visual.currentAsset = null;
            return;
        }

        const assetData = variations[Math.floor(Math.random() * variations.length)];
        this.visual.currentAssetKey = `${this.characterType}_${type}_${emotion}_${action}`;
        this.visual.currentAsset = assetData;
        this.visual.motionType = assetData.movePattern || 'none';

        this.visual.motionType = assetData.movePattern || 'none';
        this._playAssetSound(assetData, type);
    }

    /** 音声再生 */
    /** 音声再生 (内部用) */
    _playAssetSound(data, type) {
        if (!data.soundfile || typeof window === 'undefined' || !window.game) return;

        // ブラウザの自動再生ポリシーによりブロックされている場合は再生しない (AbortError回避)
        if (window.game.audioCtx && window.game.audioCtx.state === 'suspended') {
            console.log('[BaseCharacter] Audio context suspended. Skipping initial sound.');
            return;
        }

        // _applySelectedAsset で既に停止されているため、ここでは重ねて停止しない

        // 個体ごとの声の高さ (voicePitch) を反映
        this.visual.currentVoice = window.game.playSound(data.soundfile, (data.pitch || 1.0) * this.status.voicePitch);
        if (this.visual.currentVoice) {
            this.visual.currentVoice.loop = false;
        }

        const voice = this.visual.currentVoice;
        // アセットのタイプに関わらず、音声の長さを取得してアクションの長さに反映する
        if (voice) {
            const updateDur = () => {
                if (isNaN(voice.duration) || voice.duration <= 0) return;
                // 交流リアクション中も、ボイスの長さに合わせてカウントを進めるために時間を反映させる
                // (少しだけ余韻を持たせるために 500ms 追加)
                this.timers.actionDuration = (voice.duration / (data.pitch || 1.0)) * 1000 + 500;
            };
            if (voice.readyState >= 1) updateDur();
            else voice.addEventListener('loadedmetadata', updateDur, { once: true });
        }
    }

    /** アイテムアクション実行 */
    _performItemAction(item) {
        const game = window.game;
        const def = ITEMS[item.id];

        // 1. 早いもの勝ち判定: まだアイテムが場にあるか
        const isStillThere = game && game.placedItems.includes(item);

        if (!isStillThere) {
            // アイテムが既になかった場合 (ガッカリ)
            this.status.emotion = 'sad';
            this.status.action = 'idle';
            this.timers.actionDuration = 3000;
        } else {
            // 2. アイテムが存在する場合の動作
            this.status.emotion = 'ITEM';
            this.status.action = item.id;

            // 【NEW】好感度変化の適用 (手動配置の初回のみ)
            if (item.isInitialGift && def && def.friendshipChange !== undefined) {
                this.status.friendship = Math.max(-100, Math.min(100, this.status.friendship + def.friendshipChange));
                item.isInitialGift = false; // 適用済みフラグ
            }

            // 【NEW】強制感情の発動 (10秒間)
            if (def && def.forcedEmotion) {
                this.status.forcedEmotion = def.forcedEmotion;
                this.timers.forcedEmotionUntil = Date.now() + 10000;
                this._updateBaseEmotion(); // 即座に反映
            }

            if (def && def.isFood) {
                // 食べ物なら食べる (ステータス回復)
                if (def.nutrition) {
                    this.status.hunger = Math.min(100, this.status.hunger + def.nutrition);
                }

                if (item.consume()) {
                    if (game) {
                        const idx = game.placedItems.indexOf(item);
                        if (idx !== -1) game.placedItems.splice(idx, 1);
                    }
                }
                // 食べられたので「うれしい」状態をセット (forcedEmotionがなければこちらが優先される)
                if (!def.forcedEmotion) {
                    this.status.emotion = 'happy';
                }
            } else {
                // 食べ物でないなら遊ぶだけ (消費しない)
            }
            this.timers.actionDuration = 0; // _applySelectedAsset 等で設定される
        }

        this.timers.actionStart = Date.now();
        this.timers.stateStart = this.timers.actionStart;
        this.interaction.targetItem = null;
    }

    /** アイテムへの接近 */
    approachItem(item, offset = 100) {
        if (!item) return;
        this.status.state = STATE.ITEM_APPROACHING;
        this.interaction.targetItem = item;

        const dx = this.pos.x - item.x;
        const dy = this.pos.y - item.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            this.pos.targetX = item.x + (dx / dist) * offset;
            this.pos.targetY = item.y + (dy / dist) * offset;
        } else {
            this.pos.targetX = item.x + offset;
            this.pos.targetY = item.y;
        }
        this.pos.destinationSet = true;
        this._onStateChanged(this.status.state);

        // 修正: _onStateChanged が destinationSet = false にリセットするため、
        // 意図した目的地を設定した直後に再度明示的に true にする
        this.pos.destinationSet = true;
    }

    /** 歪みアニメーション更新 */
    _updateDistortion(dt) {
        const isGameReaction = this.status.state === STATE.GAME_REACTION;

        // 交流中で自分の番でない場合は動きを「凍結」させる
        if (isGameReaction && !this.status.isMySocialTurn) {
            return; // motionTimerも進めないし、distortionも更新しない
        }

        this.visual.motionTimer += dt || 16;
        if (this.interaction.isPetting) {
            this.visual.distortion.skewX += (this.visual.targetDistortion.skewX - this.visual.distortion.skewX) * 0.15;
            this.visual.distortion.rotateX += (this.visual.targetDistortion.rotateX - this.visual.distortion.rotateX) * 0.15;
            this.visual.distortion.scale += (this.visual.targetDistortion.scale - this.visual.distortion.scale) * 0.15;
            return;
        }

        // 交流リアクション中はアセットの設定に基づいた動きを常に使用
        // (_applySelectedAsset で毎ターン抽選されるため、ここでは上書きしない)

        switch (this.visual.motionType) {
            case 'shake':
                this.visual.distortion.skewX = Math.sin(this.visual.motionTimer * 0.05) * 10;
                break;
            case 'stretch':
                const stretch = Math.sin(this.visual.motionTimer * 0.01) * 0.1;
                this.visual.distortion.scale = 1.0 + stretch;
                this.visual.distortion.rotateX = stretch * -50;
                break;
            case 'bounce':
                const bounce = Math.abs(Math.sin(this.visual.motionTimer * 0.01)) * 0.1;
                this.visual.distortion.scale = 1.0 + bounce;
                break;
            case 'swing':
                const swing = Math.sin(this.visual.motionTimer * 0.005);
                this.visual.distortion.skewX = swing * 15;
                this.visual.distortion.scale = 1.0 + Math.abs(swing) * 0.25;
                break;
            default:
                this.visual.distortion.skewX *= 0.85;
                this.visual.distortion.rotateX *= 0.85;
                this.visual.distortion.scale += (1.0 - this.visual.distortion.scale) * 0.15;
                break;
        }
    }

    /** 表情やアクションを強制設定 (主にGameクラスから) */
    setExpression(action, emotion) {
        if (action) this.status.action = action;
        if (emotion) this.status.emotion = emotion;
        this._applySelectedAsset(this.status.state);
    }

    /** 絵文字（吹き出し）を表示 */
    showEmoji(text, duration = 3000) {
        if (!this.visual.dom.emoji) return;
        this.visual.dom.emoji.textContent = text;
        this.visual.dom.emoji.classList.add('visible');

        if (this.timers.emojiTimer) clearTimeout(this.timers.emojiTimer);
        this.timers.emojiTimer = setTimeout(() => {
            this.visual.dom.emoji.classList.remove('visible');
            this.timers.emojiTimer = null;
        }, duration);
    }

    /** 現在ボイスが再生中かどうか */
    isVoicePlaying() {
        const v = this.visual.currentVoice;
        if (v) {
            // console.log(`[Debug] Voice check: ended=${v.ended}, paused=${v.paused}, readyState=${v.readyState}, currentTime=${v.currentTime}`);
        }
        return (v && !v.ended);
    }

    /**
     * 特殊能力を実行する
     * @param {string} abilityId 能力のID
     * @param {Object} options オプション (targetPos, itemType等)
     */
    executeAbility(abilityId, options = {}) {
        this.status.state = STATE.ABILITY_ACTION;
        this.status.action = abilityId;
        this.timers.actionStart = Date.now();
        this.timers.actionDuration = options.duration || 3000;

        // 実際の効果（アイテム配置など）をトリガーするフック
        this._onAbilityEffect(abilityId, options);

        this._onStateChanged(this.status.state);
    }

    /** 能力の効果を実際に発生させる (サブクラスで要実装) */
    _onAbilityEffect(abilityId, options) {
        // デフォルトでは何もしない
    }
}

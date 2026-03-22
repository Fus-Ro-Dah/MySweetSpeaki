import { STATE, ASSETS, ITEMS } from './config.js';

/**
 * すべてのキャラクター（動体オブジェクト）の基底クラス
 */
export class BaseCharacter {
    constructor(game, id, parentElement, x, y, options = {}) {
        this.game = game; // グローバルwindow.gameへの依存を排除
        this.id = id;
        this.parentElement = parentElement;
        this.characterType = options.characterType || 'speaki'; // アセットのプレフィックス (speaki, mob 等)

        // const defaultNamePrefix = (this.characterType === 'baby') ? '赤ちゃんスピキ' : 'ｽﾋﾟｷ';
        // こどもでも大人でも「ｽﾋﾟｷ_番号」で統一
        const defaultNamePrefix = 'ｽﾋﾟｷ';
        const num = options.speakiNumber !== undefined ? options.speakiNumber : id + 1;
        this.name = options.name || `${num}ﾋﾟｷめの${defaultNamePrefix}`;

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
            speed: options.speed !== undefined ? options.speed : (1.5 + Math.random() * 2.5),
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
            mood: options.mood || 0, // NEW: 機嫌 (-50 ~ 50)
            deathProgress: 0, // 死亡演出の進行度 (0.0 - 1.0)
        };
        this.isPendingDeletion = false; // 死亡演出完了後に削除するためのフラグ

        // 3. 表示とアニメーション
        this.visual = {
            dom: {},
            distortion: { skewX: 0, rotateX: 0, rotateY: 0, rotateZ: 0, scaleX: 1.0, scaleY: 1.0, translateX: 0, translateY: 0, hueRotate: 0, opacity: 1.0 },
            targetDistortion: { skewX: 0, rotateX: 0, rotateY: 0, rotateZ: 0, scaleX: 1.0, scaleY: 1.0, translateX: 0, translateY: 0, hueRotate: 0, opacity: 1.0 },
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
            isMoving: false, // 移動（ドラッグ移動）中フラグ
            targetItem: null,
            carryingItem: null, // NEW: 運搬中のアイテムを保持
            socialFootImage: null, // 交流中に足元に出す画像
            socialOnComplete: null, // 交流終了時のコールバック
            socialNextAction: null, // 交流中に次に取るべきアクションの予約
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
            forcedEmotionUntil: 0, // NEW: 強制感情の終了時刻
            lastMoveTime: Date.now(), // Stuck検知用: 最後に動いた時間
            lastX: x,
            lastY: y,
            lastSocialRequestAttempt: Date.now() + Math.random() * 5000 // 交流リクエスト用の制御 (初回分散)
        };
        this._domCache = {}; // PERFORMANCE: DOM更新最小化のためのキャッシュ

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

        // 交流用足元画像 (NEW)
        const footEffect = document.createElement('img');
        footEffect.className = 'char-foot-effect hidden';

        // 名前表示用ラベル
        const nameTag = document.createElement('div');
        nameTag.className = 'char-name-tag';

        // ステータスバー表示用 (NEW)
        const barsContainer = document.createElement('div');
        barsContainer.className = 'char-status-bars';

        const createBar = (type) => {
            const bar = document.createElement('div');
            bar.className = 'char-status-bar';
            const fill = document.createElement('div');
            fill.className = `char-status-fill ${type}`;
            bar.appendChild(fill);
            return { bar, fill };
        };

        const hungerBar = createBar('hunger');
        const friendshipBar = createBar('friendship');

        barsContainer.appendChild(friendshipBar.bar);
        barsContainer.appendChild(hungerBar.bar);

        container.appendChild(footEffect); // 背面側に配置するため先に追加
        container.appendChild(img);
        container.appendChild(gift);
        container.appendChild(emoji);
        container.appendChild(chatText);
        container.appendChild(nameTag);
        container.appendChild(barsContainer);
        this.parentElement.appendChild(container);

        // CSSアニメーション(bob)の初期化: 各キャラクターで位相をずらす
        // Math.random()でランダムな位相(-1.4s〜0s)を設定し、一斉に揺れるのを防ぐ
        const bobPhase = -(Math.random() * 1.4);
        const bobAmount = Math.round(this.status.size / 30);
        container.style.setProperty('--bob-phase', `${bobPhase.toFixed(2)}s`);
        container.style.setProperty('--bob-amount', `${bobAmount}px`);

        this.visual.dom.container = container;
        this.visual.dom.sprite = img;
        this.visual.dom.gift = gift;
        this.visual.dom.footEffect = footEffect;
        this.visual.dom.emoji = emoji;
        this.visual.dom.chatText = chatText;
        this.visual.dom.nameTag = nameTag;
        this.visual.dom.statusBars = {
            container: barsContainer,
            hunger: hungerBar.fill,
            friendship: friendshipBar.fill
        };
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
            const hungerDecayLv = (this.game && this.game.unlocks.hungerDecayLv) || 0;
            const secondsPerPoint = 2 + hungerDecayLv;
            this.status.hunger = Math.max(0, this.status.hunger - (dt / (secondsPerPoint * 1000)));
        }

        // 死亡判定 (DYING状態でないときのみ判定)
        if (this.status.state !== STATE.DYING) {
            const isStarving = this.hasHunger && this.status.hunger <= 0;
            const isDespaired = this.status.friendship <= -49.5; // 自動回復に食われないよう少し余裕を持たせる

            if (isStarving || isDespaired) {
                // IDLE か WALKING の時のみ死亡プロセスへ移行する
                // これにより、交流中やアクション中に突然消滅するのを防ぐ
                if (this.status.state === STATE.IDLE || this.status.state === STATE.WALKING) {
                    this.status.state = STATE.DYING;
                    this.status.deathProgress = 0;
                    this.timers.stateStart = Date.now();

                    // 死亡ログの出力 (MessageManager経由)
                    if (this.game && this.game.messages) {
                        this.game.messages.logDeath(this);

                        // 3秒後にハイライトを解除（観察ウィンドウのクリア）
                        setTimeout(() => {
                            if (this.game && this.game.highlightedCharId === this.id) {
                                this.game.ui.setHighlight(this.id); // トグルなので、同じIDを渡すと解除される
                            }
                        }, 3000);
                    }

                    // 死に際のサウンド再生 (プラン1: ピッチを個体設定に合わせる)
                    if (this.game) {
                        this.game.playSound('ヌンデ.mp3', this.status.voicePitch);
                    }

                    // 死亡時は他の音を止める
                    if (this.visual.currentVoice) {
                        this.visual.currentVoice.pause();
                    }
                    // console.log(`[BaseCharacter] ${this.name} is dying. (Starving: ${isStarving}, Despaired: ${isDespaired})`);
                }
            }
        }

        // 好感度の自動回復 (負の値の場合のみ 0 に向かって回復)
        if (this.status.friendship < 0) {
            this.status.friendship = Math.min(0, this.status.friendship + dt / 10000); // 10秒で1回復
        }

        // 好感度の自然減少 (正の値の場合)
        if (this.status.friendship > 0) {
            // 教主像 (MasterStatue) がフィールドにある場合は減少をスキップ
            const isHolyStatueActive = this.game && this.game.items && this.game.items.hasItemOnField('MasterStatue');

            if (!isHolyStatueActive) {
                const affectionDecayLv = (this.game && this.game.unlocks.affectionDecayLv) || 0;
                const secondsPerPoint = 2 + affectionDecayLv;
                // 指定された秒数で 1ポイント下がるよう計算 (dt / (秒数 * 1000))
                this.status.friendship = Math.max(0, this.status.friendship - (dt / (secondsPerPoint * 1000)));
            }
        }

        // 表情の基本更新（オーバーライド可能）
        this._updateAppearanceByStatus();

        // しあわせスピキ状態の視覚効果用フラグ更新（差分があった時のみDOM操作）
        if (this.visual.dom.container) {
            const isRelaxed = this.game && this.game.gameMode === 'relaxed';
            const isHappySpeaki = !isRelaxed && this.canInteract && this.status.friendship >= 40 && this.status.hunger >= 80;
            if (this._domCache.isHappy !== isHappySpeaki) {
                this.visual.dom.container.classList.toggle('is-happy', isHappySpeaki);
                this._domCache.isHappy = isHappySpeaki;
            }
        }

        // 5. 交流リクエストの判定 (自律行動)
        this._updateSocialRequest(dt);

        // 6. スタック検知 (ポーズ中でないときのみ)
        if (this.game && !this.game.isPausedForDebug) {
            this._checkStuck(dt);
        }
    }

    /** 機嫌の変動 (範囲制限付き) */
    changeMood(amount) {
        if (this.status.mood === undefined) this.status.mood = 0;
        this.status.mood = Math.max(-50, Math.min(50, this.status.mood + amount));
    }

    /** 好感度の変動 (範囲制限付き) */
    changeFriendship(amount) {
        if (this.status.friendship === undefined) this.status.friendship = 0;
        this.status.friendship = Math.max(-50, Math.min(50, this.status.friendship + amount));
    }


    /** スタック（進行不能）の検知 */
    /* スタック（進行不能）の検知と自動復旧 */
    _checkStuck(dt) {
        const now = Date.now();
        const movementStates = [STATE.WALKING, STATE.ITEM_APPROACHING, STATE.GAME_APPROACHING, STATE.GIFT_LEAVING, STATE.GIFT_RETURNING];
        const STUCK_THRESHOLD = 40000; // 40秒で自動復帰

        // 1. 移動スタックの検知
        if (movementStates.includes(this.status.state) && this.pos.destinationSet) {
            const distMoved = Math.sqrt(Math.pow(this.pos.x - this.timers.lastX, 2) + Math.pow(this.pos.y - this.timers.lastY, 2));
            if (distMoved > 0.5) {
                this.timers.lastMoveTime = now;
                this.timers.lastX = this.pos.x;
                this.timers.lastY = this.pos.y;
            } else {
                const stuckDuration = now - this.timers.lastMoveTime;
                if (stuckDuration > STUCK_THRESHOLD) {
                    this._attemptAutoRecovery(`移動スタック (${Math.round(stuckDuration / 1000)}秒間移動なし)`);
                }
            }
        } else {
            this.timers.lastMoveTime = now;
            this.timers.lastX = this.pos.x;
            this.timers.lastY = this.pos.y;
        }

        // 2. 状態タイムアウトの検知
        const stateDuration = now - this.timers.stateStart;
        if ([STATE.GAME_APPROACHING, STATE.GAME_REACTION, STATE.ITEM_APPROACHING].includes(this.status.state)) {
            if (stateDuration > STUCK_THRESHOLD) {
                this._attemptAutoRecovery(`状態スタック (${this.status.state} が ${Math.round(stateDuration / 1000)}秒継続)`);
            }
        }
    }

    /** 進行不能状態からの自動復旧 */
    _attemptAutoRecovery(reason) {
        // console.warn(`[AutoRecovery] ${this.name} (ID:${this.id}) を自動復旧します。理由: ${reason}`);

        // 交流相手がいる場合は相手も解放する
        if (this.socialConfig && this.socialConfig.partner) {
            const partner = this.socialConfig.partner;
            // console.log(`[AutoRecovery] 相方 ${partner.name} (ID:${partner.id}) も解放します。`);
            partner.status.state = (partner.status.stateStack.length > 0) ? partner.status.stateStack.pop() : STATE.IDLE;
            partner.status.socialTurnCount = 0;
            partner.status.isMySocialTurn = false;
            partner.socialConfig = null;
            partner.hideEmoji();
            partner._onStateChanged(partner.status.state);
        }

        // 自身の状態をリセット
        this.status.state = (this.status.stateStack.length > 0) ? this.status.stateStack.pop() : STATE.IDLE;
        this.status.stateStack = [];
        this.status.socialTurnCount = 0;
        this.status.isMySocialTurn = false;
        this.socialConfig = null;
        this.interaction.targetItem = null;
        this.pos.destinationSet = false;

        // ログ出力をトリガーにするため、タイマーをリセットして連続発火を防ぐ
        this.timers.stateStart = Date.now();
        this.timers.lastMoveTime = Date.now();

        this._onStateChanged(this.status.state);
    }

    /** 自律的な交流リクエストの更新 */
    _updateSocialRequest(dt) {
        if (!this.canInteract || this.status.hunger <= 0 || this.status.state === STATE.DYING) return;
        if (![STATE.IDLE, STATE.WALKING].includes(this.status.state)) return;
        if (this.interaction.isInteracting) return;

        const now = Date.now();
        // 10〜20秒に1回程度の頻度でリクエストを検討
        if (now - this.timers.lastSocialRequestAttempt < 10000) return;
        this.timers.lastSocialRequestAttempt = now;

        // 交流リクエストの検討
        // 場の人数に応じて確率を動的に計算 (基本 10% + 1匹につき 1%) ひとまず２０%で固定
        const chance = this._getSocialProbability(0.2);

        if (Math.random() < chance) {
            if (this.game && this.game.social) {
                // アクションを指定せずにリクエスト（自動選択）
                this.game.social.requestSocialAction(this, null);
            }
        }
    }

    /** 交流プロパティの計算 (ベース確率 + 1匹につき1%増加) */
    _getSocialProbability(baseChance) {
        if (!this.game || !this.game.speakis) return baseChance;
        const count = this.game.speakis.length;
        // 人数による調整 (1匹ごとに -1%)
        //const adjustment = count * -0.01;
        const adjustment = 0;
        return Math.max(0, baseChance + adjustment);
    }

    /** 状態遷移の判定 (サブクラスで拡張可能) */
    _updateStateTransition() {
        if (this.status.state === STATE.DYING) return; // 死亡中は遷移しない
        const now = Date.now();
        const dist = this.pos.destinationSet ? Math.sqrt(Math.pow(this.pos.targetX - this.pos.x, 2) + Math.pow(this.pos.targetY - this.pos.y, 2)) : 999;
        const arrived = this.pos.destinationSet && dist <= 10;

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
                        this.status.state = (this.status.stateStack.length > 0) ? this.status.stateStack.pop() : STATE.IDLE;
                        this._onStateChanged(this.status.state);
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
                const itemIsStillThere = this.game && this.game.placedItems.includes(this.interaction.targetItem);

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
                } else if (this.status.action === 'ToyPumpkin' || (this.status.action === 'MasterStatue' && this.status.friendship >= 25)) {
                    // かぼちゃ使用中は定期的にハートを出す
                    if (!this.timers.lastPettingHeart || now - this.timers.lastPettingHeart > 800) {
                        if (this.game && this.game.input) {
                            this.game.input._createPettingHeart(this);
                        }
                        this.timers.lastPettingHeart = now;
                    }
                }
                break;

            case STATE.GAME_APPROACHING:
            case STATE.GAME_REACTION:
                // 安全策: パートナーがいない、または削除されている場合はIDLEに戻す
                const socialPartner = this.socialConfig ? this.socialConfig.partner : null;
                const isPartnerValid = socialPartner && this.game && this.game.speakis.includes(socialPartner) && !socialPartner.isPendingDeletion;
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
                    // 【リカバリ】目的地フラグが折れているがパートナーが近くにいる場合、強引に到着させる
                    // （交流開始時の外部通知によるフラグ消失対策）
                    let forceArrived = false;
                    if (!this.pos.destinationSet && socialPartner) {
                        const d = Math.sqrt((this.pos.x - socialPartner.pos.x) ** 2 + (this.pos.y - socialPartner.pos.y) ** 2);
                        if (d < 200) {
                            // console.log(`[BaseCharacter] Recovering stuck for ${this.id}: partner nearby, forcing arrival.`);
                            forceArrived = true;
                        }
                    }

                    if (arrived || forceArrived) {
                        this.status.state = STATE.GAME_REACTION;
                        this.timers.actionStart = Date.now();
                        // 駆け寄った側が到着したタイミングで、テンプレートのオプションを適用する
                        if (this.socialConfig && this.socialConfig.options) {
                            const opts = this.socialConfig.options;
                            const partner = this.socialConfig.partner;
                            if (this.socialConfig.isInitiator && partner) {
                                // 交流情報を両方のキャラのinteractionにセット
                                partner.interaction.socialOptions = opts;
                                this.interaction.socialOptions = opts;

                                // パートナーも待機状態から実動作状態へ促す
                                partner._onStateChanged(STATE.GAME_REACTION);
                                partner.timers.actionStart = Date.now();
                            }
                        }
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
                        const opts = (this.socialConfig && this.socialConfig.options) || this.interaction.socialOptions;
                        const sequence = opts ? opts.sequence : null;
                        const maxTurns = sequence ? sequence.length : 3;
                        const bothFinished = (this.status.socialTurnCount >= maxTurns && (!partner || partner.status.socialTurnCount >= maxTurns));

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
                            const opts = (this.socialConfig && this.socialConfig.options) || this.interaction.socialOptions;
                            const socialOnComplete = opts ? opts.onComplete : null;
                            if (socialOnComplete) {
                                socialOnComplete(this);
                            }

                            this.status.state = (this.status.stateStack.length > 0) ? this.status.stateStack.pop() : STATE.IDLE;
                            this.status.socialTurnCount = 0;
                            this.status.isMySocialTurn = false;
                            this.interaction.socialOptions = null;
                            this._onStateChanged(this.status.state);

                            if (partner) {
                                if (socialOnComplete) {
                                    socialOnComplete(partner);
                                }
                                partner.status.state = (partner.status.stateStack.length > 0) ? partner.status.stateStack.pop() : STATE.IDLE;
                                partner.status.socialTurnCount = 0;
                                partner.status.isMySocialTurn = false;
                                partner.interaction.socialOptions = null;
                                partner.hideEmoji();
                                partner._onStateChanged(partner.status.state);
                            }
                            this.hideEmoji();
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

        const cache = this._domCache;

        // ハイライトの反映
        const isHighlighted = (this.game && this.game.highlightedCharId === this.id);
        if (cache.highlighted !== isHighlighted) {
            if (isHighlighted) dom.container.classList.add('highlighted');
            else dom.container.classList.remove('highlighted');
            cache.highlighted = isHighlighted;
        }

        // 画像の切り替え
        if (this.visual.currentAsset && this.visual.currentAsset.imagefile && this.game) {
            const assetKey = this.visual.currentAsset.imagefile;
            if (cache.imagefile !== assetKey) {
                const img = this.game.images[assetKey];
                if (img) {
                    dom.sprite.src = img.src;
                    cache.imagefile = assetKey;
                }
            }
        }

        // 死亡演出およびフィルターの適用
        if (this.status.deathProgress > 0) {
            const p = this.status.deathProgress;
            if (cache.deathProgress !== p) {
                const brightness = Math.max(0, 1.0 - p * 1.2);
                const grayscale = Math.min(1.0, p * 1.5);
                dom.container.style.filter = `brightness(${brightness}) grayscale(${grayscale})`;
                cache.deathProgress = p;
            }
        } else if (cache.deathProgress !== 0) {
            dom.container.style.filter = '';
            cache.deathProgress = 0;
        }

        // 足元画像
        if (dom.footEffect) {
            const footImg = (this.status.state === STATE.GAME_REACTION) ? this.interaction.socialFootImage : null;
            if (cache.footImg !== footImg) {
                if (footImg) {
                    dom.footEffect.src = footImg;
                    dom.footEffect.classList.remove('hidden');
                } else {
                    dom.footEffect.classList.add('hidden');
                }
                cache.footImg = footImg;
            }
        }

        // 位置とサイズ
        const distortion = this.visual.distortion;
        const flip = this.pos.facingLeft ? 1 : -1;

        // bob(上下揺れ)はCSSアニメーション側で処理するため、JS計算を廃止
        // frozen時はCSSクラスでアニメーションを停止
        const isFrozen = (this.visual.motionType === 'frozen');
        if (cache.isFrozen !== isFrozen) {
            dom.container.classList.toggle('frozen-motion', isFrozen);
            cache.isFrozen = isFrozen;
        }

        // translateはbob無しで設定（bobはCSSのmargin-topで処理）
        const containerTransform = `translate(${this.pos.x - this.status.size / 2 + distortion.translateX}px, ${this.pos.y - this.status.size / 2 + distortion.translateY}px)`;
        if (cache.containerTransform !== containerTransform) {
            dom.container.style.transform = containerTransform;
            cache.containerTransform = containerTransform;
        }

        if (cache.containerSize !== this.status.size) {
            dom.container.style.width = `${this.status.size}px`;
            dom.container.style.height = `${this.status.size}px`;
            cache.containerSize = this.status.size;
        }

        const spriteTransform = `perspective(800px) rotateX(${distortion.rotateX}deg) rotateY(${distortion.rotateY}deg) rotateZ(${distortion.rotateZ || 0}deg) skewX(${distortion.skewX}deg) scale(${distortion.scaleX * flip}, ${distortion.scaleY})`;
        if (cache.spriteTransform !== spriteTransform) {
            dom.sprite.style.transform = spriteTransform;
            cache.spriteTransform = spriteTransform;
        }

        const filter = distortion.filter || (distortion.hueRotate ? `hue-rotate(${distortion.hueRotate}deg)` : 'none');
        if (cache.filter !== filter) {
            dom.sprite.style.filter = filter;
            cache.filter = filter;
        }

        const opacity = distortion.opacity !== undefined ? distortion.opacity : 1.0;
        if (cache.opacity !== opacity) {
            dom.sprite.style.opacity = opacity;
            cache.opacity = opacity;
        }

        // セリフ表示
        const displayText = (this.visual.currentAsset && this.visual.currentAsset.text) || '';
        if (cache.chatText !== displayText) {
            dom.chatText.textContent = displayText;
            cache.chatText = displayText;
        }

        // 名前表示
        if (dom.nameTag && cache.nameTag !== this.name) {
            dom.nameTag.textContent = this.name;
            cache.nameTag = this.name;
        }

        // ステータスバーの更新 
        if (dom.statusBars) {
            const { hunger, friendship, mood } = this.status;

            // 1%以上の変化、または未初期化の場合のみ更新
            const shouldUpdateGauges = (
                cache.lastHunger === undefined || Math.abs(cache.lastHunger - hunger) >= 1.0 ||
                cache.lastFriendship === undefined || Math.abs(cache.lastFriendship - friendship) >= 1.0
            );

            if (shouldUpdateGauges) {
                dom.statusBars.hunger.style.width = `${Math.max(0, Math.min(100, hunger))}%`;
                const fPercent = friendship + 50;
                dom.statusBars.friendship.style.width = `${Math.max(0, Math.min(100, fPercent))}%`;

                cache.lastHunger = hunger;
                cache.lastFriendship = friendship;
            }

            const visible = (this.status.deathProgress <= 0 && this.canInteract);
            if (cache.gaugesVisible !== visible) {
                dom.statusBars.container.style.display = visible ? 'flex' : 'none';
                cache.gaugesVisible = visible;
            }
        }
    }

    /** 目的地到着時の処理 */
    _handleArrival() {
        this.timers.stateStart = Date.now();
        this.pos.destinationSet = false;
        this.pos.socialSpeed = null; // 同期移動が終わったらクリア
        if (this.status.state === STATE.WALKING) {
            this.status.action = 'idle';
        }

        // 運搬中のアイテムがある場合は目的地で置く
        if (this.interaction.carryingItem) {
            this.dropItem();
        }
    }

    /** 運搬中のアイテムを設置する */
    dropItem() {
        if (!this.interaction.carryingItem) return;
        const item = this.interaction.carryingItem;
        const def = ITEMS[item.id];

        // 設置時に別のアイテムに変化させるかチェック (AAAA -> BBBB の機能)
        if (def && def.transformOnDrop) {
            const nextId = def.transformOnDrop;
            const game = this.game;
            if (game && game.items) {
                console.log(`[BaseCharacter] Item transform on drop: ${item.id} -> ${nextId}`);
                const x = this.pos.x;
                const y = this.pos.y;
                game.items.removeItem(item);
                game.items.addItem(nextId, 'item', x, y);
            }
        } else {
            item.carriedBy = null;
        }

        this.interaction.carryingItem = null;

        // 設置時のアクション
        this.status.action = 'idle';
        this.timers.actionStart = Date.now();
        this.timers.actionDuration = 1000;
        this._onStateChanged(this.status.state);
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
            this.pos.destinationSet = true;
            return;
        }

        if (this.status.state === STATE.GAME_APPROACHING) {
            // GAME状態の移動はGameオブジェクト（外部）が目的地をセットする責任を持つ。
            // 目的地がセットされていない場合は、勝手に散歩を始めないようにここで停止する。
            return;
        }

        this._decideWanderingDestination(canvasWidth, canvasHeight);
    }

    /** ランダム散歩の目的地決定 */
    _decideWanderingDestination(w, h) {
        const game = this.game;

        // 1. 食べ物の探索 (空腹時: 近くにあれば100%の確率で向かう)
        if (this.status.hunger < 30) {
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

        // 2. 教主像への引力 (好感度が高いスピキ・子供が対象)
        // 好感度20以上の個体が、一定確率(好感度に比例)で教主像の近くを目的地にする
        if ((this.characterType === 'speaki' || this.characterType === 'child') &&
            this.status.friendship >= 20) {

            const statue = game.placedItems.find(it => it.id === 'MasterStatue');
            if (statue) {
                // 機率は好感度 20(4%) 〜 50(10%) 程度
                const pullChance = this.status.friendship / 500;
                if (Math.random() < pullChance) {
                    // 像の周りにランダムにバラけるようにオフセットを付けて接近
                    const randomOffset = 50 + Math.random() * 100;
                    this.approachItem(statue, randomOffset);
                    return;
                }
            }
        }

        // 3. アイテムへの興味 (20% の確率で近くのアイテムに寄る)
        if (game && game.placedItems.length > 0 && Math.random() < 0.2) {
            const itemsInRange = game.placedItems.filter(it => {
                const dist = Math.sqrt((it.x - this.pos.x) ** 2 + (it.y - this.pos.y) ** 2);
                if (dist > 500) return false;

                // お腹いっぱいの時は食べ物を除外
                if (this.status.hunger >= 90) {
                    const def = ITEMS[it.id];
                    if (def && def.isFood) return false;
                }

                // 好感度が低い時は教主像を除外
                if (this.status.friendship < 20 && it.id === 'MasterStatue') {
                    return false;
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
        const game = this.game;
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
        if (!this.pos.destinationSet || this.interaction.isMoving) return;

        const dx = this.pos.targetX - this.pos.x;
        const dy = this.pos.targetY - this.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= 5) {
            // 移動を停止するのみ。到着後の状態遷移（_handleArrival含む）は _updateStateTransition が行う。
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

    _onStateChanged(newState) {
        // destroy()済みキャラクターは無視する
        if (!this.visual.dom) return;

        // メッセージログの生成 (選択されている場合のみ)
        if (this.game.messages && this.game.highlightedCharId === this.id) {
            this.game.messages.logStateChange(this);
        }

        this.timers.stateStart = Date.now();
        this.pos.destinationSet = false;

        this._applyStateAppearance(newState);
        this.visual.motionTimer = 0;

        if (newState === STATE.IDLE || newState === STATE.WALKING) {
            this.hideEmoji();
        }

        // 状態リセット
        if (newState === STATE.GAME_REACTION) {
            this.status.socialTurnCount = 0;
            // シーケンスから最初のアクションを設定
            const opts = (this.socialConfig && this.socialConfig.options) || this.interaction.socialOptions;
            if (opts && opts.sequence && opts.sequence[0]) {
                const turn = opts.sequence[0];
                const actionKey = (this.socialConfig && this.socialConfig.isOrigin) ? turn.origin : turn.target;
                if (actionKey === 'random') {
                    const moods = ['happy', 'sad', 'normal'];
                    this.status.emotion = moods[Math.floor(Math.random() * moods.length)];
                    this.status.action = 'idle';
                } else if (['happy', 'sad', 'normal'].includes(actionKey)) {
                    this.status.emotion = actionKey;
                    this.status.action = 'idle';
                } else {
                    this.status.action = actionKey || 'idle';
                }
            }

            if (this.status.isMySocialTurn) {
                this._applySelectedAsset(newState);
            } else {
                this.status.action = 'idle';
                this._applySelectedAsset(newState);
                this._stopCurrentVoice();
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

    /** 音声の停止とリソース解放 */
    _stopCurrentVoice() {
        if (this.visual.currentVoice) {
            try {
                this.visual.currentVoice.pause();
            } catch (e) {
                console.warn("[BaseCharacter] Error stopping voice:", e);
            }
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

        // 優先度 1: 深刻な不調 (最優先で sad)
        // 好感度 -20以下、空腹度 30以下、機嫌 -20以下のいずれか
        if (this.status.hunger <= 30 || this.status.friendship <= -20 || this.status.mood <= -20) {
            this.status.emotion = 'sad';
            // 強制感情タイマーを無効化（不調を優先）
            this.timers.forcedEmotionUntil = 0;
            this.status.forcedEmotion = null;
        }
        // 優先度 2: アイテム等による強制感情 (10秒間など)
        else if (this.status.forcedEmotion && now < this.timers.forcedEmotionUntil) {
            this.status.emotion = this.status.forcedEmotion;
        }
        // 優先度 3: 通常の好調/普通判定
        else {
            // 好感度 20以上、空腹度 70以上、機嫌 20以上のいずれか
            if (this.status.hunger >= 70 || this.status.friendship >= 20 || this.status.mood >= 20) {
                this.status.emotion = 'happy';
            } else {
                this.status.emotion = 'normal';
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

        let type = [
            STATE.ITEM_ACTION,
            STATE.USER_INTERACTING,
            STATE.GAME_REACTION,
            STATE.GIFT_REACTION,
            STATE.GIFT_TIMEOUT,
            STATE.ABILITY_ACTION
        ].includes(state) ? 'performance' : 'mood';

        let emotion = this.status.emotion;
        let action = this.status.action;

        // 【修正】アイテム実行中は、専用演出(ITEMカテゴリ)を優先的に探しに行くようにする。
        // ただし、actionが'idle'（横取りガッカリ状態）の場合は、設定されたsad感情を優先する。
        if (state === STATE.ITEM_ACTION && action !== 'idle') {
            emotion = 'ITEM';
        }

        // 交流リアクション中はシーケンスに基づいて感情とアクションを決定する
        if (state === STATE.GAME_REACTION) {
            const opts = (this.socialConfig && this.socialConfig.options) || this.interaction.socialOptions;
            if (opts && opts.sequence) {
                const turn = opts.sequence[this.status.socialTurnCount];
                if (turn) {
                    const actionKey = (this.socialConfig && this.socialConfig.isOrigin) ? turn.origin : turn.target;

                    if (actionKey === 'random') {
                        const moods = ['happy', 'sad', 'normal'];
                        emotion = this.status.emotion = moods[Math.floor(Math.random() * moods.length)];
                        action = this.status.action = 'idle';
                        type = 'mood';
                    } else if (['happy', 'sad', 'normal'].includes(actionKey)) {
                        emotion = this.status.emotion = actionKey;
                        action = this.status.action = 'idle';
                        type = 'mood';
                    } else if (actionKey && actionKey.includes('.')) {
                        // ドット記法の処理: [タイプ].[感情].[アクション]
                        const parts = actionKey.split('.');
                        if (parts.length === 3) {
                            type = parts[0];
                            emotion = this.status.emotion = parts[1];
                            action = this.status.action = parts[2];
                        } else if (parts.length === 2) {
                            // [タイプ].[アクション] または [感情].[アクション] 等の柔軟な解釈
                            // ここでは [感情].[アクション] とみなし、タイプは performance 固定にする
                            type = 'performance';
                            emotion = this.status.emotion = parts[0];
                            action = this.status.action = parts[1];
                        }
                    } else {
                        action = this.status.action = actionKey || 'idle';
                        type = 'performance';
                    }
                }
            } else {
                const r2 = Math.random();
                if (r2 < 0.2) emotion = this.status.emotion = 'sad';
                else if (r2 < 0.8) emotion = this.status.emotion = 'happy';
                else emotion = this.status.emotion = 'normal';
                action = this.status.action = 'idle';
                type = 'mood';
            }
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
        if (!data.soundfile || !this.game) return;

        // ブラウザの自動再生ポリシーによりブロックされている場合は再生しない (AbortError回避)
        if (this.game.audioCtx && this.game.audioCtx.state === 'suspended') {
            console.log('[BaseCharacter] Audio context suspended. Skipping initial sound.');
            return;
        }

        // _applySelectedAsset で既に停止されているため、ここでは重ねて停止しない

        // 個体ごとの声の高さ (voicePitch) を反映
        this.visual.currentVoice = this.game.playSound(data.soundfile, (data.pitch || 1.0) * this.status.voicePitch);
        if (this.visual.currentVoice) {
            const voice = this.visual.currentVoice;
            // Web Audio APIの戻り値オブジェクトにonendedを設定する
            voice.onended = () => {
                if (this.visual.currentVoice === voice) {
                    this.visual.currentVoice = null;
                }
            };
        }

        const voice = this.visual.currentVoice;
        // アセットのタイプに関わらず、音声の長さを取得してアクションの長さに反映する
        // Web Audio APIのバッファからは即座にdurationが取得可能
        if (voice && !isNaN(voice.duration) && voice.duration > 0) {
            // 交流リアクション中も、ボイスの長さに合わせてカウントを進めるために時間を反映させる
            // (少しだけ余韻を持たせるために 500ms 追加)
            this.timers.actionDuration = (voice.duration / (data.pitch || 1.0)) * 1000 + 500;
        }
    }

    /** アイテムアクション実行 */
    _performItemAction(item) {
        // 特定のアイテムは運搬する （今後使用）
        if (item.id === 'XXXXX') {
            this.interaction.carryingItem = item;
            item.carriedBy = this;

            // 運搬用の目的地（反対側あたり）を決定する
            const canvasWidth = this.parentElement ? this.parentElement.clientWidth : 1200;
            const canvasHeight = this.parentElement ? this.parentElement.clientHeight : 800;
            this.pos.targetX = Math.random() * (canvasWidth - 100) + 50;
            this.pos.targetY = Math.random() * (canvasHeight - 100) + 50;
            this.pos.destinationSet = true;
            this.status.state = STATE.WALKING;
            this.status.action = 'walking';

            this.status.emotion = 'happy'; // 運べて嬉しい心情
            this._onStateChanged(this.status.state);
        } else {
            if (this.game && this.game.items) {
                this.game.items.requestItemUsage(this, item);
            }
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

        // アイテム反応ログ (選択されている場合のみ)
        if (this.game.messages && this.game.highlightedCharId === this.id) {
            this.game.messages.logItemReaction(this, item);
        }

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
            this.visual.distortion.scaleX += (this.visual.targetDistortion.scaleX - this.visual.distortion.scaleX) * 0.15;
            this.visual.distortion.scaleY += (this.visual.targetDistortion.scaleY - this.visual.distortion.scaleY) * 0.15;
            return;
        }

        // 交流リアクション中はアセットの設定に基づいた動きを常に使用
        // (_applySelectedAsset で毎ターン抽選されるため、ここでは上書きしない)

        switch (this.visual.motionType) {
            case 'twitch':
                // 収縮幅を不規則にする (複数の周波数を組み合わせて干渉させる)
                const twBase = Math.sin(this.visual.motionTimer * 0.05); // 高速な基本振動
                const twMod = Math.sin(this.visual.motionTimer * 0.017); // 振幅をゆらす低速波
                const twNoise = Math.sin(this.visual.motionTimer * 0.037) * 0.3; // 不規則なノイズ成分

                const twitch = twBase * (0.05 + Math.abs(twMod) * 0.15) + twNoise * 0.05;
                this.visual.distortion.scaleX = 1.0 + twitch;
                this.visual.distortion.scaleY = 1.0 + twitch; // XとYを同方向に変化させる（拡大縮小）
                break;
            case 'pulse':
                // 1秒サイクル: 0.25sでつぶれ、0.25sで戻り、0.5sは静止
                const pulseDuration = 1000;
                const pTime = (this.visual.motionTimer % pulseDuration) / pulseDuration;
                let pAmt = 0;

                if (pTime < 0.25) {
                    // 0.0 - 0.25: つぶれる (0.2まで)
                    const p = pTime / 0.25;
                    pAmt = p * 0.2;
                } else if (pTime < 0.5) {
                    // 0.25 - 0.5: 戻る (0.2から0まで)
                    const p = (pTime - 0.25) / 0.25;
                    pAmt = (1.0 - p) * 0.2;
                } else {
                    // 0.5 - 1.0: 静止
                    pAmt = 0;
                }

                this.visual.distortion.scaleX = 1.0 + pAmt;
                this.visual.distortion.scaleY = 1.0 - pAmt;
                break;
            case 'vibrate':
                // 微振動 (不規則な平行移動)
                this.visual.distortion.translateX = (Math.random() - 0.5) * 6;
                this.visual.distortion.translateY = (Math.random() - 0.5) * 6;
                this.visual.distortion.scaleX = 1.0 + (Math.random() - 0.5) * 0.05;
                this.visual.distortion.scaleY = 1.0 + (Math.random() - 0.5) * 0.05;
                break;
            case 'lean':
                // 勢いよく斜めに伸びて静止
                const leanDuration = 100;
                const leanProgress = Math.min(1.0, this.visual.motionTimer / leanDuration);
                // イージング (easeOutQuart)
                const leanEased = 1 - Math.pow(1 - leanProgress, 4);

                const leanMaxSkew = 25;
                const leanMaxScaleY = 1.3;

                // キャラクターの向いている方向とは反対方向に斜めに伸びる
                this.visual.distortion.skewX = (this.pos.facingLeft ? -1 : 1) * leanEased * leanMaxSkew;
                this.visual.distortion.scaleY = 1.0 + leanEased * (leanMaxScaleY - 1.0);
                break;
            case 'frantic':
                // 錯乱している感じ (高速ランダムと回転・スケールの激しい変化)
                this.visual.distortion.translateX = (Math.random() - 0.5) * 40;
                this.visual.distortion.translateY = (Math.random() - 0.5) * 40;
                this.visual.distortion.rotateZ = (Math.random() - 0.5) * 30;
                this.visual.distortion.scaleX = 0.5 + Math.random() * 1.0;
                this.visual.distortion.scaleY = 0.5 + Math.random() * 1.0;
                break;
            case 'violent':
                // さらに激しい錯乱 (極端な伸縮と大きな回転、色の変化)
                this.visual.distortion.translateX = (Math.random() - 0.5) * 80;
                this.visual.distortion.translateY = (Math.random() - 0.5) * 80;
                this.visual.distortion.rotateZ = (Math.random() - 0.5) * 120;
                this.visual.distortion.scaleX = 0.2 + Math.random() * 2.0;
                this.visual.distortion.scaleY = 0.2 + Math.random() * 2.0;
                this.visual.distortion.filter = `hue-rotate(${Math.random() * 360}deg) contrast(2)`;
                break;
            case 'frozen':
                // 凍ったモーション (動かず、水色になる)
                // 動きをリセット
                this.visual.distortion.translateX = 0;
                this.visual.distortion.translateY = 0;
                this.visual.distortion.rotateZ = 0;
                this.visual.distortion.scaleX = 1.0;
                this.visual.distortion.scaleY = 1.0;
                this.visual.distortion.skewX = 0;
                // 色を水色に (hue-rotateで180度〜200度付近が青・水色系)
                // CSSのfilter文字列を直接操作する手段がないため、filterプロパティに適用するための変数を設定
                this.visual.distortion.filter = 'hue-rotate(160deg) brightness(1.2) saturate(0.8)';
                break;
            case 'shake':
                this.visual.distortion.skewX = Math.sin(this.visual.motionTimer * 0.05) * 10;
                break;
            case 'stretch':
                const stretch = Math.sin(this.visual.motionTimer * 0.01) * 0.1;
                this.visual.distortion.scaleX = 1.0 - stretch * 0.5;
                this.visual.distortion.scaleY = 1.0 + stretch;
                this.visual.distortion.rotateX = stretch * -50;
                break;
            case 'bounce':
                const bounce = Math.abs(Math.sin(this.visual.motionTimer * 0.01)) * 0.1;
                this.visual.distortion.scaleX = 1.0 + bounce * 0.5;
                this.visual.distortion.scaleY = 1.0 + bounce;
                break;
            case 'swing':
                const swing = Math.sin(this.visual.motionTimer * 0.005);
                this.visual.distortion.skewX = swing * 15;
                this.visual.distortion.scaleX = 1.0 + Math.abs(swing) * 0.1;
                this.visual.distortion.scaleY = 1.0 + Math.abs(swing) * 0.25;
                break;
            case 'fast_swing':
                const fswing = Math.sin(this.visual.motionTimer * 0.01);
                this.visual.distortion.skewX = fswing * 15;
                this.visual.distortion.scaleX = 1.0 + Math.abs(fswing) * 0.1;
                this.visual.distortion.scaleY = 1.0 + Math.abs(fswing) * 0.25;
                break;
            case 'dance':
                const dncCycle = 2000; // 2秒周期

                // 1サイクル（2秒）で終了してswingに移行
                if (this.visual.motionTimer >= dncCycle) {
                    this.visual.motionType = 'swing';
                    return;
                }

                const dncT = (this.visual.motionTimer % dncCycle) / dncCycle;

                // 1. 大きく左右に動く (translateX)
                this.visual.distortion.translateX = Math.sin(dncT * Math.PI * 2) * 100;

                // 2. 左右に回転（スピン）
                // 前半で2回転(720deg)、後半で逆回転して0に戻る
                this.visual.distortion.rotateY = (1.0 - Math.abs(dncT - 0.5) * 2) * 720;

                // 3. スケールと上下移動は固定（上下移動なし）
                this.visual.distortion.translateY = 0;
                this.visual.distortion.scaleX = 1.0;
                this.visual.distortion.scaleY = 1.0;

                // 4. 虹色に輝く（0.5秒で1周する猛スピード）
                this.visual.distortion.hueRotate = (this.visual.motionTimer % 500) / 500 * 360;
                break;
            case 'hop':
                const dCycle = 600; // 0.6秒周期 (速め)

                // 4回（2.4秒）跳んだらとまる swingに移行
                if (this.visual.motionTimer >= dCycle * 4) {
                    this.visual.motionType = 'swing';
                    return;
                }

                const dt = (this.visual.motionTimer % dCycle) / dCycle;

                if (dt < 0.15) {
                    // 1. 溜め
                    const p = dt / 0.15;
                    const squash = Math.sin(p * Math.PI) * 0.2;
                    this.visual.distortion.scaleX = 1.0 + squash * 0.3;
                    this.visual.distortion.scaleY = 1.0 - squash;
                    this.visual.distortion.translateY = 0;
                } else if (dt < 0.65) {
                    // 2. 小さな跳躍
                    const p = (dt - 0.15) / 0.5;
                    const height = Math.sin(p * Math.PI);
                    this.visual.distortion.translateY = -height * 30; // 高さは30px程度

                    const stretch = height * 0.15;
                    this.visual.distortion.scaleX = 1.0 - stretch * 0.2;
                    this.visual.distortion.scaleY = 1.0 + stretch;
                } else if (dt < 0.85) {
                    // 3. 着地
                    const p = (dt - 0.65) / 0.2;
                    const impact = Math.sin(p * Math.PI) * 0.25;
                    this.visual.distortion.scaleX = 1.0 + impact * 0.4;
                    this.visual.distortion.scaleY = 1.0 - impact;
                    this.visual.distortion.translateY = 0;
                } else {
                    // 4. 静止
                    this.visual.distortion.scaleX = 1.0;
                    this.visual.distortion.scaleY = 1.0;
                    this.visual.distortion.translateY = 0;
                }
                // 回転や横移動はリセット（既存の残骸を消すため）
                this.visual.distortion.rotateY = 0;
                this.visual.distortion.translateX = 0;
                break;
            case 'jump':
                const jumpCycle = 1200; // 1.2秒周期にして余裕を持たせる

                // 2回（2.4秒）跳んだら自動的にswingに移行する
                if (this.visual.motionTimer >= jumpCycle * 2) {
                    this.visual.motionType = 'swing';
                    return;
                }

                const jt = (this.visual.motionTimer % jumpCycle) / jumpCycle;

                if (jt < 0.15) {
                    // 1. 溜め: 一気に踏み込む
                    const p = jt / 0.15;
                    const squash = Math.sin(p * Math.PI) * 0.35;
                    this.visual.distortion.scaleX = 1.0 + squash * 0.5;
                    this.visual.distortion.scaleY = 1.0 - squash;
                    this.visual.distortion.translateY = 0;
                } else if (jt < 0.65) {
                    // 2. 跳躍: 空中フェーズ (0.5秒間)
                    const p = (jt - 0.15) / 0.5;
                    const height = Math.sin(p * Math.PI);
                    this.visual.distortion.translateY = -height * 140; // 少し高く

                    const stretch = height > 0.8 ? (1.0 - height) * 0.4 : height * 0.3;
                    this.visual.distortion.scaleX = 1.0 - stretch * 0.2;
                    this.visual.distortion.scaleY = 1.0 + stretch;
                } else if (jt < 0.85) {
                    // 3. 着地: ぐにゃっと一回だけ縮む
                    const p = (jt - 0.65) / 0.2;
                    const impact = Math.sin(p * Math.PI) * 0.45;
                    this.visual.distortion.scaleX = 1.0 + impact * 0.6;
                    this.visual.distortion.scaleY = 1.0 - impact;
                    this.visual.distortion.translateY = 0;
                } else {
                    // 4. 静止: 次のジャンプへの間を作る (ここで2回かがむのを防ぐ)
                    this.visual.distortion.scaleX = 1.0;
                    this.visual.distortion.scaleY = 1.0;
                    this.visual.distortion.translateY = 0;
                }
                break;
            case 'ghost':
                // ユーレイ (透明度変化とゆらゆら)
                this.visual.distortion.opacity = 0.4 + Math.sin(this.visual.motionTimer * 0.003) * 0.2;
                this.visual.distortion.translateX = Math.sin(this.visual.motionTimer * 0.002) * 20;
                this.visual.distortion.translateY = Math.sin(this.visual.motionTimer * 0.001) * 10 - 20; // 少し浮く
                this.visual.distortion.skewX = Math.sin(this.visual.motionTimer * 0.002) * 10;
                break;
            case 'glitch':
                // グリッチ (瞬間移動とノイズ)
                if (Math.random() < 0.15) {
                    this.visual.distortion.translateX = (Math.random() - 0.5) * 50;
                    this.visual.distortion.skewX = (Math.random() - 0.5) * 40;
                    this.visual.distortion.scaleX = 0.8 + Math.random() * 0.4;
                } else {
                    this.visual.distortion.translateX *= 0.7;
                    this.visual.distortion.skewX *= 0.7;
                    this.visual.distortion.scaleX = 1.0;
                }
                this.visual.distortion.filter = Math.random() < 0.05 ? `hue-rotate(${Math.random() * 360}deg) brightness(2)` : '';
                break;
            default:
                this.visual.distortion.skewX *= 0.85;
                this.visual.distortion.rotateX *= 0.85;
                this.visual.distortion.rotateY *= 0.85;
                this.visual.distortion.translateX *= 0.85;
                this.visual.distortion.translateY *= 0.85;
                this.visual.distortion.hueRotate = 0; // 虹色をリセット
                this.visual.distortion.filter = ''; // フィルターをリセット
                this.visual.distortion.opacity = 1.0; // 透明度をリセット
                this.visual.distortion.scaleX += (1.0 - this.visual.distortion.scaleX) * 0.15;
                this.visual.distortion.scaleY += (1.0 - this.visual.distortion.scaleY) * 0.15;
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
        // destroy()済み（visual.domがnull）の場合は何もしない
        if (!this.visual.dom || !this.visual.dom.emoji) return;
        this.visual.dom.emoji.textContent = text;
        this.visual.dom.emoji.classList.add('visible');

        if (this.timers.emojiTimer) clearTimeout(this.timers.emojiTimer);

        if (duration !== null) {
            this.timers.emojiTimer = setTimeout(() => {
                this.hideEmoji();
            }, duration);
        }
    }

    /** 絵文字を非表示にする */
    hideEmoji() {
        // destroy()済み（visual.domがnull）の場合は何もしない
        if (!this.visual.dom || !this.visual.dom.emoji) return;
        this.visual.dom.emoji.classList.remove('visible');
        if (this.timers.emojiTimer) {
            clearTimeout(this.timers.emojiTimer);
            this.timers.emojiTimer = null;
        }
    }

    /** 現在ボイスが再生中かどうか */
    isVoicePlaying() {
        const v = this.visual.currentVoice;
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

    /**
     * キャラクターの破棄処理
     * タイマー、音声、DOM、参照をすべて解放してメモリリークを防ぐ
     */
    destroy() {
        console.log(`[BaseCharacter] Destroying character ${this.id} (${this.name})...`);

        // 1. タイマーのクリア
        if (this.timers.emojiTimer) {
            clearTimeout(this.timers.emojiTimer);
            this.timers.emojiTimer = null;
        }
        if (this.timers.actionTimeout) {
            clearTimeout(this.timers.actionTimeout);
            this.timers.actionTimeout = null;
        }

        // 2. 音声の停止と解放
        this._stopCurrentVoice();

        // 3. DOM要素の削除と参照解除
        if (this.visual.dom && this.visual.dom.container) {
            this.visual.dom.container.remove();
            // 循環参照を防ぐためDOMオブジェクト内の各参照をnullにする
            Object.keys(this.visual.dom).forEach(key => {
                this.visual.dom[key] = null;
            });
            this.visual.dom = null;
        }

        // 4. 外部参照の解除
        this.game = null;
        this.socialConfig = null;
        this.interaction.targetItem = null;
    }

    /**
     * UI表示用の状態ラベルを返す (サブクラスでオーバーライド)
     */
    getStateLabel() {
        return this.status.state;
    }
}

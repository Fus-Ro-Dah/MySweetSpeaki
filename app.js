/**
 * My Sweet Speaki - メインロジック
 */

// 状態定数の定義
const STATE = {
    // 基本的な行動
    IDLE: 'idle',
    WALKING: 'walking',

    // お土産イベント
    GIFT_LEAVING: 'gift_leaving',
    GIFT_SEARCHING: 'gift_searching',
    GIFT_RETURNING: 'gift_returning',
    GIFT_WAIT_FOR_USER_REACTION: 'gift_wait_for_user_reaction',
    GIFT_REACTION: 'gift_reaction',
    GIFT_TIMEOUT: 'gift_timeout',

    // アイテムインタラクション
    ITEM_APPROACHING: 'item_approaching',
    ITEM_ACTION: 'item_action',

    // ユーザーインタラクション
    USER_INTERACTING: 'user_interacting',

    // スピキ同士のインタラクション
    GAME_APPROACHING: 'game_approaching',
    GAME_REACTION: 'game_reaction'
};

/**
 * 統合アセット定義 (ASSETS)
 * 形式: speaki_タイプ_感情_行動_番号
 */
const ASSETS = {
    // -- Mood (状態の継続中ループ・継続するエフェクト) --
    // ---- 通常 ----
    // ------ 停止 ------
    speaki_mood_normal_idle_1: {
        imagefile: 'speaki_normal_idle_1.png',
        soundfile: 'チョワヨ.mp3', // 仮の割り当て
        text: 'ﾁｮﾜﾖ!',
        movePattern: 'swing'
    },
    speaki_mood_normal_idle_2: {
        imagefile: 'speaki_normal_idle_2.png',
        soundfile: 'アーウ.mp3', // 仮の割り当て
        text: 'ｱｰｳ',
        movePattern: 'none'
    },
    speaki_mood_normal_idle_3: {
        imagefile: 'speaki_normal_idle_3.png',
        soundfile: 'スピキ.mp3',
        text: 'ｽﾋﾟｷ!',
        movePattern: 'stretch'
    },
    // ------ 歩き ------
    speaki_mood_normal_walking_1: {
        imagefile: 'speaki_normal_walking_1.png',
        soundfile: 'チョワヨ.mp3',
        text: 'ﾁｮﾜﾖ!',
        movePattern: 'swing'
    },
    speaki_mood_normal_walking_2: {
        imagefile: 'speaki_normal_walking_2.png',
        soundfile: 'チョワヨチョワヨホバギチョワヨ.mp3',
        text: 'ﾁｮﾜﾖ-ﾁｮﾜﾖ-',
        movePattern: 'swing'
    },
    speaki_mood_normal_walking_3: {
        imagefile: 'speaki_normal_walking_3.png',
        soundfile: 'スピキ.mp3',
        text: 'ｽﾋﾟｷ!',
        movePattern: 'none'
    },
    // ---- うれしい ----
    // ------ 停止 ------
    speaki_mood_happy_idle_1: {
        imagefile: 'speaki_happy_idle_1.png',
        soundfile: 'チョワヨ.mp3',
        text: 'ﾁｮﾜﾖ!',
        movePattern: 'none'
    },
    speaki_mood_happy_idle_2: {
        imagefile: 'speaki_happy_idle_2.png',
        soundfile: 'チョワヨチョワヨホバギチョワヨ.mp3',
        text: 'ﾁｮﾜﾖｰﾁｮﾜﾖｰ',
        movePattern: 'none'
    },
    speaki_mood_happy_idle_3: {
        imagefile: 'speaki_happy_idle_3.png',
        soundfile: 'スピキ.mp3',
        text: 'ｽﾋﾟｷ!',
        movePattern: 'stretch'
    },
    // ------ 歩き ------
    speaki_mood_happy_walking_1: {
        imagefile: 'speaki_happy_walking_1.png',
        soundfile: 'チョワヨチョワヨウェガレジチョワヨ.mp3',
        text: 'ﾁｮﾜﾖ-ﾁｮﾜﾖ-',
        movePattern: 'bounce'
    },
    speaki_mood_happy_walking_2: {
        imagefile: 'speaki_happy_walking_2.png',
        soundfile: 'チョワヨチョワヨホバギチョワヨ.mp3',
        text: 'ﾁｮﾜﾖｰﾁｮﾜﾖｰ',
        movePattern: 'none'
    },
    speaki_mood_happy_walking_3: {
        imagefile: 'speaki_happy_walking_3.png',
        soundfile: 'チョワヨチョワヨスンバコッチチョワヨ.mp3',
        text: 'ﾁｮﾜﾖ-ﾁｮﾜﾖ-',
        movePattern: 'none'
    },
    // ---- 悲しい ----
    // ------ 停止 ------
    speaki_mood_sad_idle_1: {
        imagefile: 'speaki_sad_idle_1.png',
        soundfile: 'ウアア.mp3',
        text: 'ｳｱｱ!',
        movePattern: 'shake'
    },
    speaki_mood_sad_idle_2: {
        imagefile: 'speaki_sad_idle_2.png',
        soundfile: 'デルジバゼヨ.mp3',
        text: 'ﾃﾞﾙｼﾞﾊﾞｾﾞﾖ!',
        movePattern: 'stretch'
    },
    speaki_mood_sad_idle_3: {
        imagefile: 'speaki_sad_idle_3.png',
        soundfile: 'ウアアスピキデルジバゼヨ.mp3',
        text: 'ｳｱｱ!ｽﾋﾟｷﾃﾞﾙｼﾞﾊﾞｾﾞﾖ!',
        movePattern: 'stretch'
    },
    // ------ 歩き ------
    speaki_mood_sad_walking_1: {
        imagefile: 'speaki_sad_walking_1.png',
        soundfile: 'スピキヲイジメヌンデ.mp3',
        text: 'ｽﾋﾟｷｦｲｼﾞﾒﾇﾝﾃﾞ...',
        movePattern: 'bounce'
    },
    speaki_mood_sad_walking_2: {
        imagefile: 'speaki_sad_walking_2.png',
        soundfile: 'アーウ.mp3',
        text: 'ｱｰｳ',
        movePattern: 'stretch'
    },
    speaki_mood_sad_walking_3: {
        imagefile: 'speaki_sad_walking_3.png',
        soundfile: 'デルジバゼヨ.mp3',
        text: 'ﾃﾞﾙｼﾞﾊﾞｾﾞﾖ!',
        movePattern: 'stretch'
    },

    // -- Performance --
    // ---- アイテム ----
    speaki_performance_ITEM_BabySpeaki_1: {
        imagefile: 'speaki_happy_idle_1.png',
        soundfile: 'チョワヨ.mp3',
        text: 'ﾁｮﾜﾖ!',
        movePattern: 'bounce'
    },
    speaki_performance_ITEM_Pumpkin_1: {
        imagefile: 'speaki_happy_idle_1.png',
        soundfile: 'チョワヨ.mp3',
        text: 'ﾁｮﾜﾖ!',
        movePattern: 'bounce'
    },
    speaki_performance_ITEM_ToyBall_1: {
        imagefile: 'speaki_happy_idle_1.png',
        soundfile: '完全詠唱.mp3',
        text: '完全詠唱',
        movePattern: 'bounce'
    },
    // ---- ギフト ----
    speaki_mood_happy_giftwait_1: {
        imagefile: 'speaki_happy_idle_1.png', // ギフト待機画像
        soundfile: 'チョワヨ.mp3',
        text: 'プレゼントだよ！',
        movePattern: 'bounce'
    },
    speaki_performance_happy_giftreaction_1: {
        imagefile: 'speaki_happy_idle_1.png',
        soundfile: '完全詠唱.mp3',
        text: '完全詠唱',
        movePattern: 'bounce'
    },
    speaki_performance_sad_gifttimeout_1: {
        imagefile: 'speaki_sad_idle_1.png',
        soundfile: 'ウアア.mp3',
        text: 'ぐーぐー...',
        movePattern: 'stretch'
    },
    // ---- なでなで (idle) ----
    speaki_performance_happy_idle_1: {
        imagefile: 'speaki_happy_idle_1.png',
        soundfile: 'チョワヨ.mp3',
        text: 'チョワヨ！',
        movePattern: 'bounce'
    },
    speaki_performance_normal_idle_1: {
        imagefile: 'speaki_normal_idle_1.png',
        soundfile: 'スピキ.mp3',
        text: 'ｽﾋﾟｷ?',
        movePattern: 'bounce'
    },
    speaki_performance_sad_idle_1: {
        imagefile: 'speaki_sad_idle_1.png',
        soundfile: 'アーウ.mp3',
        text: 'アーーウ...',
        movePattern: 'shake'
    },
    // ---- 叩く (surprised) ----
    speaki_performance_sad_surprised_1: {
        imagefile: 'speaki_sad_surprised_1.png',
        soundfile: 'ウアア.mp3',
        text: 'ｳｱｱｯ!',
        movePattern: 'shake'
    },
    speaki_performance_normal_surprised_1: {
        imagefile: 'speaki_normal_idle_2.png',
        soundfile: 'アーウ.mp3',
        text: '痛いよ！',
        movePattern: 'shake'
    }
};

/**
 * 統合アイテム定義 (ITEMS)
 */
const ITEMS = {
    Pumpkin: {
        name: 'かぼちゃ',
        imagefile: 'item_pumpkin.png',
        soundfile: 'チョワヨ.mp3',
        text: 'わあ、カボチャだ！',
        size: 60,
        showInMenu: true,
        transform: { nextId: 'BabySpeaki', duration: 10000 }
    },
    BabySpeaki: {
        name: '赤ちゃんスピキ',
        imagefile: 'item_baby_speaki.png',
        soundfile: '完全詠唱.mp3',
        text: 'ピキッ？',
        size: 80,
        transform: { isAdult: true, duration: 20000 }
    },
    CatTower: {
        name: 'キャットタワー',
        imagefile: 'item_cat_tower.png',
        type: 'furniture',
        size: 100,
        text: '登ってみたい！',
        showInMenu: true,
        transform: { nextId: 'ToyBall', duration: 10000 }
    },
    ToyBall: {
        name: 'おもちゃのボール',
        imagefile: 'item_toy_ball.png',
        size: 40,
        text: '転がそう！',
        showInMenu: true
    },
    LuxuryPillow: {
        name: '高級枕',
        imagefile: 'item_luxury_pillow.png',
        size: 60,
        text: 'ふかふかだ...',
        ignoreReaction: true,
        showInMenu: true
    }
};

class Speaki {
    /** コンストラクタ: Speakiの初期化 */
    constructor(id, parentElement, x, y) {
        this.id = id;
        this.parentElement = parentElement;

        // 状態プロパティ
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.size = 160;
        this.speed = 1.5 + Math.random() * 2.5; // 1.5 〜 4.0 の範囲でランダム化
        this.state = STATE.IDLE;
        this.stateStack = [];  // 割り込まれた状態を保存するスタック

        // 好感度パラメータ (-50 〜 +50)
        this.friendship = 0;

        this.emotion = 'happy';
        this.action = 'idle';
        this.angle = 0;
        this.lastDecisionTime = 0;

        // 時間管理
        this.arrivalTime = Date.now();
        this.destinationSet = false;
        this.waitDuration = 1000 + Math.random() * 4000; // 最初もバラバラに動くようにランダム化（1~5秒）
        this.actionStartTime = 0;      // アクション開始時刻
        this.actionDuration = 0;       // アクション継続時間
        this.searchStartTime = 0;      // お土産探索開始時刻
        this.reactionStartTime = 0;    // リアクション開始時刻
        this.eventStartTime = 0;       // 汎用イベント開始時刻
        this.pettingStartTime = 0;     // なでなで開始時刻
        this.lastHeartTime = 0;        // 最後にハートを生成した時刻

        this.interactionType = null;   // 'move' or 'petting'

        this.facingLeft = true; // 現在向いている方向 (true: 左, false: 右)

        this.distortion = { skewX: 0, rotateX: 0, scale: 1.0 };
        this.targetDistortion = { skewX: 0, rotateX: 0, scale: 1.0 };

        // インタラクション (操作) 状態
        this.isInteracting = false;      // 操作中（マウスダウン中）か
        this.isPetting = false;          // なでなで（一定以上の移動）が確定したか
        this.interactStartTime = 0;      // 操作開始時刻
        this.isActuallyDragging = false; // ドラッグ移動しているか（内部フラグとして維持）

        // アセット管理用
        this.currentAssetKey = ''; // 現在のアセットキー
        this.currentAsset = null;  // 現在選択されているアセットデータ
        this.currentImgSrc = '';   // 現在選択されている画像パス
        this.targetItem = null;    // 現在向かっているアイテム同期用

        // DOM生成
        this.createDOM();

        // 初期アセットを適用（感情のランダム化と画像のセット）
        this._onStateChanged(this.state);
    }

    /** DOM要素の生成 */
    createDOM() {
        this.dom = {};

        const container = document.createElement('div');
        container.className = 'speaki-sprite-container';

        const img = document.createElement('img');
        img.className = 'speaki-sprite';
        // img.src はこの後の syncSpeakiDOM() で設定されるためここでは不要

        const emoji = document.createElement('div');
        emoji.className = 'speaki-emoji-overlay';

        // デバッグ用テキスト（アセット名用）
        const debugText = document.createElement('div');
        debugText.style.position = 'absolute';
        debugText.style.left = '100%';
        debugText.style.top = '50%';
        debugText.style.transform = 'translateY(-50%)';
        debugText.style.whiteSpace = 'nowrap';
        debugText.style.fontSize = '12px';
        debugText.style.color = '#fff';
        debugText.style.background = 'rgba(0,0,0,0.5)';
        debugText.style.padding = '2px 5px';
        debugText.style.borderRadius = '4px';
        debugText.style.pointerEvents = 'none';
        debugText.style.display = 'block';

        container.appendChild(img);
        container.appendChild(emoji);
        container.appendChild(debugText);
        this.parentElement.appendChild(container); // 親要素に追加

        this.dom.container = container;
        this.dom.sprite = img;
        this.dom.emoji = emoji;
        this.dom.debugText = debugText;
    }

    /** フレームごとの更新処理 */
    update(dt) {
        // 1. 表示関連（状態に関わらず毎フレーム実行）
        this._updateDistortion(dt);
        this.syncSpeakiDOM();

        // 2. インタラクト中はAI処理を停止
        if (this.isInteracting) return;

        // 3. 判断フェーズ：状況に応じてSTATEを切り替える
        this._updateStateTransition();

        // 4. 実行フェーズ：現在のSTATEに応じた行動をとる
        this._executeStateAction(dt);

        // 好感度の自然回復（マイナスの時のみ、0にゆっくり近づく）
        if (this.friendship < 0) {
            this.friendship += 0.005; // 1秒で約0.3回復するペース
            if (this.friendship > 0) this.friendship = 0;
        }

        // 好感度が「低い」または「とっても低い」場合は表情を「かなしい」に固定
        // (ただしアイテム反応中のワクワクは例外とする)
        if (this.friendship <= -11 && this.emotion !== 'ITEM') {
            this.emotion = 'sad';
        }
    }

    /** 状態の切り替え判定（判断のみ） */
    _updateStateTransition() {
        const now = Date.now();
        const dist = this.destinationSet ? Math.sqrt(Math.pow(this.targetX - this.x, 2) + Math.pow(this.targetY - this.y, 2)) : 999;
        const arrived = dist <= 10;

        switch (this.state) {
            case STATE.IDLE: this._checkIdleState(now); break;
            case STATE.WALKING: this._checkWalkingState(arrived); break;
            case STATE.GIFT_LEAVING: this._checkGiftLeavingState(arrived); break;
            case STATE.GIFT_SEARCHING: this._checkGiftSearchingState(now); break;
            case STATE.GIFT_RETURNING: this._checkGiftReturningState(now, arrived); break;
            case STATE.GIFT_WAIT_FOR_USER_REACTION: this._checkGiftWaitState(now); break;
            case STATE.GIFT_REACTION: this._checkGiftReactionState(now); break;
            case STATE.GIFT_TIMEOUT: this._checkGiftTimeoutState(now); break;
            case STATE.ITEM_APPROACHING: this._checkItemApproachingState(arrived); break;
            case STATE.ITEM_ACTION: this._checkItemActionState(now); break;
        }
    }

    /** IDLE状態の遷移チェック */
    _checkIdleState(now) {
        // 低好感度時の隠れ処理
        if (this._tryHideWhenFriendshipLow()) return;

        // お土産イベント開始チェック
        if (this._tryStartGiftEvent(now)) return;

        // 通常の待機終了チェック
        if (now - this.arrivalTime > this.waitDuration) {
            this.state = STATE.WALKING;
            this._onStateChanged(this.state);
        }
    }

    /** 低好感度（とっても低い）時の隠れ場所移動試行 */
    _tryHideWhenFriendshipLow() {
        if (this.friendship > -31) return false;

        const hiddenX = 50;
        const hiddenY = 100;
        const distToHidden = Math.sqrt((this.x - hiddenX) ** 2 + (this.y - hiddenY) ** 2);

        if (distToHidden <= 100) return false;

        this.state = STATE.WALKING;
        this.targetX = hiddenX;
        this.targetY = hiddenY;
        this.destinationSet = true;
        this._onStateChanged(this.state);
        return true;
    }

    /** お土産イベント開始試行 */
    _tryStartGiftEvent(now) {
        const timeSinceLastGift = now - window.game.lastGiftTime;
        const canStartGift = this.friendship >= 31 && timeSinceLastGift >= 30000 && !window.game.giftPartner;

        if (!canStartGift) return false;

        this.state = STATE.GIFT_LEAVING;
        window.game.giftPartner = this;
        this._onStateChanged(this.state);
        return true;
    }

    /** WALKING状態の遷移チェック */
    _checkWalkingState(arrived) {
        if (!arrived) return;
        this.state = STATE.IDLE;
        this._onStateChanged(this.state);
        this._handleArrival();
    }

    /** GIFT_LEAVING状態の遷移チェック */
    _checkGiftLeavingState(arrived) {
        if (!arrived) return;
        this.state = STATE.GIFT_SEARCHING;
        this._onStateChanged(this.state);
    }

    /** GIFT_SEARCHING状態の遷移チェック */
    _checkGiftSearchingState(now) {
        if (now - this.arrivalTime <= 5000) return;
        this.state = STATE.GIFT_RETURNING;
        this._onStateChanged(this.state);
    }

    /** GIFT_RETURNING状態の遷移チェック */
    _checkGiftReturningState(now, arrived) {
        if (!arrived) return;
        this.state = STATE.GIFT_WAIT_FOR_USER_REACTION;
        window.game.startGiftReceiveEvent(this);
        this.eventStartTime = now;
        this._onStateChanged(this.state);
    }

    /** GIFT_WAIT_FOR_USER_REACTION状態の遷移チェック */
    _checkGiftWaitState(now) {
        if (now - this.eventStartTime <= 10000) return;
        this.state = STATE.GIFT_TIMEOUT;
        this.eventStartTime = now;
        window.game.updateGiftUI('hide');
        this._onStateChanged(this.state);
    }

    /** GIFT_REACTION状態の遷移チェック */
    _checkGiftReactionState(now) {
        const reactionDur = this.actionDuration || 3000;
        if (now - this.eventStartTime <= reactionDur) return;
        window.game.completeGiftEvent();
        this._onStateChanged(STATE.IDLE);
    }

    /** GIFT_TIMEOUT状態の遷移チェック */
    _checkGiftTimeoutState(now) {
        const timeoutDur = this.actionDuration || 5000;
        if (now - this.eventStartTime <= timeoutDur) return;
        window.game.completeGiftEvent();
        this._onStateChanged(STATE.IDLE);
    }

    /** ITEM_APPROACHING状態の遷移チェック */
    _checkItemApproachingState(arrived) {
        if (!arrived) return;
        this.state = STATE.ITEM_ACTION;
        if (this.targetItem) {
            this._performItemAction(this.targetItem);
        }
        this._onStateChanged(this.state);
    }

    /** ITEM_ACTION状態の遷移チェック */
    _checkItemActionState(now) {
        const duration = this.actionDuration || 3000;
        if (now - this.actionStartTime <= duration) return;
        this.state = STATE.IDLE;
        this._onStateChanged(this.state);
    }

    /** 状態変更時のエフェクト発動（ASSETS方式） */
    _onStateChanged(newState) {
        // 1. 前の音声を停止
        this._stopCurrentVoice();

        // 2. 状態に応じた感情・アクションの自動割り当て
        this._applyStateAppearance(newState);

        // 2.5 低好感度時は表情を強制固定
        if (this.friendship <= -11 && this.emotion !== 'ITEM') {
            this.emotion = 'sad';
        }

        // 3. アセットの選択と適用
        this._applySelectedAsset(newState);

        // 6. モーションのリセット
        this.motionTimer = 0;
    }

    /** 再生中の音声を停止 */
    _stopCurrentVoice() {
        if (this.currentVoice) {
            this.currentVoice.pause();
            this.currentVoice = null;
        }
    }

    /** 状態に基づいたデフォルトの外見設定 */
    _applyStateAppearance(state) {
        // 基本感情を好感度に基づいて更新（ただしアイテム、ギフト等は除く）
        const isSpecialEmotion = [STATE.ITEM_ACTION, STATE.GIFT_RETURNING, STATE.GIFT_WAIT_FOR_USER_REACTION, STATE.GIFT_REACTION].includes(state);
        if (!isSpecialEmotion) {
            this._updateBaseEmotion();
        }

        switch (state) {
            case STATE.IDLE:
                // _updateBaseEmotionで設定されるためここではactionのみ
                this.action = 'idle';
                break;
            case STATE.WALKING:
            case STATE.ITEM_APPROACHING:
                this.action = 'walking';
                break;
            case STATE.GIFT_LEAVING:
            case STATE.GIFT_RETURNING:
                this.emotion = 'happy';
                this.action = 'walking';
                break;
            case STATE.GIFT_WAIT_FOR_USER_REACTION:
                this.emotion = 'happy';
                this.action = 'giftwait';
                break;
            case STATE.GIFT_REACTION:
                this.emotion = 'happy';
                this.action = 'giftreaction';
                break;
            case STATE.GIFT_TIMEOUT:
                this.emotion = 'sad';
                this.action = 'gifttimeout';
                break;
            case STATE.USER_INTERACTING:
                // すでにアクションがセットされている（叩く・撫でる等）場合は上書きしない
                if (this.action === 'walking') {
                    this.action = 'idle';
                }
                break;
        }
    }

    /** 表情とアクションを即座に変更してアセットを反映させる (外部用) */
    setExpression(action, emotion) {
        if (action) this.action = action;
        if (emotion) this.emotion = emotion;
        this._applySelectedAsset(this.state);
    }

    /** 好感度ランクに基づいて基本感情を決定する (ヘルパー) */
    _updateBaseEmotion() {
        if (this.friendship <= -11) {
            this.emotion = 'sad';
        } else if (this.friendship <= 10) {
            this.emotion = 'normal';
        } else {
            this.emotion = 'happy';
        }
    }

    /** 条件に合致するアセットを検索して適用 */
    _applySelectedAsset(state) {
        const type = [STATE.GIFT_REACTION, STATE.GIFT_TIMEOUT, STATE.ITEM_ACTION, STATE.USER_INTERACTING].includes(state)
            ? 'performance' : 'mood';

        // アセットのフィルタリング (type, emotion, action)
        let candidates = Object.entries(ASSETS).filter(([key]) => {
            const p = key.split('_'); // speaki_type_emotion_action_num
            return p.length >= 4 && p[1] === type && p[2] === this.emotion && p[3] === this.action;
        });

        // 合致しなければ normal 感情で再検索
        if (candidates.length === 0) {
            candidates = Object.entries(ASSETS).filter(([key]) => {
                const p = key.split('_');
                return p[1] === type && p[2] === 'normal' && p[3] === this.action;
            });
        }

        if (candidates.length === 0) {
            this.currentAsset = null;
            this.motionType = 'none';
            return;
        }

        const [assetKey, assetData] = candidates[Math.floor(Math.random() * candidates.length)];
        this.currentAssetKey = assetKey;
        this.currentAsset = assetData;
        this.motionType = assetData.movePattern || 'none';

        // 音声の再生とDuration設定
        this._playAssetSound(assetData, type);
    }

    /** アセットの音声を再生し、パフォーマンスなら時間を計測 */
    _playAssetSound(data, type) {
        const game = window.game || Game.instance;
        if (!data.soundfile || !game) return;

        this.currentVoice = game.playSound(data.soundfile);

        const voice = this.currentVoice;
        if (type === 'performance' && voice) {
            const updateDur = () => {
                if (isNaN(voice.duration) || voice.duration <= 0) return;
                this.actionDuration = voice.duration * 1000;
            };
            if (voice.readyState >= 1) updateDur();
            else voice.addEventListener('loadedmetadata', updateDur, { once: true });
        }
    }

    /** 現在の状態に応じた行動の実行 */
    _executeStateAction(dt) {
        const movementStates = [STATE.WALKING, STATE.GIFT_LEAVING, STATE.GIFT_RETURNING, STATE.ITEM_APPROACHING];
        const staticStates = [STATE.IDLE, STATE.GIFT_SEARCHING, STATE.GIFT_WAIT_FOR_USER_REACTION, STATE.USER_INTERACTING, STATE.ITEM_ACTION];

        if (movementStates.includes(this.state)) {
            // 目的地が決まっていなければ初期化
            if (!this.destinationSet) {
                this._decideNextDestination();
            }
            // 移動を実行
            this._processMovement();
        }
        else if (staticStates.includes(this.state)) {
            // 到着直後（目的地設定が残っている）ならクリーンアップ
            if (this.destinationSet) {
                this._handleArrival();
            }
        }
    }

    /** DOMの表示更新（画像、位置、アニメーションなど） */
    syncSpeakiDOM() {
        const dom = this.dom;

        // 1. 画像切り替え (ASSETSから選択された画像を使用)
        if (this.currentAsset && this.currentAsset.imagefile) {
            const game = window.game || Game.instance;
            const img = game.images[this.currentAsset.imagefile];
            if (img && dom.sprite.src !== img.src) {
                dom.sprite.src = img.src;
            }
        }

        // 2. 位置とサイズ
        dom.container.style.width = `${this.size}px`;
        dom.container.style.height = `${this.size}px`;

        const bob = Math.sin(Date.now() / 200 + this.id * 100) * 5; // IDで位相をずらす
        dom.container.style.left = `${this.x - this.size / 2}px`;
        dom.container.style.top = `${this.y - this.size / 2 + bob}px`;

        const flip = this.facingLeft ? 1 : -1;
        const transform = `perspective(800px) rotateX(${this.distortion.rotateX}deg) skewX(${this.distortion.skewX}deg) scale(${this.distortion.scale}) scaleX(${flip})`;
        dom.sprite.style.transform = transform;

        let emoji = '';
        if ([STATE.GIFT_RETURNING, STATE.GIFT_WAIT_FOR_USER_REACTION, STATE.GIFT_REACTION].includes(this.state)) {
            emoji = '🎁';
        }

        dom.emoji.textContent = emoji;

        // 4. セリフ（text）の表示
        dom.debugText.textContent = (this.currentAsset && this.currentAsset.text) || '';
    }

    /** ドラッグ時・モーションアニメーションの更新 */
    _updateDistortion(dt) {
        this.motionTimer += dt || 16;

        // インタラクト中（なでなで確定時）はマウス移動に伴う動的な歪みを適用
        if (this.isPetting) {
            this.distortion.skewX += (this.targetDistortion.skewX - this.distortion.skewX) * 0.15;
            this.distortion.rotateX += (this.targetDistortion.rotateX - this.distortion.rotateX) * 0.15;
            this.distortion.scale += (this.targetDistortion.scale - this.distortion.scale) * 0.15;
            return;
        }

        // ASSETS定義に基づくモーション適用
        switch (this.motionType) {
            case 'shake':
                this.distortion.skewX = Math.sin(this.motionTimer * 0.05) * 10;
                this.distortion.rotateX *= 0.85;
                this.distortion.scale = 1.0;
                break;
            case 'stretch':
                const stretch = Math.sin(this.motionTimer * 0.01) * 0.1;
                this.distortion.scale = 1.0 + stretch;
                this.distortion.rotateX = stretch * -50;
                this.distortion.skewX *= 0.85;
                break;
            case 'bounce':
                const bounce = Math.abs(Math.sin(this.motionTimer * 0.01)) * 0.1;
                this.distortion.scale = 1.0 + bounce;
                this.distortion.skewX *= 0.85;
                this.distortion.rotateX *= 0.85;
                break;
            case 'swing':
                const swingPhase = Math.sin(this.motionTimer * 0.005);
                this.distortion.skewX = swingPhase * 15; // 左右への傾き
                this.distortion.scale = 1.0 + Math.abs(swingPhase) * 0.25; // 伸び
                this.distortion.rotateX = Math.abs(swingPhase) * -10; // 伸びる時の前傾
                break;
            default:
                this.distortion.skewX *= 0.85;
                this.distortion.rotateX *= 0.85;
                this.distortion.scale += (1.0 - this.distortion.scale) * 0.15;
                break;
        }
    }

    /** アイテムへの接近を開始する（共通化メソッド） */
    approachItem(item, offset = 100) {
        if (!item) return;

        this.state = STATE.ITEM_APPROACHING;
        this.targetItem = item;

        // アイテムから自分の方へ offset 離れた位置を目的地にする
        const dx = this.x - item.x;
        const dy = this.y - item.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            this.targetX = item.x + (dx / dist) * offset;
            this.targetY = item.y + (dy / dist) * offset;
        } else {
            // 完全に重なっている場合は右にずらす
            this.targetX = item.x + offset;
            this.targetY = item.y;
        }

        this.destinationSet = true;
        this._onStateChanged(this.state);
    }

    /** 目的地を決定（移動開始時の1回だけ実行） */
    _decideNextDestination() {
        const canvasWidth = this.parentElement.clientWidth || window.innerWidth;
        const canvasHeight = this.parentElement.clientHeight || window.innerHeight;

        this.action = 'walking';
        this.destinationSet = true;
        this.currentImgSrc = ''; // 画像の再抽選フラグ

        if (this.state === STATE.GIFT_LEAVING) {
            this.targetX = -100;
            this.targetY = canvasHeight / 2;
            return;
        }

        if (this.state === STATE.GIFT_RETURNING) {
            this.targetX = canvasWidth * 0.4 + (Math.random() * 100 - 50);
            this.targetY = canvasHeight * 0.5 + (Math.random() * 100 - 50);
            this._onStateChanged(this.state);
            return;
        }

        // WALKINGまたはデフォルト（通常の散歩）
        this._decideWanderingDestination(canvasWidth, canvasHeight);
    }

    /** 通常の散歩中の目的地決定 */
    _decideWanderingDestination(w, h) {
        // 低好感度時は隠れ家付近限定
        if (this.friendship <= -31) {
            this.targetItem = null;
            this.targetX = 50 + (Math.random() * 40 - 20);
            this.targetY = 100 + (Math.random() * 40 - 20);
            this.destinationSet = true;
            this._onStateChanged(this.state);
            return;
        }

        // 20%の確率で配置済みアイテムを目指す
        const game = window.game || Game.instance;
        if (game && game.placedItems.length > 0 && Math.random() < 0.2) {
            const item = game.placedItems[Math.floor(Math.random() * game.placedItems.length)];
            this.approachItem(item);
            return;
        }

        // ランダムな位置へ
        this.targetItem = null;
        this.targetX = Math.random() * (w - 100) + 50;
        this.targetY = Math.random() * (h - 100) + 50;
        this._onStateChanged(this.state);
    }

    /** 移動処理 */
    _processMovement() {
        // 目的地が設定されていなければ何もしない
        if (!this.destinationSet) return;

        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // 目的地に十分近い（5px以内）場合は、到着処理を実行して終了
        if (dist <= 5) {
            this._handleArrival();
            return;
        }

        // 移動継続：角度を計算して座標を更新
        const angle = Math.atan2(dy, dx);

        // 逃走中（好感度が低く、隠れ家に向かっている）なら速度を2倍にする
        let currentSpeed = this.speed;
        const isHeadingToHidden = this.friendship <= -31 && Math.sqrt(Math.pow(this.targetX - 50, 2) + Math.pow(this.targetY - 100, 2)) < 30;
        if (isHeadingToHidden) {
            currentSpeed *= 2.0;
        }

        this.x += Math.cos(angle) * currentSpeed;
        this.y += Math.sin(angle) * currentSpeed;
        this.angle = angle;

        // 進んでいる方向（左右）を更新
        if (Math.abs(dx) > 1) {
            this.facingLeft = dx < 0;
        }
    }

    /** 目的地到着時の物理的なクリーンアップ */
    _handleArrival() {
        this.arrivalTime = Date.now();
        this.destinationSet = false;

        // 到着時（待機開始時）に画像を再抽選させる
        this.currentImgSrc = '';

        // 待機時間をある程度ランダムに決定 (2秒 ~ 8秒)
        this.waitDuration = 2000 + Math.random() * 6000;

        // 到着時の物理的なクリーンアップのみ行う
        // (状態遷移やイベント開始は _updateStateTransition で実行済み)
        if (this.state !== STATE.WALKING) return;
        this.action = 'idle';
    }

    /** アイテムに到着した際の固有アクション */
    _performItemAction(item) {

        this.emotion = 'ITEM';
        this.action = item.id;

        // 時間を記録
        this.actionStartTime = Date.now();
        this.eventStartTime = this.actionStartTime;
        this.targetItem = null;

        // 音声と画像アセットの切り替えは、この後の _onStateChanged(STATE.ITEM_ACTION) が行う
    }

    /** インタラクション終了時の処理（3秒間喜んでから元の行動に戻る） */
    _processFinishInteraction() {
        this.action = 'happy';

        // 3秒間その場で喜ぶモーションを維持する
        setTimeout(() => {
            // 待機中に別のドラッグやイベントが発生して状態が変わっていたら何もしない
            if (this.state !== STATE.USER_INTERACTING) return;

            this.action = 'idle';

            // 好感度が非常に低い場合、インタラクション終了後にすぐに隠れるように（IDLEへ）
            if (this.friendship <= -31) {
                this.state = STATE.IDLE;
                this._onStateChanged(this.state);
                return;
            }

            // 中断されていた行動があればそこに戻り、なければ待機へ
            this.state = (this.stateStack && this.stateStack.length > 0) ? this.stateStack.pop() : STATE.IDLE;
            this._onStateChanged(this.state);
        }, 3000);
    }

    /** 好感度のラベル取得 (5段階) */
    getFriendshipLabel() {
        if (this.friendship >= 31) return 'とっても高い';
        if (this.friendship >= 11) return '高い';
        if (this.friendship >= -10) return 'どちらでもない';
        if (this.friendship >= -30) return '低い';
        return 'とっても低い';
    }

    /** 好感度のCSSクラス取得 */
    getFriendshipClass() {
        if (this.friendship >= 31) return 'friendship-v-high';
        if (this.friendship >= 11) return 'friendship-high';
        if (this.friendship >= -10) return 'friendship-normal';
        if (this.friendship >= -30) return 'friendship-low';
        return 'friendship-v-low';
    }

    /** UI表示用のステータス名取得 */
    getStateLabel() {
        if (this.friendship <= -31 && [STATE.IDLE, STATE.WALKING].includes(this.state)) {
            return 'かくれてる';
        }

        switch (this.state) {
            case STATE.IDLE: return '休憩中';
            case STATE.WALKING: return 'お散歩中';
            case STATE.GIFT_LEAVING:
            case STATE.GIFT_SEARCHING:
            case STATE.GIFT_RETURNING: return 'お土産探し中';
            case STATE.GIFT_WAIT_FOR_USER_REACTION: return '待機中';
            case STATE.ITEM_APPROACHING: return 'アイテムへ移動中';
            case STATE.ITEM_ACTION: return 'アイテムで遊んでる';
            case STATE.USER_INTERACTING: return 'ふれあい中';
            default: return 'のんびり';
        }
    }
}

class Game {
    /** コンストラクタ: ゲームの初期化 */
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.speakiRoom = document.getElementById('speaki-room');

        this.speakis = [];      // 複数管理用の配列
        this.furniture = [];
        this.placedItems = [];
        this.interactTarget = null; // 現在操作（タップ・なでなで）中のスピキ
        this.lastGiftTime = Date.now();
        this.bgmBuffer = null;      // Web Audio API用デコード済みデータ
        this.bgmSource = null;      // 再生用ノード
        this.audioCtx = null;       // AudioContext
        this.bgmFallback = null;    // CORSエラー時のフォールバック用

        this.images = {};      // キャッシュ用（パス -> Image）
        this.sounds = {};      // キャッシュ用（ファイル名 -> Audio）

        // 音声管理
        this.audioEnabled = false;

        Game.instance = this;

        this.loadResources();

        this.init();
        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.lastTime = 0;

        // 開始ボタンの待機
        const startBtn = document.getElementById('start-button');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startGame());
        }

        requestAnimationFrame((t) => this.loop(t));
    }

    /** アセット（画像・音声）の全読み込み */
    loadResources() {
        Object.entries(ASSETS).forEach(([key, data]) => {
            // 1. 画像のロード
            if (data.imagefile && !this.images[data.imagefile]) {
                const img = new Image();
                img.src = `assets/images/${data.imagefile}`;
                this.images[data.imagefile] = img;
                // 後方互換性のためパス形式でも登録
                this.images[`assets/images/${data.imagefile}`] = img;
            }

            // 2. 音声のロード（Audioオブジェクトを事前に作成）
            if (data.soundfile && !this.sounds[data.soundfile]) {
                const audio = new Audio(`assets/sounds/${data.soundfile}`);
                this.sounds[data.soundfile] = audio;
            }
        });

        // ITEMSに定義された画像をすべて読み込む
        Object.values(ITEMS).forEach(item => {
            if (item.imagefile) {
                const path = `assets/images/${item.imagefile}`;
                const img = new Image();
                img.src = path;
                const key = item.imagefile.replace('.png', '');
                this.images[key] = img;
                this.images[path] = img; // パス指定でも引けるように
            }
        });

        // 特別なリソース（旧仕様との互換性や特定の演出用）
        const specialAssets = ['item_baby_speaki.png', 'item_pumpkin.png'];
        specialAssets.forEach(fileName => {
            if (!this.images[fileName.replace('.png', '')]) {
                const path = `assets/images/${fileName}`;
                const img = new Image();
                img.src = path;
                this.images[fileName.replace('.png', '')] = img;
            }
        });

        // 4. BGMのロード (Web Audio API用)
        this._loadBGM('assets/music/he-jitsu-no-joh.mp3');
    }

    /** BGMをフェッチしてデコードする (ヘルパー) */
    async _loadBGM(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
            const arrayBuffer = await response.arrayBuffer();

            if (!this.audioCtx) {
                this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }

            this.bgmBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);
            console.log("[Audio] BGM loaded and decoded (Web Audio API).");
        } catch (e) {
            console.warn("[Audio] Web Audio API failed (CORS?), falling back to standard Audio element:", e);
            // フォールバック: 標準の Audio オブジェクトを作成（file:// プロトコル等での回避策）
            this.bgmFallback = new Audio(url);
            this.bgmFallback.loop = true;
            this.bgmFallback.volume = 0.5;
        }
    }

    /** 音声の再生（インスタンスを返す） */
    playSound(fileName) {
        if (!this.audioEnabled || !this.sounds[fileName]) return null;

        const audio = this.sounds[fileName];
        const playClone = audio.cloneNode();
        playClone.play().catch(e => console.log("[Audio] Playback failed:", e));
        return playClone;
    }

    /** ゲームの初期設定 */
    init() {
        this.initItemMenu();
        this.setupInteractions();
        this.setupDragAndDrop();

        // 初期Speaki生成は startGame で行うためここでは削除
    }

    /** タイトル画面を閉じてゲームを開始する */
    startGame() {
        const titleScreen = document.getElementById('title-screen');
        if (titleScreen) {
            titleScreen.classList.add('fade-out');
        }

        // ユーザーアクションをきっかけに音声を有効化
        this.audioEnabled = true;

        // Web Audio APIの再開（ブラウザ制限解除）
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        // BGMの再生開始
        if (this.bgmBuffer) {
            // シームレスループ方式 (Web Audio API)
            if (!this.bgmSource) {
                this.bgmSource = this.audioCtx.createBufferSource();
                this.bgmSource.buffer = this.bgmBuffer;
                this.bgmSource.loop = true;
                const gainNode = this.audioCtx.createGain();
                gainNode.gain.value = 0.5;
                this.bgmSource.connect(gainNode);
                gainNode.connect(this.audioCtx.destination);
                this.bgmSource.start(0);
                console.log("[Audio] Playing BGM via Web Audio API (Seamless).");
            }
        } else if (this.bgmFallback) {
            // 標準方式 (HTML Audio) - CORS回避用
            this.bgmFallback.play().catch(e => console.log("[Audio] Fallback playback failed:", e));
            console.log("[Audio] Playing BGM via Standard Audio (Fallback).");
        }

        // 初期Speaki生成（1匹）
        this.addSpeaki();
    }

    /** アイテムメニューを動的に生成 */
    initItemMenu() {
        const itemList = document.getElementById('item-list');
        if (!itemList) return;

        itemList.innerHTML = ''; // クリア

        Object.entries(ITEMS).forEach(([id, config]) => {
            if (config.showInMenu) {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'draggable-item';
                itemDiv.dataset.id = id;
                itemDiv.dataset.type = config.type || 'item';
                itemDiv.draggable = true;
                itemDiv.textContent = config.name || id;
                itemList.appendChild(itemDiv);
            }
        });
    }

    /** 新しいSpeakiを追加 */
    addSpeaki(x, y) {
        const id = this.speakis.length;
        const finalX = x !== undefined ? x : window.innerWidth * 0.4 + (Math.random() * 100 - 50);
        const finalY = y !== undefined ? y : window.innerHeight * 0.5 + (Math.random() * 100 - 50);
        const speaki = new Speaki(id, this.speakiRoom, finalX, finalY);
        this.speakis.push(speaki);
    }

    /** キャンバスのサイズ調整 */
    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }

    /** インタラクション（マウスイベント等）の設定 */
    setupInteractions() {
        // 初回クリック時に音声を有効化
        const unlockAudio = () => {
            if (!this.audioEnabled) {
                this.audioEnabled = true;
                console.log("[Audio] System unlocked by user interaction.");
                // 沈黙を流してコンテキストを活性化（iOS/Safari対策）
                const silent = new Audio();
                silent.play().catch(() => { });
            }
            window.removeEventListener('mousedown', unlockAudio);
            window.removeEventListener('touchstart', unlockAudio);
        };
        window.addEventListener('mousedown', unlockAudio);
        window.addEventListener('touchstart', unlockAudio);

        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.handleMouseUp());

        document.getElementById('gift-btn-receive').onclick = () => this.receiveGift();
        document.getElementById('reaction-btn-1').onclick = () => this.handleReaction(1);
        document.getElementById('reaction-btn-2').onclick = () => this.handleReaction(2);
    }

    /** ドラッグ＆ドロップの設定 */
    setupDragAndDrop() {
        const draggables = document.querySelectorAll('.draggable-item');
        draggables.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', JSON.stringify({
                    id: item.dataset.id,
                    type: item.dataset.type
                }));
            });
        });

        this.canvas.addEventListener('dragover', (e) => e.preventDefault());
        this.canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            this.addItem(data.id, data.type, x, y);
        });
    }

    /** アイテムの配置 */
    addItem(id, type, x, y) {
        const itemDef = ITEMS[id];
        if (!itemDef) return;

        const item = {
            id,
            type: itemDef.type || type,
            x,
            y,
            size: itemDef.size || (type === 'furniture' ? 100 : 40),
            placedTime: Date.now(),
            stage: 'default',
            displayText: itemDef.text || null,
            textDisplayUntil: itemDef.text ? Date.now() + 3000 : 0
        };

        this.placedItems.push(item);

        // 配置時の音声再生
        if (itemDef.soundfile) {
            this.playSound(itemDef.soundfile);
        }

        // 配置直後にスピキたちが興味を持つ
        if (itemDef.ignoreReaction) return;

        this.speakis.forEach(speaki => {
            // 半径500px以内のスピキだけが反応する
            const distToItem = Math.sqrt((speaki.x - x) ** 2 + (speaki.y - y) ** 2);
            if (distToItem > 500) return;

            // 好感度が「とっても低い」場合はアイテムに興味を示さない
            if (speaki.friendship <= -31) return;

            const isGiftEventActive = [STATE.GIFT_LEAVING, STATE.GIFT_SEARCHING, STATE.GIFT_RETURNING, STATE.GIFT_WAIT_FOR_USER_REACTION].includes(speaki.state);
            const isItemEventActive = [STATE.ITEM_APPROACHING, STATE.ITEM_ACTION].includes(speaki.state);

            // 割り込み可能な状態ならスタックに保存
            if (isGiftEventActive || isItemEventActive) {
                speaki.stateStack.push(speaki.state);
            }

            // アイテムへの接近を開始（共通メソッドを使用、距離は50px）
            speaki.friendship = Math.min(50, speaki.friendship + 2);
            speaki.approachItem(item, 50);
        });
    }

    /** マウスダウン処理（ヒットテストと操作開始） */
    handleMouseDown(e) {
        const { x, y } = this._getMousePos(e);
        const target = this._findSpeakiAt(x, y);
        if (!target) return;

        if (!this._isInteractable(target)) {
            console.log(`[Interaction] Blocked in state: ${target.state}`);
            return;
        }

        this._prepareInteraction(target, x, y);
    }

    /** マップ上の座標を取得 */
    _getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    /** 指定したSpeakiが操作可能な状態かチェック */
    _isInteractable(speaki) {
        const interactableStates = [
            STATE.IDLE,
            STATE.WALKING,
            STATE.GIFT_RETURNING,
            STATE.GIFT_LEAVING,
            STATE.GIFT_WAIT_FOR_USER_REACTION,
            STATE.ITEM_APPROACHING,
        ];
        return interactableStates.includes(speaki.state);
    }

    /** 指定座標にあるスピキを検索（手前の個体を優先） */
    _findSpeakiAt(x, y) {
        for (let i = this.speakis.length - 1; i >= 0; i--) {
            const s = this.speakis[i];
            const dist = Math.sqrt((x - s.x) ** 2 + (y - s.y) ** 2);

            // 基本的な当たり判定（円形）かつ、画像の上部(頭部らへん）であること
            const isHeadHit = (y < s.y - s.size / 5); //5がちょうどよさそう

            if (dist < s.size / 2 && isHeadHit) return s;
        }
        return null;
    }

    /** ユーザーによる操作（インタラクト）の準備 */
    _prepareInteraction(speaki, x, y) {
        speaki.isInteracting = true;
        speaki.interactStartTime = Date.now();
        speaki.lastMouseX = x;
        speaki.lastMouseY = y;
        speaki.isPetting = false;

        // 割り込み判定：保存すべき状態のリスト
        const interruptibleStates = [
            STATE.GIFT_LEAVING, STATE.GIFT_SEARCHING,
            STATE.GIFT_RETURNING, STATE.GIFT_WAIT_FOR_USER_REACTION,
            STATE.ITEM_APPROACHING, STATE.ITEM_ACTION
        ];

        if (interruptibleStates.includes(speaki.state)) {
            speaki.stateStack.push(speaki.state);
        }

        speaki.state = STATE.USER_INTERACTING;
        this.interactTarget = speaki;

        // ※ここでは _onStateChanged を呼ばない（または呼んでも見た目を変えない）
        // MouseMove または MouseUp で結果が決まってからエフェクトを発動させるため。
    }

    /** マウスムーブ処理（なでなで演出） */
    handleMouseMove(e) {
        if (!this.interactTarget) return;

        const speaki = this.interactTarget;
        const { x, y } = this._getMousePos(e);

        const dx = x - speaki.lastMouseX;
        const dy = y - speaki.lastMouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= 5) return;

        // なでなで判定
        if (speaki.state === STATE.USER_INTERACTING) {
            speaki.pettingStartTime = Date.now();
            speaki.isPetting = true;

            // 好感度を微増 (最高50)
            speaki.friendship = Math.min(50, speaki.friendship + 0.05);

            // なでなではサウンドをループ再生させる
            if (speaki.currentVoice) {
                speaki.currentVoice.loop = true;
            }
        }

        speaki.isActuallyDragging = true;

        // なでなで演出：位置は変えず、演出を適用
        const targetEmotion = (speaki.friendship <= -11) ? 'sad' : 'happy';

        // アクションと感情が変化した場合、または未設定の場合に反映
        if (speaki.action !== 'idle' || speaki.emotion !== targetEmotion) {
            speaki.setExpression('idle', targetEmotion);
        }

        // パーティクル演出（ハート）の生成
        if (speaki.isPetting && speaki.emotion === 'happy') {
            const now = Date.now();
            if (now - speaki.lastHeartTime > 150) { // 150msごとに生成
                this._createPettingHeart(speaki);
                speaki.lastHeartTime = now;
            }
        }

        // マウスの動きに合わせた歪み（震え）の演出
        speaki.targetDistortion.skewX = Math.max(-20, Math.min(20, dx * -1.0));
        speaki.targetDistortion.rotateX = Math.max(-15, Math.min(15, dy * -0.5));
        speaki.targetDistortion.scale = 1.05;

        speaki.lastMouseX = x;
        speaki.lastMouseY = y;
    }

    /** マウスアップ処理（結果の確定とクリーンアップ） */
    handleMouseUp() {
        const speaki = this.interactTarget;
        if (!speaki) return;

        const isTap = (Date.now() - speaki.interactStartTime < 300) && !speaki.isPetting;

        if (isTap) {
            this._handleSpeakiTap(speaki);
        }

        if (isTap || speaki.isActuallyDragging) {
            this._resetActionTimer(speaki, 2000);
        }

        this._cleanupInteraction(speaki);
    }

    /** タップ（叩かれた）時の処理 */
    _handleSpeakiTap(speaki) {
        speaki.setExpression('surprised', 'sad');
        this._createHitEffect(speaki.lastMouseX, speaki.lastMouseY);
        speaki.friendship = Math.max(-50, speaki.friendship - 5);
        this.playSound('surprised');
    }

    /** インタラクション終了後の物理状態・音声クリーンアップ */
    _cleanupInteraction(speaki) {
        speaki.isInteracting = false;
        speaki.isPetting = false;
        speaki.arrivalTime = Date.now();
        speaki.destinationSet = false;
        speaki.state = (speaki.stateStack.length > 0) ? speaki.stateStack.pop() : STATE.IDLE;

        if (speaki.currentVoice) {
            speaki.currentVoice.loop = false;
            speaki.currentVoice.pause();
            speaki.currentVoice = null;
        }

        this.interactTarget = null;
    }

    /** なでなで時のハートエフェクト生成 */
    _createPettingHeart(speaki) {
        const heart = document.createElement('div');
        heart.className = 'petting-heart';
        heart.textContent = '❤️';

        // スピキの頭部付近にランダムに配置
        const offsetX = (Math.random() - 0.5) * 60;
        const offsetY = -speaki.size / 2 + (Math.random() - 0.5) * 40;

        heart.style.left = `${speaki.x + offsetX}px`;
        heart.style.top = `${speaki.y + offsetY}px`;

        this.speakiRoom.appendChild(heart);

        // 1.2秒後（アニメーション終了後）に削除
        setTimeout(() => heart.remove(), 1200);
    }

    /** 独立したヒットエフェクト（💢）を生成 */
    _createHitEffect(x, y) {
        const effect = document.createElement('div');
        effect.className = 'hit-effect';
        effect.textContent = '💢';
        effect.style.left = `${x}px`;
        effect.style.top = `${y}px`;

        this.speakiRoom.appendChild(effect);

        // 2秒後に自動削除
        setTimeout(() => {
            effect.remove();
        }, 2000);
    }

    /** アクションタイマーをリセットして新しく予約するヘルパー */
    _resetActionTimer(speaki, delay) {
        if (speaki.actionTimeout) {
            clearTimeout(speaki.actionTimeout);
        }
        speaki.actionTimeout = setTimeout(() => this.resetSpeakiAppearance(speaki), delay);
    }

    /** Speakiの見た目をリセット */
    resetSpeakiAppearance(speaki) {
        if (!speaki) return;

        // タイマー参照をクリア
        speaki.actionTimeout = null;

        // 基本感情に戻してアセット更新
        speaki._updateBaseEmotion();
        speaki.setExpression('idle', speaki.emotion);

        // アクション終了時に音声を停止
        if (speaki.currentVoice) {
            speaki.currentVoice.loop = false;
            speaki.currentVoice.pause();
            speaki.currentVoice = null;
        }
    }

    /** ギフトイベントのUI表示を更新する */
    updateGiftUI(mode) {
        const ui = document.getElementById('gift-event-ui');
        const receiveBtn = document.getElementById('gift-btn-receive');
        const reactionGroup = document.getElementById('reaction-group');
        const message = document.getElementById('gift-message');

        switch (mode) {
            case 'start':
                message.textContent = 'お土産を持ってきたよ！';
                ui.classList.remove('hidden');
                receiveBtn.classList.remove('hidden');
                reactionGroup.classList.add('hidden');
                break;
            case 'receiving':
                message.textContent = '何をくれるかな？';
                receiveBtn.classList.add('hidden');
                reactionGroup.classList.remove('hidden');
                break;
            case 'hide':
                ui.classList.add('hidden');
                break;
        }
    }

    /** ギフト受け取りイベントの開始 */
    startGiftReceiveEvent(speaki) {
        this.giftPartner = speaki;
        speaki.state = STATE.GIFT_WAIT_FOR_USER_REACTION;
        speaki.eventStartTime = Date.now();
        speaki._onStateChanged(speaki.state);

        this.updateGiftUI('start');
        this.playSound('gift');
    }

    /** ギフトを受け取る処理 */
    receiveGift() {
        if (this.giftTimeout) clearTimeout(this.giftTimeout);
        this.updateGiftUI('receiving');
    }

    /** リアクション処理 */
    handleReaction(type) {
        this.updateGiftUI('hide');

        if (this.giftPartner) {
            this.giftPartner.state = STATE.GIFT_REACTION;
            this.giftPartner.eventStartTime = Date.now();
            this.giftPartner._onStateChanged(this.giftPartner.state);
            this.playSound('happy');
        }
    }

    /** ギフトイベントの完了 */
    completeGiftEvent() {
        if (this.giftPartner) {
            this.giftPartner.state = STATE.IDLE;
            this.resetSpeakiAppearance(this.giftPartner);
        }
        this.giftPartner = null;
        this.lastGiftTime = Date.now();
    }

    /** ゲームループ */
    loop(time) {
        const dt = time - this.lastTime;
        this.lastTime = time;

        this.update(dt);
        this.draw();

        requestAnimationFrame((t) => this.loop(t));
    }

    /** ゲーム全体の更新 */
    update(dt) {
        // 全Speaki更新
        this.speakis.forEach(speaki => speaki.update(dt));

        // アイテムのライフサイクル更新 (かぼちゃ -> 赤ちゃん -> 大人)
        this._updateItemLifecycles();

        this.updateSpeakiListUI();
    }

    /** アイテムの成長・変化を管理 */
    _updateItemLifecycles() {
        const now = Date.now();
        for (let i = this.placedItems.length - 1; i >= 0; i--) {
            const item = this.placedItems[i];
            const def = ITEMS[item.id];
            if (!def || !def.transform) continue;

            if (now - item.placedTime > def.transform.duration) {
                this._processItemTransform(item, i, def.transform);
            }
        }
    }

    /** 個別アイテムの変身・成長実行 */
    _processItemTransform(item, index, transform) {
        if (transform.isAdult) {
            this.addSpeaki(item.x, item.y);
            this.placedItems.splice(index, 1);
            return;
        }

        if (transform.nextId) {
            this._transformItemTo(item, transform.nextId);
        }
    }

    /** アイテムを別の種類に切り替える */
    _transformItemTo(item, nextId) {
        const nextDef = ITEMS[nextId];
        if (!nextDef) return;

        item.id = nextId;
        item.size = nextDef.size || item.size;
        item.placedTime = Date.now(); // タイマーリセット

        if (nextDef.soundfile) this.playSound(nextDef.soundfile);
        if (nextDef.text) {
            item.displayText = nextDef.text;
            item.textDisplayUntil = Date.now() + 3000;
        }
    }

    /** 全スピキの状態リストUIを更新 */
    updateSpeakiListUI() {
        const listContainer = document.getElementById('speaki-list');
        if (!listContainer) return;

        if (this.speakis.length === 0) {
            listContainer.innerHTML = '<p class="empty-list">スピキはいません</p>';
            return;
        }

        let html = '';
        this.speakis.forEach(s => {
            const label = s.getFriendshipLabel();
            const cls = s.getFriendshipClass();
            const state = s.getStateLabel();
            const emotionLabel = this._getEmotionLabel(s);

            html += `
                <div class="speaki-entry">
                    <div class="speaki-entry-header">
                        <span class="speaki-name">スピキ #${s.id + 1}</span>
                        <span class="speaki-friendship ${cls}">${label}</span>
                    </div>
                    <div class="speaki-detail">
                        <div class="speaki-detail-item">
                            <span>状態:</span>
                            <span class="speaki-detail-val">${state}</span>
                        </div>
                        <div class="speaki-detail-item">
                            <span>感情:</span>
                            <span class="speaki-detail-val">${emotionLabel}</span>
                        </div>
                    </div>
                </div>
            `;
        });
        listContainer.innerHTML = html;

        this._updateGiftCountdownUI();
    }

    /** 感情の表示用テキストを取得 (ヘルパー) */
    _getEmotionLabel(s) {
        if (s.state === STATE.USER_INTERACTING) {
            if (s.emotion === 'sad') return 'いたい...';
            if (s.friendship >= 11) return 'うれしい！';
            return 'なでなで';
        }
        if (s.emotion === 'ITEM') return 'ワクワク';
        if (s.emotion === 'happy') return 'しあわせ';
        if (s.emotion === 'sad') return 'かなしい';
        return '穏やか';
    }

    /** ギフトカウントダウンUIの更新 (ヘルパー) */
    _updateGiftCountdownUI() {
        const countdownEl = document.getElementById('gift-countdown');
        if (!countdownEl) return;

        if (this.giftPartner) {
            countdownEl.textContent = '発生中';
            return;
        }

        const timeSinceGift = Date.now() - this.lastGiftTime;
        const remaining = Math.max(0, Math.ceil((30000 - timeSinceGift) / 1000));
        countdownEl.textContent = remaining > 0 ? `${remaining}s` : 'Ready!';
    }

    /** 描画処理 */
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // アイテムの描画
        this.placedItems.forEach(item => {
            const itemDef = ITEMS[item.id];
            if (!itemDef) return;

            const imgKey = itemDef.imagefile ? itemDef.imagefile.replace('.png', '') : '';
            if (this.images[imgKey]) {
                const img = this.images[imgKey];
                this.ctx.drawImage(img, item.x - item.size / 2, item.y - item.size / 2, item.size, item.size);
            }

            // アイテムのテキスト表示
            if (item.displayText && Date.now() < item.textDisplayUntil) {
                this.ctx.save();
                this.ctx.font = "bold 18px 'Zen Maru Gothic', sans-serif";
                this.ctx.textAlign = 'center';
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
                this.ctx.lineWidth = 3;

                const textY = item.y - item.size / 2 - 10;
                this.ctx.strokeText(item.displayText, item.x, textY);
                this.ctx.fillText(item.displayText, item.x, textY);
                this.ctx.restore();
            }
        });
    }
}


window.onload = () => {
    window.game = new Game();
};

import { STATE, ASSETS, ITEMS } from './config.js';
import { Speaki } from './speaki.js';
import { Item } from './item.js';
import { BabySpeaki } from './baby-speaki.js';

export class Game {
    /** コンストラクタ: ゲームの初期化 */
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.speakiRoom = document.getElementById('speaki-room');

        this.speakis = [];      // 複数管理用の配列
        this.nextCharId = 0;    // ユニークID用カウンタ
        this.highlightedCharId = null; // ハイライト中のキャラクターID
        this.furniture = [];
        this.placedItems = [];
        this.interactTarget = null; // 現在操作（タップ・なでなで）中のスピキ
        this.lastGiftTime = Date.now() - 20000; // 起動後10秒程度でギフト可能にする
        this.stockGifts = 0;        // 溜まったギフト回数
        this.bgmBuffer = null;      // Web Audio API用デコード済みデータ
        this.bgmSource = null;      // 再生用ノード
        this.audioCtx = null;       // AudioContext
        this.bgmFallback = null;    // CORSエラー時のフォールバック用

        this.images = {};      // キャッシュ用（パス -> Image）
        this.sounds = {};      // キャッシュ用（ファイル名 -> Audio）

        // 音声管理
        this.audioEnabled = false;
        this.isGameStarted = false; // 二重起動防止用フラグ

        Game.instance = this;

        this.loadResources();

        this.resize();
        this.init();
        window.addEventListener('resize', () => this.resize());

        this.lastTime = performance.now();

        // 開始ボタンの待機
        const startBtn = document.getElementById('start-button');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startGame());
        }

        requestAnimationFrame((t) => this.loop(t));
    }

    /** アセット（画像・音声）の全読み込み */
    loadResources() {
        // ネストされたアセットを再帰的に読み込む
        this._loadNestedAssets(ASSETS);

        // ITEMSに定義された画像と音声をすべて読み込む
        Object.values(ITEMS).forEach(item => {
            if (item.imagefile) {
                const path = `assets/images/${item.imagefile}`;
                const img = new Image();
                img.src = path;
                const key = item.imagefile.replace('.png', '');
                this.images[key] = img;
                this.images[path] = img; // パス指定でも引けるように
            }
            if (item.soundfile && !this.sounds[item.soundfile]) {
                const audio = new Audio(`assets/sounds/${item.soundfile}`);
                this.sounds[item.soundfile] = audio;
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
    playSound(fileName, pitch = 1.0) {
        if (!this.audioEnabled || !this.sounds[fileName]) return null;

        const audio = this.sounds[fileName];
        const playClone = new Audio(audio.src);
        playClone.volume = 0.5;

        // ピッチ（再生速度）の設定
        if (pitch !== 1.0) {
            playClone.defaultPlaybackRate = pitch;
            playClone.playbackRate = pitch;

            if ('preservesPitch' in playClone) playClone.preservesPitch = false;
            if ('webkitPreservesPitch' in playClone) playClone.webkitPreservesPitch = false;
            if ('mozPreservesPitch' in playClone) playClone.mozPreservesPitch = false;
        }

        const promise = playClone.play();
        if (promise !== undefined) {
            promise.then(() => {
                if (pitch !== 1.0) {
                    playClone.playbackRate = pitch;
                }
            }).catch(e => console.log("[Audio] Playback failed:", e));
        }

        return playClone;
    }

    /** ゲームの初期設定 */
    init() {
        this.initItemMenu();
        this.setupInteractions();
        this.setupDragAndDrop();
    }

    /** タイトル画面を閉じてゲームを開始する */
    startGame() {
        if (this.isGameStarted) return;
        this.isGameStarted = true;

        const titleScreen = document.getElementById('title-screen');
        if (titleScreen) {
            titleScreen.classList.add('fade-out');
        }

        this.audioEnabled = true;

        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        if (this.bgmBuffer) {
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
            this.bgmFallback.play().catch(e => console.log("[Audio] Fallback playback failed:", e));
            console.log("[Audio] Playing BGM via Standard Audio (Fallback).");
        }

        this.addSpeaki(); // これが最初の1匹目
    }

    /** アイテムメニューを動的に生成 */
    initItemMenu() {
        const itemList = document.getElementById('item-list');
        if (!itemList) return;

        itemList.innerHTML = ''; // クリア

        Object.entries(ITEMS).forEach(([id, config]) => {
            if (config.showInMenu) {
                let displayName = config.name || id;
                if (id === 'RandomGift') {
                    if (this.stockGifts <= 0) return;
                    displayName = `${config.name}（×${this.stockGifts}）`;
                }

                const itemDiv = document.createElement('div');
                itemDiv.className = 'draggable-item';
                itemDiv.dataset.id = id;
                itemDiv.dataset.type = config.type || 'item';
                itemDiv.draggable = true;
                itemDiv.textContent = displayName;
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

    /** インタラクション（ポインターイベント等）の設定 */
    setupInteractions() {
        const unlockAudio = () => {
            if (!this.audioEnabled) {
                this.audioEnabled = true;
                console.log("[Audio] System unlocked by user interaction.");
                const silent = new Audio();
                silent.play().catch(() => { });
            }
            window.removeEventListener('pointerdown', unlockAudio);
        };
        window.addEventListener('pointerdown', unlockAudio); // イベントリスナーの登録
        this.canvas.addEventListener('pointerdown', (e) => this.handleMouseDown(e));
        window.addEventListener('pointermove', (e) => this.handleMouseMove(e));
        window.addEventListener('pointerup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('contextmenu', (e) => this.handleContextMenu(e));

        // タッチイベント・紛失対応
        this.canvas.addEventListener('pointercancel', (e) => this.handleMouseUp(e));

        document.getElementById('gift-btn-receive').onclick = () => this.receiveGift();
        document.getElementById('reaction-btn-1').onclick = () => this.handleReaction(1);
        document.getElementById('reaction-btn-2').onclick = () => this.handleReaction(2);

        // 情報モーダルの制御
        const openInfoBtn = document.getElementById('open-info-btn');
        const closeInfoBtn = document.getElementById('close-info-btn');
        const infoModal = document.getElementById('info-modal');

        if (openInfoBtn && infoModal) {
            openInfoBtn.onclick = (e) => {
                e.stopPropagation();
                infoModal.classList.remove('hidden');
            };
        }
        if (closeInfoBtn && infoModal) {
            closeInfoBtn.onclick = (e) => {
                e.stopPropagation();
                infoModal.classList.add('hidden');
            };
        }
        if (infoModal) {
            infoModal.onclick = (e) => {
                if (e.target === infoModal) infoModal.classList.add('hidden');
            };
        }
    }

    /** ドラッグ＆ドロップの設定 */
    setupDragAndDrop() {
        const itemList = document.getElementById('item-list');
        if (!itemList) return;

        itemList.addEventListener('dragstart', (e) => {
            const item = e.target.closest('.draggable-item');
            if (item) {
                const data = { id: item.dataset.id, type: item.dataset.type };
                e.dataTransfer.setData('application/json', JSON.stringify(data));
                e.dataTransfer.effectAllowed = 'move';
            }
        });

        this.canvas.addEventListener('dragover', (e) => e.preventDefault());
        this.canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            const rawData = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain');
            if (rawData) this._handleItemDrop(rawData, e.clientX, e.clientY);
        });

        let touchDragData = null;
        let touchGhost = null;

        itemList.addEventListener('touchstart', (e) => {
            const item = e.target.closest('.draggable-item');
            if (item) {
                touchDragData = { id: item.dataset.id, type: item.dataset.type };
                touchGhost = item.cloneNode(true);
                touchGhost.style.position = 'fixed';
                touchGhost.style.pointerEvents = 'none';
                touchGhost.style.opacity = '0.7';
                touchGhost.style.zIndex = '1000';
                document.body.appendChild(touchGhost);
                this._updateTouchGhost(touchGhost, e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: false });

        window.addEventListener('touchmove', (e) => {
            if (touchGhost) {
                e.preventDefault();
                this._updateTouchGhost(touchGhost, e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: false });

        window.addEventListener('touchend', (e) => {
            if (touchDragData) {
                const touch = e.changedTouches[0];
                const target = document.elementFromPoint(touch.clientX, touch.clientY);

                if (target === this.canvas) {
                    this._handleItemDrop(JSON.stringify(touchDragData), touch.clientX, touch.clientY);
                }

                if (touchGhost) {
                    touchGhost.remove();
                    touchGhost = null;
                }
                touchDragData = null;
            }
        });
    }

    _updateTouchGhost(ghost, x, y) {
        ghost.style.left = `${x - 40}px`;
        ghost.style.top = `${y - 20}px`;
    }

    _handleItemDrop(rawData, clientX, clientY) {
        try {
            const data = JSON.parse(rawData);
            const rect = this.canvas.getBoundingClientRect();
            this.addItem(data.id, data.type, clientX - rect.left, clientY - rect.top);
        } catch (err) {
            console.error("[Drop] Parse error:", err);
        }
    }

    addItem(id, type, x, y) {
        let finalId = id;
        let itemDef = ITEMS[id];

        if (id === 'RandomGift') {
            if (this.stockGifts <= 0) return;
            const pool = Object.entries(ITEMS).filter(([key, def]) => def.isSpecialGift);
            if (pool.length > 0) {
                const [randomId, randomDef] = pool[Math.floor(Math.random() * pool.length)];
                finalId = randomId;
                itemDef = randomDef;
                this.stockGifts--;
                this.initItemMenu();
            } else {
                return;
            }
        }

        if (!itemDef) return;

        const item = new Item(finalId, x, y, {
            type: itemDef.type || type,
            ownerId: null // 必要に応じて将来的に設定
        });

        this.placedItems.push(item);

        if (itemDef.soundfile) {
            this.playSound(itemDef.soundfile, itemDef.pitch || 1.0);
        }

        if (itemDef.ignoreReaction) return;

        this.speakis.forEach(speaki => {
            const distToItem = Math.sqrt((speaki.pos.x - x) ** 2 + (speaki.pos.y - y) ** 2);
            if (distToItem > 500) return;
            if (speaki.status.friendship <= -31) return;
            // 空腹時は食べ物以外無視する
            if (speaki.status.hunger <= 0 && !itemDef.isFood) return;
            // お腹いっぱいの時は食べ物を無視する
            if (speaki.status.hunger >= 90 && itemDef.isFood) return;

            const nonInterruptibleStates = [
                STATE.GIFT_RETURNING,
                STATE.GIFT_WAIT_FOR_USER_REACTION,
                STATE.GIFT_REACTION,
                STATE.GIFT_TIMEOUT,
                STATE.USER_INTERACTING
            ];
            if (nonInterruptibleStates.includes(speaki.status.state)) return;

            const isGiftEventActive = [STATE.GIFT_LEAVING, STATE.GIFT_SEARCHING].includes(speaki.status.state);
            const isItemEventActive = [STATE.ITEM_APPROACHING, STATE.ITEM_ACTION].includes(speaki.status.state);

            if (isGiftEventActive || isItemEventActive) {
                speaki.status.stateStack.push(speaki.status.state);
            }

            speaki.status.friendship = Math.min(50, speaki.status.friendship + 2);
            speaki.approachItem(item, 50);
        });
    }

    handleMouseDown(e) {
        const { x, y } = this._getMousePos(e);
        const target = this._findSpeakiAt(x, y);
        if (!target) return;

        if (!this._isInteractable(target)) return;

        this._prepareInteraction(target, x, y);
    }

    _getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    _isInteractable(speaki) {
        const interactableStates = [
            STATE.IDLE, STATE.WALKING, STATE.GIFT_RETURNING,
            STATE.GIFT_LEAVING, STATE.GIFT_WAIT_FOR_USER_REACTION, STATE.ITEM_APPROACHING,
            STATE.USER_INTERACTING,
        ];
        return interactableStates.includes(speaki.status.state);
    }

    _findSpeakiAt(x, y) {
        for (let i = this.speakis.length - 1; i >= 0; i--) {
            const s = this.speakis[i];
            const dist = Math.sqrt((x - s.pos.x) ** 2 + (y - s.pos.y) ** 2);
            const isHeadHit = (y < s.pos.y - s.status.size / 5);
            if (dist < s.status.size / 2 && isHeadHit) return s;
        }
        return null;
    }

    _prepareInteraction(speaki, x, y) {
        speaki.interaction.isInteracting = true;
        speaki.timers.interactStart = Date.now();
        speaki.timers.stateStart = Date.now(); // 状態遷移タイマーもリセット（IDLE判定による即時終了を防ぐ）
        speaki.interaction.lastMouseX = x;
        speaki.interaction.lastMouseY = y;
        speaki.interaction.isPetting = false;

        const interruptibleStates = [
            STATE.GIFT_LEAVING, STATE.GIFT_SEARCHING,
            STATE.GIFT_RETURNING, STATE.GIFT_WAIT_FOR_USER_REACTION,
            STATE.ITEM_APPROACHING, STATE.ITEM_ACTION
        ];

        if (interruptibleStates.includes(speaki.status.state)) {
            speaki.status.stateStack.push(speaki.status.state);
        }

        speaki.status.state = STATE.USER_INTERACTING;
        this.interactTarget = speaki;
    }

    handleContextMenu(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // クリック位置のアイテムを探して削除
        for (let i = this.placedItems.length - 1; i >= 0; i--) {
            const it = this.placedItems[i];
            const dist = Math.sqrt((it.x - x) ** 2 + (it.y - y) ** 2);
            if (dist < it.size / 2) {
                this.placedItems.splice(i, 1);
                this.playSound('アーウ.mp3', 0.8);
                console.log(`Item ${it.id} removed by user.`);
                return;
            }
        }
    }

    handleMouseMove(e) {
        if (!this.interactTarget) return;

        const speaki = this.interactTarget;
        const { x, y } = this._getMousePos(e);

        const dx = x - speaki.interaction.lastMouseX;
        const dy = y - speaki.interaction.lastMouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= 5) return;

        if (speaki.status.state === STATE.USER_INTERACTING) {
            speaki.interaction.isPetting = true;
            speaki.status.friendship = Math.min(50, speaki.status.friendship + 0.2);
            if (speaki.visual.currentVoice) speaki.visual.currentVoice.loop = true;
        }

        speaki.interaction.isActuallyDragging = true;
        const targetEmotion = (speaki.status.friendship <= -11) ? 'sad' : 'happy';

        if (speaki.status.action !== 'idle' || speaki.status.emotion !== targetEmotion) {
            speaki.setExpression('idle', targetEmotion);
        }

        if (speaki.interaction.isPetting && speaki.status.emotion === 'happy') {
            const now = Date.now();
            if (now - speaki.timers.lastHeartTime > 150) {
                this._createPettingHeart(speaki);
                speaki.timers.lastHeartTime = now;
            }
        }

        speaki.visual.targetDistortion.skewX = Math.max(-20, Math.min(20, dx * -1.0));
        speaki.visual.targetDistortion.rotateX = Math.max(-15, Math.min(15, dy * -0.5));
        speaki.visual.targetDistortion.scale = 1.05;

        speaki.interaction.lastMouseX = x;
        speaki.interaction.lastMouseY = y;
    }

    handleMouseUp() {
        const speaki = this.interactTarget;
        if (!speaki) return;

        const isTap = (Date.now() - speaki.timers.interactStart < 300) && !speaki.interaction.isPetting;
        console.log(`[Debug][${speaki.id}] MouseUp: isTap=${isTap}, dur=${Date.now() - speaki.timers.interactStart}, isPetting=${speaki.interaction.isPetting}`);

        if (isTap) {
            this._handleSpeakiTap(speaki);
            // タップアクション（音声再生）が始まった瞬間にタイマーをリセットし、
            // 以前の長押し時間（elapsed）によって即座にステートが終了するのを防ぐ
            speaki.timers.stateStart = Date.now();
            console.log(`[Debug][${speaki.id}] stateStart reset to ${speaki.timers.stateStart}`);
            speaki.interaction.isInteracting = false; // フラグだけ下ろして、状態（USER_INTERACTING）の解除はボイス終了を待つ
        }

        if (isTap || speaki.interaction.isActuallyDragging) {
            this._resetActionTimer(speaki, 2000);
        }

        // 叩き（タップ）以外の時（なでなでやドラッグ終了時）は即座にクリーンアップして音を止める
        if (!isTap) {
            this._cleanupInteraction(speaki);
        } else {
            this.interactTarget = null; // タップの時は参照だけ外す
        }
    }

    _handleSpeakiTap(speaki) {
        // 好感度計算
        speaki.status.friendship = Math.max(-50, speaki.status.friendship - 5);
        this._createHitEffect(speaki.interaction.lastMouseX, speaki.interaction.lastMouseY);

        // しきい値を下回ったか（逃げ出すか）の判定
        if (speaki.status.friendship <= -31) {
            // 限界突破：今のリアクションをかき消して逃げる（前の音を強制停止）
            speaki.interaction.isInteracting = false;

            // もしこの個体がギフト担当だった場合、担当を解除してイベントを中断する (ゾンビ化防止)
            if (this.giftPartner === speaki) {
                this.completeGiftEvent(null); // NULLを渡してリセットのみ行う
                console.log(`[Game] Gift event aborted because Speaki ${speaki.id} fled.`);
            }

            speaki.status.state = STATE.IDLE; // 一旦IDLEにしてから次フレームで即座にWALKING(隠れ家)へ移行させる
            speaki.setExpression('idle', 'sad'); // 真っ先に悲しい表情と声にする
            console.log(`[Game] Speaki ${speaki.id} reached breaking point and is fleeing.`);
        } else {
            // 通常の叩かれリアクション：Strict Stopにより、連打時は前の音が消えて新しい音が鳴る
            speaki.setExpression('surprised', 'sad');
        }

        // 音源がない場合のフォールバック（playSoundを直接呼ばなくなったが、setExpression内で再生される）
    }

    _cleanupInteraction(speaki) {
        speaki.interaction.isInteracting = false;
        speaki.interaction.isPetting = false;
        speaki.interaction.isActuallyDragging = false;
        speaki.timers.stateStart = Date.now();
        speaki.pos.destinationSet = false;
        speaki.status.state = (speaki.status.stateStack.length > 0) ? speaki.status.stateStack.pop() : STATE.IDLE;
        speaki._stopCurrentVoice();
        speaki._onStateChanged(speaki.status.state); // 追加：復帰後のアニメーション/アセットを適用
        this.interactTarget = null;
    }

    _createPettingHeart(speaki) {
        const heart = document.createElement('div');
        heart.className = 'petting-heart';
        heart.textContent = '❤️';
        const offsetX = (Math.random() - 0.5) * 60;
        const offsetY = -speaki.status.size / 2 + (Math.random() - 0.5) * 40;
        heart.style.left = `${speaki.pos.x + offsetX}px`;
        heart.style.top = `${speaki.pos.y + offsetY}px`;
        this.speakiRoom.appendChild(heart);
        setTimeout(() => heart.remove(), 1200);
    }

    _createHitEffect(x, y) {
        const effect = document.createElement('div');
        effect.className = 'hit-effect';
        effect.style.left = `${x}px`;
        effect.style.top = `${y}px`;
        this.speakiRoom.appendChild(effect);
        setTimeout(() => effect.remove(), 2000);
    }

    _resetActionTimer(speaki, delay) {
        if (speaki.timers.actionTimeout) clearTimeout(speaki.timers.actionTimeout);
        speaki.timers.actionTimeout = setTimeout(() => this.resetSpeakiAppearance(speaki), delay);
    }

    resetSpeakiAppearance(speaki) {
        if (!speaki) return;
        speaki.timers.actionTimeout = null;
        speaki._updateBaseEmotion();
        speaki.setExpression('idle', speaki.status.emotion);
        if (speaki.visual.currentVoice) {
            speaki.visual.currentVoice.loop = false;
            speaki.visual.currentVoice.pause();
            speaki.visual.currentVoice = null;
        }
    }

    updateGiftUI(mode) {
        const ui = document.getElementById('gift-event-ui');
        const receiveBtn = document.getElementById('gift-btn-receive');
        const reactionGroup = document.getElementById('reaction-group');
        const message = document.getElementById('gift-message');

        switch (mode) {
            case 'start':
                message.textContent = 'プレゼントを持ってきてくれた！';
                ui.classList.remove('hidden');
                receiveBtn.classList.remove('hidden');
                reactionGroup.classList.add('hidden');
                break;
            case 'receiving':
                message.textContent = 'お礼を言おう';
                receiveBtn.classList.add('hidden');
                reactionGroup.classList.remove('hidden');
                break;
            case 'hide':
                ui.classList.add('hidden');
                break;
        }
    }

    startGiftReceiveEvent(speaki) {
        this.giftPartner = speaki;
        speaki.status.state = STATE.GIFT_WAIT_FOR_USER_REACTION;
        speaki.timers.stateStart = Date.now();
        speaki._onStateChanged(speaki.status.state);
        this.updateGiftUI('start');
        this.playSound('gift');
    }

    receiveGift() {
        if (this.giftTimeout) clearTimeout(this.giftTimeout);
        this.updateGiftUI('receiving');
    }

    handleReaction(type) {
        this.updateGiftUI('hide');
        if (this.giftPartner) {
            this.giftPartner.status.state = STATE.GIFT_REACTION;
            this.giftPartner.timers.stateStart = Date.now();
            this.giftPartner._onStateChanged(this.giftPartner.status.state);
            this.playSound('happy');
            this.stockGifts++;
            this.initItemMenu();
        }
    }

    completeGiftEvent(char) {
        if (char) {
            this.resetSpeakiAppearance(char);
        }
        this.giftPartner = null;
        this.lastGiftTime = Date.now();
        this.updateGiftUI('hide'); // 追加：UIを確実に隠す
    }

    loop(time) {
        if (!this.lastTime) this.lastTime = time;
        const dt = time - this.lastTime;
        this.lastTime = time;

        // dtが極端に大きい場合（タブがバックグラウンドだった場合など）は上限を設ける
        const clampedDt = Math.min(dt, 100);

        this.update(clampedDt);
        this.draw();
        requestAnimationFrame((t) => this.loop(t));
    }

    update(dt) {
        this.speakis.forEach(speaki => speaki.update(dt));
        this._updateItemLifecycles(dt);

        // UIの定期更新 (約250msごと)
        if (!this.lastUIUpdate || Date.now() - this.lastUIUpdate > 250) {
            this.updateSpeakiListUI();
            this.lastUIUpdate = Date.now();
        }
    }

    addSpeaki(x, y, type = 'speaki') {
        const id = this.nextCharId++;
        // 指定がない場合は画面中央付近、ただし座標が不安定な場合は固定値 40% / 50%
        const defX = (this.canvas.width > 0) ? this.canvas.width * 0.4 : window.innerWidth * 0.4;
        const defY = (this.canvas.height > 0) ? this.canvas.height * 0.5 : window.innerHeight * 0.5;

        const finalX = (x !== undefined && x !== 0) ? x : defX + (Math.random() * 100 - 50);
        const finalY = (y !== undefined && y !== 0) ? y : defY + (Math.random() * 100 - 50);

        let char;
        if (type === 'baby') {
            char = new BabySpeaki(id, this.speakiRoom, finalX, finalY);
        } else {
            char = new Speaki(id, this.speakiRoom, finalX, finalY);
        }
        this.speakis.push(char);
        if (id === 0) {
            console.log(char);
        }
        this.updateSpeakiListUI();
    }

    /** ハイライト設定 */
    setHighlight(id) {
        this.highlightedCharId = (this.highlightedCharId === id) ? null : id;
        this.updateSpeakiListUI(true); // UI側の反映（強制更新）
    }

    /** キャラクター削除 */
    removeSpeaki(id) {
        const index = this.speakis.findIndex(s => s.id === id);
        if (index !== -1) {
            const s = this.speakis[index];

            // 削除される個体がギフト担当だった場合、担当を解除 (ゾンビ化防止)
            if (this.giftPartner === s) {
                this.completeGiftEvent(null);
                console.log(`[Game] Gift event aborted because Speaki ${id} was removed.`);
            }

            if (s.visual.dom.container) s.visual.dom.container.remove();
            this.speakis.splice(index, 1);
            if (this.highlightedCharId === id) this.highlightedCharId = null;
            this.updateSpeakiListUI(true);
        }
    }

    /** 改名 */
    renameSpeaki(id, newName) {
        const s = this.speakis.find(s => s.id === id);
        if (s) {
            s.name = newName;
            this.updateSpeakiListUI(true);
        }
    }

    /** 赤ちゃんスピキの進化 */
    evolveBaby(baby) {
        if (!baby) return;
        console.log(`[Game] BabySpeaki ${baby.id} is evolving!`);

        // DOM削除
        if (baby.visual.dom.container) baby.visual.dom.container.remove();

        // 配列から削除
        const index = this.speakis.indexOf(baby);
        if (index !== -1) {
            this.speakis.splice(index, 1);
        }

        // 大人のSpeakiを生成（IDは引き継ぐ）
        const adult = new Speaki(baby.id, this.speakiRoom, baby.pos.x, baby.pos.y);

        // ステータスの継承
        adult.name = baby.name; // 名前継承
        adult.status.friendship = baby.status.friendship;
        adult.status.hunger = baby.status.hunger;

        // 配列に追加（元の位置へ）
        if (index !== -1) {
            this.speakis.splice(index, 0, adult);
        } else {
            this.speakis.push(adult);
        }

        this.playSound('happy', 1.0);
        this.updateSpeakiListUI(true);
    }

    _updateItemLifecycles(dt) {
        for (let i = this.placedItems.length - 1; i >= 0; i--) {
            const item = this.placedItems[i];
            const result = item.update(dt);

            if (result.action === 'delete') {
                this.placedItems.splice(i, 1);
            } else if (result.action === 'transform') {
                this._processItemTransform(item, i, result.transform);
            }
        }
    }

    _processItemTransform(item, index, transform) {
        if (transform.isAdult) {
            const type = typeof transform.isAdult === 'string' ? transform.isAdult : 'speaki';
            this.addSpeaki(item.x, item.y, type);
            this.placedItems.splice(index, 1);
            return;
        }
        if (transform.nextId) {
            this._transformItemTo(item, transform.nextId);
        }
    }

    _transformItemTo(item, nextId) {
        const nextDef = ITEMS[nextId];
        if (!nextDef) return;

        // クラスのプロパティを更新
        item.id = nextId;
        item.size = nextDef.size || item.size;
        item.placedTime = Date.now();

        if (nextDef.soundfile) this.playSound(nextDef.soundfile, nextDef.pitch || 1.0);
        if (nextDef.text) {
            item.displayText = nextDef.text;
            item.textDisplayUntil = Date.now() + 15000;
        }
    }

    updateSpeakiListUI(force = false) {
        const listContainer = document.getElementById('speaki-list');
        if (!listContainer) return;

        // 入力中（フォーカスがある場合）は、forceがfalseなら更新をスキップして、入力を妨げないようにする
        if (!force && listContainer.contains(document.activeElement)) return;
        if (this.speakis.length === 0) {
            // ゲーム開始後のみ自動追加。startGameでも1回呼ばれるが、
            // 万が一削除された場合やタイミングの競合に備える。
            if (this.isGameStarted) {
                this.addSpeaki();
            }
            return;
        }

        let html = '';
        this.speakis.forEach(s => {
            const state = s.getStateLabel();
            const emotionLabel = this._getEmotionLabel(s);
            const isHighlighted = this.highlightedCharId === s.id;

            // 好感度ゲージの計算 (-50 ~ 50 を 0% ~ 100% にマッピング)
            const friendshipScore = Math.min(50, Math.max(-50, s.status.friendship));
            const friendshipPct = ((friendshipScore + 50) / 100) * 100;

            // 空腹度ゲージの計算 (0 ~ 100)
            const hungerPct = Math.min(100, Math.max(0, s.status.hunger));

            html += `
            <div class="speaki-entry ${isHighlighted ? 'active' : ''}">
                <div class="speaki-entry-header">
                    <button class="highlight-toggle ${isHighlighted ? 'active' : ''}" 
                        onclick="event.stopPropagation(); window.game.setHighlight(${s.id})">
                        ${isHighlighted ? '★' : '☆'}
                    </button>
                    <input class="speaki-name-input" value="${s.name}" 
                        onchange="window.game.renameSpeaki(${s.id}, this.value)">
                    <span class="speaki-state-tag">${state} [${emotionLabel}]</span>
                </div>
                
                <div class="speaki-gauges">
                    <div class="gauge-item mini-row">
                        <span class="mini-label">好感度: ${s.status.friendship.toFixed(0)}</span>
                        <div class="gauge-bar"><div class="gauge-fill friendship" style="width: ${friendshipPct}%"></div></div>
                    </div>
                    <div class="gauge-item mini-row">
                        <span class="mini-label">空腹度: ${s.status.hunger.toFixed(0)}%</span>
                        <div class="gauge-bar"><div class="gauge-fill hunger" style="width: ${hungerPct}%"></div></div>
                    </div>
                </div>
            </div>
        `;
        });
        listContainer.innerHTML = html;
    }

    /** アセット定義を再帰的に探索して読み込む */
    _loadNestedAssets(node) {
        if (!node || typeof node !== 'object') return;

        // 子要素が配列（バリエーションリスト）なら、それは末端のアセットデータ群
        if (Array.isArray(node)) {
            node.forEach(data => {
                if (data.imagefile && !this.images[data.imagefile]) {
                    const img = new Image();
                    img.src = `assets/images/${data.imagefile}`;
                    this.images[data.imagefile] = img;
                    // キーでも引けるように（マッピングの互換性維持のため）
                    const key = data.imagefile.replace('.png', '');
                    this.images[key] = img;
                }
                if (data.soundfile && !this.sounds[data.soundfile]) {
                    const audio = new Audio(`assets/sounds/${data.soundfile}`);
                    this.sounds[data.soundfile] = audio;
                }
            });
            return;
        }

        // それ以外はさらに深く探索
        Object.values(node).forEach(child => this._loadNestedAssets(child));
    }

    _getEmotionLabel(s) {
        if (s.status.state === STATE.USER_INTERACTING) {
            if (s.status.emotion === 'sad') return 'いたい...';
            if (s.status.friendship >= 11) return 'うれしい！';
            return 'なでなで';
        }
        if (s.status.emotion === 'ITEM') return 'ワクワク';
        if (s.status.emotion === 'happy') return 'しあわせ';
        if (s.status.emotion === 'sad') return 'かなしい';
        return '穏やか';
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.placedItems.forEach(item => {
            item.draw(this.ctx, this.images);
        });
    }
}

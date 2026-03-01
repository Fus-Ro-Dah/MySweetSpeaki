import { STATE, ASSETS, ITEMS, JOBS } from './config.js';
import { Speaki } from './speaki.js';
import { Item } from './item.js';
import { BabySpeaki } from './baby-speaki.js';
import { ChildSpeaki } from './child-speaki.js';
import { NPCCharacter } from './npc-character.js';
import { Ashur } from './ashur.js';
import { Posher } from './posher.js';


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
        this.plastics = 0;        // 溜まったプラスチック（旧ギフト）回数
        this.bgmBuffer = null;      // Web Audio API用デコード済みデータ
        this.bgmSource = null;      // 再生用ノード
        this.audioCtx = null;       // AudioContext
        this.bgmFallback = null;    // CORSエラー時のフォールバック用

        this.images = {};      // キャッシュ用（パス -> Image）
        this.sounds = {};      // キャッシュ用（ファイル名 -> Audio）

        // 音声管理
        this.audioEnabled = false;
        this.isGameStarted = false; // 二重起動防止用フラグ

        // 交流管理用プロパティ
        this.lastSocialTime = Date.now();
        this.socialInterval = 12000 + Math.random() * 8000; // 12-20秒おき

        // 新機能用ステート
        this.happiness = 0;
        this.maxHappiness = 5000; // 仮のMAX値
        this.unlocks = {
            feeder: false,
            hungerDecayLv: 0, // 0から始まり、解放ごとに+1
            affectionDecayLv: 0, // NEW: 0から始まり、解放ごとに+1
            autoReceive: false,
            mocaronUnlocked: false,
            reloadReductionLv: 0
        };
        this.itemCooldowns = {}; // { itemId: endTimestamp }
        this.isGameCleared = false;

        Game.instance = this;

        this.loadResources();

        this.resize();
        this.init();
        window.addEventListener('resize', () => this.resize());

        this.lastTime = performance.now();

        // モード選択ボタンの待機
        this._bindButton('start-relaxed-btn', () => this.selectMode('relaxed'));
        this._bindButton('start-challenge-btn', () => this.selectMode('challenge'));
        this._bindButton('confirm-start-btn', () => {
            if (this.isGameStarted) {
                // ゲーム開始後にヘルプとして開いた場合は閉じるだけ
                const modal = document.getElementById('mode-info-modal');
                if (modal) modal.classList.add('hidden');
            } else {
                this.startGame();
            }
        });

        requestAnimationFrame((t) => this.loop(t));
    }

    /** iOS Safari対策: clickとtouchend両方を安全に処理するヘルパー */
    _bindButton(id, callback) {
        const btn = document.getElementById(id);
        if (!btn) return;
        this._bindElement(btn, callback);
    }

    _bindElement(btn, callback) {
        if (!btn) return;
        let lastExecution = 0;
        const execute = (e) => {
            const now = Date.now();
            if (now - lastExecution < 400) return; // 重複発火防止
            lastExecution = now;

            // touchend経由の場合は、ブラウザによる300ms後のclick自動発火を可能な限り防ぐ
            if (e.type === 'touchend') {
                if (e.cancelable) e.preventDefault();
            }
            callback(e);
        };
        btn.addEventListener('touchend', execute);
        btn.addEventListener('click', execute);
    }

    /** モード選択時の処理 */
    selectMode(mode) {
        this.gameMode = mode;
        const title = document.getElementById('mode-info-title');
        const modal = document.getElementById('mode-info-modal');

        const infoRelaxed = document.getElementById('info-relaxed');
        const infoChallenge = document.getElementById('info-challenge');

        if (mode === 'relaxed') {
            title.textContent = 'のんびり育成モード';
            if (infoRelaxed) infoRelaxed.classList.remove('hidden');
            if (infoChallenge) infoChallenge.classList.add('hidden');
        } else {
            title.textContent = 'チャレンジモード';
            if (infoRelaxed) infoRelaxed.classList.add('hidden');
            if (infoChallenge) infoChallenge.classList.remove('hidden');
        }

        if (modal) modal.classList.remove('hidden');
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

        // 幸福度とプラスチックの初期表示
        this.updateHappinessUI();
        this.updatePlasticStockUI();

        // アンロックメニューのリスナー
        const unlockModal = document.getElementById('unlock-modal');

        this._bindButton('open-unlock-btn', () => {
            this.initUnlockMenu();
            if (unlockModal) unlockModal.classList.remove('hidden');
        });

        this._bindButton('close-unlock-btn', () => {
            if (unlockModal) unlockModal.classList.add('hidden');
        });
    }

    /** タイトル画面を閉じてゲームを開始する */
    startGame() {
        try {
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

            // モーダルを閉じる
            const modal = document.getElementById('mode-info-modal');
            if (modal) modal.classList.add('hidden');

            // モードに応じた初期化
            if (this.gameMode === 'relaxed') {
                document.body.classList.add('mode-relaxed');
                this.unlocks.hungerDecayLv = 4;
                this.unlocks.affectionDecayLv = 4;
                this.unlocks.reloadReductionLv = 20;
            }

            // 最初のスピキを中央に1匹だけ生成
            const centerX = this.canvas.width / 2;
            const centerY = this.canvas.height / 2;
            this.addSpeaki(centerX, centerY, 'speaki');

        } catch (e) {
            alert("Error starting game: " + e.message + "\n" + e.stack);
            console.error(e);
        }
    }

    /** アイテムメニューを動的に生成 */
    initItemMenu() {
        const itemList = document.getElementById('item-list');
        const jobList = document.getElementById('job-list');

        if (itemList) itemList.innerHTML = '';
        if (jobList) jobList.innerHTML = '';

        if (!itemList && !jobList) return;

        // アイテムの描画
        if (itemList) {
            Object.keys(ITEMS).forEach(id => {
                const def = ITEMS[id];
                if (def.showInMenu === false) return;

                const div = this._createDraggableMenuItem(id, def, 'item');
                itemList.appendChild(div);
            });
        }

        // バイトの描画
        if (jobList) {
            Object.keys(JOBS).forEach(id => {
                const def = JOBS[id];
                if (def.showInMenu === false) return;

                const div = this._createDraggableMenuItem(id, def, 'job');
                // バイトはクリックでも即実行ボタンとして機能させる
                div.addEventListener('click', () => {
                    this.callNPC(def.npcType);
                });
                jobList.appendChild(div);
            });
        }

        // 初回のUI状態反映
        this.updateJobMenuUI();
        this.updatePlasticStockUI();
    }

    /** ドラッグ可能なアイテム要素を作成する内部ヘルパー */
    _createDraggableMenuItem(id, def, type) {
        const div = document.createElement('div');
        div.className = 'draggable-item';
        div.draggable = true;
        if (id === 'RandomGift') {
            div.innerHTML = `${def.name} (<img src="assets/images/gift.png" class="mini-icon"> -1)`;
        } else {
            div.textContent = def.name;
        }
        div.dataset.id = id;
        div.dataset.type = type;

        div.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', JSON.stringify({ id, type }));
        });
        return div;
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
        // 右クリックでのアイテム削除を無効化するため、イベントリスナーを削除
        // this.canvas.addEventListener('contextmenu', (e) => this.handleContextMenu(e));

        // 代わりにブラウザのデフォルトメニューを抑制するだけにする（オプション）
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        // タッチイベント・紛失対応
        this.canvas.addEventListener('pointercancel', (e) => this.handleMouseUp(e));

        this._bindButton('gift-btn-receive', () => this.receiveGift());
        this._bindButton('reaction-btn-1', () => this.handleReaction(1));
        this._bindButton('reaction-btn-2', () => this.handleReaction(2));

        // モーダルの制御（共通化）
        const setupModal = (btnId, closeId, modalId) => {
            const modal = document.getElementById(modalId);

            this._bindButton(btnId, () => {
                if (modal) modal.classList.remove('hidden');
            });

            this._bindButton(closeId, () => {
                if (modal) modal.classList.add('hidden');
            });

            if (modal) {
                this._bindElement(modal, (e) => {
                    if (e.target === modal) modal.classList.add('hidden');
                });
            }
        };

        // 「？」ボタンで現在のモードの説明を再表示する
        this._bindButton('open-tutorial-btn', () => {
            const modal = document.getElementById('mode-info-modal');
            if (modal) modal.classList.remove('hidden');
        });

        // モード説明モーダルの「OK」ボタンや背景クリックでの閉じ処理を明示的に追加
        const modeModal = document.getElementById('mode-info-modal');
        if (modeModal) {
            this._bindElement(modeModal, (e) => {
                if (e.target === modeModal) modeModal.classList.add('hidden');
            });
        }

        setupModal('open-memo-btn', 'close-memo-btn', 'memo-modal');
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
            let id, type;
            try {
                // 新しいJSON形式を試す
                const data = JSON.parse(rawData);
                id = data.id;
                type = data.type;
            } catch (e) {
                // 従来のIDのみ(string)形式への互換性
                id = rawData;
                type = 'item';
            }

            const rect = this.canvas.getBoundingClientRect();
            this.addItem(id, type, clientX - rect.left, clientY - rect.top);
        } catch (err) {
            console.error("[Drop] Parse error:", err);
        }
    }

    addItem(id, type, x, y) {
        let def;

        // クールダウンチェック
        const now = Date.now();
        if (this.itemCooldowns[id] && now < this.itemCooldowns[id]) {
            this.playSound('アーウ.mp3', 0.5);
            return;
        }

        // 【修正】バイト(Job)の場合は専用オブジェクトから取得してNPC呼出
        if (type === 'job') {
            def = JOBS[id];
            if (def) {
                this.callNPC(def.npcType);
            }
            return;
        }

        // --- ここから通常のアイテムロジック ---
        if (id === 'RandomGift') {
            // プラスチックを消費
            if (this.plastics <= 0) {
                this.playSound('アーウ.mp3', 0.5);
                return;
            }
            const pool = Object.entries(ITEMS).filter(([key, d]) => d.isSpecialGift);
            if (pool.length > 0) {
                const [randomId, randomDef] = pool[Math.floor(Math.random() * pool.length)];
                id = randomId;
                def = randomDef;
                this.plastics--;
                this.initItemMenu();
                this.updatePlasticStockUI();
            } else {
                return;
            }
        } else {
            def = ITEMS[id];
        }

        if (!def) return;

        // 配置処理
        const item = new Item(id, x, y, {
            type: def.type || type,
            ownerId: null
        });

        // リロード時間の適用
        if (def.reloadTime) {
            // 固定秒数(1秒=1000ms)ずつ短縮。最小500ms（0.5秒）を維持。
            const reduction = (this.unlocks.reloadReductionLv || 0) * 1000;
            const duration = Math.max(500, def.reloadTime - reduction);
            this.itemCooldowns[id] = now + duration;
        }

        // 手動配置されたアイテムに初回ギフトフラグを付与
        item.isInitialGift = true;

        this.placedItems.push(item);

        if (def.soundfile) {
            this.playSound(def.soundfile, def.pitch || 1.0);
        }

        if (def.ignoreReaction) return;

        this.speakis.forEach(speaki => {
            // NPC（hasEmotion=false）はアイテムを完全に無視する
            if (!speaki.hasEmotion) return;

            const distToItem = Math.sqrt((speaki.pos.x - x) ** 2 + (speaki.pos.y - y) ** 2);
            if (distToItem > 500) return;
            if (speaki.status.friendship <= -31) return;
            // 空腹時は食べ物以外無視する
            if (speaki.status.hunger <= 0 && !def.isFood) return;
            // お腹いっぱいの時は食べ物を無視する
            if (speaki.status.hunger >= 90 && def.isFood) return;

            const nonInterruptibleStates = [
                STATE.GIFT_RETURNING,
                STATE.GIFT_WAIT_FOR_USER_REACTION,
                STATE.GIFT_REACTION,
                STATE.GIFT_TIMEOUT,
                STATE.USER_INTERACTING,
                STATE.GAME_APPROACHING,
                STATE.GAME_REACTION
            ];
            if (nonInterruptibleStates.includes(speaki.status.state)) return;

            const isGiftEventActive = [STATE.GIFT_LEAVING, STATE.GIFT_SEARCHING].includes(speaki.status.state);
            const isItemEventActive = [STATE.ITEM_APPROACHING, STATE.ITEM_ACTION].includes(speaki.status.state);

            if (isGiftEventActive || isItemEventActive) {
                speaki.status.stateStack.push(speaki.status.state);
            }

            // 好感度上昇は BaseCharacter._performItemAction （到着時）で行うため、ここでは行わない
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
        if (!speaki.canInteract) return false;

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

    /** 幸福度ゲージの更新 */
    updateHappinessUI() {
        const fill = document.getElementById('happiness-bar-fill');
        const pumpkinImg = document.getElementById('happiness-pumpkin');

        const pctFull = (this.happiness / this.maxHappiness) * 100;

        if (fill) {
            fill.style.width = `${Math.min(100, pctFull)}%`;
        }

        // かぼちゃの画像切り替え (p0-p4)
        if (pumpkinImg) {
            let stage = 0;
            if (pctFull >= 100) {
                stage = 4;
            } else if (pctFull >= 75) {
                stage = 3;
            } else if (pctFull >= 50) {
                stage = 2;
            } else if (pctFull >= 20) {
                stage = 1;
            } else {
                stage = 0;
            }
            pumpkinImg.src = `assets/images/p${stage}.png`;
        }

        if (this.happiness >= this.maxHappiness && !this.isGameCleared) {
            this.triggerGameClear();
        }
    }

    /** ゲームクリア演出 */
    triggerGameClear() {
        this.isGameCleared = true;
        const overlay = document.getElementById('game-clear-overlay');
        const continueBtn = document.getElementById('continue-game-btn');

        if (overlay) {
            overlay.classList.remove('hidden');
            this.playSound('happy', 0.8);

            if (continueBtn) {
                continueBtn.onclick = () => {
                    overlay.classList.add('hidden');
                    // ゲームクリアフラグはtrueのままにして、再発動を防ぐ
                };
            }
        }
    }

    /** プラスチックの在庫表示更新 */
    updatePlasticStockUI() {
        const count = document.getElementById('gift-stock-count');
        const modalCount = document.getElementById('modal-plastic-count');
        if (count) count.textContent = Math.floor(this.plastics);
        if (modalCount) modalCount.textContent = Math.floor(this.plastics);
    }

    startGiftReceiveEvent(speaki) {
        this.giftPartner = speaki;

        // 自動回収が有効な場合
        if (this.unlocks.autoReceive) {
            this.handleReaction('auto');
            return;
        }

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

            // プラスチックの報酬計算
            const friendship = this.giftPartner.status.friendship;
            let plasticGain = 1;
            if (friendship > 50) plasticGain = 3;
            if (friendship > 80) plasticGain = 5;
            this.plastics += plasticGain;

            this.initItemMenu();
            this.updatePlasticStockUI();
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
        // 死亡・削除予定のスピキを処理
        for (let i = this.speakis.length - 1; i >= 0; i--) {
            const s = this.speakis[i];
            s.update(dt);

            if (s.isPendingDeletion) {
                // 削除前にその場に「かぼちゃ（Pumpkin）」を配置
                console.log(`[Game] Speaki ${s.id} died and returned to DeathWimple.`);
                this.addItem('DeathWimple', 'item', s.pos.x, s.pos.y);

                // --- クリーンアップ ---
                if (this.interactTarget === s) this.interactTarget = null;
                if (this.giftPartner === s) this.completeGiftEvent(null);

                if (s.socialConfig && s.socialConfig.partner) {
                    const partner = s.socialConfig.partner;
                    console.log(`[Game] Releasing partner ${partner.id} from social interaction.`);
                    partner.status.state = (partner.status.stateStack.length > 0) ? partner.status.stateStack.pop() : STATE.IDLE;
                    partner.status.socialTurnCount = 0;
                    partner.status.isMySocialTurn = false;
                    partner.socialConfig = null;
                    partner._onStateChanged(partner.status.state);
                }

                // DOM削除
                if (s.visual.dom.container) {
                    s.visual.dom.container.remove();
                }
                // リストから削除
                this.speakis.splice(i, 1);
            }
        }

        this._updateItemLifecycles(dt);

        // 交流の更新
        this._updateSocialInteractions(dt);

        // 幸福度の加算処理
        this._updateHappiness(dt);

        // クールダウンの更新表示
        this._updateCooldownUI();

        // UIの定期更新 (約250msごと)
        if (!this.lastUIUpdate || Date.now() - this.lastUIUpdate > 250) {
            this.updateSpeakiList();
            this.lastUIUpdate = Date.now();
        }
    }

    /** 中央管理による交流（ソーシャル）の更新 */
    _updateSocialInteractions(dt) {
        const now = Date.now();
        if (now - this.lastSocialTime < this.socialInterval) return;

        // 次回の間隔を再設定
        this.lastSocialTime = now;
        this.socialInterval = 15000 + Math.random() * 10000;

        // 候補のピックアップ
        const candidates = this.speakis.filter(s =>
            s.canInteract &&
            s.status.friendship > -31 && // 好感度-30以下（逃げ出す状態）は交流しない
            [STATE.IDLE, STATE.WALKING].includes(s.status.state) &&
            !s.interaction.isInteracting
        );

        if (candidates.length < 2) return;

        // ランダムに2匹選ぶ
        const idx1 = Math.floor(Math.random() * candidates.length);
        let idx2 = Math.floor(Math.random() * candidates.length);
        while (idx1 === idx2) {
            idx2 = Math.floor(Math.random() * candidates.length);
        }

        let char1 = candidates[idx1];
        let char2 = candidates[idx2];

        // 常に左にいる方をchar1, 右にいる方をchar2にする (交差を防ぐ)
        if (char1.pos.x > char2.pos.x) {
            [char1, char2] = [char2, char1];
        }

        // 距離制限を緩和
        const dist = Math.sqrt((char1.pos.x - char2.pos.x) ** 2 + (char1.pos.y - char2.pos.y) ** 2);
        if (dist > 400) return;

        // 両者が赤ちゃんなら中止
        if (char1.characterType === 'baby' && char2.characterType === 'baby') return;

        // 目的地（少しずらした位置）
        let target1, target2;
        if (char1.characterType === 'baby') {
            // char1が赤ちゃんなら、char2が寄ってくる
            target1 = { x: char1.pos.x, y: char1.pos.y };
            target2 = { x: char1.pos.x + 80, y: char1.pos.y };
        } else if (char2.characterType === 'baby') {
            // char2が赤ちゃんなら、char1が寄ってくる
            target1 = { x: char2.pos.x - 80, y: char2.pos.y };
            target2 = { x: char2.pos.x, y: char2.pos.y };
        } else {
            const midX = (char1.pos.x + char2.pos.x) / 2;
            const midY = (char1.pos.y + char2.pos.y) / 2;
            target1 = { x: midX - 80, y: midY };
            target2 = { x: midX + 80, y: midY };
        }

        // 同時に到着するように速度を計算
        const d1 = Math.sqrt((char1.pos.x - target1.x) ** 2 + (char1.pos.y - target1.y) ** 2);
        const d2 = Math.sqrt((char2.pos.x - target2.x) ** 2 + (char2.pos.y - target2.y) ** 2);

        const t1 = d1 / (char1.pos.speed * 1.5 || 1);
        const t2 = d2 / (char2.pos.speed * 1.5 || 1);
        const targetTime = Math.max(t1, t2, 0.5);

        char1.pos.socialSpeed = d1 / targetTime;
        char2.pos.socialSpeed = d2 / targetTime;

        // 両者に移動命令
        const startInteraction = (char, targetPos, partner, isFirst) => {
            char.status.state = STATE.GAME_APPROACHING;
            char.pos.targetX = targetPos.x;
            char.pos.targetY = targetPos.y;
            char.pos.destinationSet = true;
            char.status.isMySocialTurn = isFirst;
            char.socialConfig = { partner }; // パートナー参照のみ保持
            char._onStateChanged(char.status.state);
            char.pos.destinationSet = (char.characterType !== 'baby'); // 赤ちゃんは目的地へ動かない
        };

        startInteraction(char1, target1, char2, true);  // char1が先攻
        startInteraction(char2, target2, char1, false); // char2が後攻

        // 交流開始の合図
        char1.showEmoji('💬');
        char2.showEmoji('💬');
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
        } else if (type === 'child') {
            char = new ChildSpeaki(id, this.speakiRoom, finalX, finalY);
        } else if (type === 'ashur') {
            char = new Ashur(id, this.speakiRoom, finalX, finalY);
        } else if (type === 'posher') {
            char = new Posher(id, this.speakiRoom, finalX, finalY);
        } else if (type === 'npc' || type.startsWith('npc_')) {
            // 今降は npc_xxx で具体的なNPCクラスを使い分けられるようにする
            char = new NPCCharacter(id, this.speakiRoom, finalX, finalY, { characterType: type });
        } else {
            char = new Speaki(id, this.speakiRoom, finalX, finalY, { characterType: type });
        }
        this.speakis.push(char);
        if (id === 0) {
            console.log(char);
        }
        this.updateSpeakiList();
    }


    /** ハイライト設定 */
    setHighlight(id) {
        this.highlightedCharId = (this.highlightedCharId === id) ? null : id;
        this.updateSpeakiList(true); // UI側の反映（強制更新）
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
            this.updateSpeakiList(true);
            this.updateJobMenuUI(); // NPCが削除されたらバイトメニューも更新
        }
    }

    /** 改名 */
    renameSpeaki(id, newName) {
        const s = this.speakis.find(s => s.id === id);
        if (s) {
            s.name = newName;
            this.updateSpeakiList(true);
        }
    }

    /** 赤ちゃんスピキの進化（子供へ） */
    evolveBabyToChild(baby) {
        if (!baby) return;
        console.log(`[Game] BabySpeaki ${baby.id} is evolving into Child!`);

        if (baby.visual.dom.container) baby.visual.dom.container.remove();

        const index = this.speakis.indexOf(baby);
        if (index !== -1) {
            this.speakis.splice(index, 1);
        }

        // 子供のSpeakiを生成
        const child = new ChildSpeaki(baby.id, this.speakiRoom, baby.pos.x, baby.pos.y);
        child.name = baby.name;
        child.status.friendship = baby.status.friendship;
        child.status.hunger = baby.status.hunger;
        // 状態の引き継ぎ（特にお土産イベント中などの場合）
        child.status.state = baby.status.state;

        // ギフト担当の引き継ぎ (ゾンビ化防止)
        if (this.giftPartner === baby) {
            this.giftPartner = child;
        }

        if (index !== -1) {
            this.speakis.splice(index, 0, child);
        } else {
            this.speakis.push(child);
        }

        this.playSound('happy', 1.2);
        this.updateSpeakiList(true);
    }

    /** 子供スピキの進化（大人へ） */
    evolveChildToAdult(child) {
        if (!child) return;
        console.log(`[Game] ChildSpeaki ${child.id} is evolving into Adult!`);

        if (child.visual.dom.container) child.visual.dom.container.remove();

        const index = this.speakis.indexOf(child);
        if (index !== -1) {
            this.speakis.splice(index, 1);
        }

        // 大人のSpeakiを生成
        const adult = new Speaki(child.id, this.speakiRoom, child.pos.x, child.pos.y);
        adult.name = child.name;
        adult.status.friendship = child.status.friendship;
        adult.status.hunger = child.status.hunger;
        // 状態の引き継ぎ
        adult.status.state = child.status.state;

        // ギフト担当の引き継ぎ (ゾンビ化防止)
        if (this.giftPartner === child) {
            this.giftPartner = adult;
        }

        if (index !== -1) {
            this.speakis.splice(index, 0, adult);
        } else {
            this.speakis.push(adult);
        }

        this.playSound('happy', 1.0);
        this.updateSpeakiList(true);
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

    _getEmotionLabel(s) {
        const stateMapping = {
            [STATE.IDLE]: 'のんびり',
            [STATE.WALKING]: 'てくてく',
            [STATE.GIFT_LEAVING]: 'お出かけ',
            [STATE.GIFT_SEARCHING]: 'さがしもの',
            [STATE.GIFT_RETURNING]: 'かえってきた',
            [STATE.GIFT_WAIT_FOR_USER_REACTION]: 'とくいげ',
            [STATE.GIFT_REACTION]: 'とくいげ',
            [STATE.GIFT_TIMEOUT]: 'しょげている',
            [STATE.ITEM_APPROACHING]: '何かを見つけた',
            [STATE.GAME_APPROACHING]: 'おしゃべり中',
            [STATE.GAME_REACTION]: 'おしゃべり中',
            [STATE.DYING]: 'ああ…'
        };

        return stateMapping[s.status.state] || '';
    }

    updateSpeakiList(force = false) {
        const listContainer = document.getElementById('speaki-list');
        if (!listContainer) return;

        // 入力中（フォーカスがある場合）は、forceがfalseなら更新をスキップして、入力を妨げないようにする
        if (!force && listContainer.contains(document.activeElement)) return;

        // 【修正】NPC（canInteractがfalseまたは救助者など）はリストに表示しない
        const displaySpeakis = this.speakis.filter(s => s.canInteract && s.characterType !== 'ashur' && s.characterType !== 'posher');

        if (displaySpeakis.length === 0) {
            listContainer.innerHTML = '<p class="empty-list">スピキはいません...</p>';
            return;
        }

        let html = '';
        displaySpeakis.forEach(s => {
            const isHighlighted = (s.id === this.highlightedCharId);
            const state = s.getStateLabel();
            const emotionLabel = this._getEmotionLabel(s);

            const friendshipPct = Math.min(100, Math.max(0, s.status.friendship + 50));
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
                    ${emotionLabel ? '<span class="speaki-state-tag">' + emotionLabel + '</span>' : ''}
                </div>
                
                <div class="speaki-gauges">
                    <div class="gauge-item mini-row">
                        <div class="icon-wrapper">
                            <img src="assets/images/icon_heart.png" class="gauge-icon" alt="friendship">
                            <span class="gauge-value">${s.status.friendship.toFixed(0)}</span>
                        </div>
                        <div class="gauge-bar"><div class="gauge-fill friendship" style="width: ${friendshipPct}%"></div></div>
                    </div>
                    <div class="gauge-item mini-row">
                        <div class="icon-wrapper">
                            <img src="assets/images/icon_stomach.png" class="gauge-icon" alt="hunger">
                            <span class="gauge-value">${s.status.hunger.toFixed(0)}</span>
                        </div>
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


    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.placedItems.forEach(item => {
            item.draw(this.ctx, this.images);
        });
    }
    /**
     * NPCを呼び出す (シングルトン・トグル式)
     * @param {string} type NPCのタイプ ('ashur', 'posher'等)
     */
    callNPC(type) {
        // すでに同じタイプのNPCがいれば、それを削除（退勤）する
        const existingNPC = this.speakis.find(s => s.characterType === type);
        if (existingNPC) {
            console.log(`[Game] NPC ${type} already exists. Removing (Leaving)...`);
            this.removeSpeaki(existingNPC.id);
            return;
        }

        // 存在しない場合は、画面中央上部 (y=100) に登場（出勤）
        const centerX = (this.speakiRoom ? this.speakiRoom.clientWidth : 1200) / 2;
        const topY = 100;

        this.addSpeaki(centerX, topY, type);
        console.log(`[Game] Called NPC: ${type}`);
        this.updateJobMenuUI(); // 追加後にUI更新
    }

    /** バイトメニューのUI状態を更新 */
    updateJobMenuUI() {
        const jobList = document.getElementById('job-list');
        if (!jobList) return;

        const jobItems = jobList.querySelectorAll('.draggable-item');
        jobItems.forEach(btn => {
            const id = btn.dataset.id;
            const def = JOBS[id];
            if (!def) return;

            const isAttending = this.speakis.some(s => s.characterType === def.npcType);

            if (isAttending) {
                btn.classList.add('active');
                btn.textContent = `${def.name}(退勤させる)`;
            } else {
                btn.classList.remove('active');
                btn.textContent = `${def.name}(出勤させる)`;
            }
        });
    }

    /** プラスチックの在庫表示を更新 */
    updatePlasticStockUI() {
        const countEl = document.getElementById('gift-stock-count');
        const modalCountEl = document.getElementById('modal-plastic-count');
        if (countEl) {
            countEl.textContent = Math.floor(this.plastics);
        }
        if (modalCountEl) {
            modalCountEl.textContent = Math.floor(this.plastics);
        }
    }

    /** 幸福度の加算処理 */
    _updateHappiness(dt) {
        // 幸福度の加算（タイマー進行、ゲージ更新、クリア判定）はチャレンジモードのみ
        if (!this.isGameCleared && this.gameMode !== 'relaxed') {
            // 「しあわせスピキ」のカウント
            // 条件: 好感度40以上 かつ 満腹度80以上
            const happySpeakCount = this.speakis.filter(s =>
                s.canInteract &&
                s.status.friendship >= 40 &&
                s.status.hunger >= 80
            ).length;

            if (happySpeakCount > 0) {
                // 幸福度は 1秒あたり 1 * しあわせスピキ数 加算 (1.5倍にブースト)
                const gain = (dt / 1000) * happySpeakCount * 1.5;
                this.happiness = Math.min(this.maxHappiness, this.happiness + gain);

                this.updateHappinessUI();
            }
        }

        // 自動ごはん係の処理
        if (this.unlocks.feeder) {
            // ポーシャーがいないか、または帰宅中/帰宅直後などでないかチェック
            const posher = this.speakis.find(s => s instanceof Posher);
            if (!posher) {
                // お腹を空かせたスピキがいるか (満腹度30以下)
                const hungryOne = this.speakis.find(s => s.canInteract && s.status.hunger <= 30);
                if (hungryOne) {
                    this.callNPC('posher');
                }
            }
        }
    }

    /** アンロックメニューの生成 */
    initUnlockMenu() {
        const list = document.getElementById('unlock-list');
        if (!list) return;

        const hungerDecayPrice = 1; // 開発中は固定1 (本来は 1 + this.unlocks.hungerDecayLv * 3)
        const currentHungerSec = 2 + this.unlocks.hungerDecayLv;
        const nextHungerSec = currentHungerSec + 1;

        const unlockDefs = [
            { id: 'feeder', name: 'ごはん係 (給餌係)', price: 1, desc: '満腹度30以下のｽﾋﾟｷにごはんをあげる係を呼びます。', current: this.unlocks.feeder },
            { id: 'autoReceive', name: 'プレゼント自動回収', price: 1, desc: 'スピキが持ってきたプレゼントを自動で受け取ります', current: this.unlocks.autoReceive },
            { id: 'unlockMocaron', name: 'モカロン解放', price: 1, desc: 'より栄養価の高い食べ物「モカロン」が置けるようになります。', current: this.unlocks.mocaronUnlocked }
        ];

        // チャレンジモードのみ表示する項目
        if (this.gameMode !== 'relaxed') {
            unlockDefs.splice(1, 0,
                {
                    id: 'hungerDecay',
                    name: `空腹度減少の緩和 (Lv.${this.unlocks.hungerDecayLv})`,
                    price: hungerDecayPrice,
                    desc: `減少速度を遅くします。現在: ${currentHungerSec}秒に1 → 次: ${nextHungerSec}秒に1`,
                    current: false, // 繰り返し可能にするため常にfalse
                    isUpgrade: true
                },
                {
                    id: 'affectionDecay',
                    name: `好感度減少の緩和 (Lv.${this.unlocks.affectionDecayLv})`,
                    price: 1,
                    desc: `減少速度を遅くします。現在: ${2 + this.unlocks.affectionDecayLv}秒に1 → 次: ${3 + this.unlocks.affectionDecayLv}秒に1`,
                    current: false,
                    isUpgrade: true
                }
            );
            unlockDefs.push({
                id: 'cooldownReduction',
                name: `リロード時間短縮 (Lv.${this.unlocks.reloadReductionLv})`,
                price: 1,
                desc: `ごはん系アイテム配置のリロード時間が1秒短縮されます。現在: -${this.unlocks.reloadReductionLv}秒 → 次: -${this.unlocks.reloadReductionLv + 1}秒`,
                current: false,
                isUpgrade: true
            });
        }

        list.innerHTML = '';
        unlockDefs.forEach(def => {
            const div = document.createElement('div');
            // isUpgrade の場合は unlocked クラスをつけない（常にボタンを押せるように）
            div.className = `unlock-item ${def.current ? 'unlocked' : 'locked'}`;
            div.innerHTML = `
                <h4>${def.name}</h4>
                <p>${def.desc}</p>
                <div class="price">${def.current ? '解放済み' : `消費: ${def.price} 個`}</div>
                <button class="primary-btn unlock-btn" ${(def.current || this.plastics < def.price) ? 'disabled' : ''} 
                    onclick="window.game.unlockFeature('${def.id}', ${def.price})">
                    ${def.current ? '解放済み' : (def.isUpgrade ? '強化する' : '解放する')}
                </button>
            `;
            list.appendChild(div);
        });
    }

    /** 実際のアンロック処理 */
    unlockFeature(id, price) {
        if (this.plastics < price) return;
        this.plastics -= price;

        switch (id) {
            case 'feeder':
                this.unlocks.feeder = true;
                this.callNPC('posher'); // アンロックした瞬間に呼び出す
                break;
            case 'hungerDecay': this.unlocks.hungerDecayLv++; break;
            case 'affectionDecay': this.unlocks.affectionDecayLv++; break;
            case 'autoReceive': this.unlocks.autoReceive = true; break;
            case 'unlockMocaron':
                this.unlocks.mocaronUnlocked = true;
                ITEMS.Mocaron.showInMenu = true;
                this.initItemMenu();
                break;
            case 'cooldownReduction': this.unlocks.reloadReductionLv++; break;
        }

        this.playSound('happy', 1.2);
        this.updatePlasticStockUI();
        this.initUnlockMenu(); // 再描画
    }

    /** アイテムリロード時間のUI更新 */
    _updateCooldownUI() {
        const now = Date.now();
        const items = document.querySelectorAll('.draggable-item');
        items.forEach(el => {
            const id = el.dataset.id;
            const cooldownEnd = this.itemCooldowns[id];

            if (cooldownEnd && now < cooldownEnd) {
                el.classList.add('cooldown');
                // タイマー表示
                let timer = el.querySelector('.cooldown-timer');
                if (!timer) {
                    timer = document.createElement('span');
                    timer.className = 'cooldown-timer';
                    el.appendChild(timer);
                }
                const remaining = Math.ceil((cooldownEnd - now) / 1000);
                timer.textContent = `${remaining}s`;
            } else {
                el.classList.remove('cooldown');
                const timer = el.querySelector('.cooldown-timer');
                if (timer) timer.remove();
            }
        });
    }
}

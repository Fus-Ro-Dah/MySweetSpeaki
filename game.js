import { STATE, ASSETS, ITEMS, JOBS } from './config.js';
import { SoundManager } from './managers/SoundManager.js';
import { InputManager } from './managers/InputManager.js';
import { ItemManager } from './managers/ItemManager.js';
import { CharacterManager } from './managers/CharacterManager.js';
import { SocialSystem } from './managers/SocialSystem.js';
import { UIManager } from './managers/UIManager.js';
import { MessageManager } from './managers/MessageManager.js';

/**
 * ゲームのメインクラス
 * 各マネージャの統括、ゲームループ、グローバル状態の管理を担当する
 */
export class Game {
    /** コンストラクタ: ゲームの初期化 */
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.speakiRoom = document.getElementById('speaki-room');

        // --- ゲーム状態 ---
        this.speakis = [];
        this.nextCharId = 0;
        this.speakiCount = 0;
        this.highlightedCharId = null;
        this.furniture = [];
        this.placedItems = [];
        this.interactTarget = null;
        this.lastGiftTime = Date.now() - 20000;
        this.giftPartner = null;
        this.plastics = 0;
        this.happiness = 0;
        this.maxHappiness = 5000;
        this.isGameCleared = false;
        this.isGameStarted = false;
        this.itemCooldowns = {};
        this.lastTime = performance.now();

        this.unlocks = {
            feeder: false,
            hungerDecayLv: 0,
            affectionDecayLv: 0,
            autoReceive: false,
            mocaronUnlocked: false,
            reloadReductionLv: 0,
            growthStop: false,
            itemUnlocks: {} // 特殊アイテムの個別解放状況
        };

        this.settings = {
            feederEnabled: false,
            autoReceiveEnabled: false,
            growthStopEnabled: false
        };

        // --- マネージャの初期化 ---
        this.sound = new SoundManager();
        this.messages = new MessageManager(this);
        this.input = new InputManager(this);
        this.items = new ItemManager(this);
        this.characters = new CharacterManager(this);
        this.social = new SocialSystem(this);
        this.ui = new UIManager(this);

        // --- 後方互換性の維持 ---
        // 既存コード（base-character.js等）が window.game.playSound() を呼ぶため、委譲メソッドを提供
        window.game = this;
        Game.instance = this;

        // --- 初期化処理 ---
        this.sound.loadResources();
        this.resize();
        this.init();
        window.addEventListener('resize', () => this.resize());

        // モード選択ボタンの待機
        this._bindButton('start-relaxed-btn', () => this.selectMode('relaxed'));
        this._bindButton('start-challenge-btn', () => this.selectMode('challenge'));
        this._bindButton('confirm-start-btn', () => {
            if (this.isGameStarted) {
                const modal = document.getElementById('mode-info-modal');
                if (modal) modal.classList.add('hidden');
            } else {
                this.startGame();
            }
        });

        requestAnimationFrame((t) => this.loop(t));
    }

    // ================================================================
    // 後方互換性のための委譲メソッド
    // base-character.js や speaki.js が window.game.xxx() を呼ぶものに対応
    // ================================================================

    /** 音声再生の委譲 */
    playSound(fileName, pitch) {
        return this.sound.playSound(fileName, pitch);
    }

    /** AudioContext への後方互換アクセス */
    get audioCtx() {
        return this.sound.audioCtx;
    }

    /** 画像キャッシュへの後方互換アクセス */
    get images() {
        return this.sound.images;
    }

    /** 音声キャッシュへの後方互換アクセス */
    get sounds() {
        return this.sound.sounds;
    }

    /** audioEnabled への後方互換アクセス */
    get audioEnabled() {
        return this.sound.audioEnabled;
    }
    set audioEnabled(val) {
        this.sound.audioEnabled = val;
    }

    /** アイテム追加の委譲 */
    addItem(id, type, x, y) {
        this.items.addItem(id, type, x, y);
    }

    /** キャラ追加の委譲 */
    addSpeaki(x, y, type) {
        this.characters.addSpeaki(x, y, type);
    }

    /** キャラ削除の委譲 */
    removeSpeaki(id) {
        this.characters.removeSpeaki(id);
    }

    /** NPC呼び出しの委譲 */
    callNPC(type) {
        this.characters.callNPC(type);
    }

    /** 赤ちゃん→子供への進化の委譲 */
    evolveBabyToChild(baby) {
        this.characters.evolveBabyToChild(baby);
    }

    /** 子供→大人への進化の委譲 */
    evolveChildToAdult(child) {
        this.characters.evolveChildToAdult(child);
    }

    /** ギフトUI更新の委譲 */
    updateGiftUI(mode) {
        this.ui.updateGiftUI(mode);
    }

    /** スピキリスト更新の委譲 */
    updateSpeakiList(force) {
        this.ui.updateSpeakiList(force);
    }

    /** ハイライトの委譲 */
    setHighlight(id) {
        this.ui.setHighlight(id);
    }

    /** 改名の委譲 */
    renameSpeaki(id, newName) {
        const s = this.speakis.find(s => s.id === id);
        if (s) {
            s.name = newName;
            this.ui.updateSpeakiList(true);
        }
    }


    /** バイトメニューUI更新の委譲 */
    updateJobMenuUI() {
        this.ui.updateJobMenuUI();
    }

    /** アンロックメニュー初期化の委譲 */
    initUnlockMenu() {
        this.ui.initUnlockMenu();
    }

    /** アイテムメニュー初期化の委譲 */
    initItemMenu() {
        this.ui.initItemMenu();
    }

    /** プラスチック在庫UI更新の委譲 */
    updatePlasticStockUI() {
        this.ui.updatePlasticStockUI();
    }

    /** テスト用コマンドの委譲 */
    testSocial(actionId) {
        this.social.testSocial(actionId);
    }

    // ================================================================
    // ユーティリティ
    // ================================================================

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
            if (now - lastExecution < 400) return;
            lastExecution = now;

            if (e.type === 'touchend') {
                if (e.cancelable) e.preventDefault();
            }
            callback(e);
        };
        btn.addEventListener('touchend', execute);
        btn.addEventListener('click', execute);
    }

    // ================================================================
    // ゲーム起動・モード選択
    // ================================================================

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

    /** ゲームの初期設定 */
    init() {
        this.ui.initItemMenu();
        this.input.setup(this.canvas, this.speakiRoom);
        this.input.setupDragAndDrop();

        // 幸福度とプラスチックの初期表示
        this.ui.updateHappinessUI();
        this.ui.updatePlasticStockUI();

        // アンロックメニューのリスナー
        const unlockModal = document.getElementById('unlock-modal');

        this._bindButton('open-unlock-btn', () => {
            this.ui.initUnlockMenu();
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

            this.sound.audioEnabled = true;
            this.sound.startBGM();

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

            // 最初のスピキを1匹生成
            const centerX = this.canvas.width / 2;
            const centerY = this.canvas.height / 2;
            this.characters.addSpeaki(centerX - 100, centerY, 'speaki');

        } catch (e) {
            alert("Error starting game: " + e.message + "\n" + e.stack);
            console.error(e);
        }
    }

    /** キャンバスのサイズ調整 */
    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }

    // ================================================================
    // ゲームループ
    // ================================================================

    loop(time) {
        if (!this.lastTime) this.lastTime = time;
        const dt = time - this.lastTime;
        this.lastTime = time;

        const clampedDt = Math.min(dt, 100);

        this.update(clampedDt);
        this.draw();
        requestAnimationFrame((t) => this.loop(t));
    }

    update(dt) {
        // キャラクターの更新（死亡処理含む）
        this.characters.update(dt);

        // アイテムのライフサイクル更新
        this.items.update(dt);

        // 交流の更新
        this.social.update(dt);

        // 幸福度の加算処理
        this._updateHappiness(dt);

        // UIの定期更新
        this.ui.updatePeriodic();
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.items.draw(this.ctx);
    }

    // ================================================================
    // ギフトイベント（Game側に残す: 状態管理が複数マネージャに跨るため）
    // ================================================================

    startGiftReceiveEvent(speaki) {
        this.giftPartner = speaki;

        if (this.unlocks.autoReceive && this.settings.autoReceiveEnabled) {
            this.handleReaction('auto');
            return;
        }

        speaki.status.state = STATE.GIFT_WAIT_FOR_USER_REACTION;
        speaki.timers.stateStart = Date.now();
        speaki._onStateChanged(speaki.status.state);
        this.ui.updateGiftUI('start');
        this.sound.playSound('チョワヨ.mp3');
    }


    handleReaction(type) {
        this.ui.updateGiftUI('hide');
        if (this.giftPartner) {
            this.giftPartner.status.state = STATE.GIFT_REACTION;
            this.giftPartner.timers.stateStart = Date.now();
            this.giftPartner._onStateChanged(this.giftPartner.status.state);
            this.sound.playSound('チョワヨ.mp3');

            const friendship = this.giftPartner.status.friendship;
            let plasticGain = 1;
            if (friendship > 50) plasticGain = 3;
            if (friendship > 80) plasticGain = 5;
            this.plastics += plasticGain;

            this.ui.initItemMenu();
            this.ui.updatePlasticStockUI();
        }
    }

    completeGiftEvent(char) {
        if (char) {
            this.resetSpeakiAppearance(char);
        }
        this.giftPartner = null;
        this.lastGiftTime = Date.now();
        this.ui.updateGiftUI('hide');
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

    // ================================================================
    // アンロック・幸福度（Game側に残す: ゲームのグローバル状態）
    // ================================================================

    toggleFeature(id) {
        if (id === 'feeder') {
            this.settings.feederEnabled = !this.settings.feederEnabled;
            const posher = this.speakis.find(s => s.characterType === 'posher');

            if (!this.settings.feederEnabled) {
                if (posher) this.removeSpeaki(posher.id);
            } else {
                if (!posher) this.callNPC('posher');
            }
        } else if (id === 'autoReceive') {
            this.settings.autoReceiveEnabled = !this.settings.autoReceiveEnabled;
        } else if (id === 'growthStop') {
            this.settings.growthStopEnabled = !this.settings.growthStopEnabled;
        }

        this.playSound('チョワヨ.mp3', 1.1);
        this.initUnlockMenu();
    }

    unlockFeature(id, price) {
        if (this.plastics < price) return;
        this.plastics -= price;

        switch (id) {
            case 'feeder':
                this.unlocks.feeder = true;
                this.settings.feederEnabled = true;
                this.callNPC('posher');
                break;
            case 'hungerDecay': this.unlocks.hungerDecayLv++; break;
            case 'affectionDecay': this.unlocks.affectionDecayLv++; break;
            case 'autoReceive':
                this.unlocks.autoReceive = true;
                this.settings.autoReceiveEnabled = true;
                break;
            case 'growthStop':
                this.unlocks.growthStop = true;
                this.settings.growthStopEnabled = true;
                break;
            case 'cooldownReduction': this.unlocks.reloadReductionLv++; break;
            default:
                // アイテム解放 (item_ID の形式)
                if (id.startsWith('item_')) {
                    const itemId = id.replace('item_', '');
                    this.unlocks.itemUnlocks[itemId] = true;
                    this.initItemMenu();
                }
                break;
        }

        this.playSound('チョワヨ.mp3', 1.2);
        this.updatePlasticStockUI();
        this.initUnlockMenu();
    }

    /** 幸福度の加算処理 */
    _updateHappiness(dt) {
        if (!this.isGameCleared && this.gameMode !== 'relaxed') {
            const happySpeakCount = this.speakis.filter(s =>
                s.canInteract &&
                s.status.friendship >= 40 &&
                s.status.hunger >= 80
            ).length;

            if (happySpeakCount > 0) {
                const gain = (dt / 1000) * happySpeakCount * 3;
                this.happiness = Math.min(this.maxHappiness, this.happiness + gain);
                this.ui.updateHappinessUI();
            }
        }

        // 自動ごはん係の処理
        if (this.unlocks.feeder && this.settings.feederEnabled) {
            const posher = this.speakis.find(s => s.characterType === 'posher');
            if (!posher) {
                const hungryOne = this.speakis.find(s =>
                    s.canInteract &&
                    s.status.hunger <= 30 &&
                    (s.status.state === STATE.IDLE || s.status.state === STATE.WALKING)
                );
                if (hungryOne) {
                    this.characters.callNPC('posher');
                }
            }
        }
    }
}

import { ASSETS, ITEMS } from '../config.js';

/**
 * 音声・画像アセットの管理クラス
 * BGM再生、SE再生、画像/音声キャッシュを一元管理する
 */
export class SoundManager {
    constructor() {
        this.images = {};        // 画像キャッシュ
        this.soundBuffers = {};  // 音声キャッシュ（デコード済み AudioBuffer）
        this.audioEnabled = false;
        
        // AudioContextはユーザー操作後に初期化できるようにあらかじめ作成しておく
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioContext();

        this.bgmBuffer = null;  // BGM用バッファ
        this.bgmSource = null;  // BGM再生用ノード
        this.bgmGain = null;    // BGM音量制御ノード
    }

    /** アセット（画像・音声）の全読み込み */
    loadResources() {
        this._loadNestedAssets(ASSETS);

        Object.values(ITEMS).forEach(item => {
            if (item.imagefile) {
                const path = `assets/images/${item.imagefile}`;
                const img = new Image();
                img.src = path;
                const key = item.imagefile.replace('.png', '');
                this.images[key] = img;
                this.images[path] = img;
            }
            if (item.soundfile) {
                this._loadAudioBuffer(item.soundfile);
            }
        });

        // BGMのロード
        this._loadBGM('assets/music/he-jitsu-no-joh.mp3');
    }

    /** 音声ファイルをフェッチしてAudioBufferとしてキャッシュする */
    async _loadAudioBuffer(fileName) {
        if (this.soundBuffers[fileName]) return; // 既にロード中/済み
        
        this.soundBuffers[fileName] = "loading"; // 重複ロード防止フラグ
        try {
            const url = `assets/sounds/${fileName}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
            
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);
            this.soundBuffers[fileName] = audioBuffer;
        } catch (e) {
            console.warn(`[Audio] Failed to load/decode ${fileName}:`, e);
            delete this.soundBuffers[fileName]; // 失敗したら再試行できるように消す
        }
    }

    /** BGMをフェッチしてデコードする */
    async _loadBGM(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
            const arrayBuffer = await response.arrayBuffer();
            this.bgmBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);
            // console.log("[Audio] BGM loaded and decoded (Web Audio API).");
        } catch (e) {
            console.warn("[Audio] BGM loading failed:", e);
        }
    }

    /** BGMの再生開始 */
    startBGM() {
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        if (this.bgmBuffer && !this.bgmSource) {
            this.bgmSource = this.audioCtx.createBufferSource();
            this.bgmSource.buffer = this.bgmBuffer;
            this.bgmSource.loop = true;
            
            this.bgmGain = this.audioCtx.createGain();
            this.bgmGain.gain.value = 0.5;
            
            this.bgmSource.connect(this.bgmGain);
            this.bgmGain.connect(this.audioCtx.destination);
            
            this.bgmSource.start(0);
            // console.log("[Audio] Playing BGM.");
        }
    }

    /** BGMの停止 */
    stopBGM() {
        if (this.bgmSource) {
            try { this.bgmSource.stop(); } catch(e) {}
            this.bgmSource.disconnect();
            this.bgmSource = null;
        }
    }

    /** 音声の再生（停止用の互換オブジェクトを返す） */
    playSound(fileName, pitch = 1.0) {
        if (!this.audioEnabled) return null;

        // Contextが停止していれば再開
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume().catch(() => {});
        }

        const buffer = this.soundBuffers[fileName];
        
        // 読み込み中または未ロードの場合は無視（new Audioによる強行はリークの元なのでやめる）
        if (!buffer || buffer === "loading") {
            if (!buffer) {
                // 未ロードの場合は裏でロードを開始しておく
                this._loadAudioBuffer(fileName);
            }
            return null;
        }

        const source = this.audioCtx.createBufferSource();
        source.buffer = buffer;
        
        // ピッチ（再生速度）の設定
        if (pitch !== 1.0) {
            source.playbackRate.value = pitch;
        }

        const gainNode = this.audioCtx.createGain();
        gainNode.gain.value = 0.5;

        source.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        source.start(0);

        const resultNode = {
            _ended: false,
            _onendedCallback: null,
            duration: buffer ? buffer.duration : 0,
            pause: function() {
                try { source.stop(); } catch(e) {}
                try { source.disconnect(); } catch(e) {}
                try { gainNode.disconnect(); } catch(e) {}
                this._ended = true;
                // pause時にも参照を明示的に解放
                source.onended = null;
                source.buffer = null;
            },
            get ended() {
                return this._ended;
            },
            set onended(callback) {
                this._onendedCallback = callback;
            },
            get onended() {
                return this._onendedCallback;
            }
        };

        // 再生が終了したらノードを切り離す（ガベージコレクションのため）
        source.onended = () => {
            try { source.disconnect(); } catch(e) {}
            try { gainNode.disconnect(); } catch(e) {}
            resultNode._ended = true;
            if (typeof resultNode._onendedCallback === 'function') {
                resultNode._onendedCallback();
            }
            // 循環参照を強制的に断ち切る（Edge等でのメモリーリーク対策）
            source.onended = null;
            source.buffer = null;
        };

        return resultNode;
    }

    /** アセット定義を再帰的に探索して読み込む */
    _loadNestedAssets(node) {
        if (!node || typeof node !== 'object') return;

        if (Array.isArray(node)) {
            node.forEach(data => {
                if (data.imagefile && !this.images[data.imagefile]) {
                    const path = `assets/images/${data.imagefile}`;
                    const img = new Image();
                    img.src = path;
                    this.images[data.imagefile] = img;
                    const key = data.imagefile.replace('.png', '');
                    this.images[key] = img;
                }
                if (data.soundfile) {
                    this._loadAudioBuffer(data.soundfile);
                }
            });
            return;
        }

        Object.values(node).forEach(child => this._loadNestedAssets(child));
    }

    /** 画像キャッシュから取得 */
    getImage(key) {
        return this.images[key] || null;
    }
}

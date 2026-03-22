import { STATE } from '../config.js';

/**
 * 入力管理クラス
 * ポインターイベント（マウス/タッチ）とドラッグ&ドロップを管理する
 */
export class InputManager {
    constructor(game) {
        this.game = game;
    }

    /** インタラクション（ポインターイベント等）の設定 */
    setup(canvas, speakiRoom) {
        const game = this.game;

        const unlockAudio = () => {
            if (!game.sound.audioEnabled) {
                game.sound.audioEnabled = true;
                console.log("[Audio] System unlocked by user interaction.");
                const silent = new Audio();
                silent.play().catch(() => { });
            }
            window.removeEventListener('pointerdown', unlockAudio);
        };
        window.addEventListener('pointerdown', unlockAudio);
        canvas.addEventListener('pointerdown', (e) => this.handleMouseDown(e));
        window.addEventListener('pointermove', (e) => this.handleMouseMove(e));
        window.addEventListener('pointerup', (e) => this.handleMouseUp(e));
        canvas.addEventListener('contextmenu', (e) => this.handleContextMenu(e));

        // タッチイベント・紛失対応
        canvas.addEventListener('pointercancel', (e) => this.handleMouseUp(e));

        game._bindButton('reaction-btn-1', () => game.handleReaction(1));
        game._bindButton('reaction-btn-2', () => game.handleReaction(2));

        // モーダルの制御（共通化）
        const setupModal = (btnId, closeId, modalId) => {
            const modal = document.getElementById(modalId);

            game._bindButton(btnId, () => {
                if (modal) modal.classList.remove('hidden');
            });

            game._bindButton(closeId, () => {
                if (modal) modal.classList.add('hidden');
            });

            if (modal) {
                game._bindElement(modal, (e) => {
                    if (e.target === modal) modal.classList.add('hidden');
                });
            }
        };

        // 「？」ボタンで現在のモードの説明を再表示する
        game._bindButton('open-tutorial-btn', () => {
            const modal = document.getElementById('mode-info-modal');
            if (modal) modal.classList.remove('hidden');
        });

        // モード説明モーダルの「OK」ボタンや背景クリックでの閉じ処理
        const modeModal = document.getElementById('mode-info-modal');
        if (modeModal) {
            game._bindElement(modeModal, (e) => {
                if (e.target === modeModal) modeModal.classList.add('hidden');
            });
        }

        setupModal('open-memo-btn', 'close-memo-btn', 'memo-modal');

        this.setupDebugCommands();
    }

    /** デバッグ用のショートカットコマンド設定 */
    setupDebugCommands() {
        const game = this.game;

        // グローバル関数としても露出（コンソールから実行可能にするため）
        window.setAllHungerTo2 = () => {
            let count = 0;
            game.speakis.forEach(s => {
                if (s.hasHunger && s.status.state !== STATE.DYING) {
                    s.status.hunger = 2;
                    count++;
                }
            });
            console.log(`[Debug] Set hunger to 2 for ${count} speakis.`);
            game.ui.updateSpeakiList(true); // UIを即座に更新
        };

        // テスト用餓死ショートカット　不要のためコメントアウト
        /*
        window.addEventListener('keydown', (e) => {
            if (e.key === '2') {
                // 入力フォーム等にフォーカスがある場合は無視
                if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
                window.setAllHungerTo2();
            }
        });
        */
    }

    /** ドラッグ＆ドロップの設定 */
    setupDragAndDrop() {
        const game = this.game;
        const canvas = game.canvas;
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

        canvas.addEventListener('dragover', (e) => e.preventDefault());
        canvas.addEventListener('drop', (e) => {
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

                if (target === canvas) {
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
                const data = JSON.parse(rawData);
                id = data.id;
                type = data.type;
            } catch (e) {
                id = rawData;
                type = 'item';
            }

            const rect = this.game.canvas.getBoundingClientRect();
            this.game.items.addItem(id, type, clientX - rect.left, clientY - rect.top);
        } catch (err) {
            console.error("[Drop] Parse error:", err);
        }
    }

    /** マウス座標を取得 */
    _getMousePos(e) {
        const rect = this.game.canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    /** 座標にいるスピキを探す */
    _findSpeakiAt(x, y) {
        for (let i = this.game.speakis.length - 1; i >= 0; i--) {
            const s = this.game.speakis[i];
            if (!s.canInteract) continue;
            const dx = s.pos.x - x;
            const dy = s.pos.y - y;
            const hitSize = s.status.size * 0.6;
            if (Math.abs(dx) < hitSize && Math.abs(dy) < hitSize) return s;
        }
        return null;
    }

    /** 座標にいるアイテムを探す */
    _findItemAt(x, y) {
        for (let i = this.game.placedItems.length - 1; i >= 0; i--) {
            const it = this.game.placedItems[i];
            if (it.isHit(x, y)) return it;
        }
        return null;
    }

    /** ポインターダウン */
    handleMouseDown(e) {
        e.preventDefault();
        const pos = this._getMousePos(e);
        const game = this.game;

        // 1. まずアイテムがそこにあるか（運搬中のものも含む）
        const item = this._findItemAt(pos.x, pos.y);
        if (item && item.carriedBy) {
            // 運ばれているアイテムがクリックされたら、運搬を解除させてアイテム単体として扱う
            const carrier = item.carriedBy;
            if (carrier.dropItem) carrier.dropItem();
            // 以降は通常のアイテムクリック（現在は何もしないが、将来的にドラッグ可能にするならここ）
            return;
        }

        const speaki = this._findSpeakiAt(pos.x, pos.y);

        if (!speaki) {
            game.interactTarget = null;
            return;
        }

        // 操作制限: IDLE, WALKING, USER_INTERACTING 状態のときのみ操作を受け付ける
        if (![STATE.IDLE, STATE.WALKING, STATE.USER_INTERACTING].includes(speaki.status.state)) {
            console.log(`[Input] Interaction skipped: ${speaki.id} is in state ${speaki.status.state}`);
            game.interactTarget = null;
            return;
        }

        game.interactTarget = speaki;
        speaki.interaction.isInteracting = true;
        speaki.interaction.lastMouseX = pos.x;
        speaki.interaction.lastMouseY = pos.y;
        speaki.interaction.dragStartX = pos.x;
        speaki.interaction.dragStartY = pos.y;
        speaki.interaction.isPetting = false;
        speaki.interaction.isActuallyDragging = false;
        speaki.interaction.isMoving = false;

        speaki.timers.stateStart = Date.now();

        // 現在の状態を保存（割り込み用）
        if (![STATE.USER_INTERACTING].includes(speaki.status.state)) {
            speaki.status.stateStack.push(speaki.status.state);
        }

        speaki.status.state = STATE.USER_INTERACTING;
        // クリック位置が中心より下ならドラッグ移動モード、上なら撫でモード
        speaki.interaction.isDraggingMode = (pos.y >= speaki.pos.y);
        speaki._onStateChanged(speaki.status.state);
    }

    /** ポインタームーブ */
    handleMouseMove(e) {
        const game = this.game;
        const speaki = game.interactTarget;
        if (!speaki || !speaki.interaction.isInteracting) return;

        const pos = this._getMousePos(e);
        const dx = pos.x - speaki.interaction.lastMouseX;
        const dy = pos.y - speaki.interaction.lastMouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const distFromStart = Math.sqrt(
            Math.pow(pos.x - speaki.interaction.dragStartX, 2) +
            Math.pow(pos.y - speaki.interaction.dragStartY, 2)
        );

        speaki.interaction.lastMouseX = pos.x;
        speaki.interaction.lastMouseY = pos.y;

        if (distFromStart > 10) {
            speaki.interaction.isActuallyDragging = true;
        }

        if (speaki.interaction.isDraggingMode) {
            // 下半分ドラッグ：移動モード
            if (speaki.interaction.isActuallyDragging) {
                speaki.interaction.isMoving = true;
                speaki.pos.x += dx;
                speaki.pos.y += dy;
            }
        } else if (dist > 3 && dist < 40) {
            // 上半分ドラッグ：なでなで判定
            speaki.interaction.isPetting = true;
            speaki.visual.targetDistortion.skewX = -dx * 2; // カーソル方向に傾くように反転
            speaki.visual.targetDistortion.rotateX = dy * -1;
            speaki.visual.targetDistortion.scale = 1.05;

            // 好感度・機嫌上昇
            speaki.status.friendship = Math.min(50, speaki.status.friendship + 0.2);
            speaki.changeMood(0.1);

            // メッセージログ (撫でる - 選択されている場合のみ)
            if (this.game.messages && this.game.highlightedCharId === speaki.id) {
                this.game.messages.logUserInteraction(speaki, 'isPetting');
            }

            // ハート生成 (一定間隔)
            if (!speaki.timers.lastPettingHeart || Date.now() - speaki.timers.lastPettingHeart > 300) {
                this._createPettingHeart(speaki);
                speaki.timers.lastPettingHeart = Date.now();
            }
        }
    }

    /** 右クリック */
    handleContextMenu(e) {
        e.preventDefault();
        const pos = this._getMousePos(e);
        const speaki = this._findSpeakiAt(pos.x, pos.y);

        if (!speaki) {
            // スピキがいない場合はアイテムの削除を試みる
            this.game.items.removeItemAt(pos.x, pos.y);
        }
    }

    /** ポインターアップ */
    handleMouseUp(e) {
        const game = this.game;
        const speaki = game.interactTarget;
        if (!speaki) return;

        const isTap = !speaki.interaction.isPetting && !speaki.interaction.isActuallyDragging;

        if (isTap) {
            // たたき判定は上半分（撫でモード）の時のみ
            if (!speaki.interaction.isDraggingMode) {
                this._handleSpeakiTap(speaki);
            }
        } else {
            speaki.interaction.isInteracting = false;
        }

        if (isTap || speaki.interaction.isActuallyDragging) {
            this._resetActionTimer(speaki, 2000);
        }

        // 叩き（タップ）以外の時はクリーンアップして音を止める
        if (!isTap) {
            this._cleanupInteraction(speaki);
        } else {
            game.interactTarget = null;
        }
    }

    _handleSpeakiTap(speaki) {
        const game = this.game;
        // 好感度・機嫌計算
        speaki.status.friendship = Math.max(-50, speaki.status.friendship - 5);
        speaki.changeMood(-10);
        this._createHitEffect(speaki.interaction.lastMouseX, speaki.interaction.lastMouseY);

        // メッセージログ (叩く - 選択されている場合のみ)
        if (game.messages && game.highlightedCharId === speaki.id) {
            game.messages.logUserInteraction(speaki, 'isHit');
        }

        if (speaki.status.friendship <= -31) {
            speaki.interaction.isInteracting = false;

            // ギフト担当解除 (ゾンビ化防止)
            if (game.giftPartner === speaki) {
                game.completeGiftEvent(null);
                console.log(`[Game] Gift event aborted because Speaki ${speaki.id} fled.`);
            }

            speaki.status.state = STATE.IDLE;
            speaki.setExpression('idle', 'sad');
            console.log(`[Game] Speaki ${speaki.id} reached breaking point and is fleeing.`);
        } else {
            speaki.setExpression('surprised', 'sad');
        }
    }

    _cleanupInteraction(speaki) {
        const game = this.game;
        const wasMoving = speaki.interaction.isMoving;
        speaki.interaction.isInteracting = false;
        speaki.interaction.isPetting = false;
        speaki.interaction.isActuallyDragging = false;
        speaki.interaction.isMoving = false;
        speaki.timers.stateStart = Date.now();
        speaki.pos.destinationSet = false;

        if (wasMoving) {
            speaki.status.state = STATE.IDLE;
        } else {
            speaki.status.state = (speaki.status.stateStack.length > 0) ? speaki.status.stateStack.pop() : STATE.IDLE;
        }

        speaki._stopCurrentVoice();
        speaki._onStateChanged(speaki.status.state);
        if (game.interactTarget === speaki) {
            game.interactTarget = null;
        }
    }

    _createPettingHeart(speaki) {
        const heart = document.createElement('div');
        heart.className = 'petting-heart';
        heart.textContent = '❤️';
        const offsetX = (Math.random() - 0.5) * 60;
        const offsetY = -speaki.status.size / 2 + (Math.random() - 0.5) * 40;
        heart.style.left = `${speaki.pos.x + offsetX}px`;
        heart.style.top = `${speaki.pos.y + offsetY}px`;
        this.game.speakiRoom.appendChild(heart);
        setTimeout(() => heart.remove(), 1200);
    }

    _createHitEffect(x, y) {
        const effect = document.createElement('div');
        effect.className = 'hit-effect';
        effect.style.left = `${x}px`;
        effect.style.top = `${y}px`;
        this.game.speakiRoom.appendChild(effect);
        setTimeout(() => effect.remove(), 2000);
    }

    _resetActionTimer(speaki, delay) {
        if (speaki.timers.actionTimeout) clearTimeout(speaki.timers.actionTimeout);
        speaki.timers.actionTimeout = setTimeout(() => {
            if (speaki.status.state === STATE.DYING || speaki.isPendingDeletion) return;
            this.game.resetSpeakiAppearance(speaki);
            this._cleanupInteraction(speaki);
        }, delay);
    }
}

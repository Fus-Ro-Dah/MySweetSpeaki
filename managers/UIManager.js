import { STATE, ITEMS, JOBS, UNLOCK_DATA } from '../config.js';

/**
 * UI管理クラス
 * DOM操作（サイドメニュー、モーダル、ゲージ、ステータスリスト等）を一元管理する
 */
export class UIManager {
    constructor(game) {
        this.game = game;
        this.lastUIUpdate = 0;
        this.initTabs(); // コンストラクタでタブを初期化
        this.initMessageWindow(); // メッセージウィンドウの初期化
    }

    /** タブ機能の初期化 */
    initTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        if (tabButtons.length === 0) return;

        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.dataset.tab;
                this.switchTab(tabId);

                // サウンド再生は必要に応じてここに追加
            });
        });
    }

    /** タブの切り替え */
    switchTab(tabId) {
        const buttons = document.querySelectorAll('.tab-btn');
        const contents = document.querySelectorAll('.tab-content');

        buttons.forEach(b => b.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));

        const targetBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
        const targetContent = document.getElementById(tabId);

        if (targetBtn && targetContent) {
            targetBtn.classList.add('active');
            targetContent.classList.add('active');
        }
    }

    /** メッセージウィンドウの初期化（ドラッグ・閉じる） */
    initMessageWindow() {
        const windowEl = document.getElementById('message-window');
        const headerEl = document.getElementById('message-window-header');
        const closeBtn = document.getElementById('close-window-btn');
        const observeBtn = document.getElementById('observe-speaki-btn');

        if (!windowEl || !headerEl) return;

        // ドラッグ機能 (PointerEventsへの移行によりタッチ対応)
        let isDragging = false;
        let startX, startY;
        let pointerId = null;

        headerEl.addEventListener('pointerdown', (e) => {
            // ボタン自体をクリックした時はドラッグを開始しない（閉じれなくなるため）
            if (e.target.closest('button')) return;

            isDragging = true;
            startX = e.clientX - windowEl.offsetLeft;
            startY = e.clientY - windowEl.offsetTop;
            pointerId = e.pointerId;
            headerEl.setPointerCapture(pointerId);
        });

        headerEl.addEventListener('pointermove', (e) => {
            if (!isDragging || e.pointerId !== pointerId) return;
            windowEl.style.left = (e.clientX - startX) + 'px';
            windowEl.style.top = (e.clientY - startY) + 'px';
        });

        headerEl.addEventListener('pointerup', (e) => {
            if (e.pointerId === pointerId) {
                isDragging = false;
                headerEl.releasePointerCapture(pointerId);
                pointerId = null;
            }
        });

        headerEl.addEventListener('pointercancel', (e) => {
            if (e.pointerId === pointerId) {
                isDragging = false;
                pointerId = null;
            }
        });

        // 閉じるボタン
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                windowEl.classList.add('hidden');
                // 閉じる時はハイライトも外すか検討したが、一旦ウィンドウだけ消す
            });
        }

        // 「観察する」ボタン
        if (observeBtn) {
            observeBtn.addEventListener('click', () => {
                if (windowEl.classList.contains('hidden')) {
                    windowEl.classList.remove('hidden');
                } else {
                    windowEl.classList.add('hidden');
                }
            });
        }
    }

    /** メッセージウィンドウにメッセージを追加 */
    addConsoleMessage(text) {
        const container = document.getElementById('message-window-content');
        if (!container) return;

        // プレースホルダーがあれば削除
        const placeholder = container.querySelector('.window-placeholder');
        if (placeholder) placeholder.remove();

        const item = document.createElement('div');
        item.className = 'message-item';
        item.textContent = text;
        container.appendChild(item);

        // 自動スクロール
        container.scrollTop = container.scrollHeight;

        // メッセージ数制限（直近3件のみに制限）
        while (container.children.length > 3) {
            container.removeChild(container.firstChild);
        }
    }

    /** コンソールをクリアする */
    clearConsole(isObserving = false) {
        const container = document.getElementById('message-window-content');
        if (container) {
            const message = isObserving ? '観察中…' : 'ｽﾋﾟｷ一覧タブからｽﾋﾟｷを選択（★マークをクリック）して観察を開始';
            container.innerHTML = `<div class="window-placeholder">${message}</div>`;
        }
    }

    /** コンソールのヘッダーを更新する */
    updateConsoleHeader(name) {
        const headerTitle = document.getElementById('window-speaki-name');
        if (headerTitle) {
            headerTitle.textContent = name ? `観察中: ${name}` : '観察中: なし';
        }
    }

    /** アイテムメニューを動的に生成 */
    initItemMenu() {
        const game = this.game;
        const itemList = document.getElementById('item-list');
        const jobList = document.getElementById('job-list');

        if (itemList) itemList.innerHTML = '';
        if (jobList) jobList.innerHTML = '';

        if (!itemList && !jobList) return;

        // アイテムの描画
        if (itemList) {
            Object.keys(ITEMS).forEach(id => {
                const def = ITEMS[id];

                // 'never' の場合は絶対に表示しない
                if (def.showInMenu === 'never') return;

                // 特殊アイテムの場合は解放済みかどうかもチェックする
                const isUnlocked = def.isLockedItem ? (game.unlocks.itemUnlocks[id] === true) : true;

                // 解放が必要なアイテムで未解放なら表示しない
                if (def.showInMenu === false && !isUnlocked) return;

                // 解放アイテムでないのに showInMenu: false なら表示しない
                if (!def.isLockedItem && def.showInMenu === false) return;

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
                div.addEventListener('click', () => {
                    game.characters.callNPC(def.npcType);
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

    /** ギフトUIの表示制御 */
    updateGiftUI(mode) {
        const ui = document.getElementById('gift-event-ui');
        const reactionGroup = document.getElementById('reaction-group');
        const message = document.getElementById('gift-message');

        switch (mode) {
            case 'start':
                message.textContent = 'プレゼントを持ってきてくれた！ お礼を言おう';
                ui.classList.remove('hidden');
                reactionGroup.classList.remove('hidden'); // 最初からお礼ボタンを表示
                break;
            case 'hide':
                ui.classList.add('hidden');
                break;
        }
    }

    /** 幸福度ゲージの更新 */
    updateHappinessUI() {
        const game = this.game;
        const fill = document.getElementById('happiness-bar-fill');
        const pumpkinImg = document.getElementById('happiness-pumpkin');

        const pctFull = (game.happiness / game.maxHappiness) * 100;

        if (fill) {
            fill.style.width = `${Math.min(100, pctFull)}%`;
        }

        // かぼちゃの画像切り替え (p0-p4)
        if (pumpkinImg) {
            let stage = 0;
            if (pctFull >= 100) stage = 4;
            else if (pctFull >= 75) stage = 3;
            else if (pctFull >= 50) stage = 2;
            else if (pctFull >= 20) stage = 1;
            else stage = 0;
            pumpkinImg.src = `assets/images/p${stage}.png`;
        }

        if (game.happiness >= game.maxHappiness && !game.isGameCleared) {
            this.triggerGameClear();
        }
    }

    /** ゲームクリア演出 */
    triggerGameClear() {
        const game = this.game;
        game.isGameCleared = true;
        const overlay = document.getElementById('game-clear-overlay');
        const continueBtn = document.getElementById('continue-game-btn');

        if (overlay) {
            overlay.classList.remove('hidden');
            game.sound.playSound('チョワヨ.mp3', 0.8);

            if (continueBtn) {
                continueBtn.onclick = () => {
                    overlay.classList.add('hidden');
                };
            }
        }
    }

    /** プラスチックの在庫表示更新 */
    updatePlasticStockUI() {
        const game = this.game;
        const count = document.getElementById('gift-stock-count');
        const modalCount = document.getElementById('modal-plastic-count');
        if (count) count.textContent = Math.floor(game.plastics);
        if (modalCount) modalCount.textContent = Math.floor(game.plastics);
    }

    /** スピキの名前を更新する */
    updateSpeakiName(id, newName) {
        const speaki = this.game.speakis.find(s => s.id === id);
        if (speaki) {
            speaki.name = newName;
            // 観察ウィンドウのヘッダーも更新
            if (this.game.highlightedCharId === id) {
                this.updateConsoleHeader(speaki.name);
            }
        }
    }

    /** ハイライト設定 */
    setHighlight(id) {
        const game = this.game;
        const prevId = game.highlightedCharId;
        game.highlightedCharId = (game.highlightedCharId === id) ? null : id;

        // ウィンドウの表示切り替え
        const windowEl = document.getElementById('message-window');
        if (windowEl) {
            if (game.highlightedCharId !== null) {
                windowEl.classList.remove('hidden');
            }
        }

        // コンソールのリフレッシュ (対象が変わった時だけ)
        if (game.highlightedCharId !== prevId) {
            this.clearConsole(game.highlightedCharId !== null);
        }

        // ヘッダーの更新
        const selectedSpeaki = game.speakis.find(s => s.id === game.highlightedCharId);
        this.updateConsoleHeader(selectedSpeaki ? selectedSpeaki.name : null);

        this.updateSpeakiList(true);
    }

    /** 感情ラベルの取得 */
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

    /** スピキリストの更新 */
    updateSpeakiList(force = false) {
        const game = this.game;
        const listContainer = document.getElementById('speaki-list');
        if (!listContainer) return;

        // 入力中はforceがfalseなら更新をスキップ
        if (!force && listContainer.contains(document.activeElement)) return;

        // NPCはリストに表示しない
        const displaySpeakis = game.speakis.filter(s => s.canInteract && s.characterType !== 'ashur' && s.characterType !== 'posher');

        if (displaySpeakis.length === 0) {
            listContainer.innerHTML = '<p class="empty-list">スピキはいません...</p>';
            this._lastSpeakiIds = "";
            return;
        }

        // リストの構造（スピキの数やID）が変わっていないか確認
        const currentIds = displaySpeakis.map(s => s.id).join(',');
        if (!force && this._lastSpeakiIds === currentIds) {
            // 構造が同じなら、中身（ゲージ等）だけ更新してホバーを維持する
            this._updateSpeakiEntries(displaySpeakis);
            return;
        }
        this._lastSpeakiIds = currentIds;

        // 構造が変わった場合のみ full rebuild
        let html = '';
        displaySpeakis.forEach(s => {
            const isHighlighted = (s.id === game.highlightedCharId);
            const emotionLabel = this._getEmotionLabel(s);

            const friendshipPct = Math.min(100, Math.max(0, s.status.friendship + 50));
            const hungerPct = Math.min(100, Math.max(0, s.status.hunger));
            const moodPct = Math.min(100, Math.max(0, s.status.mood + 50));

            html += `
            <div class="speaki-entry ${isHighlighted ? 'active' : ''}" data-id="${s.id}" onclick="window.game.ui.setHighlight(${s.id})">
                <div class="speaki-entry-header">
                    <button class="highlight-toggle ${isHighlighted ? 'active' : ''}" 
                        onclick="event.stopPropagation(); window.game.ui.setHighlight(${s.id})">
                        ${isHighlighted ? '★' : '☆'}
                    </button>
                    <input type="text" class="speaki-name-input" 
                        id="speaki-name-input-${s.id}" name="speaki-name-input-${s.id}" 
                        value="${s.name}" 
                        onclick="event.stopPropagation()" 
                        oninput="window.game.ui.updateSpeakiName(${s.id}, this.value)"
                        onfocus="this.select()">
                    <span class="speaki-state-tag">${emotionLabel || ''}</span>
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

    /** 既存語のリスト要素を効率的に更新（ホバー維持のため） */
    _updateSpeakiEntries(displaySpeakis) {
        const listContainer = document.getElementById('speaki-list');
        if (!listContainer) return;

        const entries = listContainer.querySelectorAll('.speaki-entry');
        displaySpeakis.forEach((s, index) => {
            const entry = entries[index];
            if (!entry || parseInt(entry.dataset.id) !== s.id) return;

            const isHighlighted = (s.id === this.game.highlightedCharId);

            // クラスの更新
            entry.classList.toggle('active', isHighlighted);

            // 星ボタンの更新
            const starBtn = entry.querySelector('.highlight-toggle');
            if (starBtn) {
                starBtn.classList.toggle('active', isHighlighted);
                starBtn.textContent = isHighlighted ? '★' : '☆';
            }

            // 名前の更新 (フォーカスがなければ)
            const nameInput = entry.querySelector('.speaki-name-input');
            if (nameInput && document.activeElement !== nameInput) {
                nameInput.value = s.name;
            }

            // 状態タグの更新
            const tag = entry.querySelector('.speaki-state-tag');
            if (tag) {
                tag.textContent = this._getEmotionLabel(s);
            }

            // ゲージの更新
            const friendshipPct = Math.min(100, Math.max(0, s.status.friendship + 50));
            const hungerPct = Math.min(100, Math.max(0, s.status.hunger));
            const moodPct = Math.min(100, Math.max(0, s.status.mood + 50));

            const gaugeFills = entry.querySelectorAll('.gauge-fill');
            const gaugeValues = entry.querySelectorAll('.gauge-value');

            // 0: friendship, 1: hunger, 2: mood
            if (gaugeFills[0]) gaugeFills[0].style.width = `${friendshipPct}%`;
            if (gaugeValues[0]) gaugeValues[0].textContent = s.status.friendship.toFixed(0);

            if (gaugeFills[1]) gaugeFills[1].style.width = `${hungerPct}%`;
            if (gaugeValues[1]) gaugeValues[1].textContent = s.status.hunger.toFixed(0);
        });
    }

    /** バイトメニューのUI状態を更新 */
    updateJobMenuUI() {
        const game = this.game;
        const jobList = document.getElementById('job-list');
        if (!jobList) return;

        const jobItems = jobList.querySelectorAll('.draggable-item');
        jobItems.forEach(btn => {
            const id = btn.dataset.id;
            const def = JOBS[id];
            if (!def) return;

            const isAttending = game.speakis.some(s => s.characterType === def.npcType);

            if (isAttending) {
                btn.classList.add('active');
                btn.textContent = `${def.name}(退勤させる)`;
            } else {
                btn.classList.remove('active');
                btn.textContent = `${def.name}(出勤させる)`;
            }
        });
    }

    /** アイテムリロード時間のUI更新 */
    updateCooldownUI() {
        const game = this.game;
        const now = Date.now();
        if (!document.querySelectorAll) return;
        const items = document.querySelectorAll('.draggable-item');
        items.forEach(el => {
            const id = el.dataset.id;
            const cooldownEnd = game.itemCooldowns[id];

            if (cooldownEnd && now < cooldownEnd) {
                el.classList.add('cooldown');
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

    /** 定期的なUI更新（約250msごと） */
    updatePeriodic() {
        if (!this.lastUIUpdate || Date.now() - this.lastUIUpdate > 250) {
            this.updateSpeakiList();
            this.lastUIUpdate = Date.now();
        }
        this.updateCooldownUI();
    }

    /** アンロックメニューの生成 */
    initUnlockMenu() {
        const game = this.game;
        const list = document.getElementById('unlock-list');
        if (!list) return;

        const hungerDecayPrice = UNLOCK_DATA.hungerDecay.price;
        const currentHungerSec = 2 + game.unlocks.hungerDecayLv;
        const nextHungerSec = currentHungerSec + 1;

        const unlockDefs = [];

        // 1. 基本機能（UNLOCK_DATA から動的に取得）
        Object.keys(UNLOCK_DATA).forEach(key => {
            const data = UNLOCK_DATA[key];
            // アップグレード系（Lvがあるもの）以外をここに追加
            if (key !== 'hungerDecay' && key !== 'affectionDecay' && key !== 'cooldownReduction') {
                unlockDefs.push({
                    id: key,
                    ...data,
                    current: game.unlocks[key]
                });
            }
        });

        // 2. アップグレード項目（チャレンジモードのみ表示する項目など）
        if (game.gameMode !== 'relaxed') {
            unlockDefs.push(
                {
                    id: 'hungerDecay',
                    name: `${UNLOCK_DATA.hungerDecay.name} (Lv.${game.unlocks.hungerDecayLv})`,
                    price: hungerDecayPrice,
                    desc: `${UNLOCK_DATA.hungerDecay.desc}現在: ${currentHungerSec}秒に1 → 次: ${nextHungerSec}秒に1`,
                    current: false,
                    isUpgrade: true
                },
                {
                    id: 'affectionDecay',
                    name: `${UNLOCK_DATA.affectionDecay.name} (Lv.${game.unlocks.affectionDecayLv})`,
                    price: UNLOCK_DATA.affectionDecay.price,
                    desc: `${UNLOCK_DATA.affectionDecay.desc}現在: ${2 + game.unlocks.affectionDecayLv}秒に1 → 次: ${3 + game.unlocks.affectionDecayLv}秒に1`,
                    current: false,
                    isUpgrade: true
                },
                {
                    id: 'cooldownReduction',
                    name: `${UNLOCK_DATA.cooldownReduction.name} (Lv.${game.unlocks.reloadReductionLv})`,
                    price: UNLOCK_DATA.cooldownReduction.price,
                    desc: `${UNLOCK_DATA.cooldownReduction.desc}現在: -${game.unlocks.reloadReductionLv}秒 → 次: -${game.unlocks.reloadReductionLv + 1}秒`,
                    current: false,
                    isUpgrade: true
                }
            );
        }

        // 3. 特殊アイテムの個別解放
        Object.keys(ITEMS).forEach(itemId => {
            const def = ITEMS[itemId];
            if (def.isLockedItem) {
                const isUnlocked = game.unlocks.itemUnlocks[itemId] === true;
                unlockDefs.push({
                    id: `item_${itemId}`,
                    name: `${def.name}の解放`,
                    price: def.unlockPrice || 3,
                    desc: def.unlockDesc || `「${def.name}」をメニューからいつでも配置できるようになります。`,
                    current: isUnlocked
                });
            }
        });

        list.innerHTML = '';
        unlockDefs.forEach(def => {
            const div = document.createElement('div');
            div.className = `unlock-item ${def.current ? 'unlocked' : 'locked'}`;

            let buttonHTML = '';
            const settingKey = `${def.id}Enabled`;

            if (def.current) {
                // 解放済みの場合
                if (game.settings[settingKey] !== undefined) {
                    // ON/OFF切り替えがある機能
                    const isEnabled = game.settings[settingKey];
                    let toggleText = isEnabled ? 'ON' : 'OFF';
                    if (def.id === 'feeder') toggleText = isEnabled ? '手伝い中' : '今はいない';
                    else if (def.id === 'growthStop') toggleText = isEnabled ? '成長停止中' : '今は自然に成長する';
                    else if (def.id === 'autoReceive') toggleText = isEnabled ? '自動回収中' : '自動回収停止';

                    buttonHTML = `
                        <button class="toggle-btn ${isEnabled ? 'active' : 'inactive'}" 
                            onclick="window.game.toggleFeature('${def.id}')">
                            ${toggleText}
                        </button>
                    `;
                } else {
                    // 切り替えがない機能（アイテム解放など）
                    buttonHTML = `
                        <button class="primary-btn unlock-btn" disabled>
                            解放済み
                        </button>
                    `;
                }
            } else {
                // 未解放の場合
                const canAfford = game.plastics >= def.price;
                buttonHTML = `
                    <button class="primary-btn unlock-btn" ${!canAfford ? 'disabled' : ''} 
                        onclick="window.game.unlockFeature('${def.id}', ${def.price})">
                        ${def.isUpgrade ? '強化する' : '解放する'}
                    </button>
                `;
            }

            div.innerHTML = `
                <h4>${def.name}</h4>
                <p>${(def.desc || '').replace(/\\n/g, '<br>')}</p>
                <div class="price">${def.current ? '解放済み' : `消費<img src="assets/images/icon_prastic.png" class="mini-icon" alt="plastic icon">: ${def.price} 個 `}</div>
                ${buttonHTML}
            `;
            list.appendChild(div);
        });
    }

}

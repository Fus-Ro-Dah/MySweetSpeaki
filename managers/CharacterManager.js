import { STATE } from '../config.js';
import { Speaki } from '../speaki.js';
import { BabySpeaki } from '../baby-speaki.js';
import { ChildSpeaki } from '../child-speaki.js';
import { NPCCharacter } from '../npc-character.js';
import { Ashur } from '../ashur.js';
import { Posher } from '../posher.js';

/**
 * キャラクター管理クラス
 * キャラクターの追加・削除・進化・NPC管理を担当する
 */
export class CharacterManager {
    constructor(game) {
        this.game = game;
    }

    /** キャラクターの追加 */
    addSpeaki(x, y, type = 'speaki') {
        const game = this.game;
        const id = game.nextCharId++;

        const defX = (game.canvas.width > 0) ? game.canvas.width * 0.4 : window.innerWidth * 0.4;
        const defY = (game.canvas.height > 0) ? game.canvas.height * 0.5 : window.innerHeight * 0.5;

        const finalX = (x !== undefined && x !== 0) ? x : defX + (Math.random() * 100 - 50);
        const finalY = (y !== undefined && y !== 0) ? y : defY + (Math.random() * 100 - 50);

        let char;
        const isSpeakiType = (type === 'speaki' || type === 'baby' || type === 'child');
        
        let options = { characterType: type };
        if (isSpeakiType) {
            game.speakiCount++;
            options.speakiNumber = game.speakiCount;
        }

        if (type === 'baby') {
            char = new BabySpeaki(game, id, game.speakiRoom, finalX, finalY, options);
        } else if (type === 'child') {
            char = new ChildSpeaki(game, id, game.speakiRoom, finalX, finalY, options);
        } else if (type === 'ashur') {
            char = new Ashur(game, id, game.speakiRoom, finalX, finalY, options);
        } else if (type === 'posher') {
            char = new Posher(game, id, game.speakiRoom, finalX, finalY, options);
        } else if (type === 'npc' || type.startsWith('npc_')) {
            char = new NPCCharacter(game, id, game.speakiRoom, finalX, finalY, options);
        } else {
            char = new Speaki(game, id, game.speakiRoom, finalX, finalY, options);
        }
        game.speakis.push(char);
        game.ui.updateSpeakiList();
    }

    /** キャラクター削除 */
    removeSpeaki(id) {
        const game = this.game;
        const index = game.speakis.findIndex(s => s.id === id);
        if (index !== -1) {
            const s = game.speakis[index];

            // ギフト担当解除 (ゾンビ化防止)
            if (game.giftPartner === s) {
                game.completeGiftEvent(null);
                // console.log(`[Game] Gift event aborted because Speaki ${id} was removed.`);
            }

            // 【再実装】キャラクターの破棄処理を呼び出す (タイマー、音声、DOMなどの解放)
            s.destroy();

            // 交流相手の解放 (s.destroyの前でも後でも良いが、参照が生きているうちに処理)
            if (s.socialConfig && s.socialConfig.partner) {
                const partner = s.socialConfig.partner;
                // console.log(`[CharacterManager] Releasing partner ${partner.id} from social interaction due to removal of ${id}.`);
                partner.status.state = (partner.status.stateStack.length > 0) ? partner.status.stateStack.pop() : STATE.IDLE;
                partner.status.socialTurnCount = 0;
                partner.status.isMySocialTurn = false;
                partner.socialConfig = null;
                partner.hideEmoji();
                partner._onStateChanged(partner.status.state);
            }

            game.speakis.splice(index, 1);
            if (game.highlightedCharId === id) game.highlightedCharId = null;
            game.ui.updateSpeakiList(true);
            game.ui.updateJobMenuUI();
        }
    }

    /** 改名 */
    renameSpeaki(id, newName) {
        const s = this.game.speakis.find(s => s.id === id);
        if (s) {
            s.name = newName;
            this.game.ui.updateSpeakiList(true);
        }
    }

    /** NPCを呼び出す (シングルトン・トグル式) */
    callNPC(type) {
        const game = this.game;
        const existingNPC = game.speakis.find(s => s.characterType === type);
        if (existingNPC) {
            // console.log(`[Game] NPC ${type} already exists. Removing (Leaving)...`);
            this.removeSpeaki(existingNPC.id);
            return;
        }

        const centerX = (game.speakiRoom ? game.speakiRoom.clientWidth : 1200) / 2;
        const topY = 100;

        game.addSpeaki(centerX, topY, type);
        // console.log(`[Game] Called NPC: ${type}`);
        game.ui.updateJobMenuUI();
    }

    /** 赤ちゃんスピキの進化（子供へ） */
    evolveBabyToChild(baby) {
        const game = this.game;
        if (!baby) return;
        // console.log(`[Game] BabySpeaki ${baby.id} is evolving into Child!`);

        // 【再実装】古いオブジェクトの破棄
        baby.destroy();

        const index = game.speakis.indexOf(baby);
        if (index !== -1) {
            game.speakis.splice(index, 1);
        }

        const child = new ChildSpeaki(game, baby.id, game.speakiRoom, baby.pos.x, baby.pos.y);
        child.name = baby.name;
        child.status.friendship = baby.status.friendship;
        child.status.hunger = baby.status.hunger;
        child.status.state = baby.status.state;
        child.status.stateStack = baby.status.stateStack || [];
        child.status.socialTurnCount = baby.status.socialTurnCount || 0;
        child.status.isMySocialTurn = baby.status.isMySocialTurn || false;

        // 交流情報の引き継ぎ (参照の渡し直し)
        if (baby.socialConfig) {
            child.socialConfig = baby.socialConfig;
            const partnerId = baby.socialConfig.partner ? baby.socialConfig.partner.id : null;
            if (partnerId !== null) {
                // 相方も進化している可能性があるため、IDで最新のオブジェクトを探し出す
                const realPartner = game.speakis.find(s => s.id === partnerId);
                if (realPartner && realPartner.socialConfig) {
                    realPartner.socialConfig.partner = child; // 相方に対して新しい自分を教える
                    child.socialConfig.partner = realPartner; // 自分も最新の相方を参照する
                }
            }
        }
        child.interaction.socialOptions = baby.interaction.socialOptions;

        if (game.giftPartner === baby) {
            game.giftPartner = child;
        }

        if (index !== -1) {
            game.speakis.splice(index, 0, child);
        } else {
            game.speakis.push(child);
        }

        game.sound.playSound('チョワヨ.mp3', 1.2);
        game.ui.updateSpeakiList(true);
    }

    /** 子供スピキの進化（大人へ） */
    evolveChildToAdult(child) {
        const game = this.game;
        if (!child) return;
        // console.log(`[Game] ChildSpeaki ${child.id} is evolving into Adult!`);

        // 【再実装】古いオブジェクトの破棄
        child.destroy();

        const index = game.speakis.indexOf(child);
        if (index !== -1) {
            game.speakis.splice(index, 1);
        }

        const adult = new Speaki(game, child.id, game.speakiRoom, child.pos.x, child.pos.y);
        adult.name = child.name;
        adult.status.friendship = child.status.friendship;
        adult.status.hunger = child.status.hunger;
        adult.status.state = child.status.state;
        adult.status.stateStack = child.status.stateStack || [];
        adult.status.socialTurnCount = child.status.socialTurnCount || 0;
        adult.status.isMySocialTurn = child.status.isMySocialTurn || false;

        // 交流情報の引き継ぎ (参照の渡し直し)
        if (child.socialConfig) {
            adult.socialConfig = child.socialConfig;
            const partnerId = child.socialConfig.partner ? child.socialConfig.partner.id : null;
            if (partnerId !== null) {
                // 相方も進化している可能性があるため、IDで最新のオブジェクトを探し出す
                const realPartner = game.speakis.find(s => s.id === partnerId);
                if (realPartner && realPartner.socialConfig) {
                    realPartner.socialConfig.partner = adult; // 相方に対して新しい自分を教える
                    adult.socialConfig.partner = realPartner; // 自分も最新の相方を参照する
                }
            }
        }
        adult.interaction.socialOptions = child.interaction.socialOptions;

        if (game.giftPartner === child) {
            game.giftPartner = adult;
        }

        if (index !== -1) {
            game.speakis.splice(index, 0, adult);
        } else {
            game.speakis.push(adult);
        }

        game.sound.playSound('チョワヨ.mp3', 1.0);
        game.ui.updateSpeakiList(true);
    }

    /** 死亡・削除予定のスピキを処理（毎フレーム） */
    update(dt) {
        const game = this.game;
        for (let i = game.speakis.length - 1; i >= 0; i--) {
            const s = game.speakis[i];
            s.update(dt);

            // 進化フラグのチェック: update完了後に安全に進化処理を行う
            // (update()内から直接evolveBabyToChild()を呼ぶと、destroy()後もupdate()が続き
            //  this.visual.domがnullになってクラッシュするため、フラグ経由で処理する)
            if (s.isPendingEvolution) {
                s.isPendingEvolution = false;
                if (s.characterType === 'baby' && game.evolveBabyToChild) {
                    // console.log(`[CharacterManager] 赤ちゃん ${s.id} (${s.name}) を子供に進化させます。`);
                    game.evolveBabyToChild(s);
                } else if (s.characterType === 'child' && game.evolveChildToAdult) {
                    // console.log(`[CharacterManager] 子供 ${s.id} (${s.name}) を大人に進化させます。`);
                    game.evolveChildToAdult(s);
                }
                // 進化後は配列が書き換わっているためcontinueでインデックスを保護
                continue;
            }

            if (s.isPendingDeletion) {
                // console.log(`[Game] Speaki ${s.id} died and returned to DeathWimple.`);
                game.items.addItem('DeathWimple', 'item', s.pos.x, s.pos.y);

                // --- クリーンアップ ---
                if (game.interactTarget === s) game.interactTarget = null;
                if (game.giftPartner === s) game.completeGiftEvent(null);

                if (s.socialConfig && s.socialConfig.partner) {
                    const partner = s.socialConfig.partner;
                    // console.log(`[Game] Releasing partner ${partner.id} from social interaction.`);
                    partner.status.state = (partner.status.stateStack.length > 0) ? partner.status.stateStack.pop() : STATE.IDLE;
                    partner.status.socialTurnCount = 0;
                    partner.status.isMySocialTurn = false;
                    partner.socialConfig = null;
                    partner._onStateChanged(partner.status.state);
                }

                // 【再実装】キャラクターの破棄処理を呼び出す
                s.destroy();

                // リストから削除
                game.speakis.splice(i, 1);
            }
        }
    }
}

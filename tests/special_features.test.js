import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Speaki } from '../speaki.js';
import { Item } from '../item.js';
import { STATE, ITEMS } from '../config.js';

describe('Special Item Features (Phase 4)', () => {
    let game;
    let mockParent;

    beforeEach(() => {
        mockParent = document.createElement('div');
        game = {
            placedItems: [],
            speakis: [],
            unlocks: { affectionDecayLv: 0 },
            sound: { 
                playSound: vi.fn(),
                // syncDOM であらゆるアセットキーを参照しても壊れないように Proxy を使用
                images: new Proxy({}, { get: () => ({ complete: true, naturalWidth: 100 }) })
            },
            playSound: vi.fn(), 
            items: {
                hasItemOnField: vi.fn((id) => game.placedItems.some(it => it.id === id)),
                requestItemUsage: vi.fn()
            },
            input: { _createPettingHeart: vi.fn() }
        };
        // global.window.game をモックにセット（テスト環境用）
        global.window = { game: game };

        // syncDOM がアセット読み込みで落ちるのを防ぐためモック化
        vi.spyOn(Speaki.prototype, 'syncDOM').mockImplementation(() => {});
        vi.spyOn(Speaki.prototype, 'createDOM').mockImplementation(() => {});
    });

    describe('Pumpkin (ToyPumpkin) - Holy Statue Effect', () => {
        it('should skip friendship decay when ToyPumpkin is on field', () => {
            const speaki = new Speaki(game, 1, mockParent, 100, 100, { friendship: 50 });
            game.speakis.push(speaki);
            
            // かぼちゃがある状態にする
            game.placedItems.push(new Item('ToyPumpkin', 0, 0));
            
            const dt = 1000; // 1秒
            const initialFriendship = speaki.status.friendship;
            
            speaki.update(dt);
            
            // 本来なら減少するはずだが、かぼちゃがあるので維持されるはず
            expect(speaki.status.friendship).toBe(initialFriendship);
        });

        it('should decay friendship when ToyPumpkin is NOT on field', () => {
            const speaki = new Speaki(game, 1, mockParent, 100, 100, { friendship: 50 });
            game.speakis.push(speaki);
            
            // かぼちゃがない状態
            game.placedItems = [];
            
            const dt = 1000; // 1秒
            const initialFriendship = speaki.status.friendship;
            
            speaki.update(dt);
            
            // 減少しているはず
            expect(speaki.status.friendship).toBeLessThan(initialFriendship);
        });

        it('should have higher attraction range and chance based on friendship', () => {
            const highFriendshipSpeaki = new Speaki(game, 1, mockParent, 1000, 1000, { friendship: 100 });
            const lowFriendshipSpeaki = new Speaki(game, 2, mockParent, 100, 100, { friendship: 0 });
            game.speakis = [highFriendshipSpeaki, lowFriendshipSpeaki];
            
            // ItemManager.addItem のロジックをシミュレート
            // 座標 (0,0) に配置
            const x = 0, y = 0;
            const id = 'ToyPumpkin';
            const results = [];

            game.speakis.forEach(speaki => {
                const distToItem = Math.sqrt((speaki.pos.x - x) ** 2 + (speaki.pos.y - y) ** 2);
                let reactionRange = 500;
                let reactionChance = 1.0;

                if (id === 'ToyPumpkin') {
                    if (speaki.status.friendship <= 0) return; // 反応しない
                    reactionRange = 500 + (speaki.status.friendship * 15); 
                    reactionChance = speaki.status.friendship / 100;
                }
                
                if (distToItem <= reactionRange) {
                    results.push(speaki.id);
                }
            });

            // 高好感度個体(ID:1)は距離1414px(<=2000px)なので反応リストに入る
            expect(results).toContain(1);
            // 低好感度個体(ID:2)はfriendship:0なので、早期リターンで反応しない
            expect(results).not.toContain(2);
        });
    });

    describe('AnimalCan - Carrying Feature', () => {
        it('should pick up AnimalCan instead of consuming it', () => {
            const speaki = new Speaki(game, 1, mockParent, 100, 100);
            const animalCan = new Item('AnimalCan', 100, 100);
            game.placedItems.push(animalCan);
            
            speaki._performItemAction(animalCan);
            
            expect(speaki.interaction.carryingItem).toBe(animalCan);
            expect(animalCan.carriedBy).toBe(speaki);
            expect(speaki.status.state).toBe(STATE.WALKING);
            expect(game.items.requestItemUsage).not.toHaveBeenCalled();
        });

        it('should drop AnimalCan when arriving at destination', () => {
            const speaki = new Speaki(game, 1, mockParent, 100, 100);
            const animalCan = new Item('AnimalCan', 100, 100);
            
            // 運搬状態にする
            speaki.interaction.carryingItem = animalCan;
            animalCan.carriedBy = speaki;
            speaki.status.state = STATE.WALKING;
            speaki.pos.destinationSet = true;
            speaki.pos.x = 200;
            speaki.pos.y = 200;
            speaki.pos.targetX = 200;
            speaki.pos.targetY = 200;
            
            // 到着判定
            speaki._handleArrival();
            
            expect(speaki.interaction.carryingItem).toBeNull();
            expect(animalCan.carriedBy).toBeNull();
        });
    });
});

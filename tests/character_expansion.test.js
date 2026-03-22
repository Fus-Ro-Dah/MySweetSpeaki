import { describe, it, expect, vi, beforeEach } from 'vitest';
import { STATE } from '../config.js';
import { NPCCharacter } from '../npc-character.js';
import { BaseCharacter } from '../base-character.js';
import { Speaki } from '../speaki.js';
import { FeederNPC } from '../feeder-npc.js';
import { Ashur } from '../ashur.js';
import { Posher } from '../posher.js';

// Mock DOM
global.document = {
    createElement: vi.fn(() => ({
        appendChild: vi.fn(),
        classList: { add: vi.fn(), remove: vi.fn() },
        style: {},
        setAttribute: vi.fn(),
    })),
};

describe('Character Expansion Logic', () => {
    let parentElement;

    beforeEach(() => {
        parentElement = {
            appendChild: vi.fn(),
            clientWidth: 1000,
            clientHeight: 800,
        };
        global.window = {
            game: {
                addItem: vi.fn(),
                playSound: vi.fn(),
                images: {},
                speakis: [],
                unlocks: { hungerDecayLv: 0, affectionDecayLv: 0 }
            },
            innerWidth: 1000,
            innerHeight: 800,
            AudioContext: vi.fn(),
        };
    });

    describe('BaseCharacter Flags', () => {
        it('should respect hasHunger=false', () => {
            const char = new BaseCharacter(global.window.game, 'test', parentElement, 100, 100, { hasHunger: false });
            const initialHunger = char.status.hunger;
            char.update(1000);
            expect(char.status.hunger).toBe(initialHunger);
        });

        it('should respect hasHunger=true (default)', () => {
            const char = new BaseCharacter(global.window.game, 'test', parentElement, 100, 100);
            const initialHunger = char.status.hunger;
            char.update(1000);
            expect(char.status.hunger).toBeLessThan(initialHunger);
        });

        it('should respect hasEmotion=false', () => {
            const char = new BaseCharacter(global.window.game, 'test', parentElement, 100, 100, { hasEmotion: false });
            char.status.friendship = -50;
            char._updateBaseEmotion();
            expect(char.status.emotion).toBe('normal');
        });
    });

    describe('NPCCharacter', () => {
        it('should have canInteract=false by default', () => {
            const npc = new NPCCharacter(global.window.game, 'npc1', parentElement, 100, 100);
            expect(npc.canInteract).toBe(false);
        });

        it('should use ABILITY_ACTION state when executing ability', () => {
            const npc = new NPCCharacter(global.window.game, 'npc1', parentElement, 100, 100);
            npc.executeAbility('test_ability', { duration: 1000 });
            expect(npc.status.state).toBe(STATE.ABILITY_ACTION);
            expect(npc.status.action).toBe('test_ability');
        });

        it('should trigger _onAbilityEffect', () => {
            const npc = new NPCCharacter(global.window.game, 'npc1', parentElement, 100, 100);
            const spy = vi.spyOn(npc, '_onAbilityEffect');
            npc.executeAbility('magic', {});
            expect(spy).toHaveBeenCalledWith('magic', {});
        });
    });

    describe('FeederNPC logic', () => {
        it('should stop 150px early when targetSpeaki is set', () => {
            const feeder = new FeederNPC(global.window.game, 'feeder1', parentElement, 0, 0);
            const target = new Speaki(global.window.game, 'target', parentElement, 200, 0);
            feeder.targetSpeaki = target;
            feeder.pos.targetX = target.pos.x;
            feeder.pos.targetY = target.pos.y;
            feeder.pos.destinationSet = true;

            // 距離200px (150pxより大きい)
            feeder._updateStateTransition();
            expect(feeder.status.state).toBe(STATE.IDLE); // まだWALKINGになってないはず（初期値IDLE）

            feeder.timers.stateStart = 0; // すぐ移動
            feeder.timers.waitDuration = 0;
            feeder._updateStateTransition();
            expect(feeder.status.state).toBe(STATE.WALKING);

            // 重要：_onStateChanged(WALKING) によって目的地がランダムに上書きされた可能性があるため再設定
            feeder.pos.targetX = target.pos.x;
            feeder.pos.targetY = target.pos.y;
            feeder.pos.destinationSet = true;

            // 160pxまで移動 (threshold=150なのでまだ未到着)
            feeder.pos.x = 40;
            feeder._updateStateTransition();
            expect(feeder.status.state).toBe(STATE.WALKING);

            // 140pxまで到着 (threshold=150)
            feeder.pos.x = 60;
            feeder._updateStateTransition();
            // 到着するとABILITY_ACTION（アイテム配置）に遷移する
            expect(feeder.status.state).toBe(STATE.ABILITY_ACTION);
        });

        it('should place item at midpoint between self and target', () => {
            const feeder = new FeederNPC(global.window.game, 'feeder1', parentElement, 100, 100);
            feeder.rescueItemType = 'TestItem';

            // 手動で中間地点配置をテスト
            feeder._onAbilityEffect('place_item', {
                targetPos: { x: 200, y: 100 },
                itemType: 'TestItem'
            });

            // (100+200)/2 = 150
            expect(global.window.game.addItem).toHaveBeenCalledWith('TestItem', 'item', 150, 100);
        });
    });

    describe('Ashur specific logic', () => {
        it('should initialize as ashur type with Mocaron', () => {
            const ashur = new Ashur(global.window.game, 'ashur1', parentElement, 0, 0);
            expect(ashur.characterType).toBe('ashur');
            expect(ashur.rescueItemType).toBe('Mocaron');
            expect(ashur.dashSpeedMultiplier).toBe(2.0);
        });

        it('should find hungry Speaki as target', () => {
            const ashur = new Ashur(global.window.game, 'ashur1', parentElement, 0, 0);
            const hungrySpeaki = new Speaki(global.window.game, 'hungry', parentElement, 100, 100, { hunger: 20 });
            global.window.game.speakis = [ashur, hungrySpeaki];

            const target = ashur._findHungrySpeaki();
            expect(target).toBe(hungrySpeaki);
        });
    });

    describe('Posher specific logic', () => {
        it('should initialize as posher type with Poteto', () => {
            const posher = new Posher(global.window.game, 'posher1', parentElement, 0, 0);
            expect(posher.characterType).toBe('posher');
            expect(posher.rescueItemType).toBe('Poteto');
            expect(posher.dashSpeedMultiplier).toBe(3.0);
        });
    });
});

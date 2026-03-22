import { describe, it, expect, vi, beforeEach } from 'vitest';
import { STATE, ITEMS } from '../config.js';
import { BaseCharacter } from '../base-character.js';
import { Game } from '../game.js';
import { SoundManager } from '../managers/SoundManager.js';
import { Item } from '../item.js';
import { ASSETS } from '../config.js';

// Mock Fetch and Audio APIs
global.fetch = vi.fn(() => Promise.resolve({
    ok: true,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0))
}));

vi.spyOn(SoundManager.prototype, '_loadBGM').mockImplementation(() => Promise.resolve());
// loadResources はリソース読み込み（fetch/Audio）を伴うため完全に無効化する
vi.spyOn(SoundManager.prototype, 'loadResources').mockImplementation(() => { });

// Mock unlocks
Game.prototype.unlocks = { hungerDecayLv: 0, affectionDecayLv: 0 };

// Mock DOM
const mockCanvas = {
    getContext: vi.fn(() => ({
        clearRect: vi.fn(),
        drawImage: vi.fn(),
        beginPath: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
    })),
    getBoundingClientRect: vi.fn(() => ({ left: 0, top: 0, width: 1000, height: 800 })),
    parentElement: {
        getBoundingClientRect: vi.fn(() => ({ left: 0, top: 0, width: 1000, height: 800 })),
        appendChild: vi.fn(),
        clientWidth: 1000,
        clientHeight: 800
    },
    addEventListener: vi.fn(), // NEW: addEventListener support
};

global.window = {
    innerWidth: 1000,
    innerHeight: 800,
    AudioContext: vi.fn(() => ({
        createGain: vi.fn(() => ({ connect: vi.fn(), gain: { value: 0 } })),
        decodeAudioData: vi.fn(),
    })),
    requestAnimationFrame: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    Audio: vi.fn().mockImplementation(function (src) {
        return {
            src: src || '',
            play: vi.fn(() => Promise.resolve()),
            pause: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            load: vi.fn(),
        };
    }),
};
global.Audio = global.window.Audio;
global.Image = vi.fn().mockImplementation(function () {
    return { src: '' };
});

global.document = {
    activeElement: null, // Mock activeElement
    createElement: vi.fn(() => ({
        appendChild: vi.fn(),
        classList: { add: vi.fn(), remove: vi.fn() },
        dataset: {},
        style: {},
        setAttribute: vi.fn(),
        className: '',
        addEventListener: vi.fn(),
        querySelectorAll: vi.fn(() => []),
        querySelector: vi.fn(() => null),
    })),
    getElementById: vi.fn((id) => {
        const baseElement = {
            appendChild: vi.fn(),
            innerHTML: '',
            getBoundingClientRect: vi.fn(() => ({ left: 0, top: 0, width: 1000, height: 800 })),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            classList: { add: vi.fn(), remove: vi.fn() },
            style: {},
            onclick: null,
            clientWidth: 1000,
            clientHeight: 800,
            dataset: {},
            contains: vi.fn(() => false), // Mock contains
            querySelectorAll: vi.fn(() => []), // NEW: querySelectorAll
            querySelector: vi.fn(() => null),
        };
        if (id === 'game-canvas') {
            return { ...baseElement, ...mockCanvas };
        }
        return baseElement;
    }),
    querySelectorAll: vi.fn(() => []),
    querySelector: vi.fn(() => null),
};

describe('Item and Emotion Logic', () => {
    let parentElement;
    let game;

    beforeEach(() => {
        parentElement = document.getElementById('speaki-room');
        game = new Game();
        global.window.game = game;
    });

    describe('Emotion Priority', () => {
        it('should prioritize hunger over forced emotion', () => {
            const char = new BaseCharacter(game, 'test', parentElement, 100, 100);

            // 1. 強制感情をセット (本来なら happy になるはず)
            char.status.forcedEmotion = 'happy';
            char.timers.forcedEmotionUntil = Date.now() + 10000;

            // 2. 空腹にする
            char.status.hunger = 0;

            char._updateBaseEmotion();

            // 空腹最優先なので sad になり、強制感情タイマーがクリアされているはず
            expect(char.status.emotion).toBe('sad');
            expect(char.timers.forcedEmotionUntil).toBe(0);
        });

        it('should prioritize forced emotion over friendship', () => {
            const char = new BaseCharacter(game, 'test', parentElement, 100, 100);

            // 1. 低好感度 (本来なら sad になるはず)
            char.status.friendship = -50;
            char.status.hunger = 100;

            // 2. アイテムによる強制感情セット
            char.status.forcedEmotion = 'happy';
            char.timers.forcedEmotionUntil = Date.now() + 10000;

            char._updateBaseEmotion();

            // 強制感情が優先されるので happy
            expect(char.status.emotion).toBe('happy');
        });
    });

    describe('Deferred Friendship Reward', () => {
        it('should NOT increase friendship immediately on addItem', () => {
            const char = new BaseCharacter(game, 'test', parentElement, 100, 100);
            game.speakis.push({ 
            id: 1, 
            characterType: 'normal', 
            visual: { dom: { container: { remove: vi.fn() } } },
            getStateLabel: () => 'idle',
            getName: () => 'Normal',
            status: { friendship: 0, hunger: 100, state: STATE.IDLE },
            update: vi.fn(),
            isPendingDeletion: false
        });
            const initialFriendship = char.status.friendship;

            // キャンディ（friendshipChange: 2）を配置
            game.addItem('Candy', 'item', 200, 200);

            expect(char.status.friendship).toBe(initialFriendship);
            expect(game.placedItems[0].isInitialGift).toBe(true);
        });

        it('should increase friendship when character reaches item', () => {
            const char = new BaseCharacter(game, 'test', parentElement, 100, 100);
            const item = new Item('Candy', 200, 200);
            item.isInitialGift = true;

            const initialFriendship = char.status.friendship;
            game.placedItems.push(item); // 存在判定のために必要
            char._performItemAction(item);

            // アイテムの friendshipChange が 2 なので、+2 されているはず
            expect(char.status.friendship).toBe(initialFriendship + 2);
            // フラグが消費されているはず
            expect(item.isInitialGift).toBe(false);
        });
    });

    describe('NPC Item Ignore', () => {
        it('should make NPC ignore placed items', () => {
            const npc = new BaseCharacter(game, 'npc', parentElement, 100, 100, { hasEmotion: false });
            game.speakis.push(npc);

            game.addItem('Candy', 'item', 200, 200);

            // NPCは反応しないので、ステートは IDLE のまま
            expect(npc.status.state).toBe(STATE.IDLE);
        });

        it('should make regular Speaki react to placed items', () => {
            const speaki = new BaseCharacter(game, 'speaki', parentElement, 100, 100);
            game.speakis.push(speaki);

            game.addItem('Candy', 'item', 200, 200);

            // 通常のスピキは反応する
            expect(speaki.status.state).toBe(STATE.ITEM_APPROACHING);
        });
    });

    describe('Poteto Item Logic', () => {
        it('should force happy emotion after eating Poteto', () => {
            const speaki = new BaseCharacter(game, 'speaki', parentElement, 100, 100);
            const poteto = new Item('Poteto', 200, 200);

            // 最初は普通の状態
            speaki.status.friendship = 0;
            speaki.status.hunger = 50;
            speaki._updateBaseEmotion();
            expect(speaki.status.emotion).toBe('normal');

            // さつまいもを食べる
            game.placedItems.push(poteto);
            speaki._performItemAction(poteto);

            // forcedEmotion が happy にセットされているはず
            expect(speaki.status.forcedEmotion).toBe('happy');

            // 感情更新で happy になる
            speaki._updateBaseEmotion();
            expect(speaki.status.emotion).toBe('happy');
        });
    });
    describe('Item Deletion', () => {
        it('should remove item via removeItemAt', () => {
            game.placedItems = []; // クリーンアップ
            game.addItem('Candy', 'item', 200, 200);
            expect(game.placedItems.length).toBe(1);

            // 当たらない座標を右クリックした想定
            game.items.removeItemAt(0, 0);
            expect(game.placedItems.length).toBe(1);

            // 当たる座標を右クリックした想定
            game.items.removeItemAt(200, 200);
            expect(game.placedItems.length).toBe(0);
        });
    });
});

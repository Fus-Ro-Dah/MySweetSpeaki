import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Game } from '../game.js';
import { STATE, JOBS } from '../config.js';

// Mock Fetch and Audio APIs
global.fetch = vi.fn(() => Promise.resolve({
    ok: true,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0))
}));
vi.spyOn(Game.prototype, '_loadBGM').mockImplementation(() => Promise.resolve());
vi.spyOn(Game.prototype, 'loadResources').mockImplementation(() => { });

// Mock unlocks
Game.prototype.unlocks = { hungerDecayLv: 0, affectionDecayLv: 0, autoReceive: true, feeder: true };

// Mock DOM
const mockCanvas = {
    getContext: vi.fn(() => ({})),
    getBoundingClientRect: vi.fn(() => ({ left: 0, top: 0, width: 1000, height: 800 })),
    parentElement: {
        getBoundingClientRect: vi.fn(() => ({ left: 0, top: 0, width: 1000, height: 800 })),
        appendChild: vi.fn(),
        clientWidth: 1000,
        clientHeight: 800
    },
    addEventListener: vi.fn(),
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
    activeElement: null,
    createElement: vi.fn(() => ({
        appendChild: vi.fn(),
        classList: { add: vi.fn(), remove: vi.fn() },
        dataset: {},
        style: {},
        setAttribute: vi.fn(),
        className: '',
        addEventListener: vi.fn(),
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
            contains: vi.fn(() => false),
            querySelectorAll: vi.fn(() => []),
        };
        if (id === 'game-canvas') {
            return { ...baseElement, ...mockCanvas };
        }
        return baseElement;
    }),
};

describe('Game Features Toggle', () => {
    let game;

    beforeEach(() => {
        game = new Game();
        global.window.game = game;
        // Force unlocked states for testing toggle logic
        game.unlocks.feeder = true;
        game.unlocks.autoReceive = true;
        game.unlocks.growthStop = true;
        game.settings.feederEnabled = true;
        game.settings.autoReceiveEnabled = true;
        game.settings.growthStopEnabled = false;
    });

    it('should initialize settings correctly', () => {
        expect(game.settings.feederEnabled).toBe(true);
        expect(game.settings.autoReceiveEnabled).toBe(true);
    });

    it('should toggle autoReceive setting', () => {
        game.toggleFeature('autoReceive');
        expect(game.settings.autoReceiveEnabled).toBe(false);
        game.toggleFeature('autoReceive');
        expect(game.settings.autoReceiveEnabled).toBe(true);
    });

    it('should toggle feeder setting and handle Posher npc', () => {
        // Mock addSpeaki and removeSpeaki
        const addSpy = vi.spyOn(game, 'addSpeaki');
        const removeSpy = vi.spyOn(game, 'removeSpeaki');

        // Toggle OFF (assuming it starts as ON)
        game.settings.feederEnabled = true;
        const mockPosher = {
            id: 'posher-1',
            characterType: 'posher',
            visual: { dom: { container: { remove: vi.fn() } } }
        };
        game.speakis.push(mockPosher);

        game.toggleFeature('feeder');
        expect(game.settings.feederEnabled).toBe(false);
        expect(removeSpy).toHaveBeenCalledWith('posher-1');

        // Toggle ON
        game.toggleFeature('feeder');
        expect(game.settings.feederEnabled).toBe(true);
        // Should call callNPC('posher') which calls addSpeaki
        expect(addSpy).toHaveBeenCalled();
    });

    it('should prevent BabySpeaki growth when growthStopEnabled is true', async () => {
        const { BabySpeaki } = await import('../baby-speaki.js');
        const parent = {
            appendChild: vi.fn(),
            getBoundingClientRect: vi.fn(() => ({ left: 0, top: 0, width: 1000, height: 800 })),
            clientWidth: 1000,
            clientHeight: 800
        };
        const baby = new BabySpeaki(5, parent, 0, 0);

        game.settings.growthStopEnabled = true;
        const initialGrowth = baby.idleGrowthTime;

        baby.status.state = STATE.IDLE;
        baby.update(1000); // 1 sec

        expect(baby.idleGrowthTime).toBe(initialGrowth);

        game.settings.growthStopEnabled = false;
        baby.update(1000);
        expect(baby.idleGrowthTime).toBeGreaterThan(initialGrowth);
    });

    it('should prevent ChildSpeaki growth when growthStopEnabled is true', async () => {
        const { ChildSpeaki } = await import('../child-speaki.js');
        const parent = {
            appendChild: vi.fn(),
            getBoundingClientRect: vi.fn(() => ({ left: 0, top: 0, width: 1000, height: 800 })),
            clientWidth: 1000,
            clientHeight: 800
        };
        const child = new ChildSpeaki(6, parent, 0, 0);

        game.settings.growthStopEnabled = true;
        const initialGrowth = child.growthTime;

        child.update(1000); // 1 sec

        expect(child.growthTime).toBe(initialGrowth);

        game.settings.growthStopEnabled = false;
        child.update(1000);
        expect(child.growthTime).toBeGreaterThan(initialGrowth);
    });
});

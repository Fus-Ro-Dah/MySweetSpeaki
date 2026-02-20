import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BaseCharacter } from '../base-character.js';
import { STATE, ASSETS } from '../config.js';

// BaseCharacterをテスト用に具体化したクラス
class TestCharacter extends BaseCharacter {
    constructor(id, parent, x, y, options) {
        super(id, parent, x, y, options);
    }
}

describe('Asset Selection and Fallback Logic', () => {
    let char;
    let mockParent;

    beforeEach(() => {
        global.window = {
            game: {
                images: {},
                sounds: {},
                playSound: vi.fn().mockImplementation(() => {
                    return { duration: 1.0, readyState: 4, pause: vi.fn() };
                }),
            }
        };

        mockParent = {
            appendChild: vi.fn(),
            clientWidth: 1000,
            clientHeight: 1000
        };

        char = new TestCharacter('test-1', mockParent, 0, 0, { characterType: 'speaki' });
    });

    it('should select direct hierarchical asset', () => {
        char.status.emotion = 'normal';
        char.status.action = 'idle';
        char._applySelectedAsset(STATE.IDLE);

        expect(char.visual.currentAsset).toBeDefined();
        const possibleImages = ASSETS.speaki.mood.normal.idle.map(a => a.imagefile);
        expect(possibleImages).toContain(char.visual.currentAsset.imagefile);
    });

    it('should fallback to normal emotion within same character', () => {
        char.characterType = 'speaki';
        char.status.emotion = 'unknown_emotion';
        char.status.action = 'idle';

        char._applySelectedAsset(STATE.IDLE);

        const normalIdleImages = ASSETS.speaki.mood.normal.idle.map(a => a.imagefile);
        expect(normalIdleImages).toContain(char.visual.currentAsset.imagefile);
    });

    it('should fallback to generic item action', () => {
        char.status.emotion = 'ITEM';
        char.status.action = 'NonExistentItem';

        char._applySelectedAsset(STATE.ITEM_ACTION);

        expect(char.visual.currentAsset.imagefile).toBe(ASSETS.speaki.performance.ITEM.generic[0].imagefile);
    });

    it('should fallback to speaki (parent) assets when specific character assets are missing', () => {
        char.characterType = 'baby';
        char.status.emotion = 'sad';

        // baby.performance.sad.gifttimeout は未定義 -> speaki.performance.sad.gifttimeout を見つけるはず
        // STATE.GAME_REACTION は type = 'performance' になる
        char.status.action = 'gifttimeout';
        char._applySelectedAsset(STATE.GAME_REACTION);

        expect(char.visual.currentAsset).not.toBeNull();
        expect(char.visual.currentAsset.imagefile).toBe(ASSETS.speaki.performance.sad.gifttimeout[0].imagefile);
    });

    it('should calculate final pitch correctly in _playAssetSound', () => {
        char.characterType = 'baby';
        char.status.voicePitch = 2.0;
        char.status.emotion = 'normal';
        char.status.action = 'idle';

        // constructor で呼ばれた分をクリア
        global.window.game.playSound.mockClear();

        // mood.normal.idle を選択 (STATE.IDLE -> mood)
        char._applySelectedAsset(STATE.IDLE);

        expect(global.window.game.playSound).toHaveBeenCalled();
        const calledPitch = global.window.game.playSound.mock.calls[0][1];
        expect(calledPitch).toBe(2.0);
    });
});

import { describe, it, expect } from 'vitest';
import { Game } from '../game.js';

describe('Game syntax check', () => {
    it('should be able to import Game', () => {
        expect(Game).toBeDefined();
    });
});

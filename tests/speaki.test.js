import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Speaki } from '../speaki.js';
import { STATE } from '../config.js';

describe('Speaki Character Logic', () => {
    let speaki;
    let mockParent;

    beforeEach(() => {
        // Mock global window and game
        global.window = {
            game: {
                highlightedCharId: null,
                images: {},
                playSound: vi.fn(),
                lastGiftTime: Date.now(),
                giftPartner: null,
                speakis: [],
                placedItems: []
            },
            innerWidth: 1200,
            innerHeight: 800
        };

        // Mock parentElement
        mockParent = {
            appendChild: vi.fn(),
            clientWidth: 1200,
            clientHeight: 800
        };

        speaki = new Speaki(1, mockParent, 100, 100, {
            hunger: 50,
            friendship: 0
        });

        // Add to mock list AFTER creation if needed
        global.window.game.speakis.push(speaki);
    });

    it('should initialize with correct status', () => {
        expect(speaki.status.hunger).toBe(50);
        expect(speaki.status.state).toBe(STATE.IDLE);
    });

    it('should decrease hunger over time', () => {
        const initialHunger = speaki.status.hunger;
        // dt is in ms. hunger decrease is dt / 5000 in update()
        // DT = 10000 -> 10000/5000 = 2
        speaki.update(10000);
        expect(speaki.status.hunger).toBe(initialHunger - 2);
    });

    it('should transition to IDLE if hunger is 0 and walking', () => {
        speaki.status.hunger = 0;
        speaki.status.state = STATE.WALKING;

        speaki._updateStateTransition();

        expect(speaki.status.state).toBe(STATE.IDLE);
    });

    it('should set sad emotion when starving', () => {
        speaki.status.hunger = 0;
        // updateAppearanceByStatus inside update
        speaki.update(16);

        expect(speaki.status.emotion).toBe('sad');
    });

    it('should transition from IDLE to WALKING after waitDuration', () => {
        speaki.status.state = STATE.IDLE;
        speaki.timers.stateStart = Date.now() - 10000;
        speaki.timers.waitDuration = 5000;
        speaki._updateStateTransition();
        expect(speaki.status.state).toBe(STATE.WALKING);
    });

    it('should set sad emotion and idle action if food is gone before arrival', () => {
        const mockItem = { id: 'Candy', consume: vi.fn(), x: 200, y: 200 };
        global.window.game.placedItems = [];

        speaki.status.state = STATE.ITEM_APPROACHING;
        speaki.interaction.targetItem = mockItem;
        speaki.pos.x = 0;
        speaki.pos.y = 0;

        // arrived is FALSE (dist > 10)
        speaki._updateStateTransition();

        // 食べつくされたことを検知して ITEM_ACTION に移行し、sad idle になるはず
        expect(speaki.status.state).toBe(STATE.ITEM_ACTION);
        expect(speaki.status.emotion).toBe('sad');
        expect(speaki.status.action).toBe('idle');
    });

    it('should set happy emotion and decrease hunger if food is eaten successfully', () => {
        const mockItem = { id: 'Candy', consume: vi.fn(() => true), x: 200, y: 200 };
        global.window.game.placedItems = [mockItem];

        speaki.status.hunger = 50;
        speaki.status.friendship = 50; // Ensure BaseCharacter defaults to 'happy'
        speaki.status.state = STATE.ITEM_APPROACHING;
        speaki._performItemAction(mockItem);

        expect(speaki.status.emotion).toBe('happy');
        expect(speaki.status.hunger).toBeGreaterThan(50);
        expect(global.window.game.placedItems.length).toBe(0);
    });

    it('should not consume item and set emotion to ITEM if non-food item is interacted with', () => {
        const mockItem = { id: 'LeviDriver', consume: vi.fn(), x: 200, y: 200 };
        global.window.game.placedItems = [mockItem];

        speaki.status.hunger = 50;
        speaki.status.state = STATE.ITEM_APPROACHING;
        speaki._performItemAction(mockItem);

        expect(speaki.status.hunger).toBe(50); // Hunger not changed
        expect(global.window.game.placedItems.length).toBe(1); // Not consumed
        // _performItemAction stays in emotion 'ITEM' for non-food items
        expect(speaki.status.emotion).toBe('ITEM');
    });

    it('should recover friendship over time when it is negative', () => {
        speaki.status.friendship = -10;
        // dt = 10000ms (10s) -> recovery should be 10000/10000 = 1
        speaki.update(10000);
        expect(speaki.status.friendship).toBe(-9);
    });
    it('should not increase friendship beyond 0 during auto-recovery', () => {
        speaki.status.friendship = -0.5;
        // dt = 10000ms (10s) -> recovery should be 1
        // but it should be capped at 0
        speaki.update(10000);
        expect(speaki.status.friendship).toBe(0);
    });

    it('should stay in USER_INTERACTING after tap until voice ends', () => {
        // Mock isVoicePlaying to return true initially
        const isVoicePlayingSpy = vi.spyOn(speaki, 'isVoicePlaying').mockReturnValue(true);

        speaki.status.state = STATE.USER_INTERACTING;
        speaki.interaction.isInteracting = false; // Mouse released after tap

        speaki._updateStateTransition();

        expect(speaki.status.state).toBe(STATE.USER_INTERACTING);

        // Now mock voice ended and enough time has passed
        isVoicePlayingSpy.mockReturnValue(false);
        speaki.timers.stateStart -= 2500; // Simulate 2500ms passing (must be > 2000)
        speaki._updateStateTransition();

        expect(speaki.status.state).not.toBe(STATE.USER_INTERACTING);
        isVoicePlayingSpy.mockRestore();
    });

    it('should allow machine-gun taps (restart voice on every tap)', () => {
        // Strict Stop: consecutive taps interrupts the previous voice and starts a new one
        vi.spyOn(speaki, 'isVoicePlaying').mockReturnValue(true);
        const stopSpy = vi.spyOn(speaki, '_stopCurrentVoice');
        global.window.game.playSound.mockClear();

        speaki.status.state = STATE.USER_INTERACTING;

        // 1st Tap
        speaki.setExpression('surprised', 'sad');
        expect(stopSpy).toHaveBeenCalledTimes(1);
        expect(global.window.game.playSound).toHaveBeenCalledTimes(1);

        // 2nd Tap (Machine Gun)
        speaki.setExpression('surprised', 'sad');
        expect(stopSpy).toHaveBeenCalledTimes(2);
        expect(global.window.game.playSound).toHaveBeenCalledTimes(2);
    });

    it('should strictly stop previous voice on state change', () => {
        const stopSpy = vi.spyOn(speaki, '_stopCurrentVoice');
        speaki.status.state = STATE.IDLE;

        // Transition to WALKING
        speaki.status.state = STATE.WALKING;
        speaki._onStateChanged(STATE.WALKING);

        expect(stopSpy).toHaveBeenCalled();
    });

    it('should wait for voice to finish in IDLE before walking', () => {
        const isVoicePlayingSpy = vi.spyOn(speaki, 'isVoicePlaying').mockReturnValue(true);
        speaki.status.state = STATE.IDLE;
        speaki.timers.stateStart = Date.now() - (speaki.timers.waitDuration + 1000); // Wait time exceeded

        // But voice is playing -> should stay IDLE
        speaki._updateStateTransition();
        expect(speaki.status.state).toBe(STATE.IDLE);

        // Voice finished -> should transition
        isVoicePlayingSpy.mockReturnValue(false);
        speaki._updateStateTransition();
        expect(speaki.status.state).toBe(STATE.WALKING);

        isVoicePlayingSpy.mockRestore();
    });

    it('should interrupt voice and flee when friendship hits threshold', () => {
        // This test simulates the logic inside _handleSpeakiTap
        speaki.status.friendship = -30;

        // Mock a voice playing
        vi.spyOn(speaki, 'isVoicePlaying').mockReturnValue(true);
        const stopVoiceSpy = vi.spyOn(speaki, '_stopCurrentVoice');

        // Logic from _handleSpeakiTap:
        speaki.status.friendship -= 5; // hits -35
        if (speaki.status.friendship <= -31) {
            speaki.interaction.isInteracting = false;
            speaki.status.state = STATE.IDLE;
            speaki.setExpression('idle', 'sad'); // Removed forceStopVoice=true
        }

        expect(speaki.status.state).toBe(STATE.IDLE);
        expect(stopVoiceSpy).toHaveBeenCalled(); // Previous voice was stopped

        // Next transition should set to WALKING (hideout)
        // Note: Speaki class overrides _updateStateTransition
        speaki._updateStateTransition();
        expect(speaki.status.state).toBe(STATE.WALKING);
    });
    it('should use high speed (8.0) when friendship is <= -31', () => {
        speaki.pos.speed = 2.0;

        // Normal friendship
        speaki.status.friendship = 0;
        speaki.pos.destinationSet = true;
        speaki.pos.targetX = speaki.pos.x + 100;
        speaki.pos.targetY = speaki.pos.y;

        // _processMovement accesses this.status.friendship
        speaki._processMovement();
        // Speed should correspond to pos.speed (2.0)
        // dx = 2.0
        expect(speaki.pos.x).toBeCloseTo(102, 0);

        // Frightened friendship
        speaki.pos.x = 100;
        speaki.status.friendship = -31;
        speaki._processMovement();
        // Speed should be forced to 8.0
        expect(speaki.pos.x).toBeCloseTo(108, 0);

        // Recovered friendship
        speaki.pos.x = 100;
        speaki.status.friendship = -30;
        speaki._processMovement();
        // Speed should revert to pos.speed (2.0)
        expect(speaki.pos.x).toBeCloseTo(102, 0);
    });

    it('should evolve baby when age > 30s and hunger >= 75', async () => {
        const { BabySpeaki } = await import('../baby-speaki.js'); // Dynamic import for test
        const baby = new BabySpeaki(2, mockParent, 0, 0);
        global.window.game.evolveBaby = vi.fn();

        // Case 1: Just born (Age 0) -> No evolution
        baby._updateStateTransition();
        expect(global.window.game.evolveBaby).not.toHaveBeenCalled();

        // Case 2: Age > 60s but Hunger < 75
        baby.bornTime = Date.now() - 61000;
        baby.status.hunger = 74;
        baby._updateStateTransition();
        expect(global.window.game.evolveBaby).not.toHaveBeenCalled();

        // Case 3: Age > 60s and Hunger >= 75 -> Evolution
        baby.status.hunger = 75;
        baby._updateStateTransition();
        expect(global.window.game.evolveBaby).toHaveBeenCalledWith(baby);
    });

    it('should clear giftPartner if zombie state detected (self-healing)', () => {
        // Setup zombie state:
        // Game thinks this speaki is the partner
        global.window.game.giftPartner = speaki;

        // But Speaki is actually just IDLE (not in any gift state)
        speaki.status.state = STATE.IDLE;

        // When _tryStartGiftEvent is called (checked every frame in updateStateTransition)
        // It should detect the mismatch and clear it
        speaki._tryStartGiftEvent(Date.now());

        expect(global.window.game.giftPartner).toBeNull();
    });

    it('should reset destinationSet when a state is re-applied to ensure new destination selection', () => {
        speaki.status.state = STATE.GIFT_LEAVING;
        speaki.pos.destinationSet = true;

        // Simulate re-applying the state (e.g., during event start)
        speaki._onStateChanged(STATE.GIFT_LEAVING);

        expect(speaki.pos.destinationSet).toBe(false);
    });

    it('should pop stateStack when ITEM_ACTION finishes if a state was stacked', () => {
        speaki.status.stateStack.push(STATE.GIFT_LEAVING);
        speaki.status.state = STATE.ITEM_ACTION;
        speaki.timers.actionStart = Date.now() - 5000;
        speaki.timers.actionDuration = 3000;

        speaki._updateStateTransition();

        expect(speaki.status.state).toBe(STATE.GIFT_LEAVING);
    });

    it('should prioritize food (100% chance) when hungry and food is nearby', () => {
        speaki.status.hunger = 0;
        const food = { id: 'Candy', x: 100, y: 100, consume: vi.fn() };
        global.window.game.placedItems = [food];

        // Mocking approachItem to verify it's called
        const spy = vi.spyOn(speaki, 'approachItem');

        speaki._decideWanderingDestination(1200, 800);

        expect(spy).toHaveBeenCalledWith(food);
    });

    it('should ignore food items in wandering when hunger is >= 90', () => {
        speaki.status.hunger = 90;
        const food = { id: 'Candy', x: 200, y: 200 };
        global.window.game.placedItems = [food];

        const spy = vi.spyOn(speaki, 'approachItem');
        vi.spyOn(Math, 'random').mockReturnValue(0.1); // Force interaction attempt

        speaki._decideWanderingDestination(1200, 800);

        expect(spy).not.toHaveBeenCalled();
        vi.restoreAllMocks();
    });

    it('should still target non-food items in wandering when hunger is >= 90', () => {
        speaki.status.hunger = 95;
        const toy = { id: 'Pumpkin', x: 200, y: 200 };
        global.window.game.placedItems = [toy];

        const spy = vi.spyOn(speaki, 'approachItem');
        vi.spyOn(Math, 'random').mockReturnValue(0.1); // Force interaction attempt

        speaki._decideWanderingDestination(1200, 800);

        expect(spy).toHaveBeenCalledWith(toy);
        vi.restoreAllMocks();
    });

    it('should have 20% chance to target any item when not hungry', () => {
        speaki.status.hunger = 100;
        const item = { id: 'Pumpkin', x: 200, y: 200 };
        global.window.game.placedItems = [item];

        const spy = vi.spyOn(speaki, 'approachItem');

        // Force Math.random to a value < 0.2
        vi.spyOn(Math, 'random').mockReturnValue(0.15);

        speaki._decideWanderingDestination(1200, 800);

        expect(spy).toHaveBeenCalledWith(item);

        vi.restoreAllMocks();
    });
    it('should NOT transition from IDLE to WALKING if hunger is 0', () => {
        speaki.status.hunger = 0;
        speaki.status.state = STATE.IDLE;
        speaki.timers.stateStart = Date.now() - 10000;
        speaki.timers.waitDuration = 5000;

        speaki._updateStateTransition();

        expect(speaki.status.state).toBe(STATE.IDLE);
    });

    it('should transition from ITEM_APPROACHING to IDLE if starving and target is not food', () => {
        const toy = { id: 'Pumpkin', x: 200, y: 200 };
        speaki.status.hunger = 0;
        speaki.status.state = STATE.ITEM_APPROACHING;
        speaki.interaction.targetItem = toy;

        speaki._updateStateTransition();

        expect(speaki.status.state).toBe(STATE.IDLE);
    });

    it('should NOT pick a wandering destination if starving and no food is nearby', () => {
        speaki.status.hunger = 0;
        const toy = { id: 'Pumpkin', x: 200, y: 200 };
        global.window.game.placedItems = [toy];

        const spy = vi.spyOn(speaki, 'approachItem');
        speaki.pos.destinationSet = false;

        speaki._decideWanderingDestination(1200, 800);

        expect(spy).not.toHaveBeenCalled();
        expect(speaki.pos.destinationSet).toBe(false);
        expect(speaki.status.state).toBe(STATE.IDLE);
    });
});

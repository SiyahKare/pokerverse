import { describe, it, expect } from 'vitest';
import { shuffleDeckDeterministic } from './poker';

describe('Provably-Fair RNG', () => {
  it('same seed -> same deck (repeatability x100)', () => {
    const seed = '0x' + '11'.repeat(32);
    const first = shuffleDeckDeterministic(seed).join(',');
    for (let i=0;i<100;i++) {
      const next = shuffleDeckDeterministic(seed).join(',');
      expect(next).toBe(first);
    }
  });

  it('52 unique cards', () => {
    const seed = '0x' + '22'.repeat(32);
    const deck = shuffleDeckDeterministic(seed);
    expect(deck.length).toBe(52);
    const set = new Set(deck);
    expect(set.size).toBe(52);
  });
});



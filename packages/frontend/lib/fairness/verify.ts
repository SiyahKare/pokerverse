import { deterministicShuffle, deckHash } from '@core-game/index'

export function verifyDeck(seed: string, expectHash: string): 'ok'|'mismatch' {
  const h = deckHash(seed)
  return h === expectHash ? 'ok' : 'mismatch'
}



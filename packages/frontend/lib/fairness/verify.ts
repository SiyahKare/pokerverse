import { deterministicShuffle } from '@pokerverse/core-game'

export function verifyDeck(seed: string, expectHash: string): 'ok'|'mismatch' {
  // TODO: when deckHash exposed from core-game, compare real hash
  return seed ? 'ok' : 'mismatch'
}



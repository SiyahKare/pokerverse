import type { LobbyTable } from '../store/useLobbyStore'

export async function fetchTablesMock(): Promise<LobbyTable[]> {
  // mock 5 masa
  return [
    { id: 1, sb: 5, bb: 10, maxPlayers: 6, players: 2, status: 'waiting' },
    { id: 2, sb: 10, bb: 20, maxPlayers: 6, players: 5, status: 'playing' },
    { id: 3, sb: 25, bb: 50, maxPlayers: 9, players: 6, status: 'waiting' },
    { id: 4, sb: 50, bb: 100, maxPlayers: 6, players: 3, status: 'playing' },
    { id: 5, sb: 100, bb: 200, maxPlayers: 2, players: 1, status: 'waiting' },
  ]
}



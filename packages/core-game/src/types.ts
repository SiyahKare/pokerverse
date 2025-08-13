export type HandId = number
export type Addr = `0x${string}`
export type ActionKind = 'check'|'bet'|'call'|'raise'|'fold'
export type Table = {
  id: number
  seats: number
  handId?: HandId
}
export type Seat = { seat: number; addr?: Addr; stack?: bigint }



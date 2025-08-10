export type ActionType = 'check'|'bet'|'call'|'raise'|'fold'|'allin'
export type SeatIndex = 0|1|2|3|4|5|6|7|8

export type PlayerSeat = {
  seat: SeatIndex; name?: string; stack?: number;
  isSitting?: boolean; isTurn?: boolean; isDealer?: boolean;
  hole?: string[];
}

export type TableState = {
  maxSeats: 6|9
  seats: PlayerSeat[]
  potAmount: number
  community: string[]
  lastAction?: { seat: SeatIndex; kind: ActionType; amount?: number } | null
}



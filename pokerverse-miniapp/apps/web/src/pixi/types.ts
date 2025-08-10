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

export type ClientAction =
  | { type:'ACTION'; payload:{ seat:number; kind:'fold'|'check'|'call'|'bet'|'raise'|'allin'; amount?:number } }
  | { type:'PING' }

export type ServerMsg =
  | { type:'TABLE_STATE'; payload: TableState }
  | { type:'ACTION_ACK';  payload:{ ok:true } }
  | { type:'ACTION_REJECTED'; payload:{ reason:string; min?:number; max?:number } }
  | { type:'PONG' }



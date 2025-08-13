import { Socket } from 'socket.io-client';
export type WSOptions = {
    token?: string;
    nonce?: string;
};
export declare function connect(url: string, opts?: WSOptions): Socket<import("@socket.io/component-emitter").DefaultEventsMap, import("@socket.io/component-emitter").DefaultEventsMap>;
export declare function socket(): Socket<import("@socket.io/component-emitter").DefaultEventsMap, import("@socket.io/component-emitter").DefaultEventsMap> | null;
export declare function disconnect(): void;

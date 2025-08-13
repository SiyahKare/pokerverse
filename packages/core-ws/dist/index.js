import { io } from 'socket.io-client';
let sock = null;
export function connect(url, opts) {
    if (sock)
        return sock;
    sock = io(url, {
        autoConnect: true,
        transports: ['websocket'],
        extraHeaders: opts?.token ? { 'Authorization': `Bearer ${opts.token}`, 'x-client-nonce': opts?.nonce || 'n' } : {}
    });
    return sock;
}
export function socket() { return sock; }
export function disconnect() { sock?.disconnect(); sock = null; }

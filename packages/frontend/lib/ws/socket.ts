import { io, Socket } from 'socket.io-client'

let sock: Socket | null = null
let reconnectAttempts = 0

export function connect(url: string, opts?: { token?: string; nonce?: string }) {
  if (sock) return sock
  sock = io(url, {
    autoConnect: true,
    extraHeaders: opts?.token ? { 'Authorization': `Bearer ${opts.token}`, 'x-client-nonce': opts?.nonce || 'n' } : {},
    transports: ['websocket']
  })
  sock.on('connect_error', ()=>{ reconnectAttempts++ })
  return sock
}

export function disconnect() { sock?.disconnect(); sock = null }
export function socket() { return sock }



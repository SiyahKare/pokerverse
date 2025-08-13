import { create } from 'zustand'

type ToastState = { items: string[]; push: (m: string)=>void; clear: ()=>void }
export const useToastStore = create<ToastState>((set)=>({
  items: [],
  push: (m)=> set(s=>({ items: [...s.items, m].slice(-3) })),
  clear: ()=> set({ items: [] })
}))



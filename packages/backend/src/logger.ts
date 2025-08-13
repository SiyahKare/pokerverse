export function logEvent(e: Record<string, any>) {
  try { console.log(JSON.stringify({ ts: Date.now(), ...e })) } catch { /* noop */ }
}



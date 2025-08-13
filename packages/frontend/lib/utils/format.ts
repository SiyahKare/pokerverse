export const formatChips = (v?: bigint, decimals = 6) => {
  if (v === undefined) return '0.00'
  const scale = 10n ** BigInt(decimals)
  const int = v / scale
  const frac = v % scale
  const fracStr = (scale + frac).toString().slice(1).padStart(Number(decimals), '0').slice(0, 2)
  return `${int.toString()}.${fracStr}`
}

export const clampBigInt = (v: bigint, min: bigint, max: bigint) => v < min ? min : (v > max ? max : v)
export const stepAlignBigInt = (v: bigint, step: bigint) => {
  if (step <= 1n) return v
  const rem = v % step
  return v - rem
}
export const parseBigInt = (s: string, decimals = 6): bigint => {
  const cleaned = s.replace(/[^0-9.]/g, '')
  if (!cleaned) return 0n
  const [ints, fr = ''] = cleaned.split('.')
  const frac = fr.slice(0, decimals).padEnd(decimals, '0')
  return BigInt(ints || '0') * (10n ** BigInt(decimals)) + BigInt(frac || '0')
}



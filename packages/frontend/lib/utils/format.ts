export const formatChips = (v?: bigint, decimals = 6) => {
  if (v === undefined) return '0.00'
  const scale = 10n ** BigInt(decimals)
  const int = v / scale
  const frac = v % scale
  const fracStr = (scale + frac).toString().slice(1).padStart(Number(decimals), '0').slice(0, 2)
  return `${int.toString()}.${fracStr}`
}



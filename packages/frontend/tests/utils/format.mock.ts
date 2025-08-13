export function clampBigInt(v: bigint, min: bigint, max: bigint){
	if (v < min) return min;
	if (v > max) return max;
	return v;
}



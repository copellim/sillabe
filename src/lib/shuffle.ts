// Random shuffle (Fisher–Yates). Kept out of `gameData.ts`, which stays pure and
// deterministic: randomness lives only where it is needed (e.g. the order of
// quiz options, client side).

export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

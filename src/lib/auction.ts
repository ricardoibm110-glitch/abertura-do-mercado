export type Level = { price: number; quantity: number };
export function pressure(buy: number, sell: number) {
  if (![buy, sell].every(Number.isFinite) || buy < 0 || sell < 0 || buy + sell === 0) return null;
  return (buy - sell) / (buy + sell) * 100;
}
export function classify(score: number | null) {
  if (score === null || !Number.isFinite(score)) return 'SEM DADOS';
  if (score >= 40) return 'COMPRA FORTE';
  if (score <= -40) return 'VENDA FORTE';
  if (score > 10) return 'COMPRA';
  if (score < -10) return 'VENDA';
  return 'NEUTRO';
}
export function nearby(levels: Level[], top: number, distance: number) {
  return levels.filter(l => Number.isFinite(l.price) && l.price > 0 && Number.isFinite(l.quantity) && l.quantity > 0 && Math.abs(l.price - top) <= distance).length;
}
export function signedGap(indicative: number, close: number) { return indicative - close; }
export function arbitrage(mini: number, full: number, band: number) {
  const delta = mini - full;
  return delta >= band ? 'VENDA' : delta <= -band ? 'COMPRA' : 'NEUTRO';
}
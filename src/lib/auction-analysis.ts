import { classify, pressure } from "./auction";

export type AuctionSnapshot = {
  timestamp: number;
  indicative: number;
  buy: number;
  sell: number;
  theoreticalVolume?: number;
};
export type Direction = "COMPRA" | "VENDA" | "AGUARDAR";
export type AuctionAnalysis = {
  direction: Direction;
  pressurePct: number | null;
  persistencePct: number | null;
  indicativeChange: number | null;
  gapPoints: number | null;
  stabilityPct: number | null;
  confirmationCount: number;
  reasons: string[];
  status: "SEM DADOS" | "INSUFICIENTE" | "EM ANALISE";
};

/** Uses only snapshots received from the auction; does not infer future points or a win rate. */
export function analyzeAuction(snapshots: AuctionSnapshot[], previousClose: number, now?: number): AuctionAnalysis {
  const empty: AuctionAnalysis = { direction: "AGUARDAR", pressurePct: null, persistencePct: null, indicativeChange: null, gapPoints: null, stabilityPct: null, confirmationCount: 0, reasons: ["Aguardando dados reais do leilão"], status: "SEM DADOS" };
  const ordered = snapshots.filter(s => Number.isFinite(s.timestamp) && Number.isFinite(s.indicative) && s.indicative > 0 && pressure(s.buy, s.sell) !== null).sort((a,b)=>a.timestamp-b.timestamp);
  if (!ordered.length) return empty;
  const latest = ordered[ordered.length-1];
  const p = pressure(latest.buy, latest.sell);
  const gap = Number.isFinite(previousClose) && previousClose > 0 ? latest.indicative - previousClose : null;
  const change = ordered.length > 1 ? latest.indicative - ordered[0].indicative : null;
  const cutoff = latest.timestamp - 60_000;
  const recent = ordered.filter(s => s.timestamp >= cutoff);
  const sign = p !== null && Math.abs(p) > 10 ? Math.sign(p) : 0;
  const persistence = sign && recent.length >= 5 ? 100 * recent.filter(s => Math.sign(pressure(s.buy,s.sell) ?? 0) === sign && Math.abs(pressure(s.buy,s.sell) ?? 0)>10).length/recent.length : null;
  const lastTen = recent.slice(-10);
  const stability = lastTen.length >= 5 ? Math.max(0, 100 - Math.min(100, (Math.max(...lastTen.map(s=>s.indicative))-Math.min(...lastTen.map(s=>s.indicative)))/latest.indicative*10000)) : null;
  const reasons: string[] = [];
  const stale = now !== undefined && now - latest.timestamp > 10_000;
  const enough = ordered.length >= 5 && latest.timestamp - ordered[0].timestamp >= 20_000 && persistence !== null && change !== null && !stale;
  if (!enough) reasons.push(stale ? "Dados desatualizados" : "Histórico insuficiente para confirmação");
  if (p !== null && Math.abs(p) <= 10) reasons.push("Pressão sem direção definida");
  if (p !== null && Math.abs(p) > 10 && change !== null && Math.sign(p) !== Math.sign(change)) reasons.push("Preço indicativo diverge da pressão");
  if (persistence !== null && persistence < 70) reasons.push("Pressão instável nos últimos 60 segundos");
  if (stability !== null && stability < 50) reasons.push("Preço indicativo oscilando");
  const confirmations = Number(p !== null && Math.abs(p) >= 25) + Number(persistence !== null && persistence >= 70) + Number(change !== null && p !== null && Math.sign(change) === Math.sign(p) && change !== 0) + Number(stability !== null && stability >= 50);
  const direction: Direction = enough && confirmations >= 3 && reasons.length === 0 ? (sign > 0 ? "COMPRA" : sign < 0 ? "VENDA" : "AGUARDAR") : "AGUARDAR";
  if (direction === "AGUARDAR" && reasons.length === 0) reasons.push("Confirmações insuficientes");
  return { direction, pressurePct: p, persistencePct: persistence, indicativeChange: change, gapPoints: gap, stabilityPct: stability, confirmationCount: confirmations, reasons, status: enough ? "EM ANALISE" : "INSUFICIENTE" };
}
export { classify };

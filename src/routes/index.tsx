import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Activity, ArrowDownRight, ArrowUpRight, BarChart3, ChevronDown, Clock3, Radio, ShieldAlert, TrendingUp, Zap } from "lucide-react";
import { analyzeAuction, type AuctionSnapshot } from "@/lib/auction-analysis";

export const Route = createFileRoute("/")({ component: Index });
type Asset = "WIN";
type Scenario = "buy" | "sell" | "neutral";
const fmt = (n: number, decimals = 0) => n.toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
const settings = { WIN: { price: 129850, close: 129500, step: 5 } };
const scenarios: Record<Scenario, [number,number]> = { buy:[18420,6920], sell:[6920,18420], neutral:[12000,12000] };
function demoHistory(asset: Asset, scenario: Scenario): AuctionSnapshot[] {
  const cfg = settings[asset];
  const selected = scenario;
  const [buy,sell] = scenarios[selected];
  return Array.from({length: 12}, (_,i)=>({
    timestamp: 1_000_000 + i*5000,
    indicative: cfg.price + (i-11) * (selected==="buy" ? cfg.step*2 : selected==="sell" ? -cfg.step*2 : 0),
    buy: buy + (i%3)*12,
    sell: sell + (i%4)*8,
    theoreticalVolume: 6000 + i*100,
  }));
}
function Signal({asset,scenario}:{asset:Asset;scenario:Scenario}) {
  const cfg = settings[asset];
  const history = useMemo(()=>demoHistory(asset,scenario),[asset,scenario]);
  const a = useMemo(()=>analyzeAuction(history,cfg.close),[history,cfg.close]);
  const latest = history[history.length-1];
  const isBuy = a.direction === "COMPRA";
  const isSell = a.direction === "VENDA";
  const tint = isBuy ? "text-emerald-400" : isSell ? "text-rose-400" : "text-amber-300";
  const surface = isBuy ? "border-emerald-400/35 bg-emerald-400/[.07]" : isSell ? "border-rose-400/35 bg-rose-400/[.07]" : "border-amber-400/35 bg-amber-400/[.07]";
  const buyShare = latest.buy/(latest.buy+latest.sell)*100;
  return <section className="min-w-0 overflow-hidden rounded-xl border border-[#24404b] bg-[#08131b] shadow-[0_10px_28px_rgba(0,0,0,.3)]">
    <div className="flex items-center justify-between border-b border-emerald-400/10 bg-[#0c1c25] px-3 py-2.5">
      <div className="flex items-center gap-2"><span className="rounded-md border border-emerald-400/25 bg-emerald-400/10 px-2 py-1 text-base font-black">{asset}</span><div><p className="text-xs font-bold">Mini Índice</p><p className="text-[10px] text-slate-500">Leilão · cenário fictício</p></div></div>
      <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-2 py-1 text-[10px] font-bold text-amber-300">DEMO</span>
    </div>
    <div className="grid grid-cols-[1fr_1.12fr] gap-3 p-3">
      <div className="min-w-0"><p className="text-[10px] uppercase tracking-wide text-slate-500">Preço teórico</p><p className="mt-1 text-[clamp(1.3rem,2.6vw,2rem)] font-black tabular-nums">{fmt(latest.indicative,0)}</p><p className={`mt-1 text-xs font-bold ${a.gapPoints!==null&&a.gapPoints>=0?"text-emerald-400":"text-rose-400"}`}>Gap {a.gapPoints!==null ? `${a.gapPoints>=0?"+":""}${fmt(a.gapPoints,0)} pts` : "—"}</p>
        <div className="mt-3 space-y-1.5 border-t border-white/10 pt-2 text-[11px]"><div className="flex justify-between gap-1"><span className="text-slate-500">Compras</span><b className="text-emerald-400">{fmt(latest.buy)}</b></div><div className="flex justify-between gap-1"><span className="text-slate-500">Vendas</span><b className="text-rose-400">{fmt(latest.sell)}</b></div><div className="flex justify-between gap-1"><span className="text-slate-500">Saldo</span><b>{fmt(latest.buy-latest.sell)}</b></div></div>
      </div>
      <div className={`flex min-w-0 flex-col items-center justify-center rounded-lg border p-3 text-center ${surface}`}>
        {isBuy?<ArrowUpRight className={tint} size={28}/>:isSell?<ArrowDownRight className={tint} size={28}/>:<Activity className={tint} size={28}/>}
        <p className={`mt-1 text-[clamp(1rem,2vw,1.5rem)] font-black ${tint}`}>{a.direction}</p>
        <p className={`mt-1 text-xl font-black tabular-nums ${tint}`}>{a.pressurePct===null?"—":`${a.pressurePct>0?"+":""}${fmt(a.pressurePct,1)}%`}</p>
        <p className="mt-1 text-[10px] text-slate-400">Pressão do book</p>
        <p className="mt-2 text-[10px] font-bold text-slate-300">{a.confirmationCount}/4 confirmações</p>
      </div>
    </div>
    <div className="px-3 pb-3"><div className="flex h-2 overflow-hidden rounded bg-rose-500"><div className="bg-emerald-400" style={{width:`${buyShare}%`}}/></div><div className="mt-1 flex justify-between text-[9px] text-slate-500"><span>COMPRADORES</span><span>VENDEDORES</span></div></div>
    <div className="grid grid-cols-3 border-t border-white/10 bg-[#0a1820] text-center text-[10px]"><div className="border-r border-white/10 px-1 py-2"><p className="text-slate-500">Persistência</p><b>{a.persistencePct===null?"—":`${fmt(a.persistencePct)}%`}</b></div><div className="border-r border-white/10 px-1 py-2"><p className="text-slate-500">Preço teórico Δ</p><b>{a.indicativeChange===null?"—":fmt(a.indicativeChange,0)}</b></div><div className="px-1 py-2"><p className="text-slate-500">Estabilidade</p><b>{a.stabilityPct===null?"—":`${fmt(a.stabilityPct)}%`}</b></div></div>
  </section>;
}
function Index() {
  const [scenario,setScenario] = useState<Scenario>("buy");
  const asset: Asset = "WIN";
  const history = useMemo(()=>demoHistory(asset,scenario),[asset,scenario]);
  const a = useMemo(()=>analyzeAuction(history,settings[asset].close),[history,asset]);
  const last = history[history.length-1];
  const checks = [
    ["Pressão do book", a.pressurePct===null?"—":`${a.pressurePct>0?"+":""}${fmt(a.pressurePct,1)}%`],
    ["Persistência (60s)", a.persistencePct===null?"Sem histórico":`${fmt(a.persistencePct)}%`],
    ["Variação preço teórico", a.indicativeChange===null?"Sem histórico":`${a.indicativeChange>0?"+":""}${fmt(a.indicativeChange,0)} pts`],
    ["Estabilidade do preço", a.stabilityPct===null?"Sem histórico":`${fmt(a.stabilityPct)}%`],
  ];
  return <div className="min-h-screen bg-[#03090f] text-slate-100 [background-image:radial-gradient(ellipse_70%_40%_at_50%_-20%,rgba(16,185,129,.12),transparent)]">
    <header className="border-b border-emerald-400/15 bg-[#07121b]"><div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-3"><div className="flex items-center gap-2.5"><span className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-2 text-emerald-400"><Activity size={18}/></span><div><p className="font-black tracking-tight">ABERTURA<span className="text-emerald-400">.</span></p><p className="text-[9px] tracking-[.17em] text-slate-500">DECISION TERMINAL</p></div></div><span className="flex items-center gap-1.5 text-[10px] font-bold text-amber-300"><Radio size={13}/> SEM FEED AO VIVO</span></div></header>
    <main className="mx-auto max-w-[1400px] space-y-3 px-3 py-3 md:px-5">
      <div className="flex flex-wrap items-center justify-between gap-2"><div><h1 className="text-base font-black md:text-lg">Inteligência de pré-abertura <span className="font-normal text-slate-500">/ Mini Índice WIN</span></h1><p className="text-[11px] text-slate-500">Exclusivo WIN · Direção orientativa antes da abertura · ordens executadas no Profit</p></div><label className="flex items-center gap-2 text-xs text-slate-400">Demonstração<select value={scenario} onChange={e=>setScenario(e.target.value as Scenario)} className="rounded-md border border-white/15 bg-[#152632] px-2 py-1.5 text-xs text-white"><option value="buy">Pressão compradora</option><option value="sell">Pressão vendedora</option><option value="neutral">Mercado neutro</option></select></label></div>
      <div className="flex items-center gap-2 rounded-lg border border-amber-400/25 bg-amber-400/[.06] px-3 py-2 text-[11px] text-amber-200"><ShieldAlert size={14} className="shrink-0"/> Dados 100% simulados. Os sinais não representam recomendações reais nem probabilidades calibradas.</div>
      <div className="mx-auto max-w-[900px]"><Signal asset="WIN" scenario={scenario}/></div>
      <div className="grid gap-3 lg:grid-cols-[1.15fr_1fr]">
        <section className="overflow-hidden rounded-xl border border-[#24404b] bg-[#08131b]"><div className="flex items-center justify-between border-b border-emerald-400/15 bg-[#0c1c25] px-3 py-2.5"><h2 className="flex items-center gap-2 text-xs font-black"><BarChart3 size={15} className="text-emerald-400"/> Confirmações do leilão</h2><span className="rounded bg-emerald-400/10 px-2 py-1 text-[10px] font-black text-emerald-400">WIN</span></div><div className="divide-y divide-white/[.06]">{checks.map(([name,value])=><div key={name} className="flex items-center justify-between gap-3 px-3 py-2 text-xs"><span className="text-slate-400">{name}</span><strong>{value}</strong></div>)}</div><div className="border-t border-white/10 px-3 py-2 text-[11px] text-amber-300">{a.direction==="AGUARDAR"?a.reasons.join(" · "):"Critérios demonstrativos de direção atendidos"}</div></section>
        <section className="overflow-hidden rounded-xl border border-[#24404b] bg-[#08131b]"><div className="flex items-center justify-between border-b border-emerald-400/15 bg-[#0c1c25] px-3 py-2.5"><h2 className="flex items-center gap-2 text-xs font-black"><TrendingUp size={15} className="text-emerald-400"/> Potencial de movimento · {asset}</h2><span className="text-[10px] text-slate-500">Pendente de histórico</span></div><div className="grid grid-cols-2 gap-2 p-3"><div className="rounded-lg border border-emerald-400/20 bg-emerald-400/[.05] p-3"><p className="text-[10px] text-slate-400">Potencial de alta</p><p className="mt-1 text-lg font-black text-emerald-400">— pts</p></div><div className="rounded-lg border border-rose-400/20 bg-rose-400/[.05] p-3"><p className="text-[10px] text-slate-400">Potencial de baixa</p><p className="mt-1 text-lg font-black text-rose-400">— pts</p></div></div><div className="space-y-1 px-3 pb-3 text-[11px] text-slate-400"><p>Desvio do gap: <b className="text-slate-200">aguardando distribuição histórica</b></p><p>Alvo antes do stop: <b className="text-slate-200">aguardando backtest 300 × 300</b></p><p className="pt-1 text-[10px] text-amber-300">Não estimamos pontos futuros ou taxa de acerto sem dados históricos.</p></div></section>
      </div>
      <details className="group overflow-hidden rounded-xl border border-[#24404b] bg-[#08131b]"><summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2.5 text-xs font-bold text-slate-300"><span className="flex items-center gap-2"><Clock3 size={14}/> Histórico demonstrativo do leilão · {asset}</span><ChevronDown size={15} className="transition-transform group-open:rotate-180"/></summary><div className="border-t border-white/10 px-3 pb-2"><div className="grid grid-cols-4 gap-2 py-2 text-right text-[10px] text-slate-500"><span>AMOSTRA</span><span>TEÓRICO</span><span>COMPRA</span><span>VENDA</span></div>{history.slice(-6).map((s,i)=><div key={s.timestamp} className="grid grid-cols-4 gap-2 border-t border-white/5 py-1.5 text-right text-xs tabular-nums"><span className="text-slate-500">{i+7}</span><span>{fmt(s.indicative,0)}</span><span className="text-emerald-400">{fmt(s.buy)}</span><span className="text-rose-400">{fmt(s.sell)}</span></div>)}</div></details>
      <p className="flex items-start gap-2 text-[10px] text-slate-500"><Zap size={13} className="shrink-0 text-amber-400"/> O motor já calcula persistência, divergência e estabilidade de snapshots. Para uso operacional, falta conectar dados autorizados do leilão, validar horários reais e calibrar os filtros com backtest. O Profit permanece responsável pelas ordens.</p>
    </main>
  </div>;
}

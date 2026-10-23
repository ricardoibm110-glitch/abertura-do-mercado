import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Activity, ArrowDownRight, ArrowUpRight, ChevronDown, CircleDot, LockKeyhole, Radio, ShieldAlert } from "lucide-react";
import { classify, pressure } from "@/lib/auction";

export const Route = createFileRoute("/")({ component: Index });

type Asset = "WIN" | "WDO";
type Scenario = "buy" | "sell" | "neutral";
const examples: Record<Scenario, { buy: number; sell: number }> = {
  buy: { buy: 18420, sell: 6920 },
  sell: { buy: 6920, sell: 18420 },
  neutral: { buy: 12000, sell: 12000 },
};
const br = (n: number) => n.toLocaleString("pt-BR");
const priceFmt = (n: number, asset: Asset) => n.toLocaleString("pt-BR", { minimumFractionDigits: asset === "WDO" ? 1 : 0, maximumFractionDigits: 1 });
const config: Record<Asset, { price: number; close: number; step: number }> = {
  WIN: { price: 129850, close: 129500, step: 5 },
  WDO: { price: 5712.5, close: 5700.5, step: .5 },
};

function AssetPanel({ asset, scenario }: { asset: Asset; scenario: Scenario }) {
  const { buy, sell } = asset === "WIN" ? examples[scenario] : scenario === "neutral" ? examples.neutral : scenario === "buy" ? examples.sell : examples.buy;
  const score = pressure(buy, sell) ?? 0;
  const signal = classify(score);
  const isBuy = score > 10;
  const isSell = score < -10;
  const cfg = config[asset];
  const tint = isBuy ? "text-emerald-400" : isSell ? "text-rose-400" : "text-amber-300";
  const signalBg = isBuy ? "bg-emerald-400/[.09] border-emerald-400/25" : isSell ? "bg-rose-400/[.09] border-rose-400/25" : "bg-amber-400/[.09] border-amber-400/25";
  const barWidth = buy / (buy + sell) * 100;
  return <section className="min-w-0 overflow-hidden rounded-2xl border border-white/[.10] bg-[#111b29] shadow-[0_15px_40px_rgba(0,0,0,.22)]">
    <div className="flex items-center justify-between border-b border-white/[.07] bg-white/[.025] px-4 py-3">
      <div className="flex items-center gap-3"><span className="flex h-9 w-12 items-center justify-center rounded-lg bg-white/[.07] text-lg font-black tracking-tight">{asset}</span><div><p className="text-[11px] font-semibold text-slate-200">{asset === "WIN" ? "Mini Índice" : "Mini Dólar"}</p><p className="text-[10px] text-slate-500">Leilão demonstrativo</p></div></div>
      <span className="flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-400/[.07] px-2.5 py-1 text-[10px] font-semibold text-amber-300"><CircleDot size={11}/> SIMULADO</span>
    </div>
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-3 p-4 sm:gap-4">
      <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Preço indicativo</p><p className="mt-1 text-[clamp(1.35rem,3vw,2.05rem)] font-bold tracking-tight tabular-nums">{priceFmt(cfg.price,asset)}</p><p className="mt-1 text-xs font-semibold text-emerald-400">+{priceFmt(cfg.price-cfg.close,asset)} pts</p><div className="mt-5 space-y-2 border-t border-white/[.08] pt-3 text-xs"><div className="flex justify-between gap-2"><span className="text-slate-500">Compra</span><strong className="text-emerald-300 tabular-nums">{br(buy)}</strong></div><div className="flex justify-between gap-2"><span className="text-slate-500">Venda</span><strong className="text-rose-300 tabular-nums">{br(sell)}</strong></div><div className="flex justify-between gap-2"><span className="text-slate-500">Saldo</span><strong className={tint}>{buy-sell>0?"+":""}{br(buy-sell)}</strong></div></div></div>
      <div className={`flex min-w-0 flex-col justify-center rounded-xl border px-3 py-4 text-center ${signalBg}`}><div className={`mx-auto mb-2 ${tint}`}>{isBuy?<ArrowUpRight size={27}/>:isSell?<ArrowDownRight size={27}/>:<Activity size={27}/>}</div><p className={`text-[clamp(.9rem,2vw,1.25rem)] font-black leading-tight tracking-tight ${tint}`}>{signal}</p><p className={`mt-2 text-3xl font-black tracking-tight tabular-nums ${tint}`}>{score>0?"+":""}{score.toFixed(1)}%</p><p className="mt-1 text-[10px] text-slate-400">Pressão do book</p></div>
    </div>
    <div className="px-4 pb-4"><div className="flex h-2 overflow-hidden rounded-full bg-rose-500/90"><div className="h-full bg-emerald-400 transition-[width]" style={{width:`${barWidth}%`}}/></div><div className="mt-1.5 flex justify-between text-[10px] font-medium text-slate-500"><span>COMPRADORES</span><span>VENDEDORES</span></div></div>
  </section>;
}

function Index() {
  const [scenario, setScenario] = useState<Scenario>("buy");
  const [bookAsset, setBookAsset] = useState<Asset>("WIN");
  const bookCfg = config[bookAsset];
  const book = bookAsset === "WIN" ? examples[scenario] : scenario === "neutral" ? examples.neutral : scenario === "buy" ? examples.sell : examples.buy;
  const indicators = [
    { name: "Pressão do book", win: classify(pressure(examples[scenario].buy,examples[scenario].sell)), wdo: classify(pressure(scenario === "neutral" ? 12000 : scenario === "buy" ? 6920 : 18420,scenario === "neutral" ? 12000 : scenario === "buy" ? 18420 : 6920)) },
    { name: "Gap indicativo", win: "+350 pts", wdo: "+12,0 pts" },
    { name: "Níveis próximos", win: "Sem dados", wdo: "Sem dados" },
    { name: "Arbitragem", win: "Sem dados", wdo: "Sem dados" },
    { name: "Persistência", win: "Sem histórico", wdo: "Sem histórico" },
  ];
  const signalClass = (s: string) => s.includes("COMPRA") ? "text-emerald-400" : s.includes("VENDA") ? "text-rose-400" : "text-slate-400";
  return <div className="min-h-screen bg-[#080d15] text-slate-100 [background-image:radial-gradient(ellipse_60%_40%_at_50%_-20%,rgba(16,185,129,.11),transparent)]">
    <header className="border-b border-white/10 bg-[#0e1622]"><div className="mx-auto flex max-w-[1320px] items-center justify-between gap-3 px-4 py-3 md:px-6"><div className="flex items-center gap-2.5"><span className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-1.5 text-emerald-400"><Activity size={19}/></span><div><p className="text-base font-black leading-none tracking-tight">ABERTURA<span className="text-emerald-400">.</span></p><p className="mt-1 text-[9px] font-semibold tracking-[.19em] text-slate-500">DECISION TERMINAL</p></div></div><div className="flex items-center gap-3"><span className="hidden items-center gap-1.5 text-[10px] font-semibold text-amber-300 sm:flex"><Radio size={13}/> PROFIT DESCONECTADO</span><Link to="/auth" className="flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold hover:bg-white/10"><LockKeyhole size={13}/> Entrar</Link></div></div></header>
    <main className="mx-auto max-w-[1320px] space-y-3 px-3 py-4 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3 px-1"><div><h1 className="text-lg font-bold tracking-tight md:text-xl">Visão rápida <span className="font-normal text-slate-500">/ Pré-abertura B3</span></h1><p className="text-[11px] text-slate-500">Sinais indicativos · Dados fictícios para demonstração</p></div><label className="flex items-center gap-2 text-[11px] text-slate-400">Cenário<select aria-label="Cenário simulado" value={scenario} onChange={e=>setScenario(e.target.value as Scenario)} className="rounded-lg border border-white/15 bg-[#152232] px-3 py-2 text-xs font-semibold text-slate-100"><option value="buy">Comprador WIN</option><option value="sell">Vendedor WIN</option><option value="neutral">Neutro</option></select></label></div>
      <div className="grid gap-3 lg:grid-cols-2"><AssetPanel asset="WIN" scenario={scenario}/><AssetPanel asset="WDO" scenario={scenario}/></div>
      <section className="overflow-hidden rounded-2xl border border-white/[.10] bg-[#111b29]"><div className="flex items-center justify-between border-b border-white/[.08] px-4 py-3"><h2 className="text-sm font-bold">Matriz de confirmação</h2><span className="text-[10px] text-slate-500">Somente a pressão é calculada · demais dados ilustrativos ou indisponíveis</span></div><div className="grid grid-cols-[minmax(0,1.4fr)_1fr_1fr] gap-2 bg-white/[.035] px-4 py-2 text-[10px] font-bold tracking-wide text-slate-400"><span>INDICADOR</span><span className="text-center">WIN</span><span className="text-center">WDO</span></div>{indicators.map((item,i)=><div key={item.name} className={`grid grid-cols-[minmax(0,1.4fr)_1fr_1fr] items-center gap-2 px-4 py-2 text-xs ${i%2?"bg-white/[.025]":""}`}><span className="truncate text-slate-300">{item.name}</span><span className={`text-center text-[11px] font-bold ${signalClass(item.win)}`}>{item.win}</span><span className={`text-center text-[11px] font-bold ${signalClass(item.wdo)}`}>{item.wdo}</span></div>)}</section>
      <details className="group overflow-hidden rounded-xl border border-white/[.09] bg-[#111b29]"><summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-xs font-semibold text-slate-300">Book detalhado · consulta opcional <ChevronDown size={15} className="transition-transform group-open:rotate-180"/></summary><div className="border-t border-white/10 p-3"><div className="mb-3 flex gap-2">{(["WIN","WDO"] as const).map(a=><button key={a} onClick={()=>setBookAsset(a)} className={`rounded px-3 py-1.5 text-xs font-semibold ${bookAsset===a?"bg-emerald-400 text-slate-950":"bg-white/10 text-slate-300"}`}>{a}</button>)}</div><div className="grid grid-cols-4 gap-2 pb-2 text-right text-[10px] text-slate-500"><span>QTD COMPRA</span><span>COMPRA</span><span>VENDA</span><span>QTD VENDA</span></div>{Array.from({length:6},(_,i)=><div key={i} className="grid grid-cols-4 gap-2 border-t border-white/5 py-2 text-right text-xs tabular-nums"><span className="text-emerald-300">{br(Math.round(book.buy/10+i*47))}</span><span className="text-emerald-400">{priceFmt(bookCfg.price-(i+1)*bookCfg.step,bookAsset)}</span><span className="text-rose-400">{priceFmt(bookCfg.price+(i+1)*bookCfg.step,bookAsset)}</span><span className="text-rose-300">{br(Math.round(book.sell/10+i*39))}</span></div>)}</div></details>
      <p className="flex items-center gap-2 px-1 text-[10px] text-slate-500"><ShieldAlert size={13} className="shrink-0 text-amber-400"/> Simulação sem dados em tempo real. Pressão não é probabilidade de acerto nem recomendação de investimento.</p>
    </main>
  </div>;
}

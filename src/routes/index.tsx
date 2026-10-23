import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Activity, ArrowDownRight, ArrowUpRight, LockKeyhole, Radio, ShieldAlert } from "lucide-react";
import { classify, pressure } from "@/lib/auction";

export const Route = createFileRoute("/")({ component: Index });
const scenarios = {
  buy: { buy: 18420, sell: 6920 },
  sell: { buy: 6920, sell: 18420 },
  neutral: { buy: 12000, sell: 12000 },
} as const;
type Scenario = keyof typeof scenarios;
const number = (n: number) => n.toLocaleString("pt-BR");

function Index() {
  const [asset, setAsset] = useState<"WIN" | "WDO">("WIN");
  const [scenario, setScenario] = useState<Scenario>("buy");
  const { buy, sell } = scenarios[scenario];
  const score = pressure(buy, sell) ?? 0;
  const signal = classify(score);
  const price = asset === "WIN" ? 129850 : 5712.5;
  const previous = asset === "WIN" ? 129500 : 5700.5;
  const fmt = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: asset === "WDO" ? 1 : 0, maximumFractionDigits: 1 });
  const tone = score > 10 ? "text-emerald-400" : score < -10 ? "text-rose-400" : "text-amber-300";
  return <div className="min-h-screen bg-[#080d15] text-slate-100">
    <header className="border-b border-white/10 bg-[#101925]"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5"><div className="flex items-center gap-3"><Activity className="text-emerald-400" size={28}/><div><div className="text-xl font-bold tracking-tight">ABERTURA<span className="text-emerald-400">.</span></div><div className="text-[10px] tracking-[.2em] text-slate-500">MARKET INTELLIGENCE</div></div></div><div className="flex items-center gap-4"><span className="flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-300"><Radio size={13}/> SIMULAÇÃO</span><Link to="/auth" className="flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2 text-sm hover:bg-white/10"><LockKeyhole size={14}/> Entrar</Link></div></div></header>
    <main className="mx-auto max-w-7xl space-y-6 px-6 py-9"><div><p className="text-xs font-semibold tracking-[.2em] text-emerald-400">B3 / PRÉ-ABERTURA</p><h1 className="mt-2 text-4xl font-bold tracking-tight">Terminal de abertura</h1><p className="mt-2 text-sm text-slate-400">Inteligência de mercado · dados demonstrativos, sem conexão ao Profit.</p></div>
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#121d2b] p-3"><div className="flex gap-2">{(["WIN","WDO"] as const).map(a=><button key={a} onClick={()=>setAsset(a)} className={`rounded-lg px-5 py-2 text-sm font-semibold ${asset===a?"bg-emerald-400 text-slate-950":"bg-white/5 text-slate-300 hover:bg-white/10"}`}>{a}</button>)}</div><select aria-label="Cenário demonstrativo" value={scenario} onChange={e=>setScenario(e.target.value as Scenario)} className="rounded-lg border border-white/20 bg-[#0b121d] px-4 py-2 text-sm"><option value="buy">Cenário comprador</option><option value="sell">Cenário vendedor</option><option value="neutral">Cenário neutro</option></select></div>
    <div className="grid gap-5 lg:grid-cols-3"><section className="rounded-2xl border border-white/10 bg-[#121d2b] p-7 lg:col-span-2"><div className="text-xs font-semibold tracking-widest text-slate-400">VIÉS DE ABERTURA · INDICATIVO</div><div className={`mt-8 flex items-center gap-3 ${tone}`}>{score>10?<ArrowUpRight size={38}/>:score< -10?<ArrowDownRight size={38}/>:<Activity size={38}/>}<h2 className="text-3xl font-bold uppercase">{signal}</h2></div><p className="mt-3 text-sm text-slate-400">Desequilíbrio entre as ofertas de compra e venda no cenário selecionado.</p><div className="mt-9 flex justify-between gap-3 text-sm"><span className="text-slate-400">Pressão no book</span><strong className={`text-2xl ${tone}`}>{score>0?"+":""}{score.toFixed(1)}%</strong></div><div className="mt-4 flex h-3 overflow-hidden rounded-full bg-rose-500"><div className="bg-emerald-400 transition-all" style={{width:`${buy/(buy+sell)*100}%`}}/></div><div className="mt-3 flex justify-between text-xs text-slate-400"><span>Compra {number(buy)}</span><span>Venda {number(sell)}</span></div><p className="mt-8 flex items-start gap-2 border-t border-white/10 pt-5 text-xs text-amber-200"><ShieldAlert size={16}/> Pressão indicativa não representa probabilidade de acerto.</p></section>
    <section className="rounded-2xl border border-white/10 bg-[#121d2b] p-7"><h2 className="font-semibold">Resumo do leilão <span className="float-right text-emerald-400">{asset}</span></h2><p className="mt-8 text-xs uppercase tracking-wider text-slate-400">Preço indicativo</p><div className="mt-2 text-4xl font-bold">{fmt(price)}</div><p className="mt-2 text-sm text-emerald-400">+{fmt(price-previous)} pts</p><div className="mt-7 divide-y divide-white/10">{[["Fechamento anterior",fmt(previous)],["Compra",number(buy)],["Venda",number(sell)],["Saldo",number(buy-sell)],["Fonte","Simulação"]].map(([label,value])=><div key={label} className="flex justify-between gap-3 py-3 text-sm"><span className="text-slate-400">{label}</span><b>{value}</b></div>)}</div></section></div>
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#121d2b]"><div className="flex justify-between gap-3 border-b border-white/10 p-6"><h2 className="font-semibold">Book de ofertas</h2><span className="text-xs text-slate-400">{asset} · 8 níveis simulados</span></div><div className="grid grid-cols-4 gap-2 bg-white/5 px-5 py-3 text-right text-[10px] font-semibold text-slate-400"><span>QTD. COMPRA</span><span>PREÇO COMPRA</span><span>PREÇO VENDA</span><span>QTD. VENDA</span></div>{Array.from({length:8},(_,i)=><div key={i} className="grid grid-cols-4 gap-2 border-t border-white/5 px-5 py-3 text-right text-sm tabular-nums hover:bg-white/5"><span className="text-emerald-300">{number(Math.round(buy/10+i*47))}</span><b className="text-emerald-400">{fmt(price-(i+1)*(asset==="WIN"?5:.5))}</b><b className="text-rose-400">{fmt(price+(i+1)*(asset==="WIN"?5:.5))}</b><span className="text-rose-300">{number(Math.round(sell/10+i*39))}</span></div>)}</section>
    <footer className="border-t border-white/10 pt-5 text-xs text-slate-500">ABERTURA · Cotações fictícias · Profit desconectado · Não é recomendação de investimento.</footer></main></div>;
}

import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Activity, ArrowDownRight, ArrowUpRight, BarChart3, Radio, ShieldAlert, TrendingUp } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid } from "recharts";
import { analyzeAuction, type AuctionSnapshot } from "@/lib/auction-analysis";
import { LiveMarketPanel } from "@/components/live-market-panel";

export const Route = createFileRoute("/")({ component: Index });
type Scenario = "buy" | "sell" | "neutral";
const fmt = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
const scenarios: Record<Scenario, [number, number]> = { buy: [18420, 6920], sell: [6920, 18420], neutral: [12000, 12000] };
function sample(scenario: Scenario): AuctionSnapshot[] {
  const [buy, sell] = scenarios[scenario];
  return Array.from({ length: 12 }, (_, i) => ({
    timestamp: 1000000 + i * 5000,
    indicative: 129850 + (i - 11) * (scenario === "buy" ? 10 : scenario === "sell" ? -10 : 0),
    buy: buy + i % 3 * 12, sell: sell + i % 4 * 8,
    theoreticalVolume: 6000 + i * 100,
  }));
}
const panel = "min-w-0 overflow-hidden rounded-xl border border-[#23404a] bg-[#091720]";
const panelHeader = "flex items-center justify-between border-b border-white/10 bg-[#0e222b] px-3 py-2";
function Index() {
  const [scenario, setScenario] = useState<Scenario>("buy");
  const history = useMemo(() => sample(scenario), [scenario]);
  const analysis = useMemo(() => analyzeAuction(history, 129500), [history]);
  const latest = history[history.length - 1];
  const isBuy = analysis.direction === "COMPRA";
  const isSell = analysis.direction === "VENDA";
  const directionColor = isBuy ? "text-emerald-400" : isSell ? "text-rose-400" : "text-amber-300";
  const data = history.map((h, i) => ({ time: `08:55:${String(i * 5).padStart(2, "0")}`, pressure: +((h.buy - h.sell) / (h.buy + h.sell) * 100).toFixed(1), price: h.indicative }));
  const reversals = data.slice(1).filter((v, i) => Math.abs(v.pressure) > 10 && Math.abs(data[i].pressure) > 10 && Math.sign(v.pressure) !== Math.sign(data[i].pressure)).length;
  const confirmations = [
    { label: "Pressão predominante", valid: analysis.pressurePct !== null, positive: Math.abs(analysis.pressurePct ?? 0) >= 25 },
    { label: "Persistência", valid: analysis.persistencePct !== null, positive: (analysis.persistencePct ?? 0) >= 70 },
    { label: "Preço teórico alinhado", valid: analysis.indicativeChange !== null && analysis.pressurePct !== null, positive: Math.sign(analysis.indicativeChange ?? 0) === Math.sign(analysis.pressurePct ?? 0) && analysis.indicativeChange !== 0 },
    { label: "Volume teórico crescente", valid: latest.theoreticalVolume !== undefined && history[0].theoreticalVolume !== undefined, positive: (latest.theoreticalVolume ?? 0) > (history[0].theoreticalVolume ?? 0) },
    { label: "Sem reversão recente", valid: history.length >= 5, positive: reversals === 0 },
    { label: "Gap dentro do histórico", valid: false, positive: false },
    { label: "Ordens e cancelamentos", valid: false, positive: false },
    { label: "Confirmação IND", valid: false, positive: false },
    { label: "Backtest 300 × 300", valid: false, positive: false },
  ];
  const metrics = [
    ["Persistência", analysis.persistencePct === null ? "—" : `${fmt(analysis.persistencePct)}%`],
    ["Preço teórico Δ", analysis.indicativeChange === null ? "—" : `${fmt(analysis.indicativeChange)} pts`],
    ["Estabilidade", analysis.stabilityPct === null ? "—" : `${fmt(analysis.stabilityPct)}%`],
    ["Reversões", String(reversals)],
  ];
  return <div className="min-h-dvh bg-[#040c12] text-slate-100">
    <header className="border-b border-emerald-400/15 bg-[#08151c]"><div className="mx-auto flex max-w-[1500px] items-center justify-between px-4 py-2">
      <div className="flex items-center gap-2"><Activity className="text-emerald-400" size={18}/><b className="text-sm tracking-wide">ABERTURA<span className="text-emerald-400">.</span> <span className="font-normal text-slate-500">WIN TERMINAL</span></b></div>
      <span className="flex items-center gap-1 text-[10px] text-amber-300"><Radio size={12}/> SEM DADOS AO VIVO</span>
    </div></header>
    <main className="mx-auto max-w-[1500px] space-y-2 px-3 py-2 lg:px-4">
      <div className="flex flex-wrap items-center justify-between gap-2"><div><h1 className="text-base font-bold">Pré-abertura · Mini Índice WIN</h1><p className="text-[10px] text-slate-500">Análise de leilão · execução de ordens exclusivamente no Profit</p></div>
        <label className="flex items-center gap-2 text-[11px] text-slate-400">Cenário demo <select className="rounded-md border border-white/15 bg-[#152632] px-2 py-1 text-white" value={scenario} onChange={e => setScenario(e.target.value as Scenario)}><option value="buy">Comprador</option><option value="sell">Vendedor</option><option value="neutral">Neutro</option></select></label>
      </div>
      <div className="flex items-center gap-2 rounded-md border border-amber-400/25 bg-amber-400/5 px-3 py-1.5 text-[10px] text-amber-200"><ShieldAlert size={13}/> Demonstração com números fictícios. Nenhum sinal ou percentual representa desempenho comprovado.</div>
      <LiveMarketPanel />
      <div className="grid gap-2 lg:grid-cols-3">
        <section className={panel}>
          <div className={panelHeader}><b className="text-xs">WIN · Preço indicativo</b><span className="text-[10px] text-amber-300">DEMO</span></div>
          <div className="flex items-center justify-between gap-2 px-3 py-3">
            <div><p className="text-[10px] text-slate-500">PREÇO TEÓRICO</p><p className="text-2xl font-black tabular-nums">{fmt(latest.indicative)}</p><p className={`text-xs font-bold ${(analysis.gapPoints ?? 0)>=0?"text-emerald-400":"text-rose-400"}`}>Gap {(analysis.gapPoints??0)>=0?"+":""}{fmt(analysis.gapPoints??0)} pts</p></div>
            <div className="text-right text-[11px]"><p className="text-emerald-400">Compra {fmt(latest.buy)}</p><p className="text-rose-400">Venda {fmt(latest.sell)}</p><p>Saldo {fmt(latest.buy-latest.sell)}</p></div>
          </div>
          <div className="px-3 pb-3"><div className="flex h-2 overflow-hidden rounded-full bg-rose-500"><div className="bg-emerald-400" style={{width:`${latest.buy/(latest.buy+latest.sell)*100}%`}}/></div><div className="mt-1 flex justify-between text-[9px] text-slate-500"><span>COMPRADORES</span><span>VENDEDORES</span></div></div>
        </section>
        <section className={`${panel} ${isBuy?"border-emerald-500/40":isSell?"border-rose-500/40":"border-amber-500/40"}`}>
          <div className={panelHeader}><b className="text-xs">DIREÇÃO INDICADA</b><span className="text-[10px] text-slate-400">{analysis.confirmationCount}/4 confirmações</span></div>
          <div className="flex h-[135px] flex-col items-center justify-center gap-1">{isBuy?<ArrowUpRight className={directionColor} size={26}/>:isSell?<ArrowDownRight className={directionColor} size={26}/>:<Activity className={directionColor} size={26}/>}<p className={`text-2xl font-black ${directionColor}`}>{analysis.direction}</p><p className={`text-lg font-bold ${directionColor}`}>{analysis.pressurePct===null?"—":`${analysis.pressurePct>0?"+":""}${fmt(analysis.pressurePct)}%`}</p><p className="text-[10px] text-slate-500">Pressão do book</p></div>
        </section>
        <section className={panel}>
          <div className={panelHeader}><b className="text-xs">Confirmações do leilão</b><BarChart3 size={14} className="text-emerald-400"/></div>
          <div className="grid grid-cols-2 gap-2 p-3">{metrics.map(([label,value])=><div key={label} className="rounded-lg border border-white/10 bg-[#11232c] p-2"><p className="text-[10px] text-slate-500">{label}</p><p className="mt-1 text-sm font-bold">{value}</p></div>)}</div>
        </section>
      </div>
      <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className={panel}>
          <div className={panelHeader}><b className="flex items-center gap-2 text-xs"><Activity size={14} className="text-emerald-400"/> Evolução da pressão</b><span className="text-[10px] text-amber-300">SIMULADO</span></div>
          <div className="h-[185px] min-w-0 px-2 py-2"><ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{top:5,right:8,bottom:0,left:-22}}><CartesianGrid stroke="#213540" strokeDasharray="3 4"/><XAxis dataKey="time" tick={{fill:"#8296a5",fontSize:9}} interval={3}/><YAxis domain={[-100,100]} tick={{fill:"#8296a5",fontSize:9}}/><Tooltip contentStyle={{background:"#10232d",border:"1px solid #34505c"}}/><ReferenceLine y={0} stroke="#7c8a98"/><Line name="Pressão %" dataKey="pressure" type="monotone" stroke="#34d399" strokeWidth={2.5} dot={false} isAnimationActive={false}/></LineChart></ResponsiveContainer></div>
        </section>
        <section className={panel}>
          <div className={panelHeader}><b className="flex items-center gap-2 text-xs"><TrendingUp size={14} className="text-sky-400"/> Evolução do preço teórico</b><span className="text-[10px] text-amber-300">SIMULADO</span></div>
          <div className="h-[205px] min-w-0 px-2 py-3"><ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{top:5,right:8,bottom:0,left:-5}}><CartesianGrid stroke="#213540" strokeDasharray="3 4"/><XAxis dataKey="time" tick={{fill:"#8296a5",fontSize:9}} interval={3}/><YAxis domain={["auto","auto"]} tick={{fill:"#8296a5",fontSize:9}} tickFormatter={v=>fmt(Number(v))}/><Tooltip contentStyle={{background:"#10232d",border:"1px solid #34505c"}} formatter={v=>fmt(Number(v))}/><Line name="Preço teórico" dataKey="price" type="monotone" stroke="#38bdf8" strokeWidth={2.5} dot={false} isAnimationActive={false}/></LineChart></ResponsiveContainer></div>
        </section>
      </div>
      <section className={panel}>
        <div className={panelHeader}><b className="text-xs">Confirmação inteligente · WIN</b><span className="text-[10px] text-amber-300">DEMONSTRAÇÃO</span></div>
        <div className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3">
          {confirmations.map(item => <div key={item.label} className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-[#11232c] px-2 py-2">
            <span className="text-[11px] text-slate-300">{item.label}</span>
            <span className={item.valid ? item.positive ? "shrink-0 text-[10px] font-bold text-emerald-400" : "shrink-0 text-[10px] font-bold text-rose-400" : "shrink-0 text-[10px] text-slate-500"}>{!item.valid ? "SEM DADOS" : item.positive ? "CONFIRMA" : "CONTRÁRIO"}</span>
          </div>)}
        </div>
        <p className="border-t border-white/10 px-3 py-2 text-[10px] text-slate-400">Sem dados não conta como confirmação. Critérios demonstrativos, ainda não calibrados por backtest.</p>
      </section>
      <div className="grid gap-2 lg:grid-cols-2">
        <section className={panel}><div className={panelHeader}><b className="text-xs">Potencial de movimento</b><span className="text-[10px] text-slate-500">Sem histórico real</span></div><div className="grid grid-cols-2 gap-2 p-3"><div className="rounded-md bg-emerald-400/5 p-2"><p className="text-[10px] text-slate-500">Alta estimada</p><b className="text-emerald-400">— pts</b></div><div className="rounded-md bg-rose-400/5 p-2"><p className="text-[10px] text-slate-500">Baixa estimada</p><b className="text-rose-400">— pts</b></div></div></section>
        <section className={panel}><div className={panelHeader}><b className="text-xs">Validação histórica · 300 × 300</b><span className="text-[10px] text-slate-500">Aguardando dados</span></div><div className="px-3 py-3 text-[11px] text-slate-400">Probabilidade de alvo antes do stop: <b className="text-white">indisponível</b><p className="mt-1 text-[10px] text-amber-300">Não calculamos acerto ou pontos futuros sem backtest.</p></div></section>
      </div>
    </main>
  </div>;
}

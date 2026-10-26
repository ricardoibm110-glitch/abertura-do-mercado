import { useEffect, useState } from "react";
type Row = {symbol:string;contract:string;capturedAt:string;marketTime:string;last:number|null;previousClose:number|null;indicative:number|null;theoreticalVolume:number|null;offerSell:number|null};
type Payload = {receivedAt:string|null;mode?:"REAL"|"TESTE";rows:Record<string,Row>};
const fmt=(n:number|null|undefined)=>n==null?"—":n.toLocaleString("pt-BR",{maximumFractionDigits:2});
// Endereço público da API; as chaves privadas nunca são incluídas no código.
const endpoint="https://win-market-bridge.ricardoibm110.workers.dev";
export function LiveMarketPanel(){
 const [state,setState]=useState<Payload|null>(null);
 const [error,setError]=useState("");
 useEffect(()=>{
   if(!endpoint)return;
   let active=true;
   const read=async()=>{
     try{
       const response=await fetch(endpoint+"/latest",{cache:"no-store"});
       if(!response.ok)throw new Error("Servidor indisponível ("+response.status+")");
       const data=await response.json() as Payload;
       if(active){setState(data);setError("");}
     }catch(e){if(active){setError(e instanceof Error?e.message:"Falha de conexão");setState(null);}}
   };
   void read();
   const id=setInterval(()=>void read(),5000);
   return()=>{active=false;clearInterval(id)};
 },[]);
 const received=state?.receivedAt?Date.parse(state.receivedAt):0;
 const age=received?Date.now()-received:Infinity;
 const fresh=age>=0&&age<15000;
 const win=state?.rows?.WIN;
 const ind=state?.rows?.IND;
 const valid=(row:Row|undefined)=>Boolean(row&&Date.now()-Date.parse(row.capturedAt)<15000);
 const isTest=state?.mode==="TESTE";
 const status=error?"ERRO":!state?"AGUARDANDO DADOS":isTest?"TESTE HISTÓRICO":!fresh?"DADOS ATRASADOS":"CONECTADO";
 const showRow=(row:Row|undefined)=>Boolean(row);
 const rowFresh=(row:Row|undefined)=>Boolean(row&&fresh&&valid(row));
 return <section className="min-w-0 overflow-hidden rounded-xl border border-sky-500/30 bg-[#091720]">
   <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[#0e222b] px-3 py-2">
     <b className="text-xs">Conexão Profit · WIN + IND</b>
     <span className={`text-[10px] font-bold ${fresh&&!error&&!isTest?"text-emerald-400":"text-amber-300"}`}>{status}</span>
   </div>
   {!endpoint?<p className="px-3 py-3 text-xs text-amber-300">Servidor ainda não configurado. Defina VITE_MARKET_API_URL no deploy do site.</p>:<>
     <p className="px-3 py-2 text-xs text-slate-400">Conexão automática · atualização a cada 5 segundos.</p>
     {isTest&&<p className="mx-3 mb-2 rounded-md border border-amber-400/40 bg-amber-400/10 p-2 text-xs font-bold text-amber-300">MODO TESTE · COTAÇÕES HISTÓRICAS · NÃO SÃO DADOS AO VIVO</p>}
     {error&&<p className="px-3 pb-2 text-xs text-rose-400">{error}</p>}
     <div className="grid gap-2 px-3 pb-3 sm:grid-cols-2">
       {[win,ind].map((row,i)=><div key={i} className="rounded-lg border border-white/10 bg-[#11232c] p-3">
         <div className="flex justify-between text-xs"><b>{row?.contract??(i===0?"WIN":"IND")}</b><span className={rowFresh(row)&&!isTest?"text-emerald-400":"text-amber-300"}>{!row?"SEM DADOS":isTest?"HISTÓRICO":rowFresh(row)?"RECEBENDO":"ATRASADO"}</span></div>
         <p className="mt-2 text-xl font-bold">{showRow(row)?fmt(row?.last):"—"}</p>
         <div className="mt-1 grid grid-cols-2 gap-1 text-[11px] text-slate-400"><span>Teórico: {showRow(row)?fmt(row?.indicative):"—"}</span><span>Qtd. teórica: {showRow(row)?fmt(row?.theoreticalVolume):"—"}</span><span>Fechamento: {showRow(row)?fmt(row?.previousClose):"—"}</span><span>Hora feed: {showRow(row)?row?.marketTime:"—"}</span></div>
       </div>)}
     </div>
     {state?.receivedAt&&<p className="px-3 pb-2 text-[11px] text-slate-400">Último recebimento na Cloudflare: {new Date(state.receivedAt).toLocaleString("pt-BR")} · {fresh?"recente":"atrasado"}. Valores atrasados são exibidos apenas para diagnóstico, não para operação.</p>}
     <p className="border-t border-white/10 px-3 py-2 text-[10px] text-slate-400">Leitura automática. Dados públicos até implementação de autenticação na API. Sem book completo, não há cálculo de pressão real nem sinais operacionais.</p>
   </>}
 </section>;
}

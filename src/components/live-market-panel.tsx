import { useEffect, useState } from "react";
type Row = {symbol:string;contract:string;capturedAt:string;marketTime:string;last:number|null;previousClose:number|null;indicative:number|null;theoreticalVolume:number|null;offerSell:number|null};
type Payload = {receivedAt:string|null;rows:Record<string,Row>};
const fmt=(n:number|null|undefined)=>n==null?"—":n.toLocaleString("pt-BR",{maximumFractionDigits:2});
const endpoint=(import.meta.env.VITE_MARKET_API_URL as string|undefined)?.replace(/\/$/,"");
export function LiveMarketPanel(){
 const [token,setToken]=useState("");
 const [connected,setConnected]=useState(false);
 const [state,setState]=useState<Payload|null>(null);
 const [error,setError]=useState("");
 useEffect(()=>{
   if(!connected||!token||!endpoint)return;
   let active=true;
   const read=async()=>{
     try{
       const response=await fetch(endpoint+"/latest",{headers:{Authorization:"Bearer "+token},cache:"no-store"});
       if(!response.ok)throw new Error(response.status===401?"Chave de visualização incorreta":"Servidor indisponível ("+response.status+")");
       const data=await response.json() as Payload;
       if(active){setState(data);setError("");}
     }catch(e){if(active){setError(e instanceof Error?e.message:"Falha de conexão");setState(null);}}
   };
   void read();
   const id=setInterval(()=>void read(),5000);
   return()=>{active=false;clearInterval(id)};
 },[connected,token]);
 const received=state?.receivedAt?Date.parse(state.receivedAt):0;
 const age=received?Date.now()-received:Infinity;
 const fresh=age>=0&&age<15000;
 const win=state?.rows?.WIN;
 const ind=state?.rows?.IND;
 const valid=(row:Row|undefined)=>Boolean(row&&Date.now()-Date.parse(row.capturedAt)<15000);
 const status=!connected?"DESLIGADO":error?"ERRO":!fresh?"DADOS ATRASADOS":"CONECTADO";
 return <section className="min-w-0 overflow-hidden rounded-xl border border-sky-500/30 bg-[#091720]">
   <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[#0e222b] px-3 py-2">
     <b className="text-xs">Conexão Profit · WIN + IND</b>
     <span className={`text-[10px] font-bold ${fresh&&!error?"text-emerald-400":"text-amber-300"}`}>{status}</span>
   </div>
   {!endpoint?<p className="px-3 py-3 text-xs text-amber-300">Servidor ainda não configurado. Defina VITE_MARKET_API_URL no deploy do site.</p>:<>
     <div className="flex flex-wrap gap-2 p-3">
       <input type="password" autoComplete="off" placeholder="Chave privada de visualização" aria-label="Chave privada de visualização" value={token} onChange={e=>{setToken(e.target.value);setConnected(false);setState(null)}} className="min-w-0 flex-1 rounded-md border border-white/20 bg-[#10232d] px-2 py-1.5 text-xs" />
       <button type="button" onClick={()=>setConnected(v=>!v)} disabled={!token} className="rounded-md bg-sky-700 px-3 py-1.5 text-xs font-bold disabled:opacity-50">{connected?"Desconectar":"Conectar"}</button>
     </div>
     {error&&<p className="px-3 pb-2 text-xs text-rose-400">{error}</p>}
     <div className="grid gap-2 px-3 pb-3 sm:grid-cols-2">
       {[win,ind].map((row,i)=><div key={i} className="rounded-lg border border-white/10 bg-[#11232c] p-3">
         <div className="flex justify-between text-xs"><b>{row?.contract??(i===0?"WIN":"IND")}</b><span className={valid(row)&&fresh?"text-emerald-400":"text-amber-300"}>{valid(row)&&fresh?"RECEBENDO":"SEM DADOS ATUAIS"}</span></div>
         <p className="mt-2 text-xl font-bold">{fresh&&valid(row)?fmt(row?.last):"—"}</p>
         <div className="mt-1 grid grid-cols-2 gap-1 text-[11px] text-slate-400"><span>Teórico: {fresh&&valid(row)?fmt(row?.indicative):"—"}</span><span>Qtd. teórica: {fresh&&valid(row)?fmt(row?.theoreticalVolume):"—"}</span><span>Fechamento: {fresh&&valid(row)?fmt(row?.previousClose):"—"}</span><span>Hora feed: {fresh&&valid(row)?row?.marketTime:"—"}</span></div>
       </div>)}
     </div>
     <p className="border-t border-white/10 px-3 py-2 text-[10px] text-slate-400">Leitura protegida por chave. Sem book completo, o sistema não calcula pressão real nem gera sinais operacionais a partir deste feed. Não compartilhe a chave.</p>
   </>}
 </section>;
}

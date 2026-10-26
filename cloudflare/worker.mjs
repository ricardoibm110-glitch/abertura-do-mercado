// Cloudflare Worker + KV. Configure MARKET_KV, INGEST_TOKEN, ALLOWED_ORIGIN. GET /latest is public until login is implemented.
// Never put tokens in frontend source, git, or URL query parameters.
const reply=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store",...headers}});
export class MarketHub {
 constructor(state,env){this.state=state;this.env=env;this.clients=new Set();}
 async fetch(request){
  const url=new URL(request.url);
  if(url.pathname==="/publish"&&request.method==="POST"){
   const data=await request.text();
   for(const ws of this.clients){try{ws.send(data)}catch{this.clients.delete(ws)}}
   return new Response("ok");
  }
  if(request.headers.get("Upgrade")?.toLowerCase()!=="websocket")return new Response("Upgrade required",{status:426});
  const pair=new WebSocketPair();const client=pair[0],server=pair[1];server.accept();this.clients.add(server);
  server.addEventListener("close",()=>this.clients.delete(server));
  server.addEventListener("error",()=>this.clients.delete(server));
  return new Response(null,{status:101,webSocket:client});
 }
}
const safe=(v)=>typeof v==="number"&&Number.isFinite(v)?v:null;
export default {async fetch(request,env){
 const origin=request.headers.get("Origin");
 const cors=origin&&origin===env.ALLOWED_ORIGIN?{"access-control-allow-origin":origin,"vary":"Origin","access-control-allow-headers":"authorization, content-type","access-control-allow-methods":"GET, POST, OPTIONS"}:{};
 if(request.method==="OPTIONS")return new Response(null,{status:origin===env.ALLOWED_ORIGIN?204:403,headers:cors});
 const url=new URL(request.url);
 if(url.pathname==="/health")return reply({ok:true,websocket:!!env.MARKET_HUB},200,cors);
 if(url.pathname==="/stream"&&request.method==="GET"){
  if(!env.MARKET_HUB)return reply({error:"WebSocket ainda não configurado"},503,cors);
  if(origin&&origin!==env.ALLOWED_ORIGIN)return reply({error:"Origem não permitida"},403,cors);
  if(request.headers.get("Upgrade")?.toLowerCase()!=="websocket")return reply({error:"Upgrade required"},426,cors);
  return env.MARKET_HUB.get(env.MARKET_HUB.idFromName("live")).fetch("https://hub.internal/stream",{headers:{Upgrade:"websocket"}});
 }
 if(!env.INGEST_TOKEN||!env.MARKET_KV)return reply({error:"Servidor não configurado"},503,cors);
 const auth=request.headers.get("Authorization")||"";
 if(url.pathname==="/ingest"&&request.method==="POST"){
   if(auth!==`Bearer ${env.INGEST_TOKEN}`)return reply({error:"Não autorizado"},401,cors);
   if(Number(request.headers.get("content-length")||0)>16384)return reply({error:"Payload muito grande"},413,cors);
   let body;try{body=await request.json()}catch{return reply({error:"JSON inválido"},400,cors)}
   if(!body||!Array.isArray(body.rows)||body.rows.length!==2)return reply({error:"Esperados WIN e IND"},400,cors);
   const mode=body.mode==="TESTE"?"TESTE":"REAL";
   if(body.mode!==undefined&&!["TESTE","REAL"].includes(body.mode))return reply({error:"Modo inválido"},400,cors);
   const rows={};
   for(const row of body.rows){
     if(!row||!["WIN","IND"].includes(row.symbol)||rows[row.symbol])return reply({error:"Ativo inválido"},400,cors);
     if(typeof row.contract!=="string"||!/^(WIN|IND)[FGHJKMNQUVXZ][0-9]{2}$/.test(row.contract)||!row.contract.startsWith(row.symbol))return reply({error:"Contrato inválido"},400,cors);
     if(typeof row.capturedAt!=="string"||!Number.isFinite(Date.parse(row.capturedAt))||Math.abs(Date.now()-Date.parse(row.capturedAt))>120000)return reply({error:"Captura fora da janela"},422,cors);
     if(typeof row.marketTime!=="string"||!/^\d{2}:\d{2}:\d{2}$/.test(row.marketTime))return reply({error:"Horário inválido"},400,cors);
     rows[row.symbol]={symbol:row.symbol,contract:row.contract,capturedAt:row.capturedAt,sourceCapturedAt:mode==="TESTE"&&typeof row.sourceCapturedAt==="string"?row.sourceCapturedAt:null,marketTime:row.marketTime,last:safe(row.last),previousClose:safe(row.previousClose),indicative:safe(row.indicative),theoreticalVolume:safe(row.theoreticalVolume),offerSell:safe(row.offerSell)};
   }
   const latest={receivedAt:new Date().toISOString(),mode,rows};
   await env.MARKET_KV.put("latest",JSON.stringify(latest),{expirationTtl:86400});
   if(env.MARKET_HUB){
    try{await env.MARKET_HUB.get(env.MARKET_HUB.idFromName("live")).fetch("https://hub.internal/publish",{method:"POST",body:JSON.stringify(latest)})}
    catch(e){console.error("Falha WebSocket; KV preservado",String(e))}
   }
   return reply({ok:true},200,cors);
 }
 if(url.pathname==="/latest"&&request.method==="GET"){
   const state=await env.MARKET_KV.get("latest","json");
   return reply(state||{receivedAt:null,rows:{}},200,cors);
 }
 return reply({error:"Não encontrado"},404,cors);
}};

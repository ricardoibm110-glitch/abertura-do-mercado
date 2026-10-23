// Cloudflare Worker + KV. Configure MARKET_KV, INGEST_TOKEN, VIEW_TOKEN, ALLOWED_ORIGIN.
// Never put tokens in frontend source, git, or URL query parameters.
const reply=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store",...headers}});
const safe=(v)=>typeof v==="number"&&Number.isFinite(v)?v:null;
export default {async fetch(request,env){
 const origin=request.headers.get("Origin");
 const cors=origin&&origin===env.ALLOWED_ORIGIN?{"access-control-allow-origin":origin,"vary":"Origin","access-control-allow-headers":"authorization, content-type","access-control-allow-methods":"GET, POST, OPTIONS"}:{};
 if(request.method==="OPTIONS")return new Response(null,{status:origin===env.ALLOWED_ORIGIN?204:403,headers:cors});
 const url=new URL(request.url);
 if(url.pathname==="/health")return reply({ok:true},200,cors);
 if(!env.INGEST_TOKEN||!env.VIEW_TOKEN||!env.MARKET_KV)return reply({error:"Servidor não configurado"},503,cors);
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
   await env.MARKET_KV.put("latest",JSON.stringify({receivedAt:new Date().toISOString(),mode,rows}),{expirationTtl:86400});
   return reply({ok:true},200,cors);
 }
 if(url.pathname==="/latest"&&request.method==="GET"){
   if(auth!==`Bearer ${env.VIEW_TOKEN}`)return reply({error:"Não autorizado"},401,cors);
   const state=await env.MARKET_KV.get("latest","json");
   return reply(state||{receivedAt:null,rows:{}},200,cors);
 }
 return reply({error:"Não encontrado"},404,cors);
}};

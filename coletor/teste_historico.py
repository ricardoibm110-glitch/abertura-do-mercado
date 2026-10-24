"""Teste único com CSV histórico. Envia dados rotulados TESTE, nunca como cotação real."""
import csv
import json
import os
import ssl
import urllib.request
import urllib.error
from datetime import datetime, timezone
from pathlib import Path

folder=Path(__file__).resolve().parent/"historico_profit"
url=os.environ.get("PROFIT_API_URL","").rstrip("/")
token=os.environ.get("PROFIT_INGEST_TOKEN","")
if not url.startswith("https://") or len(token)<24:
    raise SystemExit("Configure PROFIT_API_URL e PROFIT_INGEST_TOKEN antes de executar.")
files=sorted(folder.glob("profit_win_ind_*.csv"),key=lambda p:p.stat().st_mtime,reverse=True)
if not files: raise SystemExit("Nenhum CSV encontrado em historico_profit.")
with files[0].open("r",encoding="utf-8-sig",newline="") as f:
    sample=f.read(4096);f.seek(0)
    try: dialect=csv.Sniffer().sniff(sample,delimiters=";,")
    except csv.Error: dialect=csv.excel
    data=list(csv.DictReader(f,dialect=dialect))
found={}
for r in data:
    sym="WIN" if r.get("ativo","").startswith("WIN") else "IND" if r.get("ativo","").startswith("IND") else None
    if sym:found[sym]=r
if set(found)!={"WIN","IND"}:raise SystemExit("CSV sem linhas WIN e IND.")
def num(value):
    try:
        if value is None or not str(value).strip():return None
        x=float(str(value).replace(",","."))
        return x if x==x and abs(x)!=float("inf") else None
    except ValueError:return None
now=datetime.now(timezone.utc).isoformat()
rows=[]
for sym in ("WIN","IND"):
    r=found[sym]
    theoretical=num(r.get("preco_teorico"))
    quantity=num(r.get("quantidade_teorica"))
    rows.append({"symbol":sym,"contract":r["ativo"],"capturedAt":now,
        "sourceCapturedAt":r.get("capturado_em",""),"marketTime":r.get("hora_profit","00:00:00"),
        "last":num(r.get("ultimo")),"previousClose":num(r.get("fechamento_anterior")),
        "indicative":theoretical if theoretical and theoretical>0 else None,
        "theoreticalVolume":quantity if quantity and quantity>0 else None,
        "offerSell":num(r.get("oferta_venda"))})
body=json.dumps({"mode":"TESTE","rows":rows}).encode()
request=urllib.request.Request(url+"/ingest",data=body,headers={"Authorization":"Bearer "+token,"Content-Type":"application/json","User-Agent":"Mozilla/5.0"},method="POST")
try:
    with urllib.request.urlopen(request,timeout=15) as response:
        print("HTTP",response.status,response.read().decode())
        print("TESTE HISTÓRICO enviado:",rows[0]["contract"],rows[1]["contract"])
        print("Origem:",files[0].name)
except urllib.error.HTTPError as exc:
    print("HTTP",exc.code,exc.read().decode())
except Exception as exc:
    print("Falha de conexão:",exc)

"""Bridge CSV do Profit -> Cloudflare Worker. Apenas leitura; não envia ordens.
Requer Python 3.10+. Variáveis PROFIT_API_URL e PROFIT_INGEST_TOKEN.
Lê arquivo CSV que o coletor já produz; mantém apenas as últimas linhas de WIN e IND.
"""
import csv
import json
import os
import time
import urllib.request
from pathlib import Path
from datetime import datetime, timezone

BASE = Path(__file__).resolve().parent
CSV_DIR = BASE / "historico_profit"
URL = os.environ.get("PROFIT_API_URL", "").rstrip("/")
TOKEN = os.environ.get("PROFIT_INGEST_TOKEN", "")
if not URL.startswith("https://") or not TOKEN:
    raise SystemExit("Configure PROFIT_API_URL (https) e PROFIT_INGEST_TOKEN no PowerShell.")
if len(TOKEN) < 24:
    raise SystemExit("Use um token aleatório de pelo menos 24 caracteres.")

def number(value):
    try:
        x = float(value)
        return x if x == x and abs(x) != float("inf") else None
    except (TypeError, ValueError):
        return None

def load_rows():
    files = sorted(CSV_DIR.glob("profit_win_ind_*.csv"), key=lambda f: f.stat().st_mtime, reverse=True)
    if not files:
        return None
    file = files[0]
    # CSV é pequeno inicialmente; lê só o final para evitar crescimento indefinido.
    with file.open("rb") as f:
        header = f.readline().decode("utf-8-sig").strip()
        f.seek(0, 2)
        size = f.tell()
        f.seek(max(0, size - 65536))
        tail = f.read().decode("utf-8-sig", errors="replace")
    lines = tail.splitlines()
    if size > 65536:
        lines = lines[1:]
    rows = list(csv.DictReader([header] + lines, delimiter=";"))
    last = {}
    for row in rows:
        name = row.get("ativo", "")
        symbol = "WIN" if name.startswith("WIN") else "IND" if name.startswith("IND") else None
        if symbol:
            last[symbol] = row
    if set(last) != {"WIN", "IND"}:
        return None
    now = datetime.now(timezone.utc)
    output = []
    for symbol in ("WIN", "IND"):
        r = last[symbol]
        try:
            captured = datetime.fromisoformat(r["capturado_em"])
            if captured.tzinfo is None or abs((now - captured.astimezone(timezone.utc)).total_seconds()) > 12:
                return None
        except (KeyError, ValueError):
            return None
        output.append({
            "symbol": symbol, "contract": r["ativo"],
            "capturedAt": captured.isoformat(), "marketTime": r.get("hora_profit", ""),
            "last": number(r.get("ultimo")),
            "previousClose": number(r.get("fechamento_anterior")),
            "indicative": number(r.get("preco_teorico")) if number(r.get("preco_teorico")) and number(r.get("preco_teorico")) > 0 else None,
            "theoreticalVolume": number(r.get("quantidade_teorica")) if number(r.get("quantidade_teorica")) and number(r.get("quantidade_teorica")) > 0 else None,
            "offerSell": number(r.get("oferta_venda"))
        })
    return output

def main():
    print("Bridge online iniciada. Ctrl+C para parar.")
    last_payload = None
    while True:
        try:
            rows = load_rows()
            if rows:
                payload = json.dumps({"rows": rows}, separators=(",", ":")).encode()
                if payload != last_payload:
                    req = urllib.request.Request(URL + "/ingest", data=payload, headers={"Authorization": "Bearer " + TOKEN, "Content-Type": "application/json", "User-Agent": "Mozilla/5.0"}, method="POST")
                    with urllib.request.urlopen(req, timeout=10) as response:
                        if response.status != 200:
                            raise RuntimeError("HTTP " + str(response.status))
                    last_payload = payload
                    print("Enviado:", rows[0]["capturedAt"], rows[0]["contract"], rows[1]["contract"])
            else:
                print("Aguardando CSV atualizado dos dois ativos...")
        except Exception as exc:
            print("Falha no envio:", exc)
        time.sleep(3)

if __name__ == "__main__":
    main()

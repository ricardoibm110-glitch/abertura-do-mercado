# Profit → dashboard online (WIN / IND)

## O que já está implementado
- `cloudflare/worker.mjs`: API HTTPS privada; recebe 2 ativos e guarda o último snapshot no Cloudflare KV.
- `coletor/bridge_online.py`: lê o CSV gerado por `coletor_profit_win.py` e envia a cada 3 segundos quando há registros novos.
- `src/components/live-market-panel.tsx`: mostra WIN/IND no celular, busca a cada 5 segundos e avisa quando a captura está atrasada.
- Nenhum módulo executa ordens. Sinais demonstrativos continuam separados dos dados reais.

## Configuração simples (uso pessoal)
Não é necessário criar usuários ou configurar login. Basta manter dois segredos: uma chave de envio no computador e uma chave de leitura para abrir o painel no celular. Você pode compartilhar somente a chave de leitura com pessoas de confiança. Não publique nenhuma chave no GitHub.

## Implantar backend (Cloudflare)
1. Crie uma conta Cloudflare, instale Node.js e rode `npx wrangler login`.
2. Crie o namespace KV: `npx wrangler kv namespace create MARKET_KV` e copie o ID.
3. Dentro de `cloudflare`, crie `wrangler.toml` **localmente**:
```toml
name = "win-market-bridge"
main = "worker.mjs"
compatibility_date = "2026-10-23"
workers_dev = true

[[kv_namespaces]]
binding = "MARKET_KV"
id = "COLE_O_ID_DO_KV"

[vars]
ALLOWED_ORIGIN = "https://SEU-DOMINIO-LOVABLE"
```
4. Em `cloudflare`, execute `npx wrangler secret put INGEST_TOKEN` e `npx wrangler secret put VIEW_TOKEN`. Use dois tokens aleatórios **diferentes**, com pelo menos 32 caracteres. Nunca publique os tokens no GitHub.
5. Execute `npx wrangler deploy`. Anote a URL HTTPS do Worker. Essa é a única implantação do servidor necessária.
6. No deploy do frontend (Lovable/Vite), configure `VITE_MARKET_API_URL` com a URL HTTPS do Worker e publique novamente. **Não** coloque tokens em variáveis VITE, pois ficam públicas no JavaScript.

## Iniciar a ponte no Windows
1. Continue usando Profit + Excel + `coletor_profit_win.py`.
2. Coloque `bridge_online.py` na mesma pasta de `coletor_profit_win.py`, ao lado de `historico_profit`.
3. Em um segundo PowerShell, configure as variáveis **somente para a sessão**:
```powershell
$env:PROFIT_API_URL="https://SEU-WORKER.workers.dev"
$env:PROFIT_INGEST_TOKEN="SEU_TOKEN_DE_ENVIO"
py bridge_online.py
```
4. No dashboard, digite a chave de leitura (VIEW_TOKEN) e clique Conectar. A chave permanece apenas em memória na página e é apagada ao atualizar. Para alguém de confiança visualizar, compartilhe apenas a chave de leitura, nunca a chave de envio.

## Segurança e limites
- O endpoint de leitura exige VIEW_TOKEN; o de escrita exige INGEST_TOKEN. O CORS permite apenas o domínio configurado, mas **CORS não substitui autenticação**.
- Evite compartilhar links/tokens e use um domínio HTTPS. O código não registra credenciais nem dados de conta.
- Verifique as condições de licença da sua fonte B3/Nelogica antes de transmitir ou redistribuir cotações pela internet. Prefira uso pessoal e acesso restrito.
- Cloudflare KV é eventualmente consistente: não há garantia de atualização instantânea; adequado para observação, não execução de ordens.
- A API guarda apenas o último par de snapshots, não o histórico completo. O histórico permanece no CSV local.
- O horário de captura e o horário do feed são diferentes. Se o Profit estiver aberto, mas sem negociação, o timestamp de captura pode ser novo enquanto o horário do feed está parado; o painel mostra ambos. A confirmação da validade do feed deve considerar o horário da B3.
- Preço teórico zero/vazio vira indisponível; **não** deve ser tratado como preço de abertura.
- Sem dados do book (compras/vendas), a análise real de pressão e os sinais operacionais continuam desabilitados.

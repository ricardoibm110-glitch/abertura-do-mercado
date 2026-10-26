# WebSocket em tempo real (fase de implantação)

O código em `cloudflare/worker.mjs` exporta `MarketHub` e expõe `GET /stream` (WebSocket). O painel usa WebSocket quando disponível e retorna automaticamente a GET /latest quando não estiver disponível. O POST /ingest continua autenticado e o KV continua como fallback.

## Cloudflare

A classe Durable Object **precisa ser registrada com migração e binding** no mesmo Worker. O código sozinho não habilita WebSocket. Em configuração Wrangler existente, adicione (sem apagar KV, vars e secrets existentes):

```toml
[[durable_objects.bindings]]
name = "MARKET_HUB"
class_name = "MarketHub"

[[migrations]]
tag = "market-hub-v1"
new_sqlite_classes = ["MarketHub"]
```

**Importante:** `new_sqlite_classes` requer conta/plano e configuração compatíveis com Durable Objects. Configure o entrypoint do Worker para `cloudflare/worker.mjs`, preserve o binding `MARKET_KV`, `ALLOWED_ORIGIN` e `INGEST_TOKEN` (secret). Não publique secrets no repositório. Faça deploy com Wrangler após revisar o arquivo de configuração completo. Deploy apenas pelo editor de código, sem registrar o Durable Object, mantém somente o fallback HTTP.

## Verificação

1. `GET /health` deverá responder `{"ok":true,"websocket":true}` após o binding estar disponível.
2. Com Profit e coletores ativos, o painel deverá exibir **transmissão WebSocket em tempo real**.
3. Compare `receivedAt`, `capturedAt` e hora do Profit; WebSocket não acelera a fonte RTD/Excel. Não considere a frequência de consulta como garantia de latência.
4. A leitura de `/stream` e `/latest` é pública nesta versão, até haver autenticação de consulta no servidor. Não envie credenciais pelo frontend.

## Limitações

Esta implementação mantém sockets em memória da instância do Durable Object. Reinícios da instância podem derrubar conexões, que o navegador tenta restabelecer. A consulta HTTP funciona como contingência. O painel de sinais DEMO não usa estes dados para inferir pressão real do book.

# Troubleshooting Docker Swarm Deployment

## Problema: Container sai com "exited - code 1"

### Sintomas
- Migrações executam com sucesso ✅
- Logs mostram: `✨ Starting application...`
- Container morre logo após com exit code 1
- Portainer mostra múltiplas tentativas de restart

### Diagnóstico

#### 1. Verificar logs completos do serviço

```bash
# No nó manager do Swarm
docker service logs whatsapp_flow_app --tail 200 --raw

# Ver apenas erros após "Starting application"
docker service logs whatsapp_flow_app --tail 200 --raw | grep -A 20 "Starting application"
```

#### 2. Verificar se há erros de criptografia

O servidor requer chaves RSA. Verifique se estão configuradas:

```bash
docker service inspect whatsapp_flow_app --format '{{json .Spec.TaskTemplate.ContainerSpec.Env}}' | jq
```

Procure por:
- `PRIVATE_KEY` - Deve estar definida
- `PUBLIC_KEY` - Deve estar definida
- `META_APP_SECRET` - Necessário para webhooks
- `META_ACCESS_TOKEN` - Necessário para API

#### 3. Verificar porta e bind

```bash
docker service inspect whatsapp_flow_app --format '{{json .Spec.EndpointSpec.Ports}}'
```

Deve mostrar porta 3000 mapeada.

#### 4. Verificar logs do healthcheck

```bash
docker service ps whatsapp_flow_app --format "table {{.ID}}\t{{.Name}}\t{{.CurrentState}}\t{{.Error}}"
```

### Causas Comuns

#### Causa 1: Chaves de criptografia ausentes ou inválidas

**Sintoma**: Erro ao carregar private key

**Solução**:
```bash
# Gerar chaves (rodar localmente)
cd /path/to/project
npm run generate-keys

# Copiar output e atualizar variáveis no Portainer
# IMPORTANTE: Manter formato com \n
```

No Portainer:
1. Vá em Stacks → whatsapp_flow_app
2. Editor → Environment variables
3. Cole as chaves mantendo os `\n` (não substituir por quebras de linha reais)

#### Causa 2: Variáveis META_* ausentes

**Sintoma**: Container inicia mas falha ao processar webhooks

**Solução**: Adicionar no environment do stack:
```bash
META_APP_SECRET=seu_app_secret_aqui
META_VERIFY_TOKEN=seu_verify_token_aqui
META_ACCESS_TOKEN=seu_access_token_aqui
META_PHONE_NUMBER_ID=seu_phone_id_aqui
META_WABA_ID=seu_waba_id_aqui
```

#### Causa 3: Porta já em uso

**Sintoma**: Error: listen EADDRINUSE :::3000

**Solução**:
```bash
# Verificar se há outro serviço na porta 3000
docker service ls | grep 3000

# Se necessário, mudar porta no environment:
PORT=3001
```

#### Causa 4: Problemas de memória/recursos

**Sintoma**: Container morto sem erro claro (OOMKilled)

**Solução**: Aumentar limites no stack:
```yaml
deploy:
  resources:
    limits:
      memory: 512M
    reservations:
      memory: 256M
```

### Solução Passo a Passo

#### Opção 1: Atualizar imagem e forçar redeploy

```bash
# No nó manager
docker service update \
  --image setupautomatizado/whatsapp-flows-server:latest \
  --force \
  whatsapp_flow_app
```

#### Opção 2: Recriar serviço do zero

```bash
# Remover serviço
docker service rm whatsapp_flow_app

# Aplicar stack novamente (via Portainer ou CLI)
docker stack deploy -c docker-compose.swarm.yml whatsapp_flow_app
```

#### Opção 3: Verificar com container standalone

Para debug, teste sem Swarm:

```bash
docker run --rm -it \
  -e DATABASE_URL="postgresql://user:pass@postgres_host:5432/db" \
  -e PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMII..." \
  -e PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\nMII..." \
  -e META_APP_SECRET="seu_secret" \
  -e META_VERIFY_TOKEN="seu_token" \
  -e META_ACCESS_TOKEN="seu_access_token" \
  -p 3000:3000 \
  setupautomatizado/whatsapp-flows-server:latest
```

### Checklist de Verificação

- [ ] Postgres está healthy e acessível
- [ ] Migrations executam com sucesso
- [ ] PRIVATE_KEY está definida (formato PEM com `\n`)
- [ ] PUBLIC_KEY está definida (formato PEM com `\n`)
- [ ] META_APP_SECRET está definido
- [ ] META_ACCESS_TOKEN está definido
- [ ] Porta 3000 não está em conflito
- [ ] Memória suficiente alocada (mínimo 256MB)
- [ ] Rede do Swarm permite comunicação entre containers

### Logs Esperados em Startup Saudável

```
🚀 Starting WhatsApp Flow Server...
📊 Testing database connection...
✅ Database connection established
✅ Database connected
✅ Private key loaded with native crypto
Express server configured
✅ Server started
{
  "port": 3000,
  "host": "0.0.0.0",
  "environment": "production",
  "flowEndpointTimeout": 2500
}
📋 Available endpoints:
  - GET  0.0.0.0:3000/health
  - GET  0.0.0.0:3000/docs
  - POST 0.0.0.0:3000/flows/endpoint
  - POST 0.0.0.0:3000/webhooks/whatsapp
```

### Como Obter Logs Detalhados

```bash
# Ver logs de todas as tentativas
docker service logs whatsapp_flow_app --tail 500 --raw > logs.txt

# Ver apenas últimas 20 linhas de cada container
docker service ps whatsapp_flow_app --no-trunc
# Copie o CONTAINER ID de cada task
docker logs <container_id> --tail 50
```

### Ainda com Problemas?

1. **Verifique a versão da imagem**:
   ```bash
   docker service inspect whatsapp_flow_app --format '{{.Spec.TaskTemplate.ContainerSpec.Image}}'
   ```
   
   Deve ser: `setupautomatizado/whatsapp-flows-server:latest` ou uma versão específica como `:v1.1.4`

2. **Verifique se o CI/CD completou**:
   - Acesse: https://github.com/guilhermejansen/whatsapp-flows-server/actions
   - Verifique se o último workflow completou com sucesso
   - Verifique se a imagem Docker foi publicada

3. **Force pull da nova imagem**:
   ```bash
   docker service update --image setupautomatizado/whatsapp-flows-server:latest --force whatsapp_flow_app
   ```

## Próximos Passos

Depois de resolver o problema de inicialização, verifique:

1. **Health check está passando**: `curl http://localhost:3000/health`
2. **Swagger docs acessível**: `http://localhost:3000/docs`
3. **Teste o flow endpoint**: Envie um ping request

Se ainda tiver problemas, forneça os logs completos desde "Starting application" até o crash.

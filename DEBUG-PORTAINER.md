# Debug Portainer Container Issues

## 🔍 Problema Identificado

O container **funciona localmente** mas **falha no Portainer** após completar as migrações.

## 📊 Logs Observados

```
✅ Migrations completed successfully!
📋 Configuration:
   NODE_ENV: production
   PORT: 3000
   HOST: 0.0.0.0
   LOG_LEVEL: info
✨ Starting application...
[dotenv@17.2.3] injecting env (0) from .env
```

O container **morre logo após** sem erro visível.

## 🎯 Diagnóstico Rápido

### Opção 1: Ver Logs Completos no Portainer

1. Vá em **Services** → `whatsapp_flow_app`
2. Clique em **Service logs**
3. Procure por mensagens **APÓS** `✨ Starting application...`
4. Copie **todas as linhas** até o container morrer

**O que procurar:**
- Erros do Node.js (stack trace)
- Mensagens sobre PRIVATE_KEY
- Erros de módulos não encontrados
- Erros de conexão

### Opção 2: Executar Container Interativo (Diagnóstico Detalhado)

No **nó manager** do Swarm, execute:

```bash
# 1. Criar container temporário para debug
docker run -it --rm \
  --network network_public \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e DATABASE_URL="postgresql://whatsapp_flow:qYWdJ61zk3i1AvTfXhzE!@postgres_whatsapp_flow:5432/whatsapp_flows" \
  -e PRIVATE_KEY='-----BEGIN RSA PRIVATE KEY-----
MIIEogIBAAKCAQEAiC2lwK+ssEl0c3J2cJvtAC81iWFV7K3fQCQD/vABL8mh4F8Z
5SHF5ww/pfXcI0Or0YDx5UU4B2embc9qeo8hd84vUsdJHGiuj65U+QbwNwByHzHz
jI8sVEDBdnGCEy07I/TBhajgK3zKIZ1Uw3dsEEiiSCcDiDe6ScbjRqfZO86LawIx
r11KvnHm2YZSU9bP3r2K985hpjWsE+5YXuZtYUqg5LktwnQusq+Mipaa7/4DLSS4
Ehi1+PlmxhoCR/dFEmy03RCNCUXO2SWUlOdg8rq6AUy//7ZPC6NGKpXbOZQG/fiM
IC1Uer+LrVXT3i/K232bt7FsH+apbPonCPhZPwIDAQABAoIBAEIRg318vde5i5oH
SpdPzyhrvxmr87gkk0/XKWkioDDDLpphCXs1a4KxWp/2LJufVVkLqlCFyK0vCHv2
Sb60epRZoHQU48+4qhhjiC5Zw2mr+bJQ1cy4GdW2pSYF5AnRxAOp18o1KK1wmdC9
OEatReyQkMtYwknwX50ztUiuXqK41l+9NgqmoelyXXyOIwMSA9+w+zhasXfTwRnG
H87oNhrz+kYyLN7q6VYhPzw/dVC9VptWs+mh4OnxL7ePFEwC24jX7icWl6fbIZJY
e2gX4FndfvSvquCNDLRPgAd45svM52MgzjnJYLsw+2ykqKFpl8IRbcjkWYGFqMw6
Vp2fluECgYEA4VrB3FcE6c1fhEV0Z6jcQYc1Z4czkc7JixO/XdgZmJoB0C6BUr16
yGTauNdAaPCARx+zdBtcUV/Q8AkLtg/EITYQ8GISLfHh0chADBtOVLKr+rObpqD0
ZVgTFUiWccjKfq/DBsC7DAmXYiDXeWZschz8G/Rf/wvtX3UjURifiEsCgYEAmrJo
iyELFNcD9zbvbaMcxD1oCdusBuyrBLZPjsJhOZ64n0qVnNq4/KmIAZz/KfowKEHD
+YjegpU2THqof3cq/ux3Jmy4fvyzv+VvY9IakvN1YQVeqDLtOAvFnefyvKdH8d/O
xnBbfllgJXIVpMfvt1V5i6kFd3cbwxv7AvZRwl0CgYAExdNNQ1qLSRo4xu/MMjtX
9/EdnDNvZx3FoElxR15jaP+Y1SNQCUtMazZmq8hlcJKG7xjx4JJ39ruKGebxmCvj
OC3rqWgRKQpLUx5oIzvpd09FJACr6sTCULc2wC7Pgh0nybkrr3FGs/1Myr1FiPHL
COod/XL7B9mjJ+vzj73xOQKBgGUlNVmSd05e74bZ8l47AfoFNFsNuEKmx4LDOO1c
hnlIH+p2t6/hCoaYygZUAjoODSKlLV+gb+vtZ51FrZn57rDTJ2yGNXNCArz7ZINd
wmZGrH6NJkDPW28Ds2f1Wi6jKVUqQmZY3FmWUljpaOFeoIu8ZUY9cweTZyGAz/Q1
3Ws5AoGASwqiYM9ybdTiyhKCevEJaDfiIvZTxSBb93mKzVKJKqKDs7fQ9ZTKQwh+
4u6RC+fWYySY8rsDX3Q53B2ZWd3WdC+7ea17slOeVrE/ZtRRy7QKYOUCPyuVBxCg
z5v7F7U9MLc/4EAxvLVE7IY8VsSX/wDjG3A+2/cMylDBRAmQT4Y=
-----END RSA PRIVATE KEY-----' \
  -e PUBLIC_KEY='-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAiC2lwK+ssEl0c3J2cJvt
AC81iWFV7K3fQCQD/vABL8mh4F8Z5SHF5ww/pfXcI0Or0YDx5UU4B2embc9qeo8h
d84vUsdJHGiuj65U+QbwNwByHzHzjI8sVEDBdnGCEy07I/TBhajgK3zKIZ1Uw3ds
EEiiSCcDiDe6ScbjRqfZO86LawIxr11KvnHm2YZSU9bP3r2K985hpjWsE+5YXuZt
YUqg5LktwnQusq+Mipaa7/4DLSS4Ehi1+PlmxhoCR/dFEmy03RCNCUXO2SWUlOdg
8rq6AUy//7ZPC6NGKpXbOZQG/fiMIC1Uer+LrVXT3i/K232bt7FsH+apbPonCPhZ
PwIDAQAB
-----END PUBLIC KEY-----' \
  setupautomatizado/whatsapp-flows-server:latest \
  sh

# 2. Dentro do container, execute:
ls -la /app/dist/
node --version
whoami

# 3. Tente iniciar manualmente:
node dist/main.js

# Observe o erro exato que aparece
```

### Opção 3: Verificar Arquivos no Container em Produção

```bash
# Ver último container que falhou
docker service ps whatsapp_flow_app --no-trunc

# Copie o CONTAINER ID que está "Failed"
docker logs <CONTAINER_ID> 2>&1 | tail -100
```

## 🔎 Causas Prováveis

### 1. PRIVATE_KEY com aspas extras

**Sintoma**: Container morre silenciosamente ao tentar carregar chaves

**Causa**: No seu compose você tem:
```yaml
- DB_PASSWORD="qYWdJ61zk3i1AvTfXhzE!"  # ← Aspas aqui!
- PRIVATE_KEY="-----BEGIN..."           # ← E aqui!
```

**Solução**: Remover aspas nas variáveis:
```yaml
- DB_PASSWORD=qYWdJ61zk3i1AvTfXhzE!
- PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----\nMII...
```

### 2. Arquivo dist/main.js não existe na imagem

**Sintoma**: "Cannot find module" ou "ENOENT"

**Solução**: Rebuild da imagem (já fizemos isso com v1.1.5)

### 3. Permissões de arquivo

**Sintoma**: "EACCES: permission denied"

**Solução**: Verificar se `nodejs` user tem permissão nos arquivos

### 4. Porta 3000 já em uso

**Sintoma**: "EADDRINUSE :::3000"

**Solução**: Verificar conflito de porta no Swarm

## 🎯 Ação Recomendada AGORA

**Execute este comando no Portainer Console:**

1. Vá em **Containers** (não Services)
2. Encontre o container `whatsapp_flow_app.X.XXXXX` que está "Exited"
3. Clique nos **3 pontinhos** → **Logs**
4. Copie **TODAS as linhas** desde "Starting application" até o fim
5. Cole aqui para análise

**OU**

No terminal SSH do seu servidor Swarm:

```bash
# Ver logs do último container que falhou
docker service logs whatsapp_flow_app --tail 200 --raw 2>&1 | grep -A 50 "Starting application"
```

## 📝 Informações Necessárias

Para eu identificar o problema exato, preciso de:

1. ✅ Logs completos após "Starting application" até o crash
2. ⚠️ Mensagem de erro do Node.js (se houver)
3. ⚠️ Resultado do teste manual: `docker run -it ... node dist/main.js`

## 🔧 Fix Temporário para Testar

Enquanto investigamos, teste com esta configuração simplificada:

```yaml
environment:
  # Remover aspas de TODAS as variáveis
  - NODE_ENV=production
  - PORT=3000
  - DATABASE_URL=postgresql://whatsapp_flow:qYWdJ61zk3i1AvTfXhzE!@postgres_whatsapp_flow:5432/whatsapp_flows
  - PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----\nMII...\n-----END RSA PRIVATE KEY-----
  # Continue sem aspas em nenhuma variável
```

**IMPORTANTE**: Em YAML, só use aspas quando houver caracteres especiais que precisam ser escapados. Na maioria dos casos, não precisa.

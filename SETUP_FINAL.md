# 🎯 SETUP FINAL - 3 PASSOS RESTANTES

## ⚠️ STATUS ATUAL:
O MCP do Supabase precisa de configuração de token. Como alternativa, seguir processo manual:

---

## 📋 **PASSO 1: CRIAR PROJETO SUPABASE** (2 min)

### 1.1 Acesse o Supabase:
```bash
# Vá para: https://supabase.com/dashboard
# Clique em "New Project"
```

### 1.2 Configurações do Projeto:
```
Nome: fisioflow-ai-studio
Organização: Sua organização
Região: South America (São Paulo)
Plano: Pro ($25/mês)
Password: [sua senha forte]
```

### 1.3 Aguarde criação (1-2 minutos)

---

## 📋 **PASSO 2: EXECUTAR SCRIPTS SQL** (2 min)

### 2.1 Acesse SQL Editor:
```bash
# No dashboard do projeto → SQL Editor
```

### 2.2 Execute Schema Principal:
```sql
# Copie TODO o conteúdo de: supabase/01_create_schema.sql
# Cole no SQL Editor e execute (Run)
# Resultado esperado: ✅ 11 tabelas criadas
```

### 2.3 Execute Dados de Exemplo:
```sql
# Copie TODO o conteúdo de: supabase/02_seed_data.sql
# Cole no SQL Editor e execute (Run)
# Resultado esperado: ✅ 33 registros inseridos
```

---

## 📋 **PASSO 3: CONFIGURAR VARIÁVEIS VERCEL** (1 min)

### 3.1 Copie Credenciais Supabase:
```bash
# No dashboard Supabase → Settings → API
# Copie: Project URL
# Copie: anon public key
# Copie: service_role secret key
```

### 3.2 Configure Vercel:
```bash
# Vá para: https://vercel.com/rafael-minattos-projects/mocha/settings/environment-variables
# Configure estas 7 variáveis:
```

| Variável | Valor | Ambiente |
|----------|-------|----------|
| `SUPABASE_URL` | `https://SEU-PROJETO.supabase.co` | Production |
| `SUPABASE_ANON_KEY` | `eyJ...` (anon key) | Production |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` (service role) | Production |
| `VITE_SUPABASE_URL` | `https://SEU-PROJETO.supabase.co` | Production |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` (anon key) | Production |
| `JWT_SECRET` | `fisioflow_jwt_secret_2024_super_secure_key` | Production |
| `NODE_ENV` | `production` | Production |

### 3.3 Redeploy Automático:
```bash
# Vercel fará redeploy automático após configurar as variáveis
# Aguarde 2-3 minutos para build completar
```

---

## 🎉 **RESULTADO FINAL:**

Após estes 3 passos você terá:

- ✅ **Aplicação completa**: https://mocha-5nxxv1bgd-rafael-minattos-projects.vercel.app
- ✅ **Banco de dados**: PostgreSQL com 11 tabelas
- ✅ **Autenticação**: Sistema de login funcionando
- ✅ **33 registros**: Dados de exemplo inseridos
- ✅ **Segurança**: RLS e políticas ativas
- ✅ **Performance**: Índices otimizados

---

## 🚀 **TESTE FINAL:**

Após redeploy, teste:
1. Acesse a aplicação
2. Tente fazer login/registro
3. Verifique se dados aparecem
4. Confirme que APIs funcionam

**Total: 5 minutos para ter o sistema 100% funcional!**
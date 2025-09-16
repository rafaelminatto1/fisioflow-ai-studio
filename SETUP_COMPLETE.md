# 🚀 SETUP COMPLETO - FisioFlow AI Studio

## ✅ STATUS ATUAL
- ✅ **Vercel**: Deployed em https://mocha-5nxxv1bgd-rafael-minattos-projects.vercel.app
- ✅ **GitHub**: Código no repositório https://github.com/rafaelminatto1/fisioflow-ai-studio
- ✅ **SQL Scripts**: Schema e dados preparados
- 🔄 **Supabase**: Aguardando criação do projeto

---

## 🗄️ PASSO 1: CRIAR PROJETO SUPABASE

### 1.1. Acessar Supabase
1. Vá para: https://supabase.com/dashboard
2. Clique em **"New project"**

### 1.2. Configurar Projeto
- **Nome**: `fisioflow-ai-studio`
- **Organização**: Sua organização
- **Região**: `South America (São Paulo)` (recomendado para Brasil)
- **Database Password**: Escolha uma senha forte (anote!)
- **Pricing Plan**: Pro (se necessário)

### 1.3. Aguardar Criação
- O projeto levará ~2 minutos para ser criado
- Aguarde até aparecer o dashboard

---

## 📊 PASSO 2: EXECUTAR DATABASE SCHEMA

### 2.1. Acessar SQL Editor
1. No dashboard do Supabase, clique em **"SQL Editor"**
2. Clique em **"New query"**

### 2.2. Executar Schema Principal
1. Copie TODO o conteúdo do arquivo: `supabase/01_create_schema.sql`
2. Cole no SQL Editor
3. Clique **"RUN"** (aguarde ~30 segundos)
4. ✅ Deve aparecer "Success. No rows returned"

### 2.3. Executar Dados de Exemplo (Opcional)
1. Abra nova query no SQL Editor
2. Copie TODO o conteúdo do arquivo: `supabase/02_seed_data.sql`
3. Cole no SQL Editor
4. Clique **"RUN"**
5. ✅ Deve inserir exercícios, artigos e dados de exemplo

---

## 🔑 PASSO 3: COPIAR CREDENCIAIS

### 3.1. Acessar Configurações
1. No dashboard Supabase, vá em **"Settings"** → **"API"**

### 3.2. Copiar Informações Importantes
```bash
# COPIE ESTES VALORES:
Project URL: https://[SEU-PROJECT-ID].supabase.co
anon public key: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
service_role key: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

⚠️ **IMPORTANTE**: Mantenha o `service_role key` em segredo!

---

## ⚙️ PASSO 4: CONFIGURAR VERCEL

### 4.1. Acessar Configurações Vercel
1. Vá para: https://vercel.com/rafael-minattos-projects/mocha/settings/environment-variables

### 4.2. Adicionar Variáveis de Ambiente
Clique **"Add New"** para cada variável:

```env
SUPABASE_URL
[Cole seu Project URL aqui]

SUPABASE_ANON_KEY
[Cole sua anon public key aqui]

SUPABASE_SERVICE_ROLE_KEY
[Cole sua service_role key aqui]

VITE_SUPABASE_URL
[Cole seu Project URL aqui - mesmo valor]

VITE_SUPABASE_ANON_KEY
[Cole sua anon public key aqui - mesmo valor]

JWT_SECRET
fisioflow_jwt_secret_2024_super_secure_key

NODE_ENV
production
```

### 4.3. Salvar e Redeploy
1. Clique **"Save"** em cada variável
2. Vá para **"Deployments"**
3. Clique nos 3 pontinhos do último deploy
4. Clique **"Redeploy"**
5. Aguarde o build (2-3 minutos)

---

## 🧪 PASSO 5: TESTAR A APLICAÇÃO

### 5.1. Acessar a URL
1. Vá para: https://mocha-5nxxv1bgd-rafael-minattos-projects.vercel.app
2. A página deve carregar sem erros

### 5.2. Testar Funcionalidades
1. **Registro**: Criar nova conta
2. **Login**: Fazer login com a conta criada
3. **Dashboard**: Verificar se carrega os dados
4. **Pacientes**: Tentar adicionar um paciente
5. **Exercícios**: Ver a lista de exercícios

### 5.3. Verificar no Supabase
1. Vá para **"Authentication"** → **"Users"**
2. Deve aparecer o usuário que você criou
3. Vá para **"Table Editor"** → **"patients"**
4. Deve aparecer o paciente que você adicionou

---

## 🎯 URLS FINAIS

### Produção
- **App**: https://mocha-5nxxv1bgd-rafael-minattos-projects.vercel.app
- **Vercel Dashboard**: https://vercel.com/rafael-minattos-projects/mocha
- **Supabase Dashboard**: https://supabase.com/dashboard/project/[SEU-PROJECT-ID]

### Desenvolvimento
- **GitHub**: https://github.com/rafaelminatto1/fisioflow-ai-studio
- **Local**: http://localhost:5173 (após `npm run dev`)

---

## ✅ CHECKLIST FINAL

- [ ] ✅ Projeto Supabase criado
- [ ] ✅ Schema SQL executado (11 tabelas criadas)
- [ ] ✅ Dados de exemplo inseridos (10 exercícios, 5 artigos, etc.)
- [ ] ✅ Credenciais copiadas (URL, anon key, service key)
- [ ] ✅ Variáveis configuradas no Vercel (7 variáveis)
- [ ] ✅ Redeploy realizado no Vercel
- [ ] ✅ Aplicação testada (registro, login, funcionalidades)
- [ ] ✅ Dados verificados no Supabase

---

## 🆘 SOLUÇÃO DE PROBLEMAS

### Erro de Conexão
- Verifique se as URLs estão corretas
- Confirme se as keys não têm espaços extras
- Tente fazer redeploy no Vercel

### Erro de Autenticação
- Verifique o JWT_SECRET
- Confirme se o service_role key está correto
- Verifique as políticas RLS no Supabase

### Página em Branco
- Abra o console do navegador (F12)
- Verifique erros JavaScript
- Confirme se todas as variáveis VITE_ estão configuradas

---

**🎉 Após completar todos os passos, você terá o FisioFlow AI Studio rodando 100% em produção com Vercel Pro + Supabase Pro!**
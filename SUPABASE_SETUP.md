# 🗄️ Configuração do Supabase Pro - FisioFlow AI Studio

## ✅ **Status Atual**
- ✅ **Vercel**: Projeto criado e deployed com sucesso
- ✅ **URL Produção**: https://mocha-5nxxv1bgd-rafael-minattos-projects.vercel.app
- 🔄 **Supabase**: Aguardando configuração

## 🚀 **Passo a Passo - Supabase Setup**

### 1. **Criar Projeto Supabase Pro**
1. Acesse: https://supabase.com/dashboard
2. Clique "New project"
3. Escolha sua organização
4. Configure:
   - **Nome**: `fisioflow-ai-studio`
   - **Região**: Mais próxima do Brasil (ex: São Paulo)
   - **Plano**: Pro (se necessário)
   - **Senha do Database**: Escolha uma senha forte

### 2. **Executar Schema SQL**
1. No dashboard do Supabase, vá em **SQL Editor**
2. Copie e cole o conteúdo do arquivo `supabase/schema.sql`
3. Clique **RUN** para executar

### 3. **Dados de Exemplo (Opcional)**
1. Ainda no SQL Editor
2. Copie e cole o conteúdo do arquivo `supabase/seed.sql`
3. Clique **RUN** para executar

### 4. **Copiar Credenciais**
1. Vá em **Settings** > **API**
2. Copie:
   - **Project URL**
   - **anon public key**
   - **service_role key** (mantenha secreta!)

## 🔧 **Configurar Variáveis no Vercel**

Acesse: https://vercel.com/rafael-minattos-projects/mocha/settings/environment-variables

Adicione essas variáveis:

```env
SUPABASE_URL=https://SEU-PROJETO-ID.supabase.co
SUPABASE_ANON_KEY=sua-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui
VITE_SUPABASE_URL=https://SEU-PROJETO-ID.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
JWT_SECRET=um-jwt-secret-super-seguro-aqui
NODE_ENV=production
```

## 🔄 **Fazer Redeploy**

Após configurar as variáveis:
1. Vá no dashboard Vercel
2. Clique "Redeploy" no último deployment
3. Aguarde o build concluir

## 🧪 **Testar a Aplicação**

1. **Acesse**: https://mocha-5nxxv1bgd-rafael-minattos-projects.vercel.app
2. **Teste registro** de novo usuário
3. **Teste login** com o usuário criado
4. **Verifique** se os dados aparecem no Supabase

## 📋 **Schema Resumido**

O schema criará estas tabelas principais:
- `users` - Extensão dos usuários do Supabase Auth
- `patients` - Cadastro de pacientes
- `appointments` - Agendamentos
- `consultations` - Consultas médicas
- `exercises` - Biblioteca de exercícios
- `patient_exercises` - Prescrições de exercícios
- `inventory` - Controle de equipamentos
- `prescriptions` - Prescrições médicas
- `finance` - Controle financeiro
- `knowledge_base` - Base de conhecimento
- `tasks` - Sistema de tarefas

## 🔒 **Segurança RLS**

Todas as tabelas têm:
- ✅ Row Level Security ativado
- ✅ Políticas de acesso configuradas
- ✅ Triggers para timestamps automáticos

## 🎯 **URLs de Produção**

- **App**: https://mocha-5nxxv1bgd-rafael-minattos-projects.vercel.app
- **Vercel Dashboard**: https://vercel.com/rafael-minattos-projects/mocha
- **Supabase**: (será criado por você)

---

**⚡ Após configurar o Supabase, a aplicação estará 100% funcional em produção!**
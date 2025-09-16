# 🏥 FisioFlow AI Studio

Sistema completo de gestão para fisioterapeutas com IA integrada, desenvolvido com React + TypeScript e migrado para **Vercel Pro + Supabase Pro**.

## ✨ Características

- 📊 **Dashboard Completo** - Visão geral de pacientes, consultas e métricas
- 👥 **Gestão de Pacientes** - Cadastro completo com histórico médico
- 📅 **Agendamento Inteligente** - Sistema de consultas com calendário avançado
- 💪 **Biblioteca de Exercícios** - Catálogo extenso com instruções detalhadas
- 💊 **Prescrições** - Sistema de prescrição de medicamentos e exercícios
- 📈 **Relatórios e Analytics** - Análises detalhadas de progresso
- 💰 **Gestão Financeira** - Controle de receitas e despesas
- 📚 **Base de Conhecimento** - Artigos e recursos educacionais
- 🔒 **Autenticação Segura** - Sistema robusto com JWT e Supabase Auth

## 🚀 Tecnologias

- **Frontend**: React 19, TypeScript, Vite, TailwindCSS
- **Backend**: Vercel Serverless Functions, Node.js
- **Banco de Dados**: Supabase Pro (PostgreSQL)
- **Autenticação**: Supabase Auth + JWT
- **Deploy**: Vercel Pro
- **UI Components**: Radix UI, Lucide Icons
- **Animations**: Framer Motion

## 🛠️ Desenvolvimento Local

```bash
# Instalar dependências
npm install --legacy-peer-deps

# Configurar variáveis de ambiente
cp .env.example .env.local
# Preencher com suas credenciais do Supabase

# Rodar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build
```

## 📦 Deploy

Este projeto está configurado para deploy automático na **Vercel Pro** com integração **Supabase Pro**.

Consulte o arquivo `DEPLOY.md` para instruções completas de deploy.

## 📁 Estrutura do Projeto

```
src/
├── react-app/           # Frontend React
│   ├── components/      # Componentes reutilizáveis
│   ├── pages/          # Páginas da aplicação
│   ├── hooks/          # Hooks customizados
│   └── contexts/       # Context providers
├── lib/                # Utilitários e configurações
│   └── supabase.ts     # Cliente Supabase
api/                    # Vercel Serverless Functions
├── auth/              # Endpoints de autenticação
├── patients/          # Gestão de pacientes
└── exercises/         # Biblioteca de exercícios
supabase/              # Schema e configurações DB
├── schema.sql         # Schema completo do banco
└── seed.sql          # Dados de exemplo
```

## 🔒 Variáveis de Ambiente

```env
SUPABASE_URL=sua-url-do-supabase
SUPABASE_ANON_KEY=sua-chave-anonima
SUPABASE_SERVICE_ROLE_KEY=sua-chave-de-servico
JWT_SECRET=seu-jwt-secret
NODE_ENV=production
```

## 📄 Licença

Este projeto foi desenvolvido para demonstração e aprendizado.

---

**Desenvolvido com ❤️ para fisioterapeutas modernos**
## Contexto do Projeto Traço

- **Produto:** MicroSaaS de gestão para designers de brow
- **Estágio atual:** MVP-zero exclusivo para Alana Ferreira (sócia/expert)
- **Após validação com Alana:** evolui para SaaS público com billing
- **Stack:** Next.js 15 (App Router) + TypeScript strict + Supabase + Tailwind + shadcn/ui + Vercel
- **Idioma:** Toda interface, comentários e mensagens em pt-BR
- **Pasta do projeto:** /Users/christianpaulo/Documents/SAAS_ALANA/traco-app

## 4 Features-núcleo do MVP-zero

1. Cadastro de clientes (CRUD com perfil completo)
2. Ficha digital de anamnese com assinatura
3. Pasta de evolução com fotos e observações
4. Dashboard financeiro por procedimento + Timeline de retorno (painel)

## Convenções Inquebráveis

- RLS em TODA tabela do Supabase (mesmo no MVP-zero)
- Multi-tenancy via tenant_id desde o dia 1 (futuro-proof)
- Feature flags estruturadas (mesmo todas ligadas no MVP-zero)
- Métrica de "cliente ativa" = atendimento nos últimos 90 dias
- Conventional Commits (feat/fix/chore/refactor/test)
- Mobile-first (375px viewport)

## Armadilhas conhecidas

- Stripe NÃO faz recorrência PIX nativa — usar AbacatePay quando ligar billing
- Vercel Hobby viola ToS comercial — Pro obrigatório quando lançar
- pdf-lib não suporta canvas direto — converter para imagem primeiro
- Supabase Storage tem limite de 50MB por arquivo no plano free

## Fluxo AIOX no Traço

Toda feature deve passar por: @analyst → @architect → @sm → @dev → @qa
Não pular agentes. Não vibe coding direto no @dev.
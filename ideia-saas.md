# Traço: plano executivo para um MicroSaaS brow em 30 dias

**O mercado de brow designer no Brasil é grande, fragmentado e mal servido — existe espaço real para um MicroSaaS vertical com posicionamento técnico colado na autoridade da Alana.** São cerca de 1,3 milhão de MEIs de beleza no país (IBGE 2022), com estimativa de 150–300 mil designers focadas em sobrancelha, faturando em média R$2.000–5.000/mês e sofrendo com no-show, ficha em caderno e WhatsApp caótico. Os líderes de software (Trinks, Booksy, Belle, Fresha) são 100% horizontais e não entregam ficha de anamnese brow, mapeamento áureo ou protocolo técnico por procedimento — o único player nichado, BrowStudio, é pequeno e tecnicamente raso. Com a audiência da Alana (42,6 mil seguidores + 800+ alunas), um MVP Next.js + Supabase + AbacatePay entregue em 30 dias, uma oferta "Founders R$27 vitalício" para as primeiras 100 assinantes e R$1.000 de ads no Meta, o **cenário realista é 90 assinantes pagantes no mês 1 (MRR ~R$3.150) evoluindo para 380 assinantes e MRR ~R$23.500 no mês 12**. A tese central do relatório: o moat não está no código (copiável), está em Alana + comunidade técnica + ficha ANVISA-ready + preço agressivo. Este documento traduz essa tese em cronograma dia-a-dia, stack validada, contrato de sociedade, copy de ads e checklist de go-live.

> **Observação de validação:** a pesquisa pública em abril/2026 encontrou ~32k seguidores em @alanaferreirabrows, enquanto o briefing indica 42,6k. Vale reconferir com a Alana se há segunda conta, perda recente ou dado desatualizado. As projeções usam a faixa 32–42k como range.

---

## 1. O mercado de brow design no Brasil em números

O Brasil é o **3º–4º maior mercado mundial de beleza** (divergência entre SEBRAE e ABIHPEC/Euromonitor), com volume estimado de R$130–140 bilhões em 2024 e **CAGR de 7,2% projetado até 2027**. Dentro desse universo, o segmento de estética cresceu 587% de 2018 a 2022, e **design de sobrancelhas aparece como o 2º serviço mais consumido** no setor, atrás apenas de depilação. Não existe recorte público isolado para "mercado de sobrancelhas", mas uma estimativa construída por proxies (CNPJs × ticket médio × recorrência) aponta para **R$8–12 bilhões/ano em serviços de brow** — o suficiente para sustentar múltiplos players verticais.

O universo de profissionais é massivo e crescendo rápido: **1,3 milhão de MEIs no CNAE 9602** (beleza), sendo 282 mil especificamente em "outros serviços de cuidados com beleza" (onde brow designers geralmente se enquadram). Em 2024 abriram-se ~700 novos negócios de beleza por dia. A concentração é Sudeste-pesada — **27,4% em São Paulo, 11% em Minas Gerais e 11% no Rio**, o que casa bem com a base da Alana em Contagem/MG. Perfil típico: mulher, 30–45 anos, ensino médio, autônoma ou MEI.

No bolso, uma autônoma estabelecida fatura **R$2.000–5.000/mês**, atendendo 88–132 clientes/mês (4–6 por dia em 22 dias úteis). Brow lamination, o foco da Alana, tem ticket de **R$140–300** no Brasil (média R$150–200), com recorrência de 45–60 dias. Design simples + henna roda em R$60–130 a cada 15–30 dias. Isso importa para pricing: nosso SaaS a R$47/mês consome **menos de 1% do faturamento** da profissional — vendável.

| Serviço | Ticket médio BR | Recorrência |
|---|---|---|
| Design simples + pinça | R$40–80 | 15–20 dias |
| Design com henna | R$60–130 | 15–30 dias |
| **Brow lamination** | **R$140–300** | **45–60 dias** |
| Microblading / nanoblading | R$800–2.500 | 12–18 meses (+retoque 30d) |

### Como elas gerenciam hoje (a dor que compra o produto)

Inferência robusta cruzando dados da Trinks (líder declarado com ~40 mil negócios ativos) contra o universo de 1 milhão+ de MEIs ativos aponta que **apenas 20–30% dos profissionais autônomos de beleza usam software dedicado** — o restante opera em WhatsApp pessoal + caderno físico. As dores mais repetidas em blogs do setor, Capterra e artigos do SEBRAE são, em ordem: **no-show (15–30% de falta estimada em salões sem confirmação automática)**, agenda duplicada, falta de controle financeiro, ficha de cliente perdida e, desde 2023, a obrigação de NFS-e nacional que confunde MEIs. A tendência brow lamination está madura (não em pico pós-pandemia), e existe forte profissionalização do nicho — SENAC, cursos online de R$47 a R$997, Beauty Fair passando de R$1 bi em negócios em 2024. O mercado está pronto para ferramenta vertical.

---

## 2. O campo de batalha competitivo e onde está o buraco

O mapa competitivo mostra um cenário clássico de **generalistas grandes + um nichado pequeno e fraco** — desenho perfeito para um novo entrante técnico:

| Software | Preço inicial | Público | Trial | Tem algo para brow? | Reclame Aqui | Principal fraqueza |
|---|---|---|---|---|---|---|
| **Trinks** (Grupo Stone) | R$76–110/mês (1–2 prof) | Salões pequenos→redes | 5 dias | Não — genérico | 8,9 "Ótimo" | Multa de 50% no cancelamento; adicionais pagos (WhatsApp, fidelidade) |
| **Booksy** (EUA) | R$99/mês + R$20/prof | Salões+barbearia | 14 dias | Não | 6,9 "Regular" | Bloqueios sem aviso; cobrança em dólar |
| **Fresha** | "Grátis" + taxas | Global | Freemium | Não | — | 20% sobre clientes novos; taxas ocultas |
| **Belle Software** | R$80–150 est. | Clínicas estética | Sim | **Menciona sobrancelha/micro** | Reviews péssimos | App instável; "idade da pedra" em UX |
| **Simples Agenda** | R$39,90 (1 prof) | Autônomas | 35 dias | Copy nichado "designer de sobrancelha" | Baixo volume | Produto genérico por trás |
| **Gendo** | R$86,90–266,90 | Salões | 7 dias | Genérico | Positivos Capterra | Cobra por profissional |
| **Avec** (Stone/Hyperlocal) | R$279,90+ | Médios/grandes | Sim | Não | Mistos | Caro; features cobradas à parte |
| **BrowStudio** | Não publica | 100% brow/cílios | 14 dias | **Sim — único nichado** | — | Pequeno, sem fichas técnicas profundas |

**O grande insight** é que o único jogador 100% vertical em brow (BrowStudio) é subcapitalizado e tecnicamente raso: reduz ao básico (agenda + cadastro) sem entregar o que um brow designer realmente quer — ficha ANVISA, mapeamento de proporção áurea, protocolo por tipo de procedimento, timeline de retorno cíclica. Belle é o único grande que **menciona sobrancelha e micropigmentação no marketing**, mas os reviews do app nas lojas oficiais são catastróficos ("não abre", "some com atendimentos", "idade da pedra"). Trinks domina mas é odiado no cancelamento. Esse é o buraco.

### Onde diferenciar concretamente

Nenhum concorrente entrega **ficha de anamnese brow pronta de fábrica** — os campos críticos (uso de isotretinoína, alergia a henna/pigmento, fototipo, termo de responsabilidade ANVISA, autorização de imagem) existem em blocos físicos vendidos por fornecedoras (VP Design, FuturaIM, Italash cobram R$15–30 por bloco de papel), mas **nunca foram digitalizados integrados à agenda**. Adicione a isso protocolo técnico por procedimento (cada técnica tem tempo, contraindicação e cuidado diferente), mapeamento visual de proporção áurea (só existe em apps isolados americanos, sem gestão acoplada), timeline cíclica que sugere retorno automático por tipo de serviço, e link de agendamento Instagram-first com sinal PIX antecipado — e você tem um produto que os generalistas não conseguem replicar sem sacrificar a horizontalidade que os mantém vivos vendendo para manicures, cabeleireiros e barbearias ao mesmo tempo.

O benchmark de preço mostra três faixas claras: **baixa até R$50** (Simples Agenda R$39,90 é o piso), **média R$50–150** (Trinks, Booksy, Belle, Gendo Essencial) e **alta R$150+** (Avec, Gendo Profissional). O sweet spot para atacar é **R$47 solo / R$97 studio** — 20–40% abaixo da Trinks mas com features verticais que justificam a preferência, e acima do piso Simples Agenda para não canibalizar margem.

---

## 3. Stack técnica validada e 30 dias de roadmap

A stack inicial proposta (Next.js + Supabase + Stripe + Tailwind + Vercel) está **quase correta**, com duas substituições críticas para o Brasil: troque Stripe por **AbacatePay** (primário) com **Asaas** como fallback, e adicione **Cloudflare R2** para galeria de fotos depois dos primeiros 5GB. Stripe não faz recorrência em PIX nativamente — furada em país onde 10–15% dos SMBs não têm cartão de crédito ativo. AbacatePay cobra R$0,80 fixo por transação PIX (menor taxa do mercado), tem subscription API nativa e DX "nível Stripe" segundo indie hackers BR; Asaas é mais maduro e serve de plano B caso AbacatePay (fundada em 2024) apresente algum problema de escala.

**Stack final recomendada:** Next.js 15 App Router + TypeScript strict + Supabase (Postgres + Auth + Storage + RLS) + shadcn/ui + Tailwind + Vercel Pro (obrigatório para uso comercial — Hobby viola ToS) + AbacatePay + Evolution API self-hosted para WhatsApp + Resend para email + PostHog free + Sentry. Para WhatsApp no MVP, **Evolution API rodando em VPS Hetzner CX11 (~R$30–40/mês, volume ilimitado)** bate qualquer alternativa oficial em custo — o trade-off é que não é oficial Meta e existe risco de ban; mitigue usando número dedicado novo, aquecendo 3–5 dias antes e respeitando rate limit de 1 msg/segundo. Migre para WhatsApp Cloud API oficial quando passar de ~300 usuários pagantes.

### Cronograma de 30 dias com entregáveis atômicos

**Semana 1 — Fundação:** setup Next.js + shadcn + Supabase projeto na região sa-east-1, CLAUDE.md e subagents (.claude/agents/planner.md, migration-writer.md, qa-reviewer.md), schema inicial com RLS em toda tabela (`profiles`, `clients`, `appointments`, `anamnesis_templates`, `anamnesis_forms`, `photos`, `protocols`, `subscriptions`), auth magic link + senha, middleware protegendo /dashboard, layout base, CI/CD Vercel com preview por PR, seed script com dados fake pt-BR.

**Semana 2 — Core:** CRUD clientes com data-table shadcn, página de detalhe com tabs (dados/histórico/anamneses/fotos/protocolo), calendário react-big-calendar com drag-drop, regra de disponibilidade do designer (`designer_availability` com dia-da-semana × horário × duração), **link público `/agendar/[slug]` sem auth** protegido com Cloudflare Turnstile, builder de template de anamnese com @dnd-kit, preenchimento via token JWT assinado expirando em 7 dias.

**Semana 3 — Diferenciais + billing:** upload de fotos com compressão client-side (`browser-image-compression`, 1600px JPEG 0.8) e bucket privado com signed URLs, componente antes/depois usando `react-compare-slider`, protocolo estruturado (tipo de pele, alergias, mapping favorito, cor henna, Tiptap para observações, auto-save), integração AbacatePay com webhook HMAC-verificado, paywall pós-trial de 7 dias, cron Supabase `pg_cron` rodando de hora em hora para disparar lembretes WhatsApp 24h antes + confirmação imediata pós-booking, **beta fechado com a Alana no fim da semana**.

**Semana 4 — GTM:** landing page pública (hero + problema + solução + autoridade Alana + Founders + FAQ + CTA), polimento mobile 375px, onboarding stepper (completar perfil → criar template → 1º cliente → agendar → compartilhar link), PostHog com eventos-chave (signup, first_client_created, public_link_shared, subscription_started, churn), Sentry produção, **beta com 5–10 alunas da Alana ao vivo em call**, correção dos 10 bugs top, lançamento oficial no Dia 30.

### Custo operacional mensal por escala

A economia do produto é excelente: margem bruta acima de 90% a partir de 100 clientes, com a maior diluição vindo de suporte humano (não de infra).

| Usuários pagantes | MRR (R$79 médio) | Custo infra | Margem bruta |
|---|---|---|---|
| 10 | R$790 | R$290 | 63% |
| 100 | R$7.900 | R$753 | 90% |
| 500 | R$39.500 | R$2.465 | 94% |
| 1.000 | R$79.000 | R$6.460 | 92% |

### Claude Code eficiente — as regras que importam

O diferencial do desenvolvimento AI-assisted não está em "pedir código" mas em **estruturar o contexto**. Use um `CLAUDE.md` curto como router (princípios, comandos, convenções, armadilhas conhecidas) referenciando docs externas via `@arquivo.ts` em vez de colar tudo. Crie subagents especialistas (`planner`, `migration-writer` que sempre gera RLS junto, `qa-reviewer` que roda typecheck + lint + build antes de qualquer commit). Use `/plan` antes de qualquer feature maior que 1 hora — revise o plano, ajuste, depois peça execução. Para MCP servers, três são obrigatórios: **Supabase MCP com `read_only=true`** (Claude lê schema e gera types), **Context7 MCP** (docs atualizados das libs, mata alucinação de API), **Playwright MCP** (E2E e navegação visual). Paralelize com git worktrees (`claude --worktree billing`, `claude --worktree gallery`), mas 2–3 simultâneos é o sweet spot — o limite real é sua banda de review. E resista à tentação de over-engineering: Claude vai criar `BaseRepository` e abstrações prematuras se você deixar; o prompt vencedor é **"simples primeiro, YAGNI"**.

---

## 4. Pricing e oferta de lançamento Founders

A recomendação é **dois planos, sem freemium, com trial de 7 dias sem cartão**. Freemium destrói LTV em SaaS nichado (as alunas top da Alana ficam de graça para sempre); 14 dias de trial é longo demais (esquecem); exigir cartão no trial derruba ativação em ~60% no perfil de microempreendedor brasileiro.

| | **Solo R$47/mês** | **Studio R$97/mês** |
|---|---|---|
| Profissionais | 1 | Até 5 |
| Agendamento online + link público | ✓ | ✓ |
| Ficha de anamnese brow | ✓ | ✓ |
| Galeria antes/depois | 50 fotos/mês | Ilimitado |
| Protocolos técnicos | Básicos | Customizáveis |
| WhatsApp lembretes | 100/mês | Ilimitado |
| Multi-profissional + comissões | — | ✓ |
| Anual com 25% off | R$423/ano | R$873/ano |

A **oferta de lançamento é o eixo emocional da campanha**: as primeiras 100 assinantes vindas da waitlist entram como **"Founders Master Brow" por R$27/mês vitalício — preço trava para sempre**, mesmo quando subirmos para R$67 ou R$97. Após 100 vagas, abre **Early Bird a R$37/mês por 12 meses** para as próximas 100, depois volta para o preço cheio. Essa estrutura escalonada cria FOMO real (não artificial), recompensa quem confia primeiro, e gera social proof (os Founders viram marketeiros gratuitos da marca). Alunas Master Brow validadas contra a lista de CPF/email da Alana ganham um mês grátis adicional — diferenciação interna que cria pertencimento à "família Master Brow" dentro dos Founders.

---

## 5. Lançamento dia a dia com a Alana

O lançamento é um funil de 30 dias dividido em quatro fases claras: semeadura (dias 1–10), intensificação (dias 11–17), semana de conversão (dias 18–24) e fechamento Founders (dias 25–30). A landing de waitlist deve subir **no Framer em 2 horas** (alternativa Next.js se quiser já usar o stack do produto) com hero ("O sistema que a Alana usa pra organizar o studio dela — feito pra designers de brow como você"), três dores visuais, três prints mockados, autoridade Alana com foto + números, oferta Founders como CTA principal e formulário curto (nome, email, WhatsApp, "é aluna Master Brow?").

### Calendário de conteúdo orgânico

Produza os reels em **um dia de shooting com a Alana** (rende duas semanas de posts). Os formatos que convertem no nicho: **reels de dor** ("se você é designer de brow e ainda usa caderninho, tá perdendo R$800/mês") com hook nos primeiros 1,5s e CTA "link na bio", **stories de bastidor diários** com enquetes ("papel ou digital?", "quanto tempo/dia em WhatsApp?"), **reels técnicos de autoridade** conectando problema técnico à necessidade digital ("os 3 protocolos que salvam um brow lamination que deu errado") e **conteúdo de antecipação** com contagem regressiva e prints borrados do produto.

O Dia 22 (lançamento) segue cronograma hora a hora: post feed às 7h, email blast para waitlist às 9h, **live de 60 minutos no IG às 14h** com você aparecendo junto como co-founder (humaniza), depoimento de beta tester às 16h, stories contador de vagas a cada 3h, post carrossel final às 22h agradecendo. Três depoimentos em vídeo gravados previamente com os 5 beta testers caem ao longo do dia para puxar social proof.

### R$1.000 de Meta Ads distribuídos com cirurgia

Nicho beauty BR 2025–2026 tem CPC de R$0,80–2,50 e CPL de R$3–15. Com R$1.000, a distribuição que maximiza conversão é **35% para tráfego waitlist** (dias 8–21, ~R$27/dia), **35% para conversão checkout** (dias 22–30, ~R$39/dia), **20% retargeting** (quem visitou e não converteu) e **10% boost dos dois Reels orgânicos top-performers**. Zero em Google Ads (demanda ainda não existe) e zero em YouTube; TikTok pode receber R$100 de teste com os criativos vencedores. WhatsApp blast da Alana para as 800 alunas é custo zero e alto impacto.

Os públicos críticos são **lookalike 1% dos seguidores da Alana** (conectar o IG dela à Business Manager antes), **lookalike 1% da lista CSV das 800 alunas Master Brow** e **interesses AND combinados** (sobrancelha + brow lamination + henna, mulheres 22–45, BR com ênfase em MG/SP/RJ/PR/RS). O A/B test roda em três fases: dor vs autoridade primeiro (dias 8–14), vencedor vs carrossel estático (dias 15–21), depoimento + escassez final (dias 22–30).

**Copy vencedora para o Criativo 1 (Reel UGC 15s):** *"Se você ainda usa caderno pra gestão do seu studio de brow, você tá perdendo cliente. Fiz um sistema com um sócio dev pra resolver isso de vez. Lista VIP — 100 vagas — link nos comentários."* Hook nos 1,5s, problema-solução em 10s, CTA direto.

---

## 6. Projeções financeiras realistas

As projeções partem da audiência acessível (42,6k seguidores + 800 alunas), alcance orgânico efetivo de 30–40% nos posts de lançamento, waitlist esperado de 500–1.500 (1–3% dos seguidores + 15–30% das alunas), e benchmarks de conversão de SaaS nichado com micro-expert BR (1,5–5% de clique-a-pagante no funil completo; 8–18% de alunas diretas da expert). Churn de 5–7% mensal é a mediana para SaaS B2B SMB brasileiro (fontes: Metrikia 2024, Optifai).

| Cenário | Mês 1 assinantes / MRR | Mês 6 / MRR | Mês 12 / MRR / ARR |
|---|---|---|---|
| **Conservador** | 60 / R$1.920 | 110 / R$4.620 | 180 / R$8.640 / **R$104k** |
| **Realista (alvo)** | 90 / R$3.150 | 240 / R$12.480 | 380 / R$23.560 / **R$283k** |
| **Otimista** | 130 / R$4.940 | 380 / R$23.560 | 620 / R$45.880 / **R$550k** |

A economia unitária no cenário realista é excelente: **LTV de R$1.240 contra CAC orgânico de R$11 no mês 1** (R$1.000 ÷ 90) e CAC pago pós-lançamento de R$70–100 — razão LTV/CAC de 12–17×, payback menor que 2 meses. Custos operacionais crescem de R$1.030 no mês 1 para R$8.000 no mês 12 (incluindo primeira VA de suporte a partir do mês 4 e ads contínuos de R$3k/mês), mantendo margem bruta estável em ~66%.

### Divisão de receita que protege os dois sócios

A recomendação com mais rigor é **60/40 a favor do dev no Ano 1, migrando para 50/50 após o gatilho de payback** (receita bruta acumulada ultrapassar R$50.000, o que no realista acontece por volta do mês 8–10). A justificativa: você banca CAPEX de ~R$15–25k em dev (mercado de 30 dias AI-assisted) + risco técnico + operação 24/7 no primeiro ano; Alana banca audiência que levou 5+ anos para construir + autoridade + face do produto. Depois do payback, o ativo real é a base recorrente e a retenção — aí 50/50 reflete o valor da marca/autoridade que sustenta o churn baixo.

Seis cláusulas do contrato de sócios são não-negociáveis: **(1)** papéis claros (você CTO/COO com decisão final em produto; Alana CMO com decisão final em marca; estratégia em consenso), **(2)** vesting recíproco de 4 anos com cliff de 1 ano — quem sai antes de 12 meses perde a participação, **(3)** non-compete de 24 meses pós-saída específico para "software de gestão brow BR", **(4)** cláusula de conteúdo mínimo da Alana (4 posts/mês orgânicos sobre o produto no Ano 1), **(5)** PJs separadas com SLU ou LTDA formalizada e contador (~R$1.500 abertura + R$300/mês Simples Nacional), **(6)** propriedade intelectual da empresa, não pessoal. Não faça informal — é a causa número um de conflito de sócios que destrói MicroSaaS.

---

## 7. Os riscos de verdade e como mitigar

Sete riscos merecem atenção ativa, ranqueados por produto de probabilidade × impacto:

O **risco #1 é dependência exclusiva da Alana para aquisição** (probabilidade alta, impacto crítico). Mitigação: a partir do mês 2, diversifique — SEO com blog "guia definitivo de brow lamination" (intenção de busca crescente), parcerias com 3–5 micro-influenciadoras brow (R$500–1.500 cada como seeding), programa de indicação (indique e ganhe 1 mês grátis), e a partir do mês 6 orgânico-Alana não deve ser mais que 50% da aquisição. O **risco #2 é churn alto** se o produto não retiver — mitigação é onboarding guiado obrigatório, check-in via WhatsApp nos dias 3, 14 e 30, pesquisa obrigatória no cancelamento, e comunidade Founders ativa criando switching cost social. Plano B: pivotar para oferta "lifetime" de R$497–997 à vista se a recorrência não segurar.

O **risco #3 é conflito com a sócia** — mitigação via contrato robusto (ver seção 6) e separação estrita de domínios de decisão. O **risco #4 é compliance LGPD**, particularmente crítico porque dados de anamnese são **dados sensíveis de saúde** pela LGPD — contratar advogado para termos de uso e política de privacidade (~R$800–2k), criptografar at-rest, e incluir cláusula específica sobre autorização de uso de fotos antes/depois da cliente da brow designer. Os riscos #5–7 (bugs no lançamento, CPL alto nos ads, concorrente copiando) são operacionais e se resolvem com beta fechado de 7 dias + feature flags + dois gateways de pagamento configurados (AbacatePay primário, Asaas failover). Concorrente copiar é fato — o moat é comunidade e protocolos exclusivos coproduzidos com a Alana, não código.

---

## 8. Nome, ação de segunda-feira e checklist go-live

Entre os sete nomes avaliados (Sobra, Pincel, Traço, Fioo, Cliia, Studioo, Browly), **a recomendação top é "Traço"** pelo alinhamento direto com o posicionamento técnico da Alana ("anti-achismo", traço como técnica/precisão) e pela escalabilidade para outras verticais de beleza sem renomear. Segunda opção: **"Pincel"** (mais quente e amigável, também escala). Evite "Browly/Brow.ly" porque trava a expansão para cílios e unhas no mês 12+. Teste Traço vs Pincel em enquete com 20 alunas Master Brow antes de fechar, e registre os três finalistas (Traço, Pincel, Sobra) em registro.br + Instagram handle na segunda (R$40/ano cada, ~R$120 total, barato seguro). INPI pode esperar 90% de certeza (R$355/classe).

### A segunda-feira concreta

A ordem de ataque dos primeiros cinco dias é: **segunda AM** reunião de 2h com Alana (fechar modelo societário 60/40→50/50, escolher nome, definir data do Dia 22); **segunda PM** registrar domínios + abrir CNPJ via contador online (~R$500) + conta PJ (Nubank/Inter PJ) + criar repo GitHub privado + `npx create-next-app` com Tailwind + shadcn init. **Terça** landing Framer no ar com pixel Meta + GA4 + copy da waitlist + email #1 sequência. **Quarta** dia de shooting com Alana (6 Reels + fotos de autoridade) + escrever os outros 6 emails + subir CLAUDE.md e subagents. **Quinta** primeiro Reel publicado + iniciar Semana 1 do dev (auth + schema + RLS) + subir primeira campanha de ads (R$27/dia para waitlist). **Sexta** Meta Business totalmente configurado + meta de 100 signups no fim de semana.

### Três red flags que obrigam pausar

Se **waitlist após 10 dias < 150 signups**, algo quebrou no criativo ou na landing — revisar antes de seguir queimando verba. Se **CPL de ads > R$15**, pausar imediatamente, trocar criativo e refinar público. Se **beta fechado NPS < 30**, adiar lançamento em 7 dias e arrumar o produto — lançar com produto ruim gera churn irrecuperável nos primeiros 60 dias.

### Checklist de go-live (o que precisa estar verde no Dia 21)

**Técnico:** auth funcionando, agendamento completo com link público, ficha anamnese brow + customizável, histórico com timeline, galeria com compressão, 5 protocolos pré-carregados validados pela Alana, lembretes WhatsApp via Evolution API, dashboard financeiro básico, mobile responsivo em 375px, SSL, backups diários. **Pagamento:** AbacatePay configurado com webhook HMAC, Asaas de fallback, trial 7 dias sem cartão, cobrança automática D8, retry automático em falha, página de gestão de assinatura. **Legal:** CNPJ aberto, contrato de sócios assinado, Termos + Política LGPD redigidos por advogado, consentimento explícito para anamnese, cláusula de fotos antes/depois. **Marketing:** pixel testado, 5 criativos prontos, 7 emails programados, WhatsApp Business com 800 alunas segmentadas, 10 posts agendados. **Beta:** 5 alunas usando 7 dias reais, 3 depoimentos em vídeo editados, 10 bugs críticos fechados, NPS beta ≥ 40.

---

## Conclusão: o jogo real é comunidade + velocidade, não código

A pesquisa revela algo que vai além de "existe oportunidade" — revela que **a oportunidade é estruturalmente protegida** se executada com a Alana. Os generalistas (Trinks, Booksy, Belle) não vão verticalizar porque sacrificariam horizontalidade que os mantém lucrativos em dez nichos; o único nichado (BrowStudio) não tem capital nem autoridade para construir profundidade técnica. A combinação **autoridade expert + 800 alunas como base inicial + ficha ANVISA ready + preço Founders vitalício + produto entregue em 30 dias via Claude Code** é um encaixe raro em MicroSaaS BR. O maior risco não é mercado nem tecnologia — é **execução do contrato de sociedade** (por isso a ênfase na seção 6) e **dependência exclusiva da Alana para aquisição após o mês 3** (por isso a urgência de SEO e micro-influenciadoras a partir do mês 2).

Duas convicções finais. **Primeira:** preço é arma — R$27 vitalício nas primeiras 100 assinantes não é "barato demais", é o melhor investimento de marketing que existe, porque essas 100 viram caso, depoimento e comunidade que sustenta CAC orgânico pelos próximos 24 meses. **Segunda:** o produto do mês 1 não precisa ser bonito, precisa ser **técnico e correto** — ficha de anamnese com os 20 campos certos (não 50) vale mais que dashboard animado; protocolo por procedimento com tempo e contraindicação vale mais que chat integrado. A Alana não vende porque o app é bonito; vende porque você resolveu um problema que ela diz em cada aula que é sério. Se o Dia 30 entregar isso, o cenário realista (MRR R$3.150 no mês 1, R$23.560 no mês 12, ARR R$283k) é conservador — o otimista vira factível.

**Bora executar.**
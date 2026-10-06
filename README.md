# ⚡ ENXAME MULTI-AGENTE: HARNESS DE ELITE (KIMI CODE CLI + OPENCODE GO)

> **O ecossistema definitivo para dominação digital**: O melhor criador de sites e landing pages de conversão, o estrategista supremo de marketing ($100M Offers de Alex Hormozi) e o social media mestre com modelagem 360° de Instagram e fabricação de imagens cinematográficas (Midjourney v6.1 & Flux.1).

---

## 🏛️ ARQUITETURA DO ENXAME

Este harness foi concebido sob a nova arquitetura do **Kimi Code CLI** integrado aos modelos do **OpenCode Go**, operando com o **Maestro LongCat** (raciocínio nativo com Thinking Tokens e custo zero) liderando uma rede paralela de especialistas ultra-econômicos:

```
agente-enxame-harness/
├── AGENTS.md                  # A Constituição e Protocolo Mestre do Enxame
├── config.example.toml        # Template de configuração do Kimi Code CLI
├── opencode.example.json      # Template de configuração para OpenCode CLI
├── .env.example               # Template de variáveis de ambiente
├── swarm.js                   # Motor de despacho em paralelo do enxame
├── swarm-cli.js               # Terminal interativo do Enxame (REPL)
├── swarm.bat                  # Inicializador em 1 clique do prompt interativo
├── server.js                  # Servidor local de suporte e API
├── studio.html / studio.bat   # Plataforma Web com preview ao vivo (localhost:3000)
├── skills/                    # Conhecimento especializado e manuais práticos
│   ├── web-crafting/          # Bento Grid, Tailwind CSS, JS de FAQ, SEO e Acessibilidade
│   ├── instagram-modeling/    # Engenharia reversa, Bios, 10 Lâminas, Reels e Stories 24h
│   ├── growth-marketing/      # $100M Offers de Alex Hormozi, Stack de Bônus e Neuromarketing
│   └── prompt-art-engine/     # Matriz de 7 elementos, Midjourney v6.1, Flux.1 e Mockups 3D
├── templates/                 # Blueprints prontos para produção
│   ├── landing-page-elite.html# Boilerplate de Landing Page com Tailwind CDN
│   ├── instagram-profile-dossier.md # Dossiê de modelagem de conta e concorrência
│   ├── carousel-10-slides.md  # Estrutura perfeita para carrosséis de alta retenção
│   ├── stories-24h-funnel.md  # Sequência diária de Stories para vendas na DM
│   └── image-prompt-generator.md # Gerador de prompts e capas de destaques
├── web/                       # Landing pages e códigos gerados
├── marketing/                 # Estratégias, ICPs e ofertas geradas
├── instagram/                 # Dossiês, carrosséis e roteiros gerados
└── prompts/                   # Prompts fotorealistas gerados
```

---

## 🤖 MAPA DO ENXAME & MODELOS (OPENCODE GO)

| Agente Especialista | Modelo Alocado | Custo / Limite Mensal | Missão no Enxame |
| :--- | :--- | :--- | :--- |
| **`@maestro`** | `longcat-2.5-preview-free` | **$0.00 · ILIMITADO** | **Orquestrador Supremo**: Raciocínio analítico nativo (Thinking Tokens), 128k context. Decompõe qualquer briefing e delega 4 cadernos de comando táticos com custo zero. |
| **`@web-architect`** | `deepseek-v4-flash` | $0.15/1M · Limite $120 | **Arquiteto Frontend**: Gera landing pages completas em HTML5 + Tailwind CSS + Bento Grid sem nenhum placeholder. |
| **`@marketing-strategist`** | `glm-5.3-flash` | $0.15/1M · Limite $180 | **Estrategista-Chefe**: Desenvolve ofertas Grand Slam ($100M Offers de Alex Hormozi), stack de bônus e garantias reversas. |
| **`@instagram-architect`** | `minimax-m3` | $0.30/1M · Limite $180 | **Modelador de Instagram**: Engenharia reversa, bio hipnótica, os 5 destaques, carrossel de 10 lâminas e stories 24h. |
| **`@prompt-artisan`** | `qwen3.8-flash` | $0.15/1M · Limite $90 | **Diretor de Arte Sintética**: Fabrica prompts cinematográficos para Midjourney v6.1 e Flux.1 com parâmetros de câmeras e iluminação real. |
| **`@qa-critic`** | `longcat-2.5-preview-free` | **$0.00 · ILIMITADO** | **Auditor Implacável**: Valida conformidade técnica, ausência de placeholders e checklist de conversão. |

---

## ⚡ COMO USAR O ENXAME

### 1. Clonar o Repositório e Configurar Chaves
```bash
git clone https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
cd SEU_REPOSITORIO
```

Copie os arquivos de exemplo para os nomes reais:
```bash
cp .env.example .env
cp config.example.toml config.toml
cp opencode.example.json opencode.json
```

Insira sua chave do OpenCode Go (`oc_sk_...`) no arquivo `.env` e no `config.toml`.

---

### 2. Formas de Execução

#### Opção A: Prompt Interativo do Enxame (Recomendado)
Execute no terminal:
```bash
.\swarm.bat
```
Comandos rápidos disponíveis:
- `/help`: Exibe todos os comandos.
- `/free`: Comuta 100% da rede para o modelo gratuito ilimitado (`longcat-2.5-preview-free`).
- `/flash`: Retorna para a rede de alta velocidade Flash (DeepSeek + GLM + MiniMax + Qwen).
- `/ask <pergunta>`: Pergunta rápida direta ao Maestro sem gastar enxame.
- `<qualquer briefing>`: Dispara o enxame quádruplo paralelo instantaneamente!

#### Opção B: Disparo Direto via Linha de Comando
```bash
node swarm.js "Criar landing page e modelar Instagram para clinica de estetica de luxo"
```

#### Opção C: Kimi Code CLI Nativo
```bash
kimi
```
O Kimi CLI iniciará com o Maestro LongCat ativo, lendo automaticamente o [AGENTS.md](AGENTS.md) e o diretório `skills/`.

---

## 🎯 PROTOCOLO DE PROMPT CACHE (98% DE DESCONTO)

O ecossistema utiliza o cabeçalho persistente `x-opencode-session: "swarm-persistent-cache"`. 
- Isso ativa o reaproveitamento de KV cache nas GPUs da OpenCode Go.
- O custo de entrada dos prompts de sistema e regras cai de **$0.15** para **$0.003 por 1M tokens** (98% de economia).
- Permite rodar centenas de automações por dia ao longo do mês inteiro mantendo a cota segura.

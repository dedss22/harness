// ==============================================================================
// SWARM NETWORK CLI ENGINE - DUAL-CORE ORCHESTRATION (LONGCAT + DEEPSEEK CO-PILOT)
// ==============================================================================
// Arquitetura de Elite com Prevenção de Loops Infinitos (One-Shot FSM)
// e Mitigação Ativa de Latência (Fast-Path Adaptativo + 800 tokens max + Cache Hit)
// ==============================================================================
const https = require('https');
const fs = require('fs');
const path = require('path');

let rawArgs = process.argv.slice(2);
let isFastMode = false;
let isDeepMode = false;

if (rawArgs.includes('--fast')) {
  isFastMode = true;
  rawArgs = rawArgs.filter(a => a !== '--fast');
}
if (rawArgs.includes('--deep')) {
  isDeepMode = true;
  rawArgs = rawArgs.filter(a => a !== '--deep');
}

const userPrompt = rawArgs.join(' ').trim();

if (rawArgs.includes('--help') || rawArgs.includes('-h') || !userPrompt) {
  console.log(`\n\x1b[33mUSO DO ENXAME:\x1b[0m node swarm.js [--fast | --deep] "<sua missao aqui>"`);
  console.log(`  --fast : Modo ultrarrápido (ignora auditoria DeepSeek para latência zero)`);
  console.log(`  --deep : Força auditoria profunda do DeepSeek Co-Pilot mesmo em comandos curtos`);
  console.log(`Exemplo: node swarm.js "Criar landing page e modelar Instagram para clinica de estetica"\n`);
  process.exit(!userPrompt ? 1 : 0);
}

// Ler API Key de process.env ou do arquivo .env local
let apiKey = process.env.OPENCODE_API_KEY || "";
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const match = envContent.match(/OPENCODE_API_KEY=(.*)/);
  if (match) apiKey = match[1].trim();
}

if (!apiKey) {
  console.log(`\n\x1b[31m[ERRO DE CONFIGURAÇÃO]\x1b[0m OPENCODE_API_KEY não encontrada.`);
  console.log(`Configure seu arquivo .env ou a variável de ambiente OPENCODE_API_KEY.\n`);
  process.exit(1);
}

function requestModel(model, systemPrompt, userMessage, maxTokens = 4096, temperature = 0.4) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      temperature: temperature,
      max_tokens: maxTokens
    });

    const options = {
      hostname: "opencode.ai",
      port: 443,
      path: "/zen/go/v1/chat/completions",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "x-opencode-session": "swarm-persistent-cache", // Ativa o cache de prompt de 98% de desconto
        "User-Agent": "kimi-code/2.1.1",
        "Content-Length": Buffer.byteLength(postData)
      },
      timeout: 180000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300 && json.choices && json.choices[0]) {
            const msg = json.choices[0].message;
            const text = msg.content || msg.reasoning || msg.reasoning_content || "";
            resolve(text);
          } else {
            const errMsg = json.error ? (json.error.message || JSON.stringify(json.error)) : data;
            reject(new Error(`Erro ${res.statusCode} no modelo ${model}: ${errMsg}`));
          }
        } catch (e) {
          reject(new Error(`Parse error em ${model}: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Timeout no modelo ${model}`));
    });

    req.write(postData);
    req.end();
  });
}

const delay = ms => new Promise(r => setTimeout(r, ms));

async function requestModelWithRetry(model, systemPrompt, userMessage, retries = 2, maxTokens = 4096, temperature = 0.4) {
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      return await requestModel(model, systemPrompt, userMessage, maxTokens, temperature);
    } catch (err) {
      const isTransient = err.message.includes('Parse error') || err.message.includes('500') || err.message.includes('502') || err.message.includes('503') || err.message.includes('Timeout') || err.message.includes('Unknown Error');
      if (isTransient && attempt <= retries) {
        console.log(`  \x1b[90m[Tentativa ${attempt} falhou em ${model}: ${err.message}. Retentando em 1.5s...]\x1b[0m`);
        await delay(1500);
        continue;
      }
      throw err;
    }
  }
}

let redirectDecisionPromise = null;
let redirectApproved = null;

function askUserRedirect(failedModel) {
  if (redirectApproved !== null) {
    return Promise.resolve(redirectApproved);
  }
  if (redirectDecisionPromise) {
    return redirectDecisionPromise;
  }

  redirectDecisionPromise = new Promise((resolve) => {
    // Se estiver em ambiente não-interativo (pipes, background ou automação), auto-confirma com log
    if (!process.stdin.isTTY) {
      console.log(`\n\x1b[33m[REDIRECIONAMENTO AUTOMÁTICO]:\x1b[0m Limite de tokens atingido em ${failedModel}. Redirecionando para longcat-2.5-preview-free...`);
      redirectApproved = true;
      return resolve(true);
    }

    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log(`\n\x1b[33m==========================================================\x1b[0m`);
    console.log(`\x1b[33m⚠️  ALERTA: LIMITE DE TOKENS/COTA ATINGIDO NO MODELO:\x1b[0m \x1b[36m${failedModel}\x1b[0m`);
    console.log(`==========================================================\x1b[0m`);

    rl.question(`Deseja redirecionar para o \x1b[32mlongcat-2.5-preview-free\x1b[0m (gratuito e ilimitado) para prosseguir com o trabalho? [S/n]: `, (answer) => {
      rl.close();
      const ans = answer.trim().toLowerCase();
      if (ans === '' || ans === 's' || ans === 'y' || ans === 'sim' || ans === 'yes') {
        console.log(`\x1b[32m✓ Aprovado! Redirecionando rede para longcat-2.5-preview-free...\x1b[0m\n`);
        redirectApproved = true;
        resolve(true);
      } else {
        console.log(`\x1b[31m✖ Redirecionamento recusado pelo usuário. Cancelando operação.\x1b[0m\n`);
        redirectApproved = false;
        resolve(false);
      }
    });
  });

  return redirectDecisionPromise;
}

// Chamada resiliente: primário -> fallback flash -> pergunta antes do fallback gratuito
async function callModelWithFallback(primaryModel, fallbackModel, systemPrompt, userMessage, maxTokens = 4096, temperature = 0.4) {
  if (redirectApproved === true) {
    return await requestModelWithRetry("longcat-2.5-preview-free", systemPrompt, userMessage, 2, maxTokens, temperature);
  }

  try {
    return await requestModelWithRetry(primaryModel, systemPrompt, userMessage, 2, maxTokens, temperature);
  } catch (err) {
    const isQuota = err.message.includes('429') || err.message.includes('limit') || err.message.includes('cota') || err.message.includes('usage');
    if (isQuota) {
      const approved = await askUserRedirect(primaryModel);
      if (approved) {
        return await requestModelWithRetry("longcat-2.5-preview-free", systemPrompt, userMessage, 2, maxTokens, temperature);
      } else {
        throw new Error(`Operação cancelada: limite atingido em ${primaryModel} e redirecionamento recusado.`);
      }
    }

    console.log(`  \x1b[33m⚠️ ${primaryModel} falhou (${err.message.substring(0, 50)}...). Acionando ${fallbackModel}...\x1b[0m`);
    try {
      return await requestModelWithRetry(fallbackModel, systemPrompt, userMessage, 2, maxTokens, temperature);
    } catch (err2) {
      const approved = await askUserRedirect(fallbackModel);
      if (approved) {
        return await requestModelWithRetry("longcat-2.5-preview-free", systemPrompt, userMessage, 2, maxTokens, temperature);
      } else {
        throw new Error(`Operação cancelada: limite atingido em ${fallbackModel} e redirecionamento recusado.`);
      }
    }
  }
}

// ------------------------------------------------------------------------------
// PROMPTS DO SISTEMA: MAESTRO & DEEPSEEK CO-PILOT
// ------------------------------------------------------------------------------
const MAESTRO_SYSTEM_PROMPT = `Você é o MAESTRO ORQUESTRADOR SUPREMO DO ENXAME DE IA.
Sua missão é realizar a DECOMPOSIÇÃO ESTRATÉGICA E DELEGAÇÃO PERFEITA para 4 especialistas de elite:
1. @web-architect (Arquiteto Frontend e Criador de Landing Pages)
2. @marketing-strategist (Estrategista de Marketing & Neuromarketing)
3. @instagram-architect (Modelador 360° de Redes Sociais)
4. @prompt-artisan (Diretor de Arte & Prompts Fotorealistas)

DIRETRIZES DA SUA DELEGAÇÃO:
Analise profundamente o briefing do usuário, o nicho, o público-alvo, a dor latente e o objetivo comercial.
Em seguida, produza um comando tático estruturado dividido exatamente nas seções abaixo:

### 1. DIAGNÓSTICO ESTRATÉGICO
- Nicho, Avatar de Compra (ICP) e Mecanismo Único de Transformação.
- Ângulo de Ataque e Posicionamento de Mercado.

### 2. DIRETRIZES PARA O @web-architect
- Estrutura completa da Landing Page (Header Glassmorphic, Hero com duplo CTA, Bento Grid com 4-6 cards de funcionalidades/serviços, Prova Social, Tabela de Preços com Garantia, FAQ Accordion, Footer).
- Paleta de cores recomendada (Background, Cards, Bordas sutis, Accent color), tipografia e microinterações.
- Proibição absoluta de placeholders.

### 3. DIRETRIZES PARA O @marketing-strategist
- Aplicação do framework $100M Offers (Alex Hormozi): Formulação da Oferta Grand Slam.
- UVP (Proposta Única de Valor) irresistível.
- Stack de Bônus de alto valor percebido e Garantia Reversa Incondicional.
- Funil de Conversão e gatilhos de Neuromarketing a serem acionados.

### 4. DIRETRIZES PARA O @instagram-architect
- Linha editorial e tom de voz da marca.
- Bio Hipnótica em 4 linhas (Para quem + Transformação, Prova/Autoridade, Mecanismo Único, CTA).
- Roteiro temático para os 5 Destaques Obrigatórios (Comece Aqui, Método, Resultados, Bastidores, Oferta).
- Tema e gancho de retenção para Carrossel de 10 Lâminas.
- Sequência de Stories 24h e Roteiro de Reels de 45 segundos.

### 5. DIRETRIZES PARA O @prompt-artisan
- Direção de arte visual (estilo cinematográfico, editorial de moda/luxo ou corporativo hi-tech).
- Cenários, paleta de iluminação, lentes e parâmetros para Midjourney v6.1 e Flux.1.

Seja minucioso, tático, autoritário e escreva em Português (Brasil).`;

const DEEPSEEK_COPILOT_SYSTEM_PROMPT = `Você é o CO-PILOTO & AUDITOR TÉCNICO DE ELITE DO ENXAME (@deepseek-copilot).
Sua missão é realizar a AUDITORIA CRÍTICA E BLINDAGEM TÉCNICA do plano proposto pelo Maestro LongCat.

DIRETRIZES DE AUDITORIA & VELOCIDADE MÁXIMA (TURNO ÚNICO - ZERO LOOPS):
- Responda em TURNO ÚNICO, de forma cirúrgica e concisa (máximo 350-400 palavras).
- Não perca tempo elogiando o que já está bom. Vá direto nas brechas, edge cases e melhorias.
- Estruture sua resposta estritamente nos 3 blocos abaixo:

### 1. CASOS DE BORDA & RISCOS EVITADOS
- 2 a 3 potenciais falhas de arquitetura, UX, copy ou concorrência que devem ser neutralizadas.

### 2. UPGRADES ESTRATÉGICOS OBRIGATÓRIOS
- @web-architect: Refinamentos cruciais de frontend (acessibilidade, performance de carregamento, responsividade, Tailwind).
- @marketing-strategist: Ajuste cirúrgico na ancoragem de preço e quebra da maior objeção oculta.
- @instagram-architect: Gancho magnético de retenção nos primeiros 3 segundos.
- @prompt-artisan: Parâmetros estritos de consistência de estilo, luz e lentes.

### 3. DIRETIVAS BLINDADAS DE EXECUÇÃO
- Comandos mandatórios finais que os especialistas devem incorporar no seu código e copy.

Escreva em Português (Brasil).`;

// ------------------------------------------------------------------------------
// EXECUÇÃO DO ENXAME DUAL-CORE
// ------------------------------------------------------------------------------
async function runSwarm() {
  const startTime = Date.now();
  console.log(`\n\x1b[36m==========================================================\x1b[0m`);
  console.log(`   \x1b[33m⚡ ENXAME MULTI-AGENTE: DUAL-CORE ORCHESTRATION\x1b[0m`);
  console.log(`   \x1b[90mMaestro Central: longcat-2.5-preview-free ($0.00 / Thinking Engine)\x1b[0m`);
  console.log(`   \x1b[90mCo-Piloto Validador: deepseek-v4-flash ($0.15/1M / One-Shot FSM)\x1b[0m`);
  console.log(`   \x1b[90mEspecialistas: DeepSeek Flash + GLM Flash + MiniMax M3 + Qwen Flash\x1b[0m`);
  console.log(`\x1b[36m==========================================================\x1b[0m`);
  console.log(`\x1b[90mBriefing:\x1b[0m "${userPrompt}"\n`);

  try {
    // 1. FASE 1: Maestro Orquestrador (LongCat com Thinking Tokens nativos)
    console.log(`\x1b[35m[1/4] 🧠 Maestro (@longcat-2.5-preview-free) dissecando briefing e arquitetando plano mestre...\x1b[0m`);
    const plan = await callModelWithFallback(
      "longcat-2.5-preview-free",
      "longcat-2.5-preview-free",
      MAESTRO_SYSTEM_PROMPT,
      userPrompt
    );
    console.log(`  \x1b[32m✓ Plano inicial do Maestro gerado com sucesso analítico!\x1b[0m\n`);

    let consolidatedPlan = plan;

    // 2. FASE 1.5: Co-Piloto & Auditoria DeepSeek (Prevenção Estrita de Loops + Otimização de Latência)
    const shouldRunCopilot = isDeepMode || (!isFastMode && userPrompt.length >= 50);

    if (shouldRunCopilot) {
      console.log(`\x1b[34m[2/4] ⚡ Co-Piloto (@deepseek-v4-flash) auditando arquitetura e blindando casos de borda...\x1b[0m`);
      const copilotReview = await callModelWithFallback(
        "deepseek-v4-flash",
        "deepseek-v4.1-flash",
        DEEPSEEK_COPILOT_SYSTEM_PROMPT,
        `Briefing do Cliente: "${userPrompt}"\n\nPLANO PROPOSTO PELO MAESTRO:\n${plan}`,
        800,  // Latência ultrabaixa: limite de tokens cirúrgico
        0.2   // Temperatura baixa para máxima precisão e velocidade
      );
      console.log(`  \x1b[32m✓ Auditoria DeepSeek concluída com êxito! Plano blindado.\x1b[0m\n`);

      consolidatedPlan = `=== DIRETRIZES DO MAESTRO (LONGCAT) ===\n${plan}\n\n=== AUDITORIA TÉCNICA & BLINDAGEM (DEEPSEEK CO-PILOT) ===\n${copilotReview}`;
    } else {
      console.log(`\x1b[90m[2/4] ⚡ Fast-Path Ativo: Co-Piloto bypassado para latência instantânea.\x1b[0m\n`);
    }

    // 3. FASE 2: Disparo Paralelo aos Especialistas com o Plano Blindado Consolidado
    console.log(`\x1b[36m[3/4] 🚀 Disparando 4 especialistas em paralelo com diretrizes blindadas...\x1b[0m`);
    console.log(`  -> @web-architect (\x1b[34mdeepseek-v4-flash\x1b[0m): Programando Landing Page HTML5/Tailwind`);
    console.log(`  -> @marketing-strategist (\x1b[33mglm-5.3-flash\x1b[0m): Arquitetando Oferta $100M e Neuromarketing`);
    console.log(`  -> @instagram-architect (\x1b[35mminimax-m3\x1b[0m): Modelando Bio, Destaques, Carrossel & Reels`);
    console.log(`  -> @prompt-artisan (\x1b[31mqwen3.8-flash\x1b[0m): Fabricando Prompts para Midjourney/Flux\n`);

    const pWeb = callModelWithFallback(
      "deepseek-v4-flash",
      "kimi-k2.7-code",
      "Você é o Arquiteto Web Supremo (@web-architect). Siga estritamente as diretrizes do Maestro e da Auditoria Técnica. Gere uma landing page completa em HTML5 com Tailwind CDN, Bento Grid, sem nenhum placeholder. Retorne o código em ```html ... ```.",
      `Briefing do Cliente: ${userPrompt}\n\nDIRETRIZES BLINDADAS:\n${consolidatedPlan}`
    );
    await delay(600);

    const pMarketing = callModelWithFallback(
      "glm-5.3-flash",
      "minimax-m3",
      "Você é o Estrategista-Chefe de Marketing (@marketing-strategist). Siga estritamente as diretrizes do Maestro e da Auditoria Técnica. Gere o canvas de marketing com ICP, Proposta Única de Valor e Oferta Grand Slam ($100M Offers de Alex Hormozi).",
      `Briefing do Cliente: ${userPrompt}\n\nDIRETRIZES BLINDADAS:\n${consolidatedPlan}`
    );
    await delay(600);

    const pInstagram = callModelWithFallback(
      "minimax-m3",
      "glm-5.3-flash",
      "Você é o Modelador de Instagram 360° (@instagram-architect). Siga estritamente as diretrizes do Maestro e da Auditoria Técnica. Entregue Bio hipnótica, os 5 destaques, roteiro de carrossel de 10 lâminas, sequência de stories 24h e script de reels de 45s.",
      `Briefing do Cliente: ${userPrompt}\n\nDIRETRIZES BLINDADAS:\n${consolidatedPlan}`
    );
    await delay(600);

    const pPrompts = callModelWithFallback(
      "qwen3.8-flash",
      "minimax-m3",
      "Você é o Diretor de Arte e Criador de Prompts (@prompt-artisan). Siga estritamente as diretrizes do Maestro e da Auditoria Técnica. Gere prompts cinematográficos fotorealistas prontos para Midjourney v6.1 e Flux.1 com iluminação, lentes e parâmetros técnicos.",
      `Briefing do Cliente: ${userPrompt}\n\nDIRETRIZES BLINDADAS:\n${consolidatedPlan}`
    );

    const [resWeb, resMarketing, resInstagram, resPrompts] = await Promise.all([
      pWeb,
      pMarketing,
      pInstagram,
      pPrompts
    ]);

    console.log(`\x1b[32m  ✓ Todos os 4 especialistas responderam com sucesso!\x1b[0m\n`);

    // 4. FASE 3: Salvar Arquivos no Disco
    console.log(`\x1b[33m[4/4] 💾 Gravando artefatos no disco em C:\\KIMI...\x1b[0m`);
    let htmlClean = resWeb;
    const match = resWeb.match(/```html([\s\S]*?)```/);
    if (match) htmlClean = match[1].trim();

    fs.writeFileSync(path.join(__dirname, 'web', 'index.html'), htmlClean, 'utf-8');
    fs.writeFileSync(path.join(__dirname, 'marketing', 'estrategia_marketing.md'), resMarketing, 'utf-8');
    fs.writeFileSync(path.join(__dirname, 'instagram', 'dossie_instagram.md'), resInstagram, 'utf-8');
    fs.writeFileSync(path.join(__dirname, 'prompts', 'prompts_fotorealistas.md'), resPrompts, 'utf-8');

    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`  \x1b[32m✓ C:\\KIMI\\web\\index.html\x1b[0m`);
    console.log(`  \x1b[32m✓ C:\\KIMI\\marketing\\estrategia_marketing.md\x1b[0m`);
    console.log(`  \x1b[32m✓ C:\\KIMI\\instagram\\dossie_instagram.md\x1b[0m`);
    console.log(`  \x1b[32m✓ C:\\KIMI\\prompts\\prompts_fotorealistas.md\x1b[0m`);

    console.log(`\n\x1b[32m==========================================================\x1b[0m`);
    console.log(`   \x1b[32m🔥 MISSÃO DO ENXAME CONCLUÍDA EM ${totalDuration}s COM 100% DE ÊXITO!\x1b[0m`);
    console.log(`==========================================================\x1b[0m\n`);

  } catch (err) {
    console.error(`\x1b[31m[ERRO NO ENXAME]:\x1b[0m`, err.message);
  }
}

runSwarm();

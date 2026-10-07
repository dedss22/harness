// ==============================================================================
// NEXUS SWARM PROMPT - AMBIENTE INTERATIVO DE ALTA EFICIÊNCIA (DURA O MÊS TODO)
// ==============================================================================
const readline = require('readline');
const https = require('https');
const fs = require('fs');
const path = require('path');

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

// Topologia padrão ultrarrápida: Maestro LongCat ($0.00) + Especialistas Flash
let networkConfig = {
  orchestrator: "longcat-2.5-preview-free",
  web: "deepseek-v4-flash",
  marketing: "glm-5.3-flash",
  instagram: "minimax-m3",
  prompt_art: "qwen3.8-flash"
};

const AVAILABLE_MODELS = [
  "deepseek-v4-flash",
  "deepseek-v4.1-flash",
  "glm-5.3-flash",
  "minimax-m3",
  "qwen3.8-flash",
  "longcat-2.5-preview-free",
  "deepseek-v4-pro",
  "kimi-k2.7-code",
  "kimi-k3"
];

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
        "x-opencode-session": "swarm-persistent-cache", // Cache ativo a $0.003/1M
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
            reject(new Error(`Erro ${res.statusCode} em ${model}: ${errMsg}`));
          }
        } catch (e) {
          reject(new Error(`Parse error em ${model}: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Timeout ao consultar ${model}`));
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
        console.log(`    \x1b[90m[Tentativa ${attempt} em ${model} falhou: ${err.message}. Retentando em 1.5s...]\x1b[0m`);
        await delay(1500);
        continue;
      }
      throw err;
    }
  }
}

let cliRedirectPromise = null;
let cliRedirectApproved = null;

function askUserRedirectCli(failedModel) {
  if (cliRedirectApproved !== null) {
    return Promise.resolve(cliRedirectApproved);
  }
  if (cliRedirectPromise) {
    return cliRedirectPromise;
  }

  cliRedirectPromise = new Promise((resolve) => {
    if (!process.stdin.isTTY) {
      console.log(`\n\x1b[33m[REDIRECIONAMENTO AUTOMÁTICO]:\x1b[0m Limite de tokens atingido em ${failedModel}. Redirecionando para longcat-2.5-preview-free...`);
      cliRedirectApproved = true;
      return resolve(true);
    }

    const rlTemp = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log(`\n\x1b[33m==========================================================\x1b[0m`);
    console.log(`\x1b[33m⚠️  ALERTA: LIMITE DE TOKENS/COTA ATINGIDO EM:\x1b[0m \x1b[36m${failedModel}\x1b[0m`);
    console.log(`==========================================================\x1b[0m`);

    rlTemp.question(`Deseja redirecionar para o \x1b[32mlongcat-2.5-preview-free\x1b[0m (gratuito e ilimitado) para prosseguir? [S/n]: `, (answer) => {
      rlTemp.close();
      const ans = answer.trim().toLowerCase();
      if (ans === '' || ans === 's' || ans === 'y' || ans === 'sim' || ans === 'yes') {
        console.log(`\x1b[32m✓ Aprovado! Redirecionando para longcat-2.5-preview-free...\x1b[0m\n`);
        cliRedirectApproved = true;
        resolve(true);
      } else {
        console.log(`\x1b[31m✖ Redirecionamento cancelado pelo usuário.\x1b[0m\n`);
        cliRedirectApproved = false;
        resolve(false);
      }
    });
  });

  return cliRedirectPromise;
}

async function callWithFallback(primaryModel, fallbackModel, systemPrompt, userMessage, maxTokens = 4096, temperature = 0.4) {
  if (cliRedirectApproved === true) {
    return await requestModelWithRetry("longcat-2.5-preview-free", systemPrompt, userMessage, 2, maxTokens, temperature);
  }

  try {
    return await requestModelWithRetry(primaryModel, systemPrompt, userMessage, 2, maxTokens, temperature);
  } catch (err) {
    const isQuota = err.message.includes('429') || err.message.includes('limit') || err.message.includes('cota') || err.message.includes('usage');
    if (isQuota) {
      const approved = await askUserRedirectCli(primaryModel);
      if (approved) {
        return await requestModelWithRetry("longcat-2.5-preview-free", systemPrompt, userMessage, 2, maxTokens, temperature);
      } else {
        throw new Error(`Operação cancelada: limite atingido em ${primaryModel} e redirecionamento recusado.`);
      }
    }

    console.log(`    \x1b[33m↳ ${primaryModel} falhou. Tentando ${fallbackModel}...\x1b[0m`);
    try {
      return await requestModelWithRetry(fallbackModel, systemPrompt, userMessage, 2, maxTokens, temperature);
    } catch (err2) {
      const approved = await askUserRedirectCli(fallbackModel);
      if (approved) {
        return await requestModelWithRetry("longcat-2.5-preview-free", systemPrompt, userMessage, 2, maxTokens, temperature);
      } else {
        throw new Error(`Operação cancelada: limite atingido em ${fallbackModel} e redirecionamento recusado.`);
      }
    }
  }
}

async function executeSwarmMission(missionPrompt) {
  console.log(`\n\x1b[36m┌─────────────────────────────────────────────────────────────┐\x1b[0m`);
  console.log(`\x1b[36m│\x1b[0m  \x1b[33m⚡ REDE CONVOCADA: DISPARANDO ENXAME MULTI-MODELO\x1b[0m           \x1b[36m│\x1b[0m`);
  console.log(`\x1b[36m└─────────────────────────────────────────────────────────────┘\x1b[0m`);
  console.log(`\x1b[90mTopologia ativa (Consumo Inteligente: ~$0.005 por execução):\x1b[0m`);
  console.log(` • Maestro:       \x1b[35m${networkConfig.orchestrator}\x1b[0m`);
  console.log(` • Web Architect: \x1b[34m${networkConfig.web}\x1b[0m`);
  console.log(` • Marketing:     \x1b[33m${networkConfig.marketing}\x1b[0m`);
  console.log(` • Instagram:     \x1b[35m${networkConfig.instagram}\x1b[0m`);
  console.log(` • Prompt Art:    \x1b[31m${networkConfig.prompt_art}\x1b[0m\n`);

  const startTime = Date.now();

  try {
    // 1. Maestro
    const MAESTRO_PROMPT = `Você é o MAESTRO ORQUESTRADOR SUPREMO DO ENXAME. Realize a DELEGAÇÃO PERFEITA para:
1. @web-architect (Landing Page Tailwind/Bento Grid)
2. @marketing-strategist (Oferta $100M Alex Hormozi/ICP)
3. @instagram-architect (Bio 4 linhas, 5 Destaques, Carrossel 10 Lâminas, Stories 24h, Reels)
4. @prompt-artisan (Prompts Midjourney v6.1 e Flux.1)
Entregue diretrizes táticas completas para cada um sem placeholders. Português (Brasil).`;

    process.stdout.write(`  \x1b[35m[1/4] 🧠 Maestro (${networkConfig.orchestrator})\x1b[0m planejando e delegando... `);
    const plan = await callWithFallback(
      networkConfig.orchestrator,
      "longcat-2.5-preview-free",
      MAESTRO_PROMPT,
      missionPrompt
    );
    console.log(`\x1b[32m[OK]\x1b[0m`);

    let consolidatedPlan = plan;

    if (missionPrompt.length >= 50) {
      process.stdout.write(`  \x1b[34m[2/4] ⚡ Co-Piloto (deepseek-v4-flash)\x1b[0m auditando e blindando casos de borda... `);
      const COPILOT_PROMPT = `Você é o CO-PILOTO & AUDITOR TÉCNICO DE ELITE (@deepseek-copilot).
Sua missão é realizar a AUDITORIA CRÍTICA E BLINDAGEM TÉCNICA do plano proposto pelo Maestro LongCat.
Responda em TURNO ÚNICO (máximo 350 palavras) dividido em:
1. CASOS DE BORDA & RISCOS EVITADOS
2. UPGRADES ESTRATÉGICOS OBRIGATÓRIOS (Web, Marketing, Instagram, Prompts)
3. DIRETIVAS BLINDADAS DE EXECUÇÃO
Escreva em Português (Brasil).`;

      const copilotReview = await callWithFallback(
        "deepseek-v4-flash",
        "deepseek-v4.1-flash",
        COPILOT_PROMPT,
        `Briefing: ${missionPrompt}\n\nPLANO PROPOSTO PELO MAESTRO:\n${plan}`,
        800,
        0.2
      );
      console.log(`\x1b[32m[OK]\x1b[0m`);
      consolidatedPlan = `=== DIRETRIZES DO MAESTRO ===\n${plan}\n\n=== AUDITORIA TÉCNICA & BLINDAGEM (DEEPSEEK CO-PILOT) ===\n${copilotReview}`;
    } else {
      console.log(`  \x1b[90m[2/4] ⚡ Fast-Path Ativo: Co-Piloto bypassado para latência instantânea.\x1b[0m`);
    }

    // 2. Especialistas em paralelo com diretrizes blindadas
    console.log(`  \x1b[36m[3/4] 🚀 Disparando 4 especialistas em paralelo com diretrizes blindadas...\x1b[0m`);
    console.log(`    -> \x1b[34m${networkConfig.web}\x1b[0m: Programando Landing Page...`);
    console.log(`    -> \x1b[33m${networkConfig.marketing}\x1b[0m: Oferta $100M e Neuromarketing...`);
    console.log(`    -> \x1b[35m${networkConfig.instagram}\x1b[0m: Modelando Instagram 360°...`);
    console.log(`    -> \x1b[31m${networkConfig.prompt_art}\x1b[0m: Prompts Midjourney/Flux...`);

    const pWeb = callWithFallback(
      networkConfig.web,
      "longcat-2.5-preview-free",
      "Você é o Arquiteto Web Supremo (@web-architect). Siga estritamente as diretrizes do Maestro e da Auditoria Técnica. Gere uma landing page completa em HTML5 com Tailwind CDN, Bento Grid, sem nenhum placeholder. Retorne o código em ```html ... ```.",
      `Briefing: ${missionPrompt}\n\nDIRETRIZES BLINDADAS:\n${consolidatedPlan}`
    );
    await delay(600);

    const pMarketing = callWithFallback(
      networkConfig.marketing,
      "longcat-2.5-preview-free",
      "Você é o Estrategista-Chefe de Marketing (@marketing-strategist). Siga estritamente as diretrizes do Maestro e da Auditoria Técnica. Gere o canvas com ICP, Proposta Única de Valor e Oferta Grand Slam ($100M Offers de Alex Hormozi).",
      `Briefing: ${missionPrompt}\n\nDIRETRIZES BLINDADAS:\n${consolidatedPlan}`
    );
    await delay(600);

    const pInstagram = callWithFallback(
      networkConfig.instagram,
      "longcat-2.5-preview-free",
      "Você é o Modelador de Instagram 360° (@instagram-architect). Siga estritamente as diretrizes do Maestro e da Auditoria Técnica. Entregue Bio hipnótica, os 5 destaques, roteiro de carrossel de 10 lâminas, sequência de stories 24h e script de reels de 45s.",
      `Briefing: ${missionPrompt}\n\nDIRETRIZES BLINDADAS:\n${consolidatedPlan}`
    );
    await delay(600);

    const pPrompts = callWithFallback(
      networkConfig.prompt_art,
      "longcat-2.5-preview-free",
      "Você é o Diretor de Arte e Criador de Prompts (@prompt-artisan). Siga estritamente as diretrizes do Maestro e da Auditoria Técnica. Gere prompts cinematográficos fotorealistas prontos para Midjourney v6.1 e Flux.1 com iluminação, lentes e parâmetros técnicos.",
      `Briefing: ${missionPrompt}\n\nDIRETRIZES BLINDADAS:\n${consolidatedPlan}`
    );

    const [resWeb, resMarketing, resInstagram, resPrompts] = await Promise.all([
      pWeb,
      pMarketing,
      pInstagram,
      pPrompts
    ]);

    console.log(`  \x1b[32m[3/4] ✓ Todos os especialistas concluíram com êxito!\x1b[0m`);

    // 3. Salvar no disco
    console.log(`  \x1b[33m[4/4] 💾 Gravando artefatos em C:\\KIMI...\x1b[0m`);
    let htmlClean = resWeb;
    const match = resWeb.match(/```html([\s\S]*?)```/);
    if (match) htmlClean = match[1].trim();

    const baseDir = __dirname;
    fs.writeFileSync(path.join(baseDir, 'web', 'index.html'), htmlClean, 'utf-8');
    fs.writeFileSync(path.join(baseDir, 'marketing', 'estrategia_marketing.md'), resMarketing, 'utf-8');
    fs.writeFileSync(path.join(baseDir, 'instagram', 'dossie_instagram.md'), resInstagram, 'utf-8');
    fs.writeFileSync(path.join(baseDir, 'prompts', 'prompts_fotorealistas.md'), resPrompts, 'utf-8');

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`\n\x1b[32m╔═════════════════════════════════════════════════════════════╗\x1b[0m`);
    console.log(`\x1b[32m║   🔥 ENTREGA DO ENXAME CONCLUÍDA EM ${duration}s!                     ║\x1b[0m`);
    console.log(`\x1b[32m╚═════════════════════════════════════════════════════════════╝\x1b[0m`);
    console.log(`  📁 \x1b[36mC:\\KIMI\\web\\index.html\x1b[0m (Landing Page com Bento Grid & Tailwind)`);
    console.log(`  📁 \x1b[33mC:\\KIMI\\marketing\\estrategia_marketing.md\x1b[0m (Oferta $100M & Funil)`);
    console.log(`  📁 \x1b[35mC:\\KIMI\\instagram\\dossie_instagram.md\x1b[0m (Bio, Destaques, 10 Lâminas & Stories)`);
    console.log(`  📁 \x1b[31mC:\\KIMI\\prompts\\prompts_fotorealistas.md\x1b[0m (Prompts Midjourney & Flux)`);

  } catch (err) {
    console.error(`\n\x1b[31m[ERRO NA REDE]:\x1b[0m`, err.message);
  }
}

function startPrompt() {
  console.clear();
  console.log(`\x1b[36m╔════════════════════════════════════════════════════════════════════════╗\x1b[0m`);
  console.log(`\x1b[36m║   \x1b[33m⚡ NEXUS SWARM CLI - AMBIENTE DE PROMPT ULTRA-ECONÔMICO\x1b[0m              \x1b[36m║\x1b[0m`);
  console.log(`\x1b[36m║   \x1b[90mDeepSeek Flash Engine | OpenCode Go | Cache Persistente               \x1b[36m║\x1b[0m`);
  console.log(`\x1b[36m╚════════════════════════════════════════════════════════════════════════╝\x1b[0m`);
  console.log(`\x1b[90mComandos rápidos:\x1b[0m`);
  console.log(`  \x1b[33m/models\x1b[0m     -> Ver ou trocar os modelos de cada agente da rede`);
  console.log(`  \x1b[33m/network\x1b[0m    -> Ver a topologia ativa da rede`);
  console.log(`  \x1b[33m/clear\x1b[0m      -> Limpar a tela`);
  console.log(`  \x1b[33m/exit\x1b[0m       -> Sair`);
  console.log(`  \x1b[32m<qualquer instrução>\x1b[0m -> Dispara a rede de IAs em paralelo imediatamente!\n`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `\x1b[35mswarm\x1b[0m (\x1b[36m${networkConfig.orchestrator}\x1b[0m) > `
  });

  rl.prompt();

  rl.on('line', async (line) => {
    const input = line.trim();

    if (!input) {
      rl.prompt();
      return;
    }

    if (input === '/exit' || input === 'exit') {
      console.log(`Saindo do Swarm...`);
      process.exit(0);
    }

    if (input === '/clear' || input === 'clear') {
      console.clear();
      rl.prompt();
      return;
    }

    if (input === '/network' || input === '/status') {
      console.log(`\n\x1b[33m[TOPOLOGIA ATIVA - MÁXIMA EFICIÊNCIA]:\x1b[0m`);
      console.log(`  • Maestro (Orquestração): \x1b[35m${networkConfig.orchestrator}\x1b[0m`);
      console.log(`  • Web Architect (Código): \x1b[34m${networkConfig.web}\x1b[0m`);
      console.log(`  • Marketing (Oferta/Copy):\x1b[33m${networkConfig.marketing}\x1b[0m`);
      console.log(`  • Instagram (360° Social):\x1b[35m${networkConfig.instagram}\x1b[0m`);
      console.log(`  • Prompt Art (Midjourney):\x1b[31m${networkConfig.prompt_art}\x1b[0m\n`);
      rl.prompt();
      return;
    }

    if (input === '/help') {
      console.log(`\n\x1b[33mComandos do Prompt Swarm:\x1b[0m`);
      console.log(`  \x1b[32m<texto livre>\x1b[0m             -> Dispara a MISSÃO COMPLETA com os 4 agentes em paralelo`);
      console.log(`  \x1b[33m/ask <sua pergunta>\x1b[0m       -> Resposta rápida direta do Maestro (econômico, sem disparar enxame)`);
      console.log(`  \x1b[33m/free\x1b[0m                     -> Ativa MODO GRATUITO TOTAL (100% longcat-2.5-preview-free, custo zero)`);
      console.log(`  \x1b[33m/flash\x1b[0m                    -> Ativa MODO FLASH (DeepSeek + GLM + MiniMax + Qwen, frações de centavo)`);
      console.log(`  \x1b[33m/network\x1b[0m ou \x1b[33m/status\x1b[0m       -> Exibe a topologia e modelos de cada papel`);
      console.log(`  \x1b[33m/models <papel> <modelo>\x1b[0m  -> Customiza o modelo de um papel específico`);
      console.log(`  \x1b[33m/clear\x1b[0m                    -> Limpa o terminal`);
      console.log(`  \x1b[33m/exit\x1b[0m                     -> Encerra o terminal\n`);
      rl.prompt();
      return;
    }

    if (input === '/free') {
      networkConfig = {
        orchestrator: "longcat-2.5-preview-free",
        web: "longcat-2.5-preview-free",
        marketing: "longcat-2.5-preview-free",
        instagram: "longcat-2.5-preview-free",
        prompt_art: "longcat-2.5-preview-free"
      };
      console.log(`\n\x1b[32m🛡️ MODO GRATUITO ATIVADO!\x1b[0m Todos os agentes rodando com \x1b[36mlongcat-2.5-preview-free\x1b[0m (Custo $0.00 / Ilimitado).\n`);
      rl.setPrompt(`\x1b[35mswarm\x1b[0m (\x1b[32mfree\x1b[0m) > `);
      rl.prompt();
      return;
    }

    if (input === '/flash') {
      networkConfig = {
        orchestrator: "deepseek-v4-flash",
        web: "deepseek-v4-flash",
        marketing: "glm-5.3-flash",
        instagram: "minimax-m3",
        prompt_art: "qwen3.8-flash"
      };
      console.log(`\n\x1b[33m⚡ MODO FLASH ATIVADO!\x1b[0m Topologia de alta eficiência restaurada (DeepSeek + GLM + MiniMax + Qwen).\n`);
      rl.setPrompt(`\x1b[35mswarm\x1b[0m (\x1b[36m${networkConfig.orchestrator}\x1b[0m) > `);
      rl.prompt();
      return;
    }

    if (input.startsWith('/ask ')) {
      const q = input.slice(5).trim();
      if (!q) {
        console.log(`\x1b[31mUso: /ask <sua pergunta>\x1b[0m\n`);
        rl.prompt();
        return;
      }
      process.stdout.write(`\x1b[35m[${networkConfig.orchestrator}]\x1b[0m Pensando... \n`);
      try {
        const ans = await callWithFallback(
          networkConfig.orchestrator,
          "longcat-2.5-preview-free",
          "Você é um consultor sênior em marketing, engenharia web e redes sociais. Responda com clareza, concisão e técnica de alto nível.",
          q
        );
        console.log(`\n\x1b[32m[RESPOSTA]:\x1b[0m\n${ans}\n`);
      } catch (e) {
        console.log(`\x1b[31mErro: ${e.message}\x1b[0m\n`);
      }
      rl.prompt();
      return;
    }

    if (input.startsWith('/models') || input.startsWith('/model')) {
      const parts = input.split(' ');
      if (parts.length === 3) {
        const role = parts[1].toLowerCase();
        const model = parts[2].toLowerCase();
        if (networkConfig[role] && AVAILABLE_MODELS.includes(model)) {
          networkConfig[role] = model;
          console.log(`\x1b[32m✓ Agente '${role}' atualizado para '${model}'!\x1b[0m\n`);
        } else {
          console.log(`\x1b[31mUso incorreto. Exemplo: /models web deepseek-v4-flash\x1b[0m\n`);
        }
      } else {
        console.log(`\n\x1b[33mModelos econômicos recomendados:\x1b[0m`);
        AVAILABLE_MODELS.forEach(m => console.log(`  - ${m}`));
        console.log(`\nPara alterar: \x1b[33m/models <papel> <modelo>\x1b[0m (papéis: orchestrator, web, marketing, instagram, prompt_art)\n`);
      }
      rl.setPrompt(`\x1b[35mswarm\x1b[0m (\x1b[36m${networkConfig.orchestrator}\x1b[0m) > `);
      rl.prompt();
      return;
    }

    await executeSwarmMission(input);
    rl.prompt();
  });
}

startPrompt();

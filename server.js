// ==============================================================================
// NEXUS SWARM STUDIO - SERVIDOR DO MOTOR MULTI-AGENTE EM REDE (COM FALLBACK)
// ==============================================================================
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
let OPENCODE_KEY = process.env.OPENCODE_API_KEY || "";
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const match = envContent.match(/OPENCODE_API_KEY=(.*)/);
  if (match) OPENCODE_KEY = match[1].trim();
}
const OPENCODE_BASE_URL = "https://opencode.ai/zen/go/v1";

function requestModel(model, systemPrompt, userPrompt, temperature = 0.5) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: temperature,
      max_tokens: 4096
    });

    const parsedUrl = new URL(OPENCODE_BASE_URL + "/chat/completions");
    const options = {
      hostname: parsedUrl.hostname,
      port: 443,
      path: parsedUrl.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENCODE_KEY}`,
        "x-opencode-session": "swarm-persistent-cache", // Sessão persistente ativa cache de prompt de 98%
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
            const text = msg.content || msg.reasoning || "";
            resolve(text);
          } else {
            const errMsg = json.error ? (json.error.message || JSON.stringify(json.error)) : data;
            reject(new Error(`Model ${model} erro (${res.statusCode}): ${errMsg}`));
          }
        } catch (e) {
          reject(new Error(`Falha no parse JSON de ${model}: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Timeout ao consultar o modelo ${model}`));
    });

    req.write(postData);
    req.end();
  });
}

async function callModel(primaryModel, systemPrompt, userPrompt, fallbackModel = "longcat-2.5-preview-free") {
  try {
    return await requestModel(primaryModel, systemPrompt, userPrompt);
  } catch (err) {
    console.log(`[FALLBACK] ${primaryModel} falhou (${err.message}). Acionando ${fallbackModel}...`);
    try {
      return await requestModel(fallbackModel, systemPrompt, userPrompt);
    } catch (err2) {
      console.log(`[FALLBACK] ${fallbackModel} também falhou. Acionando longcat-2.5-preview-free (gratuito)...`);
      return await requestModel("longcat-2.5-preview-free", systemPrompt, userPrompt);
    }
  }
}

const AGENT_SYSTEM_PROMPTS = {
  orchestrator: `Você é o MAESTRO ORQUESTRADOR CENTRAL do Enxame. Sua missão é dissecar a solicitação do usuário, entender o nicho, o público-alvo e o objetivo comercial, e criar um plano de comando para os especialistas da rede (Web Architect, Marketing Strategist, Instagram Architect e Prompt Artisan). Seja direto, estratégico e entregue um sumário executivo de alto impacto em Português (Brasil).`,
  web: `Você é o ARQUITETO WEB & CRIADOR DE SITES SUPREMO (@web-architect). Sua missão é gerar uma LANDING PAGE COMPLETA E LINDA em HTML5 com Tailwind CSS (usando CDN https://cdn.tailwindcss.com e FontAwesome 6). NUNCA gere placeholders. Inclua Header Glassmorphic, Hero Section, Bento Grid, Tabela de Oferta, FAQ e Footer. Retorne APENAS o código HTML dentro de \`\`\`html ... \`\`\`.`,
  marketing: `Você é o ESTRATEGISTA-CHEFE DE MARKETING & NEUROMARKETING (@marketing-strategist). Sua missão é desenvolver a ESTRATÉGIA DE CONVERSÃO E OFERTA IRRESISTÍVEL ($100M Offers de Alex Hormozi): ICP, UVP, Oferta Grand Slam e Funil Topo/Meio/Fundo.`,
  instagram: `Você é o MODELADOR SUPREMO DE INSTAGRAM 360° (@instagram-architect). Entregue: Bio hipnótica em 4 linhas, 5 destaques, roteiro completo de carrossel de 10 lâminas, sequência de stories 24h e script de reels de 45 segundos.`,
  prompt_art: `Você é o DIRETOR DE ARTE & FABRICANTE DE IMAGENS SINTÉTICAS (@prompt-artisan). Crie prompts cinematográficos fotorealistas prontos para Midjourney v6.1 e Flux.1: retratos editoriais, mockups 3D de interface e capas dos 5 destaques com parâmetros técnicos.`
};

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // 1. Rota de Listagem de Modelos
  if (pathname === '/api/models' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      models: [
        { id: "kimi-k3", name: "Kimi K3 (200k Context)", category: "Orchestration & Deep Reasoning", recommendedFor: "orchestrator" },
        { id: "kimi-k2.7-code", name: "Kimi K2.7 Code", category: "Frontend & Web Architecture", recommendedFor: "web" },
        { id: "glm-5.3", name: "GLM 5.3", category: "Direct Response & Neuromarketing", recommendedFor: "marketing" },
        { id: "minimax-m3", name: "MiniMax M3", category: "Social Media & Instagram", recommendedFor: "instagram" },
        { id: "qwen3.8-max", name: "Qwen 3.8 Max", category: "Visual & Art Direction", recommendedFor: "prompt_art" },
        { id: "mimo-v2.6-pro", name: "MiMo V2.6 Pro", category: "Photorealistic Prompts", recommendedFor: "prompt_art" },
        { id: "deepseek-v4-pro", name: "DeepSeek V4 Pro (Requer Global Region)", category: "Code & Logic", recommendedFor: "web" }
      ]
    }));
    return;
  }

  // 2. Rota de Teste de Conexão Rápida
  if (pathname === '/api/test-model' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { model } = JSON.parse(body);
        const reply = await callModel(model || "kimi-k3", "Você é um testador.", "Responda apenas: 'ONLINE' e seu nome.");
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, model, reply }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // 3. Rota de Disparo do Enxame em Rede (/api/swarm/dispatch)
  if (pathname === '/api/swarm/dispatch' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const userPrompt = payload.prompt;
        const models = payload.models || {
          orchestrator: "deepseek-v4-flash",
          web: "deepseek-v4-flash",
          marketing: "glm-5.3-flash",
          instagram: "minimax-m3",
          prompt_art: "qwen3.8-flash"
        };


        console.log(`\n[SWARM DISPATCH] Nova missão: "${userPrompt.substring(0, 80)}..."`);

        // FASE 1: Maestro planeja
        console.log(` -> Disparando Maestro (${models.orchestrator})...`);
        const plan = await callModel(
          models.orchestrator,
          AGENT_SYSTEM_PROMPTS.orchestrator,
          `O usuário quer a seguinte entrega digital completa:\n"${userPrompt}"\n\nCrie o plano de ataque para Web Architect, Marketing Strategist, Instagram Architect e Prompt Artisan.`,
          "kimi-k3"
        );

        // FASE 2: Disparo Paralelo
        console.log(` -> Disparando em paralelo para os 4 especialistas...`);
        const taskWeb = callModel(
          models.web,
          AGENT_SYSTEM_PROMPTS.web,
          `Briefing: "${userPrompt}"\nPlano: ${plan}`,
          "kimi-k3"
        );

        const taskMarketing = callModel(
          models.marketing,
          AGENT_SYSTEM_PROMPTS.marketing,
          `Briefing: "${userPrompt}"\nPlano: ${plan}`,
          "kimi-k3"
        );

        const taskInstagram = callModel(
          models.instagram,
          AGENT_SYSTEM_PROMPTS.instagram,
          `Briefing: "${userPrompt}"\nPlano: ${plan}`,
          "kimi-k3"
        );

        const taskPromptArt = callModel(
          models.prompt_art,
          AGENT_SYSTEM_PROMPTS.prompt_art,
          `Briefing: "${userPrompt}"\nPlano: ${plan}`,
          "kimi-k3"
        );

        const [webResult, marketingResult, instagramResult, promptArtResult] = await Promise.all([
          taskWeb,
          taskMarketing,
          taskInstagram,
          taskPromptArt
        ]);

        let htmlCode = webResult;
        const htmlMatch = webResult.match(/```html([\s\S]*?)```/);
        if (htmlMatch) {
          htmlCode = htmlMatch[1].trim();
        }

        const baseDir = "C:\\KIMI";
        fs.writeFileSync(path.join(baseDir, "web", "index.html"), htmlCode, 'utf-8');
        fs.writeFileSync(path.join(baseDir, "marketing", "estrategia_marketing.md"), marketingResult, 'utf-8');
        fs.writeFileSync(path.join(baseDir, "instagram", "dossie_instagram.md"), instagramResult, 'utf-8');
        fs.writeFileSync(path.join(baseDir, "prompts", "prompts_fotorealistas.md"), promptArtResult, 'utf-8');

        console.log(` -> Concluído com êxito! Arquivos gravados em C:\\KIMI\\`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          plan: plan,
          results: {
            web: { model: models.web, code: htmlCode, raw: webResult },
            marketing: { model: models.marketing, content: marketingResult },
            instagram: { model: models.instagram, content: instagramResult },
            prompt_art: { model: models.prompt_art, content: promptArtResult }
          },
          savedFiles: [
            "C:\\KIMI\\web\\index.html",
            "C:\\KIMI\\marketing\\estrategia_marketing.md",
            "C:\\KIMI\\instagram\\dossie_instagram.md",
            "C:\\KIMI\\prompts\\prompts_fotorealistas.md"
          ]
        }));
      } catch (e) {
        console.error(`[SWARM ERROR]:`, e);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // 4. Rota para Ler Arquivos
  if (pathname === '/api/files' && req.method === 'GET') {
    const baseDir = "C:\\KIMI";
    try {
      const webFile = fs.existsSync(path.join(baseDir, "web", "index.html")) ? fs.readFileSync(path.join(baseDir, "web", "index.html"), 'utf-8') : '';
      const marketingFile = fs.existsSync(path.join(baseDir, "marketing", "estrategia_marketing.md")) ? fs.readFileSync(path.join(baseDir, "marketing", "estrategia_marketing.md"), 'utf-8') : '';
      const instagramFile = fs.existsSync(path.join(baseDir, "instagram", "dossie_instagram.md")) ? fs.readFileSync(path.join(baseDir, "instagram", "dossie_instagram.md"), 'utf-8') : '';
      const promptsFile = fs.existsSync(path.join(baseDir, "prompts", "prompts_fotorealistas.md")) ? fs.readFileSync(path.join(baseDir, "prompts", "prompts_fotorealistas.md"), 'utf-8') : '';

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        web: webFile,
        marketing: marketingFile,
        instagram: instagramFile,
        prompts: promptsFile
      }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // 5. Servir o Dashboard Visual
  if (pathname === '/' || pathname === '/index.html') {
    const htmlPath = path.join(__dirname, 'studio.html');
    if (fs.existsSync(htmlPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(fs.readFileSync(htmlPath, 'utf-8'));
      return;
    }
  }

  res.writeHead(404);
  res.end('Not Found');
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[SWARM STUDIO] Servidor operando em http://localhost:${PORT}`);
});

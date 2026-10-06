---
name: web-crafting
description: Guia de arquitetura e design frontend para criação dos melhores sites e landing pages de altíssima conversão do mundo usando Tailwind CSS, Bento Grid, microanimações, SEO técnico e acessibilidade.
---

# SKILL: WEB CRAFTING & LANDING PAGE DE ALTA CONVERSÃO

Esta skill fornece ao agente `@web-architect` as regras definitivas e o código executável para construir sites e páginas de destino que não apenas impressionam visualmente, mas convertem visitantes em clientes de forma implacável.

---

## 1. PRINCÍPIOS DE DESIGN & UI/UX ESTADO-DA-ARTE

### A. Bento Grid Design (Layout Modular Assimétrico)
- Organize o núcleo de benefícios usando **Bento Grid** (`grid grid-cols-1 md:grid-cols-3 gap-6`).
- O cartão principal de maior impacto deve ocupar `md:col-span-2` ou `md:row-span-2`.
- Bordas sutis com translucidez: `border border-white/10 dark:border-zinc-800`.
- Sombras profundas e coloridas: `shadow-2xl shadow-indigo-500/10 hover:shadow-indigo-500/20`.
- Efeito de profundidade com vidro fosco (*Glassmorphism*): `backdrop-blur-xl bg-zinc-900/60`.

### B. Paleta Visual & Efeitos Atmosféricos (Dark Luxury & Clean Elite)
- **Fundo**: `bg-slate-950` ou `bg-zinc-950` com textura de ruído ou gradiente radial.
- **Glow Blobs (Luzes volumétricas de fundo)**:
  ```html
  <div class="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-500/15 blur-[140px] rounded-full pointer-events-none -z-10"></div>
  ```
- **Tipografia**: `font-sans` (Inter, Plus Jakarta Sans) para corpo; títulos com gradiente metálico:
  `bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-400 font-extrabold tracking-tight`.

### C. Micro-interações & Sensação Tátil
- Botões com micro-elevação: `hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 ease-out shadow-lg hover:shadow-indigo-500/25`.
- Efeito de feixe de luz passando no botão (*Shimmer Button*):
  ```html
  <button class="relative overflow-hidden group px-8 py-4 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold shadow-xl">
    <span class="relative z-10 flex items-center gap-2">Agendar Consulta <i class="fas fa-arrow-right text-sm group-hover:translate-x-1 transition-transform"></i></span>
    <div class="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
  </button>
  ```

---

## 2. ANATOMIA OBRIGATÓRIA DA LANDING PAGE DE ALTA CONVERSÃO

Toda landing page gerada pelo `@web-architect` DEVE conter os 10 blocos na ordem psicológica de conversão:

1. **Header Flutuante Glassmorphic**:
   - `sticky top-4 z-50 max-w-5xl mx-auto px-6 py-3 rounded-full backdrop-blur-md bg-zinc-900/70 border border-white/10 flex items-center justify-between shadow-2xl`.
   - Logo tipográfica com ícone vetorial, links de ancoragem suaves (`#beneficios`, `#metodo`, `#precos`, `#faq`) e CTA compacto.

2. **Hero Section Hipnótica**:
   - **Pill Badge**: `inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 mb-6`.
   - **Headline H1**: Direta, batendo na dor oculta ou no maior sonho (máximo 12 palavras).
   - **Subheadline**: Como o mecanismo único resolve o problema sem esforço ou tempo excessivo.
   - **CTA Duplo**:
     - *Botão Primário*: Ação de compra/agendamento imediato (`bg-indigo-600 text-white`).
     - *Botão Secundário*: Ação de baixo atrito ("Ver demonstração de 2 min" ou "Falar com especialista").
   - **Prova Social Imediata**: Avatares circulares sobrepostos (`-space-x-2`) + 5 estrelas douradas (`fas fa-star text-amber-400`) + "+1.400 clientes satisfeitos".

3. **Barra de Autoridade / Métricas de Impacto**:
   - Grid de 3 a 4 estatísticas com contadores visuais destacados (Ex: "+R$ 14M Gerados", "99.8% Satisfação", "< 24h Suporte").

4. **Contraste Cognitivo: O Jeito Antigo vs. O Novo Método**:
   - Tabela comparativa visual lado a lado:
     - *O Jeito Antigo (Frustração, perda de dinheiro, processos manuais)* em tons cinza/vermelho fosco.
     - *O Nosso Método (Automação, previsibilidade, paz mental)* em tons verdes/índigo com brilho.

5. **Bento Grid de Soluções & Recursos Exclusivos**:
   - 4 a 6 cartões assimétricos com ícones FontAwesome em gradiente, título com forte benefício e texto explicativo sem jargão.

6. **Demonstração Visual do Produto / Mockup Interativo**:
   - Mockup 3D ou representação estilizada do dashboard/interface do produto ou resultado do serviço.

7. **Depoimentos Reais com Resultados Quantitativos**:
   - Cartões com foto, nome, cargo, empresa e citação destacando um número tangível (Ex: "Reduzi meus custos em 32% no primeiro mês").

8. **Tabela de Preços & Oferta Grand Slam (Alex Hormozi)**:
   - Destaque claro do plano recomendado com badge "Mais Escolhido".
   - Stack de bônus empilhados com valor riscado.
   - Selo de Garantia Incondicional de Risco Zero (7, 30 ou 90 dias).

9. **FAQ Interativo em Accordion (com JavaScript Acessível)**:
   - Respondendo às 5 maiores objeções de compra.

10. **Footer Completo**:
    - Selos de segurança, links de termos e privacidade, dados da empresa (CNPJ/endereço) e copyright.

---

## 3. CÓDIGO EXECUTÁVEL: JAVASCRIPT DO ACCORDION FAQ (ACESSIBILIDADE WCAG)

O `@web-architect` DEVE injetar este script no final da página para garantir abertura suave, fechamento automático dos demais e acessibilidade via teclado:

```html
<script>
  document.addEventListener('DOMContentLoaded', () => {
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach((item) => {
      const button = item.querySelector('.faq-button');
      const content = item.querySelector('.faq-content');
      const icon = item.querySelector('.faq-icon');

      button.addEventListener('click', () => {
        const isExpanded = button.getAttribute('aria-expanded') === 'true';

        // Fechar todos os outros accordions
        faqItems.forEach((otherItem) => {
          if (otherItem !== item) {
            const otherBtn = otherItem.querySelector('.faq-button');
            const otherContent = otherItem.querySelector('.faq-content');
            const otherIcon = otherItem.querySelector('.faq-icon');
            if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
            if (otherContent) otherContent.style.maxHeight = null;
            if (otherIcon) otherIcon.style.transform = 'rotate(0deg)';
          }
        });

        // Alternar o item clicado
        if (isExpanded) {
          button.setAttribute('aria-expanded', 'false');
          content.style.maxHeight = null;
          icon.style.transform = 'rotate(0deg)';
        } else {
          button.setAttribute('aria-expanded', 'true');
          content.style.maxHeight = content.scrollHeight + 'px';
          icon.style.transform = 'rotate(180deg)';
        }
      });
    });
  });
</script>
```

### Estrutura HTML Correspondente para cada FAQ:
```html
<div class="faq-item border border-white/10 rounded-2xl bg-zinc-900/50 backdrop-blur-sm overflow-hidden transition-all duration-300">
  <button class="faq-button w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-2xl" aria-expanded="false">
    <span class="text-lg font-semibold text-white">Como funciona a garantia de 30 dias?</span>
    <i class="faq-icon fas fa-chevron-down text-zinc-400 transition-transform duration-300"></i>
  </button>
  <div class="faq-content max-h-0 overflow-hidden transition-all duration-300 ease-in-out px-6">
    <p class="pb-6 text-zinc-400 leading-relaxed">
      Se dentro de 30 dias você não estiver 100% satisfeito com a solução, basta nos enviar um e-mail. Devolvemos todo o seu dinheiro sem questionamentos e sem burocracia.
    </p>
  </div>
</div>
```

---

## 4. SEO TÉCNICO, OPEN GRAPH & DADOS ESTRUTURADOS (JSON-LD)

Toda landing page DEVE incluir no `<head>` o pacote completo de meta tags para compartilhamento impecável no WhatsApp, LinkedIn e indexação no Google:

```html
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[Nome do Produto/Empresa] | [Benefício Principal em 60 Caracteres]</title>
  <meta name="description" content="[Descrição magnética com até 155 caracteres contendo proposta de valor e CTA claro].">
  <meta name="keywords" content="[palavra-chave 1, palavra-chave 2, nicho, serviço]">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://exemplo.com.br">

  <!-- Open Graph / Facebook / WhatsApp / LinkedIn -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://exemplo.com.br">
  <meta property="og:title" content="[Título Atraente para Redes Sociais]">
  <meta property="og:description" content="[Descrição instigante que faz a pessoa querer clicar no link compartilhado].">
  <meta property="og:image" content="https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1200&h=630&fit=crop">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">

  <!-- Twitter / X Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="[Título Atraente para Twitter]">
  <meta name="twitter:description" content="[Descrição magnética de 140 caracteres].">
  <meta name="twitter:image" content="https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1200&h=630&fit=crop">

  <!-- Schema.org JSON-LD (Dados Estruturados para o Google) -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "[Nome do Produto/Serviço]",
    "description": "[Descrição detalhada do produto]",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "1420"
    },
    "offers": {
      "@type": "Offer",
      "priceCurrency": "BRL",
      "price": "997.00",
      "availability": "https://schema.org/InStock"
    }
  }
  </script>

  <!-- Tailwind CDN & FontAwesome -->
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
  </style>
</head>
```

---

## 5. BANCO DE EXEMPLOS DE COPY POR SEÇÃO DA LANDING PAGE

O `@web-architect` deve utilizar estes padrões de copywriting para nunca gerar páginas frias ou com placeholders:

| Seção | Exemplo de Copy de Alto Nível |
| :--- | :--- |
| **Pill Badge** | `✨ MÉTODO EXCLUSIVO 2026` · `⚡ VAGAS LIMITADAS PARA ESTA SEMANA` · `🔒 RISCO ZERO INCONDICIONAL` |
| **Headline Hero (Dor)** | *"Pare de Perder Vendas Por Ter um Site Amador Que Não Passa Confiança"* |
| **Headline Hero (Desejo)**| *"Escale Suas Vendas com Funis de Conversão Previsíveis em Menos de 14 Dias"* |
| **Subheadline** | *"A metodologia definitiva que combina neurodesign, velocidade extrema e copywriting cirúrgico para transformar cliques em clientes fiéis."* |
| **CTA Primário** | `"Quero Multiplicar Meus Resultados"`, `"Agendar Diagnóstico Gratuito"`, `"Garantir Minha Vaga com 40% OFF"` |
| **CTA Secundário** | `"Ver Como Funciona na Prática (2 min)"`, `"Falar Direto no WhatsApp"`, `"Calcular Meu Potencial de Escala"` |
| **Bento Grid Cards** | 1. *Engenharia de Alta Fidelidade*; 2. *Proteção & Blindagem*; 3. *Automação 24/7*; 4. *Velocidade Extrema (99+ Lighthouse)* |
| **Selo de Garantia** | *"Experimente por 30 Dias. Se Não Adorar, 100% do Seu Dinheiro de Volta na Sua Conta em 24h."* |

---

## 6. DIRETRIZES DE ACESSIBILIDADE & PERFORMANCE (LIGHTHOUSE 100%)

1. **Acessibilidade (WCAG 2.1 AA)**:
   - Contraste de texto mínimo de 4.5:1 contra o fundo. Nunca use cinza claro em fundo branco ou cinza muito escuro em fundo preto.
   - Todo botão interativo deve ter `aria-label` descritivo caso contenha apenas ícones.
   - Estados de foco nítidos com `focus:ring-2 focus:ring-indigo-500 focus:outline-none`.
2. **Performance Implacável**:
   - Todas as tags `<img>` DEVEM conter `loading="lazy"` e `decoding="async"`.
   - Use Unsplash com parâmetros de compressão otimizados: `?w=800&auto=format&fit=crop&q=80`.
   - Elimine códigos CSS ou bibliotecas pesadas que bloqueiam a renderização inicial.

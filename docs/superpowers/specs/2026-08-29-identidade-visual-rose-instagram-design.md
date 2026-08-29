# Identidade visual do Rose no Instagram (@somosrose.app)

Data: 2026-08-29
Status: aprovado

## Objetivo

Dar ao Instagram do Rose uma identidade visual reconhecível, ancorada 1:1 no design system que o app já usa (`src/app/globals.css`) e na peça `rose_sem_depoimento.png`, e um sistema de prompt reutilizável para gerar posts do pilar educativo/reflexão — sem inventar paleta, tipografia ou tom novos.

## Diagnóstico do estado atual

Levantamento feito em 2026-08-29 no perfil público:

- Grid 100% Reels, nenhum carrossel ou post estático — limita alcance no Explorar e não gera conteúdo salvável.
- Cada reel usa um template de "meme" diferente (fonte/cor variando post a post) — zero consistência visual, conta não é reconhecível fora do nome.
- Bio afirma "+1000 mulheres na Rose" com apenas 9 seguidoras reais — dissonância que quebra confiança.
- Só 1 destaque ("Quem somos").
- Link da bio vai direto para `somosrose.space` sem CTA de download/cadastro diferenciado.

## Fundação visual (idêntica ao app — não negociável)

Fonte única de verdade: `src/app/globals.css`. Nunca declarar cor ou fonte fora desses tokens.

| Token | Valor | Uso no Instagram |
|---|---|---|
| `--color-fundo` | `#FBF6F0` | Fundo de ganchos e frases de fechamento |
| `--color-superficie` | `#FFFDFB` | Cartões/elementos elevados dentro de um post |
| `--color-texto` | `#453C42` | Texto principal |
| `--color-texto-suave` | `#8C7F87` | Texto secundário, legendas |
| `--color-acao` | `#B8697A` | Cor de marca, CTAs, palavras de destaque |
| `--color-destaque` | `#B9A6D4` | Acentos secundários |
| `--color-borda` | `#E8DDD9` | Bordas sutis |
| `--color-pessego-suave` | `#F3CFC1` | Fundo de posts "pra guardar" (citações) |
| `--color-lilas-suave` | `#D8CCE2` | Fundo de slides de desenvolvimento/conteúdo |
| `--color-salvia-suave` | `#DDE5D4` | Fundo de posts mostrando práticas específicas do app |
| `#2C2327` (superfície escura do tema dark) | — | Fundo de slide de CTA/fechamento, mesmo bloco escuro do `rose_sem_depoimento.png` |
| Fraunces (serif, `--font-display`) | — | Títulos e frases-chave, sempre com peso 400–500 |
| Inter (sans, `--font-sans`) | — | Corpo de texto, legendas, rótulos |
| Rosa botânica line-art (logo + `rose_sem_depoimento.png`) | — | Elemento gráfico recorrente (marca d'água, moldura, ícone de fechamento) |

Cada cor pastel carrega um significado fixo (igual à lógica de categorização por cor das Jornadas no app) — não trocar o papel de uma cor entre posts.

Mockup de referência aprovado: ver artifact publicado em 2026-08-29 (carrossel "Comparação social" de 3 slides + citação + demo de prática + frase de fechamento).

## Estrutura do feed

- Carrossel é o formato-âncora, não o Reel. Reels continuam para alcance, mas o carrossel educativo é o que gera salvamento/compartilhamento e constrói a conta organicamente.
- Grid pensado em blocos repetíveis de 3 posts: 1 carrossel educativo (pilar reflexão) + 1 reel de prática do app + 1 post de frase/citação em `--color-fundo` com Fraunces.
- Estrutura de carrossel padrão (4–5 slides):
  1. Gancho — pergunta ou afirmação curta que a leitora reconhece em si. Fundo `--color-fundo`.
  2–3. Desenvolvimento — 1 ideia por slide, frase curta + 1–2 linhas de contexto. Fundo `--color-lilas-suave`.
  4. CTA suave para experimentar a prática correspondente no Rose. Fundo `#2C2327` (bloco escuro), texto claro.

## Sistema de prompt (pilar educativo/reflexão)

Prompt-base reutilizável para gerar carrosséis:

```
Crie um carrossel de Instagram para o Rose (app de diário emocional).

Tom: acolhedor, direto, nunca clínico ou técnico — nunca usar linguagem de
diagnóstico, "sintoma", "transtorno" ou promessas de cura.

Tema: [inserir tema, ex: autocompaixão / comparação social / alimentação
emocional / autoestima / ansiedade do dia a dia]

Estrutura:
- Slide 1 (gancho): pergunta ou afirmação curta que a leitora reconhece em
  si mesma. Fundo #FBF6F0, texto #453C42, palavra de impacto em #B8697A.
- Slides 2–3 (desenvolvimento): 1 ideia por slide, frase curta em Fraunces
  + 1-2 linhas de contexto em Inter. Fundo #D8CCE2.
- Slide final (CTA): convite suave para experimentar a prática
  correspondente no Rose (respiração, diário guiado, meditação,
  autocompaixão). Fundo #2C2327, texto #F3E9E6, botão pill com borda.

Idioma: português neutro (PT-BR/PT-PT), sem gírias regionais nem jargão
terapêutico.

Regras que vêm do próprio produto (não quebrar):
- A Rose não é terapia, não diagnostica, não substitui acompanhamento
  profissional.
- Nunca "você melhorou/piorou", "isso significa que", "a causa é",
  previsões emocionais, "bom/ruim/normal/anormal".
- Linguagem sempre descritiva, nunca prescritiva.
```

Variações do mesmo prompt-base, para quando o conteúdo expandir além de educativo/reflexão:

- **Funcionalidade do app**: trocar a estrutura para 1 problema (slide 1) → prática do Rose que resolve (slides 2–3, com mockup de card do app, fundo `--color-salvia-suave`) → CTA.
- **Depoimento**: gancho com a frase da usuária entre aspas (Fraunces itálico) → contexto breve → CTA de "experimente também".
- **Bastidores**: tom mais pessoal, still respeitando a paleta; sem estrutura fixa de slides.

## Perfil

- Bio nova: *"O diário emocional pra entender seus dias 🌹 Prática guiada em minutos, no seu ritmo. 👇🏻 Comece agora, é grátis"* — remove a alegação de "+1000 mulheres" enquanto não for verificável pelo número real de seguidoras.
- Destaques: adicionar "Como funciona" e "Práticas" além do já existente "Quem somos", usando a mesma iconografia botânica.

## Regras transversais (não negociáveis)

- Nunca introduzir cor, fonte ou elemento gráfico fora dos tokens listados acima.
- Nunca prometer números de usuárias não verificáveis no momento da publicação.
- Copy de post segue as mesmas regras clínicas já estabelecidas para o produto (ver `2026-08-24-evolucao-rose-design.md`): sem diagnóstico, sem linguagem prescritiva, sem promessas de cura.
- Este documento cobre apenas o Instagram do Rose (@somosrose.app). Identidade do Instagram pessoal do fundador fica fora de escopo.

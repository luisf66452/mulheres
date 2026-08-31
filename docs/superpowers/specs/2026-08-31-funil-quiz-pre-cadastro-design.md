# Funil de quiz pré-cadastro (versão intermediária)

## Contexto

O funil atual é: anúncio → `/login` (cria conta) → app completo → onboarding → oferta do Rose Pro só aparece depois de tudo isso. Isso pede o maior nível de compromisso (criar conta) antes de qualquer personalização ou prova de valor — o oposto do que apps do mesmo nicho (BetterMe, Noom) fazem, e o oposto do que os dados de mercado mostram converter melhor: conteúdo interativo (quiz) converte 3-4x mais que página estática, e funis com quiz+trial convertem ~10,9% no paywall contra ~3,6% sem quiz.

## Escopo

**Versão intermediária** (decisão consciente, não a versão completa estilo BetterMe): o quiz, o resultado personalizado e a oferta com preço acontecem **antes** de criar conta — mas o pagamento em si continua exigindo conta criada (código de acesso), porque o checkout do Stripe hoje ([checkout/route.ts](../../../src/app/api/stripe/checkout/route.ts)) exige usuária autenticada e reformular isso é escopo maior, fora deste projeto.

Fora de escopo: pagamento sem conta (versão completa), mudanças no checkout do Stripe, "magnetic page" separada antes do quiz (avaliado e descartado — adiciona um degrau de abandono sem função clara nesse tipo de funil).

## Funil (visão geral)

```
anúncio
  → /comecar            (quiz, 5 perguntas, sem login)
  → /comecar/resultado  (resultado personalizado + oferta com preço)
  → CTA "Quero começar agora" → /login (código de 6 dígitos, já existente)
  → conta criada → onboarding reduzido (só o que é obrigatório)
  → app, já com objetivo/temas sensíveis aplicados
```

## As 5 perguntas do quiz (`/comecar`)

Ordem pensada em compromisso progressivo: emocional/fácil primeiro, dados de personalização depois.

1. **Abertura emocional** (resposta única, não gravada no banco — só usada para a frase de validação no resultado)
   "Qual dessas frases mais parece com você hoje?"
   - "Eu me comparo com outras mulheres o tempo todo"
   - "Eu evito me olhar no espelho"
   - "Eu sei que preciso me cuidar mais, mas não sei por onde começar"
   - "Eu já cuido de mim, mas quero ir mais fundo"

2. **Frequência emocional** (resposta única, não gravada no banco — só usada para o tom da tela de resultado)
   "Com que frequência você se sente insatisfeita com sua imagem corporal?"
   - Quase todo dia / Algumas vezes por semana / De vez em quando / Raramente

3. **Objetivo principal** (resposta única — diferente do app atual, que permite múltipla escolha; reaproveita [OBJETIVOS](../../../src/lib/perfil/personalizacao.ts), gravado em `perfis.objetivos` como array de 1 item na hora de criar a conta)
   Mesmas 7 opções já existentes em `OBJETIVOS` (incluindo a sentinela "Prefiro decidir depois").

4. **Temas sensíveis** (múltipla escolha, reaproveita [TEMAS_SENSIVEIS](../../../src/lib/perfil/personalizacao.ts) tal como já existe, gravado em `perfis.temas_sensiveis`)
   Mesmas 5 opções já existentes (excluindo "prefiro não responder", que já não é gravada hoje).

5. **Tempo disponível** (resposta única, não gravada no banco — só usada na tela de resultado, para reforçar viabilidade)
   "Quanto tempo você consegue reservar por dia pra se cuidar?"
   - Menos de 5 minutos / 5 a 10 minutos / Mais de 10 minutos

## Tela de resultado + oferta (`/comecar/resultado`)

Conteúdo, de cima pra baixo:

1. **Headline personalizada** — usa a resposta da pergunta 3: "Seu plano: [rótulo do objetivo], 5 minutos por dia". Se a resposta for a sentinela "Prefiro decidir depois", usa uma headline genérica: "Seu plano: cuidar de você, 5 minutos por dia" (mesma regra de não gravar a sentinela que já existe em `normalizarObjetivosParaGravar`)
2. **Validação emocional** — usa a resposta da pergunta 1: uma frase de validação por opção, sem estatística inventada (nunca inventar percentuais tipo "X% das mulheres..." sem dado real)
3. **Ajuste de sensibilidade** — usa a resposta da pergunta 4: se "Alimentação" estiver marcada, reforça "sem dieta, sem contagem, sem julgamento"; mensagem genérica de acolhimento se nenhum tema sensível foi marcado
4. **Confirmação de viabilidade** — usa a resposta da pergunta 5: "Seu plano cabe em [resposta] — sem precisar reorganizar sua rotina"
5. **Prova social real** — reaproveita o componente [SeloProvaSocial](../../../src/app/components/inicio/SeloProvaSocial.tsx) já existente ("+500 mulheres já assinam o Rose Pro")
6. **Preço + desconto anual real** — reaproveita a lógica já construída em [planos.ts](../../../src/lib/stripe/planos.ts) (`buscarPrecoDetalhado`, `calcularPercentualEconomiaAnual`); como ainda não há usuária/país confirmado nesta etapa, usa moeda default (BR/`brl`) até o país ser confirmado no onboarding
7. **Garantia** — "Cancele quando quiser, sem multa"
8. **CTA final** — "Quero começar agora" → `/login`

Resposta da pergunta 2 (frequência emocional) informa o tom geral da cópia de validação, mas não tem uma seção dedicada — evita a tela ficar repetitiva.

## Ponte quiz → conta (sem perguntar de novo)

**Armazenamento temporário**: ao concluir o quiz (antes de navegar para `/comecar/resultado`), as respostas das perguntas 3 e 4 (as únicas que são gravadas no banco) são salvas em `localStorage` sob uma chave dedicada (ex.: `rose_quiz_personalizacao`), no mesmo formato de `ObjetivoId[]` / `TemaSensivelId[]` já usado por `OBJETIVOS`/`TEMAS_SENSIVEIS` — sem necessidade de conversão.

**Consumo no onboarding**: [OnboardingClient.tsx](../../../src/app/onboarding/OnboardingClient.tsx), ao montar, verifica se existe essa chave no localStorage:
- Se existir: salva objetivo e temas sensíveis diretamente via as mesmas server actions já existentes (`salvarObjetivos`, `salvarTemasSensiveis`), sem exibir as telas de `SeletorObjetivos`/`SeletorTemasSensiveis` para essa sessão, e limpa a chave do localStorage após salvar com sucesso.
- Se não existir (quiz não feito, navegador diferente, localStorage limpo/bloqueado): comportamento atual, sem nenhuma mudança — pergunta objetivos e temas normalmente.

O onboarding continua pedindo, sempre: consentimento de idade/termos, confirmação de país, e horário de lembrete (nenhum desses é coberto pelo quiz).

**Por que essa ponte é segura**: é estritamente aditiva. Nunca bloqueia nem quebra o fluxo de quem não passou pelo quiz — só melhora a experiência de quem passou. Falha "silenciosamente" (volta a perguntar) em qualquer cenário de perda de dado do navegador.

## Fora de escopo / decisões conscientes

- Pagamento sem conta criada (versão completa estilo BetterMe) — próximo projeto, se este validar bem.
- "Magnetic page" antes do quiz — descartada, sem função clara nesse tipo de funil.
- Nenhuma estatística/percentual inventado na tela de resultado — só dados reais (prova social do +500) ou frases de validação sem número.
- Pergunta 1, 2 e 5 do quiz não são gravadas no banco — existem só para moldar a cópia da tela de resultado, não fazem parte do perfil da usuária.

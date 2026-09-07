# Reposicionamento da landing do ebook: "bagunça mental" (`/ebook`)

## Contexto

A landing `/ebook` ([page.tsx](../../../src/app/ebook/page.tsx)) hoje se posiciona em torno de imagem corporal e autocuidado ("21 dias pra sair do piloto automático", identificação sobre se comparar/evitar o espelho). O pedido foi atacar um problema mais específico: bagunça mental / pensamentos que não param (autocrítica, comparação, ruminação) — o mesmo tipo de conteúdo que o ebook já entrega (journaling, tracker emocional, mapa de vocabulário emocional, 3 fases progressivas), só descrito de outro ângulo.

Restrição importante levantada durante o brainstorm: o produto **não muda**, só a descrição do problema na landing. Isso significa que a nova promessa não pode prometer algo que o ebook não entrega (ex.: produtividade/organização de tarefas). A validação por profissional de saúde é de **uma** psicóloga (singular, sem estudo formal) — a palavra "comprovado" não é usada em lugar nenhum, só "validado", para não configurar propaganda enganosa sob o CDC.

## Escopo

Reescrita de copy pontual em `src/app/ebook/page.tsx`: metadata (title/description), hero (headline, subheadline, nova linha de confiança), bloco de identificação, subheadline da pilha de valor, e o texto da fase 1 de "como funciona". Sem mudança de estrutura, componentes, preços, ou do conteúdo do próprio ebook.

Fora de escopo: qualquer alegação de garantia/reembolso (pendente de confirmação jurídica sobre o direito de arrependimento do CDC, levantado em conversa anterior); prova social com números ou depoimentos (usuário ainda não tem esses dados); mudança no conteúdo do ebook em si.

## Mudanças de copy aprovadas

**Metadata:**
- `title`: "Guia Rose — 21 dias pra silenciar os pensamentos que não param | Ebook por R$ 29,99"
- `description`: "Um guia diário, direto ao ponto: 5 a 10 minutos por dia pra parar de remoer, se comparar e se cobrar. 21 práticas, acesso imediato, pagamento único de R$ 29,99."
- `openGraph.title`/`description` espelham a mesma mudança de ângulo.

**Hero:**
- H1: "21 dias pra silenciar os pensamentos que não te deixam em paz"
- Subheadline: "Um guia diário, direto ao ponto — 5 a 10 minutos por dia pra parar de remoer o mesmo pensamento, de se comparar e de se cobrar. Sem fórmula mágica, sem recomeço toda segunda-feira."
- Bullets de 3 itens: sem mudança (já descrevem mecânica do produto, não o ângulo).
- Nova linha de confiança abaixo dos bullets, antes do card de preço: "✓ Conteúdo validado por uma psicóloga" — informação já usada na seção de autoridade (seção 5), promovida pra perto da oferta principal para reforçar credibilidade mais cedo no funil.

**Identificação:**
- Blockquote: "Você se compara. Se cobra. O mesmo pensamento volta, de novo e de novo. E você sabe que precisa de algo diferente — só não sabe por onde começar."
- Subtexto abaixo: sem mudança ("Comece aqui, no dia 1, exatamente como você está agora.").

**Pilha de valor (intro):**
- H2: sem mudança ("O que você recebe no Guia Rose").
- Subheadline: "Não é um PDF pra ler e esquecer. É uma ferramenta pra organizar o que se passa na sua cabeça, dia após dia, durante 21 dias." — reaproveita a palavra "organizar" da ideia original do usuário, mas como descrição funcional do mecanismo (journaling e mapa de vocabulário emocional literalmente ajudam a nomear/organizar emoção), não como a promessa central da página.

**Como funciona (fase 1):**
- Texto da fase 1 ("Dias 1–7 — Entenda"): "Observe os pensamentos que mais se repetem, a autocobrança e os padrões, com mais clareza." (fases 2 e 3 mantêm o texto atual, já alinhado ao novo ângulo).

**Oferta final:**
- Subtexto: "Você não precisa mudar tudo de uma vez. Só precisa de um primeiro passo pra aquietar a mente — e ele leva 5 minutos."

**Sem mudança:** seção de autoridade (já correta, singular, sem "comprovado"), FAQ, footer, CTAs dos botões, preços, estrutura de componentes.

## Decisão consciente

Não foi adicionada nenhuma alegação de garantia/reembolso nem prova social numérica nesta mudança — ambas dependem de informação factual que o usuário ainda não tem ou não confirmou (ver conversa anterior sobre o direito de arrependimento do CDC art. 49). Qualquer adição futura nessas frentes deve vir com o dado real primeiro.

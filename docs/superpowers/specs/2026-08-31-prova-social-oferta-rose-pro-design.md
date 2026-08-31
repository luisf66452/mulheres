# Prova social na oferta do Rose Pro

## Contexto

O funil de conversão do Rose Pro (modal pós-cadastro + página de planos) não tem nenhum elemento de prova social. O usuário confirmou 500 assinantes pagantes reais do Rose Pro — número a ser exibido para reforçar confiança no momento de decisão.

## Escopo

Adicionar um selo de prova social nas duas telas da oferta:
- [`src/app/components/inicio/OfertaRosePro.tsx`](../../../src/app/components/inicio/OfertaRosePro.tsx) — modal exibido logo após o cadastro
- [`src/app/perfil/assinatura/page.tsx`](../../../src/app/perfil/assinatura/page.tsx) — página de planos

Fora de escopo: preço no modal, garantia, urgência, unificação da lista de benefícios (itens 2-6 da lista de sugestões, não pedidos agora).

## Solução

Componente `SeloProvaSocial` em `src/app/components/inicio/SeloProvaSocial.tsx`, reaproveitado nas duas telas, renderizando:

> 💛 +500 mulheres já assinam o Rose Pro

Posicionado logo abaixo do headline/subtítulo e acima da lista de benefícios em cada tela.

O número "+500" é uma string fixa (não consulta o banco em tempo real) — evita variação para baixo por churn e evita custo de query a cada render. Atualização manual quando o número real crescer significativamente.

## Fora de escopo / decisões conscientes

- Não é dinâmico/consultado do banco.
- Não há teste automatizado dedicado — é uma mudança de copy/apresentação sem lógica de negócio.

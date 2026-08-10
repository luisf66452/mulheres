# Processo de acesso administrativo a dados individuais

Por padrão, ninguém acessa dados ou flags de uma usuária individual (spec de design, seção 9).
Quando um acesso pontual for estritamente necessário (ex: investigar um bug relatado por uma
usuária específica, atender a um pedido de exportação/exclusão de dados dela):

1. Defina o motivo do acesso por escrito antes de acessar.
2. Rode `npx tsx scripts/registrar-acesso.ts <usuaria_id> "<seu email>" "<motivo>"` — isso grava
   o registro em `acessos_administrativos` **antes** de qualquer consulta aos dados dela.
3. Só então consulte os dados necessários no Supabase Studio, usando o mínimo necessário para
   resolver a finalidade descrita no motivo.

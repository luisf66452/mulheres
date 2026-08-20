// Gera supabase/seed_jornada_estruturada.sql a partir do conteúdo TypeScript
// dos 9 módulos. Rodar com: npx tsx scripts/gerarSeedJornadaEstruturada.ts
//
// Cada módulo é validado com validarModuloEstruturado antes de virar SQL —
// se algum estiver malformado, o script falha em vez de gerar SQL quebrado.

import { writeFileSync } from 'node:fs';
import { validarModuloEstruturado } from '../src/lib/jornadas-modulos/validarModulo';
import { SCHEMA_VERSION_MODULO_ATUAL } from '../src/lib/jornadas-modulos/tipos';
import { modulo1EntendendoEmocoes } from '../src/lib/jornadas-modulos/conteudo/modulo1EntendendoEmocoes';
import { modulo2PensamentosNaoSaoFatos } from '../src/lib/jornadas-modulos/conteudo/modulo2PensamentosNaoSaoFatos';
import { modulo3AutocompaixaoAutocritica } from '../src/lib/jornadas-modulos/conteudo/modulo3AutocompaixaoAutocritica';
import { modulo4AnsiedadePreocupacaoRuminacao } from '../src/lib/jornadas-modulos/conteudo/modulo4AnsiedadePreocupacaoRuminacao';
import { modulo5PerfeccionismoMedoFalhar } from '../src/lib/jornadas-modulos/conteudo/modulo5PerfeccionismoMedoFalhar';
import { modulo6ImagemCorporal } from '../src/lib/jornadas-modulos/conteudo/modulo6ImagemCorporal';
import { modulo7LimitesComunicacaoAssertiva } from '../src/lib/jornadas-modulos/conteudo/modulo7LimitesComunicacaoAssertiva';
import { modulo8HabitosAutocuidadoPossivel } from '../src/lib/jornadas-modulos/conteudo/modulo8HabitosAutocuidadoPossivel';
import { modulo9PrevencaoRecaidasPlanoPessoal } from '../src/lib/jornadas-modulos/conteudo/modulo9PrevencaoRecaidasPlanoPessoal';

const JORNADA_ID = '22222222-2222-2222-2222-222222222222';

const MODULOS = [
  { titulo: 'Dia 1: Entendendo minhas emoções', conteudo: modulo1EntendendoEmocoes },
  { titulo: 'Dia 2: Pensamentos não são fatos', conteudo: modulo2PensamentosNaoSaoFatos },
  { titulo: 'Dia 3: Autocompaixão e autocrítica', conteudo: modulo3AutocompaixaoAutocritica },
  { titulo: 'Dia 4: Ansiedade, preocupação e ruminação', conteudo: modulo4AnsiedadePreocupacaoRuminacao },
  { titulo: 'Dia 5: Perfeccionismo e medo de falhar', conteudo: modulo5PerfeccionismoMedoFalhar },
  { titulo: 'Dia 6: Imagem corporal além da aparência', conteudo: modulo6ImagemCorporal },
  { titulo: 'Dia 7: Limites e comunicação assertiva', conteudo: modulo7LimitesComunicacaoAssertiva },
  { titulo: 'Dia 8: Hábitos e autocuidado possível', conteudo: modulo8HabitosAutocuidadoPossivel },
  { titulo: 'Dia 9: Prevenção de recaídas e plano pessoal', conteudo: modulo9PrevencaoRecaidasPlanoPessoal },
];

function sqlString(valor: string): string {
  return `'${valor.replace(/'/g, "''")}'`;
}

function sqlJsonb(valor: unknown): string {
  return `${sqlString(JSON.stringify(valor))}::jsonb`;
}

const linhas: string[] = [];

linhas.push(
  '-- supabase/seed_jornada_estruturada.sql',
  '-- GERADO por scripts/gerarSeedJornadaEstruturada.ts a partir do conteúdo em',
  '-- src/lib/jornadas-modulos/conteudo/ — não edite este arquivo à mão, edite o',
  '-- conteúdo TypeScript e rode `npx tsx scripts/gerarSeedJornadaEstruturada.ts`',
  '-- de novo.',
  '--',
  '-- Conteúdo psicoeducativo baseado em literatura científica revisada (ver',
  '-- docs/EVIDENCE.md), mas AGUARDANDO VALIDAÇÃO DA PSICÓLOGA responsável pelo',
  '-- Rose antes de ir para produção — por isso a jornada é inserida como',
  "-- status = 'rascunho'. A UPDATE final que publica é só para uso em",
  '-- desenvolvimento/E2E local, no mesmo padrão de supabase/seed_jornadas.sql.',
  '',
  `insert into public.jornadas (id, titulo, descricao, duracao_dias, status) values`,
  `  (${sqlString(JORNADA_ID)}, ${sqlString('Fundamentos emocionais: 9 dias de psicoeducação')}, ${sqlString(
    'Nove módulos práticos sobre emoções, pensamentos, autocompaixão, ansiedade, perfeccionismo, imagem corporal, limites, hábitos e prevenção de recaídas — com base em psicologia científica.'
  )}, 9, 'rascunho');`,
  ''
);

linhas.push('insert into public.jornada_atividades (jornada_id, numero_dia, titulo, conteudo, conteudo_estruturado, schema_version) values');
const valoresAtividades = MODULOS.map((m, i) => {
  const validado = validarModuloEstruturado(m.conteudo);
  const conteudoPlano = [validado.objetivo, '', ...validado.explicacao].join('\n\n');
  return `  (${sqlString(JORNADA_ID)}, ${i + 1}, ${sqlString(m.titulo)}, ${sqlString(conteudoPlano)}, ${sqlJsonb(
    validado
  )}, ${SCHEMA_VERSION_MODULO_ATUAL})`;
});
linhas.push(valoresAtividades.join(',\n') + ';', '');

linhas.push(
  '-- Publica para uso em desenvolvimento/E2E local. EM PRODUÇÃO, não rode este',
  '-- UPDATE até o conteúdo passar pela revisão da psicóloga (mesmo padrão do',
  '-- restante do conteúdo do app — ver seed.sql e seed_jornadas.sql).',
  `update public.jornadas set status = 'publicada' where id = ${sqlString(JORNADA_ID)};`,
  ''
);

writeFileSync(new URL('../supabase/seed_jornada_estruturada.sql', import.meta.url), linhas.join('\n'), 'utf-8');

console.log(`OK: gerado supabase/seed_jornada_estruturada.sql com ${MODULOS.length} módulos.`);

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/lib/supabase/types';

async function main() {
  const [usuariaId, acessadoPor, motivo] = process.argv.slice(2);

  if (!usuariaId || !acessadoPor || !motivo) {
    console.error('Uso: npx tsx scripts/registrar-acesso.ts <usuaria_id> "<seu email>" "<motivo>"');
    process.exit(1);
  }

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase
    .from('acessos_administrativos')
    .insert({ usuaria_id: usuariaId, acessado_por: acessadoPor, motivo });

  if (error) {
    console.error('Falha ao registrar acesso:', error.message);
    process.exit(1);
  }

  console.log('Acesso registrado.');
}

main();

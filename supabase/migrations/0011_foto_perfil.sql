-- 0011_foto_perfil.sql
-- Foto de perfil opcional: coluna em perfis + bucket de Storage próprio.

alter table public.perfis add column foto_url text;

-- Bucket público (a foto de perfil, quando existe, é sempre pública — mesmo
-- padrão de qualquer app com avatar visível). Limite de 2MB e só imagens.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatares', 'avatares', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Leitura pública (bucket já é público, mas a policy explícita evita
-- depender só da configuração do bucket).
create policy "leitura publica de avatares" on storage.objects
  for select using (bucket_id = 'avatares');

-- Cada usuária só pode escrever/atualizar/apagar dentro da sua própria pasta
-- (convenção de path: "{usuaria_id}/arquivo.ext"), verificada pelo primeiro
-- segmento do caminho via storage.foldername.
create policy "usuaria envia seu proprio avatar" on storage.objects
  for insert with check (
    bucket_id = 'avatares' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "usuaria atualiza seu proprio avatar" on storage.objects
  for update using (
    bucket_id = 'avatares' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "usuaria remove seu proprio avatar" on storage.objects
  for delete using (
    bucket_id = 'avatares' and (storage.foldername(name))[1] = auth.uid()::text
  );

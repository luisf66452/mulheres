-- 20260902120000_bucket_ebooks.sql
-- Bucket privado para o PDF do ebook "Rose Reset 21 dias" — diferente do
-- bucket 'avatares' (público), este nunca tem leitura pública: o download só
-- é liberado via signed URL de curta duração, depois que o pagamento é
-- confirmado no Stripe (ver /ebook/obrigado). Upload do PDF em si é manual,
-- via Supabase Studio — fora do escopo desta migration.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ebooks', 'ebooks', false, 10485760, array['application/pdf'])
on conflict (id) do nothing;

-- Nenhuma policy de storage.objects criada de propósito: sem policy de
-- select/insert/update/delete, só o service role (que ignora RLS) acessa o
-- bucket. Isso é intencional — o app nunca deixa a usuária final escrever ou
-- listar objetos deste bucket diretamente.

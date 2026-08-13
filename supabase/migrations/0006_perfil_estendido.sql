-- Campos adicionais de perfil usados na reformulação da tela Perfil.
-- Todos aditivos e não-destrutivos, mesmo padrão de 0005_nome_perfil.sql.
alter table public.perfis add column frase_pessoal text;
alter table public.perfis add column faixa_etaria text;
alter table public.perfis add column fuso_horario text not null default 'America/Sao_Paulo';
alter table public.perfis add column idioma text not null default 'pt-BR';

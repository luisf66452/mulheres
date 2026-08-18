'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import Botao from '@/app/components/Botao';
import { atualizarPerfilCompleto, solicitarTrocaEmail } from './actions';
import type { ErrosEdicaoPerfil } from '@/lib/perfil/validacaoPerfil';
import { FUSOS_HORARIOS } from '@/lib/perfil/fusosHorarios';
import FotoPerfilUpload from './FotoPerfilUpload';

const FAIXAS_ETARIAS = [
  { valor: '', rotulo: 'Prefiro não informar' },
  { valor: '18-24', rotulo: '18–24' },
  { valor: '25-34', rotulo: '25–34' },
  { valor: '35-44', rotulo: '35–44' },
  { valor: '45-54', rotulo: '45–54' },
  { valor: '55+', rotulo: '55+' },
] as const;

const CAMPO_CLASSE =
  'mt-1 block w-full rounded-2xl border border-borda bg-superficie p-3 text-texto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acao/60';

function formatarDataCriacao(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(iso)
  );
}

export default function EditarPerfilForm({
  usuariaId,
  nomeAtual,
  frasePessoalAtual,
  faixaEtariaAtual,
  fusoHorarioAtual,
  fotoUrlAtual,
  email,
  criadoEm,
}: {
  usuariaId: string;
  nomeAtual: string | null;
  frasePessoalAtual: string | null;
  faixaEtariaAtual: string | null;
  fusoHorarioAtual: string;
  fotoUrlAtual: string | null;
  email: string;
  criadoEm: string;
}) {
  const [nome, setNome] = useState(nomeAtual ?? '');
  const [frasePessoal, setFrasePessoal] = useState(frasePessoalAtual ?? '');
  const [faixaEtaria, setFaixaEtaria] = useState(faixaEtariaAtual ?? '');
  const [fusoHorario, setFusoHorario] = useState(fusoHorarioAtual);
  const [erros, setErros] = useState<ErrosEdicaoPerfil>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);
  const [salvando, startTransition] = useTransition();

  const [alterandoEmail, setAlterandoEmail] = useState(false);
  const [novoEmail, setNovoEmail] = useState('');
  const [statusEmail, setStatusEmail] = useState<{ tipo: 'erro' | 'sucesso'; mensagem: string } | null>(
    null
  );
  const [enviandoEmail, startTransitionEmail] = useTransition();

  function handleSalvar() {
    setErros({});
    setErroGeral(null);
    setSalvo(false);
    startTransition(async () => {
      const resultado = await atualizarPerfilCompleto({
        nome,
        frasePessoal,
        faixaEtaria,
        fusoHorario,
        idioma: 'pt-BR',
      });
      if (resultado.erros) {
        setErros(resultado.erros);
        return;
      }
      if (resultado.erroGeral) {
        setErroGeral(resultado.erroGeral);
        return;
      }
      setSalvo(true);
      setTimeout(() => setSalvo(false), 4000);
    });
  }

  function handleSolicitarTrocaEmail() {
    setStatusEmail(null);
    startTransitionEmail(async () => {
      const resultado = await solicitarTrocaEmail(novoEmail);
      if (resultado.erro) {
        setStatusEmail({ tipo: 'erro', mensagem: resultado.erro });
        return;
      }
      setStatusEmail({
        tipo: 'sucesso',
        mensagem: 'Enviamos um link de confirmação para o novo e-mail. Sua troca só é concluída depois que você confirmar por lá.',
      });
      setNovoEmail('');
    });
  }

  return (
    <div className="space-y-6">
      <FotoPerfilUpload usuariaId={usuariaId} nome={nomeAtual} fotoUrlAtual={fotoUrlAtual} />

      <div className="space-y-4">
        <label className="block text-texto">
          Nome
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Seu nome"
            className={CAMPO_CLASSE}
            maxLength={80}
          />
          {erros.nome && <p className="mt-1 text-sm text-alerta">{erros.nome}</p>}
        </label>

        <label className="block text-texto">
          Frase pessoal (opcional)
          <input
            type="text"
            value={frasePessoal}
            onChange={(e) => setFrasePessoal(e.target.value)}
            placeholder="Uma frase curta que te representa"
            className={CAMPO_CLASSE}
            maxLength={80}
          />
          <p className="mt-1 text-xs text-texto-suave">{frasePessoal.length}/80</p>
          {erros.frasePessoal && <p className="mt-1 text-sm text-alerta">{erros.frasePessoal}</p>}
        </label>

        <label className="block text-texto">
          Faixa etária (opcional)
          <select value={faixaEtaria} onChange={(e) => setFaixaEtaria(e.target.value)} className={CAMPO_CLASSE}>
            {FAIXAS_ETARIAS.map((opcao) => (
              <option key={opcao.valor} value={opcao.valor}>
                {opcao.rotulo}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-texto">
          Fuso horário
          <select
            value={fusoHorario}
            onChange={(e) => setFusoHorario(e.target.value)}
            className={CAMPO_CLASSE}
          >
            {FUSOS_HORARIOS.map((opcao) => (
              <option key={opcao.valor} value={opcao.valor}>
                {opcao.rotulo}
              </option>
            ))}
          </select>
          {erros.fusoHorario && <p className="mt-1 text-sm text-alerta">{erros.fusoHorario}</p>}
        </label>

        <label className="block text-texto">
          Idioma
          <p className={`${CAMPO_CLASSE} text-texto-suave`}>Português</p>
          <p className="mt-1 text-xs text-texto-suave">O Rose está disponível em português por enquanto.</p>
        </label>
      </div>

      {erroGeral && (
        <p role="alert" className="text-sm text-alerta">
          {erroGeral}
        </p>
      )}
      {salvo && (
        <p role="status" className="text-sm text-acao">
          Alterações salvas.
        </p>
      )}

      <div className="flex gap-3">
        <Botao onClick={handleSalvar} disabled={salvando}>
          {salvando ? 'Salvando...' : 'Salvar alterações'}
        </Botao>
        <Link href="/perfil" className="flex-1">
          <Botao variante="secundaria" type="button">
            Cancelar
          </Botao>
        </Link>
      </div>

      <div className="space-y-3 border-t border-borda pt-6">
        <div>
          <p className="text-xs text-texto-suave">E-mail</p>
          <p className="text-texto">{email}</p>
        </div>
        <div>
          <p className="text-xs text-texto-suave">Conta criada em</p>
          <p className="text-texto">{formatarDataCriacao(criadoEm)}</p>
        </div>

        {!alterandoEmail ? (
          <button
            type="button"
            onClick={() => setAlterandoEmail(true)}
            className="text-sm font-medium text-acao underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acao/60"
          >
            Alterar e-mail
          </button>
        ) : (
          <div className="space-y-2">
            <label className="block text-texto">
              Novo e-mail
              <input
                type="email"
                value={novoEmail}
                onChange={(e) => setNovoEmail(e.target.value)}
                placeholder="novo@email.com"
                className={CAMPO_CLASSE}
              />
            </label>
            <p className="text-xs text-texto-suave">
              Enviaremos um link de confirmação para o novo endereço — o e-mail só muda depois que você
              confirmar.
            </p>
            {statusEmail && (
              <p
                role={statusEmail.tipo === 'erro' ? 'alert' : 'status'}
                className={`text-sm ${statusEmail.tipo === 'erro' ? 'text-alerta' : 'text-acao'}`}
              >
                {statusEmail.mensagem}
              </p>
            )}
            <div className="flex gap-3">
              <Botao onClick={handleSolicitarTrocaEmail} disabled={enviandoEmail}>
                {enviandoEmail ? 'Enviando...' : 'Enviar confirmação'}
              </Botao>
              <Botao
                variante="secundaria"
                type="button"
                onClick={() => {
                  setAlterandoEmail(false);
                  setStatusEmail(null);
                  setNovoEmail('');
                }}
              >
                Cancelar
              </Botao>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

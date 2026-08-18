import { describe, it, expect } from 'vitest';
import {
  estaNaJanelaDeEnvio,
  minutosDoDiaNoFuso,
  diaDaSemanaNoFuso,
  dataLocalISONoFuso,
} from './timeWindow';

describe('estaNaJanelaDeEnvio', () => {
  it('retorna true quando o horário local está dentro da janela de tolerância do horário preferido', () => {
    // 12:45 UTC = 09:45 em America/Sao_Paulo (UTC-3)
    const agora = new Date(Date.UTC(2026, 7, 10, 12, 45));
    expect(estaNaJanelaDeEnvio('09:00', agora, 'America/Sao_Paulo')).toBe(true);
  });

  it('retorna false quando o horário local está fora da janela de tolerância', () => {
    // 15:05 UTC = 12:05 em America/Sao_Paulo — mais de 90 min de 09:00
    const agora = new Date(Date.UTC(2026, 7, 10, 15, 5));
    expect(estaNaJanelaDeEnvio('09:00', agora, 'America/Sao_Paulo')).toBe(false);
  });

  it('respeita os minutos do horário preferido, não só a hora', () => {
    // 09:00 America/Sao_Paulo = 12:00 UTC
    const agora = new Date(Date.UTC(2026, 7, 10, 12, 0));
    // 18:30 está a 9h30 de distância de 09:00 — bem fora de qualquer janela razoável
    expect(estaNaJanelaDeEnvio('18:30', agora, 'America/Sao_Paulo', 90)).toBe(false);
    // mas 09:20 está a só 20 min de 09:00 — dentro da janela
    expect(estaNaJanelaDeEnvio('09:20', agora, 'America/Sao_Paulo', 90)).toBe(true);
  });

  it('considera a virada da meia-noite ao calcular a diferença', () => {
    // 23:50 local, preferido 00:10 local — só 20 min de diferença, não 1420
    const agora = new Date(Date.UTC(2026, 7, 11, 2, 50)); // 23:50 em UTC-3
    expect(estaNaJanelaDeEnvio('00:10', agora, 'America/Sao_Paulo', 30)).toBe(true);
  });

  it('usa o fuso horário da usuária, não o fuso do processo', () => {
    // 12:00 UTC = 09:00 em America/Sao_Paulo, mas 13:00 em Europe/Lisbon (verão)
    const agora = new Date(Date.UTC(2026, 7, 10, 12, 0));
    expect(estaNaJanelaDeEnvio('09:00', agora, 'America/Sao_Paulo')).toBe(true);
    expect(estaNaJanelaDeEnvio('09:00', agora, 'Europe/Lisbon')).toBe(false);
  });

  it('retorna false quando não há horário preferido', () => {
    const agora = new Date(Date.UTC(2026, 7, 10, 12, 5));
    expect(estaNaJanelaDeEnvio(null, agora, 'America/Sao_Paulo')).toBe(false);
  });

  it('retorna false para um valor de horário inválido em vez de lançar erro', () => {
    const agora = new Date(Date.UTC(2026, 7, 10, 12, 5));
    expect(estaNaJanelaDeEnvio('não-é-hora', agora, 'America/Sao_Paulo')).toBe(false);
  });

  it('cai de volta para UTC se o fuso for inválido, sem quebrar', () => {
    // 09:30 UTC — com fallback para UTC, "09:00" cai dentro da janela padrão.
    const agora = new Date(Date.UTC(2026, 7, 10, 9, 30));
    expect(estaNaJanelaDeEnvio('09:00', agora, 'fuso-que-nao-existe')).toBe(true);
  });
});

describe('minutosDoDiaNoFuso', () => {
  it('converte um instante UTC para minutos desde a meia-noite local', () => {
    const agora = new Date(Date.UTC(2026, 7, 10, 12, 30));
    expect(minutosDoDiaNoFuso(agora, 'America/Sao_Paulo')).toBe(9 * 60 + 30);
  });
});

describe('diaDaSemanaNoFuso', () => {
  it('retorna o dia da semana local, não o dia UTC, perto da virada da meia-noite', () => {
    // 2026-08-10 é uma segunda-feira. 01:30 UTC de terça já é 22:30 de segunda em UTC-3.
    const agora = new Date(Date.UTC(2026, 7, 11, 1, 30));
    expect(diaDaSemanaNoFuso(agora, 'America/Sao_Paulo')).toBe(1); // segunda
    expect(diaDaSemanaNoFuso(agora, 'UTC')).toBe(2); // terça
  });
});

describe('dataLocalISONoFuso', () => {
  it('retorna a data local em vez da data UTC perto da virada do dia', () => {
    const agora = new Date(Date.UTC(2026, 7, 11, 1, 30));
    expect(dataLocalISONoFuso(agora, 'America/Sao_Paulo')).toBe('2026-08-10');
    expect(dataLocalISONoFuso(agora, 'UTC')).toBe('2026-08-11');
  });
});

import { render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import RegistrarServiceWorker from './RegistrarServiceWorker';

describe('RegistrarServiceWorker', () => {
  const registerMock = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    registerMock.mockClear();
    Object.defineProperty(window.navigator, 'serviceWorker', {
      configurable: true,
      value: { register: registerMock },
    });
  });

  const originalReadyState = document.readyState;

  afterEach(() => {
    vi.unstubAllEnvs();
    Object.defineProperty(document, 'readyState', {
      configurable: true,
      value: originalReadyState,
    });
  });

  it('registra /sw.js em producao, apos o load da pagina', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    render(<RegistrarServiceWorker />);

    window.dispatchEvent(new Event('load'));

    await waitFor(() => expect(registerMock).toHaveBeenCalledWith('/sw.js'));
  });

  it('registra /sw.js imediatamente quando o load ja disparou antes do effect (document.readyState === "complete")', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    Object.defineProperty(document, 'readyState', {
      configurable: true,
      value: 'complete',
    });

    render(<RegistrarServiceWorker />);

    await waitFor(() => expect(registerMock).toHaveBeenCalledWith('/sw.js'));
  });

  it('nao registra fora de producao', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    render(<RegistrarServiceWorker />);

    window.dispatchEvent(new Event('load'));

    await new Promise((r) => setTimeout(r, 0));
    expect(registerMock).not.toHaveBeenCalled();
  });
});

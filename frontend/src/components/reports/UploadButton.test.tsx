import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UploadButton } from './UploadButton';

// Mock useUpload hook — UploadButton's own logic (size validation, rendering per
// status) is what's under test here; useUpload's internals are covered by T12's tests.
const mockUpload = vi.fn();
const mockRetryUpload = vi.fn();
const mockReset = vi.fn();
let mockStatus = 'idle';
let mockError: string | null = null;
let mockProgress = 0;

vi.mock('../../hooks', () => ({
  useUpload: () => ({
    status: mockStatus,
    progress: mockProgress,
    error: mockError,
    upload: mockUpload,
    retryUpload: mockRetryUpload,
    reset: mockReset,
  }),
}));

function openDialog() {
  fireEvent.click(screen.getByText('Enviar Relatório'));
}

function makeFile(sizeInBytes: number, name = 'report.pdf', type = 'application/pdf'): File {
  const file = new File(['x'], name, { type });
  Object.defineProperty(file, 'size', { value: sizeInBytes });
  return file;
}

describe('UploadButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStatus = 'idle';
    mockError = null;
    mockProgress = 0;
  });

  // Done when: switch de status inclui case 'ttl-expired' com ícone Clock + texto
  // "Tempo expirado — Tentar novamente"
  it('renders ttl-expired state with the correct message', () => {
    mockStatus = 'ttl-expired';
    render(<UploadButton />);
    openDialog();

    expect(screen.getByText('Tempo expirado — Tentar novamente')).toBeInTheDocument();
  });

  // Done when: botão clicável no estado ttl-expired chama retryUpload()
  it('clicking the retry button in ttl-expired state calls retryUpload', () => {
    mockStatus = 'ttl-expired';
    render(<UploadButton />);
    openDialog();

    const retryBtn = document.getElementById('upload-retry-btn');
    expect(retryBtn).not.toBeNull();
    fireEvent.click(retryBtn!);

    expect(mockRetryUpload).toHaveBeenCalledTimes(1);
  });

  // Done when: validação de tamanho (50MB) no handleFileChange antes de chamar upload(file)
  // Spec P1 Validação AC2: rejeitar no frontend antes de qualquer chamada ao backend,
  // exibindo mensagem de tamanho excedido.
  it('rejects a file larger than 50MB with the correct message and does not call upload', () => {
    render(<UploadButton />);
    openDialog();

    const input = document.getElementById('upload-file-input') as HTMLInputElement;
    const oversizedFile = makeFile(52_428_801); // 50MB + 1 byte
    fireEvent.change(input, { target: { files: [oversizedFile] } });

    expect(screen.getByText('Arquivo muito grande (máx. 50 MB)')).toBeInTheDocument();
    expect(mockUpload).not.toHaveBeenCalled();
  });

  // Done when: renderiza todos os 6 estados (idle, requesting, uploading, success, error, ttl-expired)
  it('renders all 6 upload states with their expected content', () => {
    const cases: Array<{ status: string; progress?: number; error?: string | null; expected: string }> = [
      { status: 'idle', expected: 'Clique para selecionar' },
      { status: 'requesting', expected: 'Obtendo token de upload...' },
      { status: 'uploading', progress: 42, expected: 'Enviando arquivo... 42%' },
      { status: 'success', expected: 'Upload concluído!' },
      { status: 'error', error: 'Erro durante o upload.', expected: 'Erro durante o upload.' },
      { status: 'ttl-expired', expected: 'Tempo expirado — Tentar novamente' },
    ];

    for (const testCase of cases) {
      mockStatus = testCase.status;
      mockProgress = testCase.progress ?? 0;
      mockError = testCase.error ?? null;

      const { unmount } = render(<UploadButton />);
      openDialog();

      expect(screen.getByText(testCase.expected)).toBeInTheDocument();

      unmount();
    }
  });
});

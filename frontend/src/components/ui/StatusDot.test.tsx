import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusDot } from './StatusDot';
import type { ReportStatus } from '../../types';

const statusLabels: Array<[ReportStatus, string]> = [
  ['PENDING', 'Pendente'],
  ['AVAILABLE', 'Disponível'],
  ['PROCESSING', 'Processando'],
  ['ERROR', 'Erro'],
  ['EXPIRED', 'Expirado'],
];

describe('StatusDot', () => {
  it.each(statusLabels)('renders the pt-BR label for each API status: %s -> %s', (status, label) => {
    render(<StatusDot status={status} />);

    expect(screen.getByText(label)).toBeInTheDocument();
  });

  // 'available' is the lowercase value the frontend used before it mirrored the API.
  it.each(['ARCHIVED', 'available'])('renders Desconhecido for a status outside the contract: %s', (status) => {
    render(<StatusDot status={status} />);

    expect(screen.getByText('Desconhecido')).toBeInTheDocument();
    expect(screen.queryByText('Disponível')).not.toBeInTheDocument();
  });
});

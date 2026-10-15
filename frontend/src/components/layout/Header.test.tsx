import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Header } from './Header';

describe('Header', () => {
  it('renders the default title and subtitle', () => {
    render(<Header />);

    expect(screen.getByRole('heading', { level: 1, name: 'Central de Relatórios' })).toBeInTheDocument();
    expect(screen.getByText('Seus documentos fiscais, guardados e à mão.')).toBeInTheDocument();
  });

  it('renders the action inside the header', () => {
    render(<Header action={<button type="button">Enviar Relatório</button>} />);

    const header = screen.getByRole('banner');
    expect(header).toContainElement(screen.getByRole('button', { name: 'Enviar Relatório' }));
  });

  it('renders no action wrapper without an action', () => {
    render(<Header />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

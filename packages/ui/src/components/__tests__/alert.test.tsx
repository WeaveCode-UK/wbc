import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Alert } from '../alert';

describe('Alert component', () => {
  it('renders with role=alert', () => {
    render(<Alert>Warning message</Alert>);
    expect(screen.getByRole('alert')).toHaveTextContent('Warning message');
  });

  it('renders icon when provided', () => {
    render(<Alert icon={<span data-testid="alert-icon">!</span>}>Msg</Alert>);
    expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
  });

  it('applies variant styles', () => {
    render(<Alert variant="danger">Error</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert.className).toContain('danger');
  });
});

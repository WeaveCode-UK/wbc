import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Input } from '../input';

describe('Input component', () => {
  it('renders with label', () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('shows error message with role=alert', () => {
    render(<Input label="Name" error="Required" />);
    const error = screen.getByRole('alert');
    expect(error).toHaveTextContent('Required');
  });

  it('sets aria-invalid when error is present', () => {
    render(<Input label="Phone" error="Invalid" />);
    expect(screen.getByLabelText('Phone')).toHaveAttribute('aria-invalid', 'true');
  });

  it('links error via aria-describedby', () => {
    render(<Input label="Test" id="test-input" error="Bad" />);
    const input = screen.getByLabelText('Test');
    expect(input).toHaveAttribute('aria-describedby', 'test-input-error');
  });

  it('shows helper text when no error', () => {
    render(<Input label="Hint" id="hint" helper="Enter value" />);
    expect(screen.getByText('Enter value')).toBeInTheDocument();
  });

  it('hides helper when error is present', () => {
    render(<Input label="X" error="Bad" helper="Good" />);
    expect(screen.queryByText('Good')).not.toBeInTheDocument();
  });
});

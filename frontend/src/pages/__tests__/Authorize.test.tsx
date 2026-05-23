import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import Authorize from '../Authorize';
import * as api from '../../lib/api';

vi.mock('../../lib/api', () => ({
  login: vi.fn(),
}));

describe('Authorize', () => {
  it('renders the authorize button', () => {
    render(<Authorize />);
    expect(screen.getByRole('button', { name: 'Authorize with Google' })).toBeInTheDocument();
  });

  it('calls login when the button is clicked', () => {
    render(<Authorize />);
    fireEvent.click(screen.getByRole('button', { name: 'Authorize with Google' }));
    expect(api.login).toHaveBeenCalledTimes(1);
  });
});

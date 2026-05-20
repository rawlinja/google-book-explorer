import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Nav from '../Nav';
import * as api from '../../lib/api';
import userSessionStore from '../../store';

vi.mock('../../lib/api', () => ({
  logout: vi.fn().mockResolvedValue(undefined),
  login: vi.fn(),
  getMe: vi.fn(),
}));

describe('Nav', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userSessionStore.setState({ isLoggedIn: false, expiresAt: null, checking: false });
  });

  it('renders nothing when not logged in', () => {
    const { container } = render(<Nav />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the brand and sign out button when logged in', () => {
    userSessionStore.setState({ isLoggedIn: true, expiresAt: 9999999, checking: false });
    render(<Nav />);
    expect(screen.getByText('Google Book Explorer')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
  });

  it('clears session state and calls the logout API when sign out is clicked', async () => {
    userSessionStore.setState({ isLoggedIn: true, expiresAt: 9999999, checking: false });
    render(<Nav />);

    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));

    await waitFor(() => expect(api.logout).toHaveBeenCalledTimes(1));
    expect(userSessionStore.getState().isLoggedIn).toBe(false);
    expect(userSessionStore.getState().expiresAt).toBeNull();
  });
});

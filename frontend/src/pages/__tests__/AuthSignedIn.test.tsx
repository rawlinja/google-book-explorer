import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AuthSignedIn from '../AuthSignedIn';
import * as api from '../../lib/api';
import userSessionStore from '../../store';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../lib/api', () => ({
  getMe: vi.fn(),
}));

function renderComponent() {
  return render(
    <MemoryRouter>
      <AuthSignedIn />
    </MemoryRouter>,
  );
}

describe('AuthSignedIn', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userSessionStore.setState({ isLoggedIn: false, expiresAt: null, checking: true });
  });

  it('renders the loading message', () => {
    vi.mocked(api.getMe).mockResolvedValue(null);
    renderComponent();
    expect(screen.getByText('Finishing sign-in…')).toBeInTheDocument();
  });

  it('sets session state and navigates to /books on successful auth', async () => {
    vi.mocked(api.getMe).mockResolvedValue({ isLoggedIn: true, expiresAt: 9999999 });
    renderComponent();

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/books'));
    expect(userSessionStore.getState().isLoggedIn).toBe(true);
    expect(userSessionStore.getState().expiresAt).toBe(9999999);
  });

  it('navigates to /authorize when getMe returns null', async () => {
    vi.mocked(api.getMe).mockResolvedValue(null);
    renderComponent();

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/authorize'));
    expect(userSessionStore.getState().isLoggedIn).toBe(false);
  });

  it('navigates to /authorize when getMe throws', async () => {
    vi.mocked(api.getMe).mockRejectedValue(new Error('network error'));
    renderComponent();

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/authorize'));
    expect(userSessionStore.getState().isLoggedIn).toBe(false);
  });
});

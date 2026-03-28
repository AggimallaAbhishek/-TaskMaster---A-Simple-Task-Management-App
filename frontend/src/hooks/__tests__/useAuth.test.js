import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from '../../hooks/useAuth';
import apiClient from '../../api/client';

// Mock the API client
vi.mock('../../api/client', () => ({
  default: {
    checkAuth: vi.fn(),
    logout: vi.fn(),
  },
}));

describe('useAuth hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should check auth status on mount', async () => {
    const mockUser = { id: 1, username: 'testuser' };
    apiClient.checkAuth.mockResolvedValueOnce(mockUser);

    const { result } = renderHook(() => useAuth());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(apiClient.checkAuth).toHaveBeenCalledOnce();
  });

  it('should handle auth check failure', async () => {
    apiClient.checkAuth.mockRejectedValueOnce(new Error('Auth failed'));

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Auth check failure is silent (user just isn't logged in)
    expect(result.current.user).toBeNull();
    expect(result.current.error).toBe('');
  });

  it('should provide login function', () => {
    apiClient.checkAuth.mockResolvedValueOnce(null);

    const { result } = renderHook(() => useAuth());

    // Mock window.location.href
    delete window.location;
    window.location = { href: '' };

    act(() => {
      result.current.login();
    });

    expect(window.location.href).toContain('/auth/google');
  });

  it('should handle logout', async () => {
    const mockUser = { id: 1, username: 'testuser' };
    apiClient.checkAuth.mockResolvedValueOnce(mockUser);
    apiClient.logout.mockResolvedValueOnce(null);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(apiClient.logout).toHaveBeenCalledOnce();
  });

  it('should handle logout failure gracefully', async () => {
    const mockUser = { id: 1, username: 'testuser' };
    apiClient.checkAuth.mockResolvedValueOnce(mockUser);
    apiClient.logout.mockRejectedValueOnce(new Error('Logout failed'));

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.error).toContain('Failed to logout');
  });
});

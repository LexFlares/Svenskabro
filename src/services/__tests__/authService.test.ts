import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService } from '../authService';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  },
}));

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should exist', () => {
    expect(authService).toBeDefined();
  });

  it('should have signIn method', () => {
    expect(authService.signIn).toBeDefined();
    expect(typeof authService.signIn).toBe('function');
  });

  it('should have signOut method', () => {
    expect(authService.signOut).toBeDefined();
    expect(typeof authService.signOut).toBe('function');
  });

  it('should have getCurrentUser method', () => {
    expect(authService.getCurrentUser).toBeDefined();
    expect(typeof authService.getCurrentUser).toBe('function');
  });
});

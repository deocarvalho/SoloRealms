import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProgressTracker } from '../ProgressTracker';
import { supabase } from '@/lib/supabase';
import { UserProgress } from '@/types/book';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn()
  }
}));

describe('ProgressTracker', () => {
  const mockUserId = 'test-user-123';
  const mockBookId = 1;
  const mockEntryId = 'entry1';
  const mockChoice = 'choice1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProgress', () => {
    it('should return null when no progress exists', async () => {
      setupSupabaseMock({ maybeSingleData: null });
      const tracker = new ProgressTracker(mockUserId);
      const progress = await tracker.getProgress(mockBookId);
      expect(progress).toBeNull();
    });

    it('should return existing progress', async () => {
      const dbProgress = {
        user_id: mockUserId,
        book_id: mockBookId,
        current_entry_id: mockEntryId,
        visited_entries: [mockEntryId],
        choices: [{ entry_id: mockEntryId, choice: mockChoice }],
        completed_at: undefined
      } as any;
      setupSupabaseMock({ maybeSingleData: dbProgress });
      const tracker = new ProgressTracker(mockUserId);
      const progress = await tracker.getProgress(mockBookId);
      expect(progress).toEqual({
        userId: mockUserId,
        bookId: mockBookId,
        currentEntryId: mockEntryId,
        visitedEntries: [mockEntryId],
        choices: [{ entryId: mockEntryId, choice: mockChoice }],
        completedAt: undefined
      });
    });

    it('should handle database errors', async () => {
      setupSupabaseMock({ maybeSingleError: new Error('Database error') as any });
      const tracker = new ProgressTracker(mockUserId);
      const progress = await tracker.getProgress(mockBookId);
      expect(progress).toBeNull();
    });
  });

  describe('updateProgress', () => {
    it('should create new progress when none exists', async () => {
      setupSupabaseMock({ maybeSingleData: null });
      const tracker = new ProgressTracker(mockUserId);
      await tracker.updateProgress(mockBookId, mockEntryId, mockChoice);
      expect(supabase.from).toHaveBeenCalledWith('user_progress');
    });

    it('should update existing progress', async () => {
      const dbProgress = {
        user_id: mockUserId,
        book_id: mockBookId,
        current_entry_id: 'oldEntry',
        visited_entries: ['oldEntry'],
        choices: [{ entry_id: 'oldEntry', choice: 'oldChoice' }],
        completed_at: undefined
      } as any;
      setupSupabaseMock({ maybeSingleData: dbProgress });
      const tracker = new ProgressTracker(mockUserId);
      await tracker.updateProgress(mockBookId, mockEntryId, mockChoice);
      expect(supabase.from).toHaveBeenCalledWith('user_progress');
    });

    it('should mark progress as completed when isEnd is true', async () => {
      setupSupabaseMock({ maybeSingleData: null });
      const tracker = new ProgressTracker(mockUserId);
      await tracker.updateProgress(mockBookId, mockEntryId, mockChoice, true);
      expect(supabase.from).toHaveBeenCalledWith('user_progress');
    });
  });

  describe('clearProgress', () => {
    it('should delete progress for the book', async () => {
      setupSupabaseMock();
      const tracker = new ProgressTracker(mockUserId);
      await tracker.clearProgress(mockBookId);
      expect(supabase.from).toHaveBeenCalledWith('user_progress');
    });

    it('should throw error if deletion fails', async () => {
      const mockError = new Error('Delete failed');
      setupSupabaseMock({ deleteError: mockError as any });
      const tracker = new ProgressTracker(mockUserId);
      await expect(tracker.clearProgress(mockBookId)).rejects.toThrow(mockError);
    });
  });
});

// Helper function to setup Supabase mock with full chaining
function setupSupabaseMock({ maybeSingleData = null, maybeSingleError = null, upsertData = null, upsertError = null, deleteError = null } = {}) {
  // Chainable mock object
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: maybeSingleData, error: maybeSingleError }),
    upsert: vi.fn().mockResolvedValue({ data: upsertData, error: upsertError }),
    // delete().eq().eq() chain
    delete: vi.fn(),
  };
  // For delete().eq().eq(), each eq returns the same object, and then() is available
  const eqChain = {
    eq: undefined as any,
    then: (resolve: (value: any) => void, reject: (reason?: any) => void) => {
      if (deleteError) {
        reject(deleteError);
      } else {
        resolve({ data: null, error: null });
      }
    },
    catch: (reject: (reason?: any) => void) => {
      if (deleteError) reject(deleteError);
    }
  };
  eqChain.eq = () => eqChain;
  chain.delete = vi.fn().mockReturnValue(eqChain);

  vi.mocked(supabase.from).mockReturnValue(chain as any);
  return chain;
} 
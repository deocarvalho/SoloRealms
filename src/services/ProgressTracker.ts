import { UserProgress } from '@/types/book';
import { supabase } from '@/lib/supabase';

export class ProgressTracker {
  constructor(private readonly userId: string) {}

  async getProgress(bookId: number): Promise<UserProgress | null> {
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', this.userId)
      .eq('book_id', bookId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching progress:', error);
      return null;
    }

    if (!data) return null;

    return {
      userId: data.user_id,
      bookId: data.book_id,
      currentEntryId: data.current_entry_id,
      visitedEntries: data.visited_entries,
      choices: data.choices,
      completedAt: data.completed_at
    };
  }

  async saveProgress(progress: UserProgress): Promise<void> {
    const { error } = await supabase
      .from('user_progress')
      .upsert({
        user_id: progress.userId,
        book_id: progress.bookId,
        current_entry_id: progress.currentEntryId,
        visited_entries: progress.visitedEntries,
        choices: progress.choices,
        completed_at: progress.completedAt,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,book_id',
        ignoreDuplicates: false
      });

    if (error) {
      console.error('Error saving progress:', error);
      throw error;
    }
  }

  async updateProgress(bookId: number, entryId: string, choice?: string, isEnd?: boolean): Promise<void> {
    const progress = await this.getProgress(bookId) || {
      userId: this.userId,
      bookId,
      currentEntryId: entryId,
      visitedEntries: [],
      choices: []
    };

    // Update current entry
    progress.currentEntryId = entryId;

    // Add to visited entries if not already there
    if (!progress.visitedEntries.includes(entryId)) {
      progress.visitedEntries.push(entryId);
    }

    // Add choice if provided
    if (choice) {
      progress.choices.push({
        entryId,
        choice,
        timestamp: new Date().toISOString()
      });
    }

    // Check if this is the end of the book
    if (isEnd) {
      progress.completedAt = new Date().toISOString();
    }

    await this.saveProgress(progress);
  }

  async clearProgress(bookId: number): Promise<void> {
    const { error } = await supabase
      .from('user_progress')
      .delete()
      .eq('user_id', this.userId)
      .eq('book_id', bookId);

    if (error) {
      console.error('Error clearing progress:', error);
      throw error;
    }
  }
} 
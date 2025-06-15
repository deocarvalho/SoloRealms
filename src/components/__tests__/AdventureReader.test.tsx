import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import AdventureReader from '../AdventureReader';
import { ProgressTracker } from '@/services/ProgressTracker';

// Mock dependencies
vi.mock('@/services/ProgressTracker');
vi.mock('next/image', () => ({
  default: (props: any) => {
    const { src, alt, ...rest } = props;
    return <img src={src} alt={alt} {...rest} />;
  }
}));

// Mock fetch
global.fetch = vi.fn();

describe('AdventureReader', () => {
  const mockBookId = 1;
  const mockUserId = 'user123';
  const mockClearProgress = vi.fn();
  const mockBookContent = {
    entries: {
      entries: {
        START: {
          text: ['Welcome to the adventure!'],
          choices: [
            { target: 'NEXT', text: 'Continue' }
          ],
          imageId: 'img1'
        },
        NEXT: {
          text: ['You continue your journey.'],
          choices: [],
          imageId: 'img2'
        }
      }
    },
    images: {
      images: {
        img1: { filename: 'image1.jpg', altText: 'Start image' },
        img2: { filename: 'image2.jpg', altText: 'Next image' }
      }
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockBookContent)
    });
    (ProgressTracker as any).mockImplementation(() => ({
      getProgress: vi.fn().mockResolvedValue(null),
      updateProgress: vi.fn(),
      clearProgress: mockClearProgress
    }));
  });

  describe('Initial Loading', () => {
    it('should show loading state', async () => {
      render(<AdventureReader bookId={mockBookId} userId={mockUserId} />);
      // Loading state should be shown immediately
      expect(screen.getByText('Loading adventure...')).toBeInTheDocument();
    });

    it('should show error state when book fails to load', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Failed to load'));
      
      render(<AdventureReader bookId={mockBookId} userId={mockUserId} />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load the adventure book')).toBeInTheDocument();
      });
    });
  });

  describe('Content Rendering', () => {
    it('should render book content when loaded successfully', async () => {
      render(<AdventureReader bookId={mockBookId} userId={mockUserId} />);
      
      await waitFor(() => {
        expect(screen.getByText('Welcome to the adventure!')).toBeInTheDocument();
        expect(screen.getByText('Continue')).toBeInTheDocument();
      });
    });

    it('should render images when available', async () => {
      render(<AdventureReader bookId={mockBookId} userId={mockUserId} />);
      
      await waitFor(() => {
        const image = screen.getByAltText('Start image');
        expect(image).toBeInTheDocument();
        expect(image).toHaveAttribute('src', expect.stringContaining('image1.jpg'));
      });
    });
  });

  describe('User Interactions', () => {
    it('should handle choice selection', async () => {
      const mockUpdateProgress = vi.fn();
      (ProgressTracker as any).mockImplementation(() => ({
        getProgress: vi.fn().mockResolvedValue(null),
        updateProgress: mockUpdateProgress,
        clearProgress: vi.fn()
      }));

      render(<AdventureReader bookId={mockBookId} userId={mockUserId} />);
      
      await waitFor(() => {
        expect(screen.getByText('Continue')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        expect(screen.getByText('You continue your journey.')).toBeInTheDocument();
        expect(mockUpdateProgress).toHaveBeenCalledWith(
          mockBookId,
          'NEXT',
          'Continue',
          true
        );
      });
    });

    it('should handle restart confirmation', async () => {
      render(<AdventureReader bookId={mockBookId} userId={mockUserId} />);

      // Wait for content to load
      await waitFor(() => {
        expect(screen.getByText('Welcome to the adventure!')).toBeInTheDocument();
      });

      // Click the restart button in the main UI
      const mainRestartButton = screen.getAllByRole('button', { name: 'Restart' })[0];
      fireEvent.click(mainRestartButton);

      // Verify confirmation dialog appears
      expect(screen.getByText('Are you sure you want to restart? Your current progress will be lost.')).toBeInTheDocument();

      // Click confirm restart button in modal
      const modalRestartButton = screen.getAllByRole('button', { name: 'Restart' })[1];
      fireEvent.click(modalRestartButton);

      // Verify progress is cleared
      expect(mockClearProgress).toHaveBeenCalledWith(mockBookId);
    });

    it('should handle book closing at end of book', async () => {
      // Mock progress to be at the end of the book (no choices)
      (ProgressTracker as any).mockImplementation(() => ({
        getProgress: vi.fn().mockResolvedValue({
          currentEntryId: 'NEXT' // This entry has no choices
        }),
        updateProgress: vi.fn(),
        clearProgress: mockClearProgress
      }));

      render(<AdventureReader bookId={mockBookId} userId={mockUserId} />);

      // Wait for content to load
      await waitFor(() => {
        expect(screen.getByText('You continue your journey.')).toBeInTheDocument();
      });

      // Click close button
      fireEvent.click(screen.getByRole('button', { name: 'Close Book' }));

      // Verify progress is cleared
      expect(mockClearProgress).toHaveBeenCalledWith(mockBookId);
    });

    it('should handle image loading errors', async () => {
      render(<AdventureReader bookId={mockBookId} userId={mockUserId} />);

      // Wait for image to be rendered
      await waitFor(() => {
        expect(screen.getByAltText('Start image')).toBeInTheDocument();
      });

      // Simulate image error
      const image = screen.getByAltText('Start image');
      fireEvent.error(image);

      // Verify image is removed by checking its src attribute is null
      await waitFor(() => {
        const updatedImage = screen.getByAltText('Start image');
        expect(updatedImage).not.toHaveAttribute('src');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid entry IDs', async () => {
      (ProgressTracker as any).mockImplementation(() => ({
        getProgress: vi.fn().mockResolvedValue({
          currentEntryId: 'INVALID_ENTRY'
        }),
        updateProgress: vi.fn(),
        clearProgress: vi.fn()
      }));

      render(<AdventureReader bookId={mockBookId} userId={mockUserId} />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load the adventure book')).toBeInTheDocument();
      });
    });
  });
}); 
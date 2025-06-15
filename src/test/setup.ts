import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock next/image
vi.mock('next/image', () => ({
  default: (props: any) => {
    const { src, alt, ...rest } = props;
    return {
      type: 'img',
      props: { src, alt, ...rest }
    };
  }
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn()
  }),
  usePathname: () => '/'
}));

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn()
  }
})); 
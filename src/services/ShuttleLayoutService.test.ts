import { describe, it, expect, vi, beforeEach } from 'vitest';
import ShuttleLayoutService from './ShuttleLayoutService';
import { supabase } from '@/integrations/supabase/client';

// Mock supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: {}, error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: {}, error: null })),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  },
}));

describe('ShuttleLayoutService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch layouts', async () => {
    const mockData = [{ id: '1', name: 'Test Layout' }];
    (supabase.from as any).mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: mockData, error: null })),
      })),
    });

    const layouts = await ShuttleLayoutService.getLayouts();
    expect(layouts).toEqual(mockData);
    expect(supabase.from).toHaveBeenCalledWith('shuttle_vehicle_layouts');
  });

  it('should fetch layout by id', async () => {
    const mockData = { id: '1', name: 'Test Layout' };
    (supabase.from as any).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: mockData, error: null })),
        })),
      })),
    });

    const layout = await ShuttleLayoutService.getLayoutById('1');
    expect(layout).toEqual(mockData);
  });

  it('should create layout', async () => {
    const newLayout = { name: 'New Layout', vehicle_type: 'SUV', dimensions: { width: 100, height: 100 }, layout_data: { seats: [], objects: [] }, is_active: true };
    const mockResult = { id: '2', ...newLayout };
    
    (supabase.from as any).mockReturnValue({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: mockResult, error: null })),
        })),
      })),
    });

    const result = await ShuttleLayoutService.createLayout(newLayout);
    expect(result).toEqual(mockResult);
  });

  it('should update layout', async () => {
    const updateData = { name: 'Updated Layout' };
    const mockResult = { id: '1', ...updateData };

    (supabase.from as any).mockReturnValue({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: mockResult, error: null })),
          })),
        })),
      })),
    });

    const result = await ShuttleLayoutService.updateLayout('1', updateData);
    expect(result).toEqual(mockResult);
  });

  it('should delete layout', async () => {
    (supabase.from as any).mockReturnValue({
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    });

    const result = await ShuttleLayoutService.deleteLayout('1');
    expect(result).toBe(true);
  });
});

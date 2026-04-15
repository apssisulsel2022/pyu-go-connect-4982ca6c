import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SeatLayout, SeatInfo } from './SeatLayout';
import { VehicleLayout } from '@/services/ShuttleLayoutService';
import '@testing-library/jest-dom';

// Mock tooltip component since it uses radix-ui
vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: any) => <div>{children}</div>,
  TooltipTrigger: ({ children }: any) => <div>{children}</div>,
  TooltipContent: ({ children }: any) => <div>{children}</div>,
  TooltipProvider: ({ children }: any) => <div>{children}</div>,
}));

describe('SeatLayout Component', () => {
  const mockSeats: SeatInfo[] = [
    { id: '1', number: '1', status: 'available' },
    { id: '2', number: '2', status: 'booked' },
    { id: '3', number: '3', status: 'reserved' },
  ];

  const onSeatSelect = vi.fn();

  it('renders hardcoded SUV layout correctly', () => {
    render(
      <SeatLayout 
        vehicleType="SUV" 
        seats={mockSeats} 
        onSeatSelect={onSeatSelect} 
        selectedSeats={[]} 
      />
    );
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Bagasi')).toBeInTheDocument();
  });

  it('renders hardcoded MINI_CAR layout correctly', () => {
    render(
      <SeatLayout 
        vehicleType="MINI_CAR" 
        seats={mockSeats} 
        onSeatSelect={onSeatSelect} 
        selectedSeats={[]} 
      />
    );
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Bagasi')).toBeInTheDocument();
  });

  it('renders hardcoded HIACE layout correctly', () => {
    render(
      <SeatLayout 
        vehicleType="HIACE" 
        seats={mockSeats} 
        onSeatSelect={onSeatSelect} 
        selectedSeats={[]} 
      />
    );
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('14')).toBeInTheDocument();
  });

  it('renders dynamic layout data correctly', () => {
    const mockLayoutData: VehicleLayout = {
      id: 'layout-1',
      vehicle_type: 'SUV',
      name: 'Test Layout',
      dimensions: { width: 300, height: 600 },
      layout_data: {
        seats: [
          { id: 's1', number: '101', x: 50, y: 50, type: 'Passenger', class: 'VIP' },
          { id: 's2', number: '102', x: 150, y: 50, type: 'Driver', class: 'Regular' }
        ],
        objects: [
          { id: 'o1', type: 'Baggage', x: 50, y: 500, width: 200, height: 50, label: 'Kargo' }
        ]
      },
      is_active: true
    };

    render(
      <SeatLayout 
        vehicleType="SUV" 
        seats={mockSeats} 
        onSeatSelect={onSeatSelect} 
        selectedSeats={[]} 
        layoutData={mockLayoutData}
      />
    );

    expect(screen.getByText('101')).toBeInTheDocument();
    expect(screen.getByText('DRV')).toBeInTheDocument();
    expect(screen.getByText('Kargo')).toBeInTheDocument();
  });

  it('handles seat selection', () => {
    render(
      <SeatLayout 
        vehicleType="SUV" 
        seats={mockSeats} 
        onSeatSelect={onSeatSelect} 
        selectedSeats={[]} 
      />
    );
    
    const seat1 = screen.getByText('1').closest('button');
    seat1?.click();
    expect(onSeatSelect).toHaveBeenCalled();
  });
});

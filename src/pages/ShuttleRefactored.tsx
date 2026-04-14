import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

import ShuttleService, { ServiceVehicleOption } from '@/services/ShuttleService';
import { PriceCalculator } from '@/utils/PriceCalculator';

// Components
import { RouteSelector } from '@/components/shuttle/RouteSelector';
import { ScheduleSelector } from '@/components/shuttle/ScheduleSelector';
import { ServiceVehicleSelector } from '@/components/shuttle/ServiceVehicleSelector';
import { PickupSelector } from '@/components/shuttle/PickupSelector';
import { SeatSelector } from '@/components/shuttle/SeatSelector';
import { GuestInfoForm } from '@/components/shuttle/GuestInfoForm';
import { PaymentForm } from '@/components/shuttle/PaymentForm';
import { BookingSummary } from '@/components/shuttle/BookingSummary';
import { PriceBreakdown } from '@/components/shuttle/PriceBreakdown';
import ShuttleTicket from '@/components/shuttle/ShuttleTicket';

type Step = 'routes' | 'schedule' | 'service_vehicle' | 'pickup' | 'seats' | 'passengers' | 'summary' | 'payment' | 'confirmation';

const STEP_LIST: Step[] = ['routes', 'schedule', 'service_vehicle', 'pickup', 'seats', 'passengers', 'summary', 'payment', 'confirmation'];
const STEP_LABELS: Record<Step, string> = {
  routes: 'Route',
  schedule: 'Schedule',
  service_vehicle: 'Service',
  pickup: 'Pickup',
  seats: 'Seats',
  passengers: 'Passengers',
  summary: 'Summary',
  payment: 'Payment',
  confirmation: 'Confirmation',
};

interface BookingState {
  routeId: string | null;
  scheduleId: string | null;
  selectedService: ServiceVehicleOption | null;
  rayonId: string | null;
  selectedSeats: number[];
  passengers: Array<{ seatNumber: number; name: string; phone: string }>;
  paymentMethod: string;
}

export default function Shuttle() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('booking');
  const [step, setStep] = useState<Step>('routes');
  const [priceBreakdown, setPriceBreakdown] = useState<any>(null);

  // Booking state
  const [booking, setBooking] = useState<BookingState>({
    routeId: null,
    scheduleId: null,
    selectedService: null,
    rayonId: null,
    selectedSeats: [],
    passengers: [],
    paymentMethod: 'CASH',
  });

  // Query routes
  const { data: routes, isLoading: routesLoading } = useQuery({
    queryKey: ['shuttle-routes'],
    queryFn: async () => {
      const { data, error } = await (window as any).supabase
        .from('shuttle_routes')
        .select('*')
        .eq('active', true)
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });

  // Query schedules for selected route
  const { data: schedules } = useQuery({
    queryKey: ['shuttle-schedules', booking.routeId],
    queryFn: async () => {
      if (!booking.routeId) return [];
      const { data, error } = await (window as any).supabase
        .from('shuttle_schedules')
        .select('*')
        .eq('route_id', booking.routeId)
        .eq('active', true)
        .gte('departure_time', new Date().toISOString())
        .order('departure_time');
      if (error) throw error;
      return data || [];
    },
    enabled: !!booking.routeId,
  });

  // Query rayons
  const { data: rayons } = useQuery({
    queryKey: ['shuttle-rayons'],
    queryFn: async () => {
      const { data: rayonData, error: rayonError } = await (window as any).supabase
        .from('shuttle_rayons')
        .select('*')
        .eq('active', true)
        .order('name');

      if (rayonError) throw rayonError;

      const rayonIds = (rayonData || []).map((r: any) => r.id);
      const { data: pointsData } = await (window as any).supabase
        .from('shuttle_pickup_points')
        .select('*')
        .eq('active', true)
        .in('rayon_id', rayonIds)
        .order('stop_order');

      return (rayonData || []).map((r: any) => ({
        ...r,
        pickup_points: (pointsData || []).filter((p: any) => p.rayon_id === r.id),
      }));
    },
  });

  // Query user bookings
  const { data: userBookings } = useQuery({
    queryKey: ['user-shuttle-bookings', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await (window as any).supabase
        .from('shuttle_bookings')
        .select('*, shuttle_schedules(*, shuttle_routes(name, origin, destination))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Calculate price when service/route/rayon changes
  useEffect(() => {
    const calculatePrice = async () => {
      if (
        !booking.routeId ||
        !booking.scheduleId ||
        !booking.selectedService ||
        !booking.rayonId ||
        booking.selectedSeats.length === 0
      ) {
        return;
      }

      try {
        const breakdown = await ShuttleService.calculatePrice(
          booking.routeId,
          booking.selectedService.id,
          booking.rayonId,
          booking.selectedSeats.length
        );

        if (breakdown) {
          setPriceBreakdown(breakdown);
        }
      } catch (error) {
        console.error('Error calculating price:', error);
      }
    };

    calculatePrice();
  }, [booking.routeId, booking.selectedService, booking.rayonId, booking.selectedSeats]);

  // Handlers
  const handleSelectRoute = (routeId: string) => {
    setBooking((prev) => ({
      ...prev,
      routeId,
      scheduleId: null,
      selectedService: null,
      rayonId: null,
    }));
    setStep('schedule');
  };

  const handleSelectSchedule = (scheduleId: string) => {
    setBooking((prev) => ({ ...prev, scheduleId }));
    setStep('service_vehicle');
  };

  const handleSelectService = (service: ServiceVehicleOption) => {
    setBooking((prev) => ({ ...prev, selectedService: service }));
    setStep('pickup');
  };

  const handleSelectPickup = (rayonId: string, pointId: string) => {
    setBooking((prev) => ({ ...prev, rayonId }));
    setStep('seats');
  };

  const handleSelectSeats = (seatNumbers: number[]) => {
    setBooking((prev) => ({ ...prev, selectedSeats: seatNumbers }));
    setStep('passengers');
  };

  const handleAddPassenger = (seatNumber: number, name: string, phone: string) => {
    setBooking((prev) => {
      const existing = prev.passengers.filter((p) => p.seatNumber !== seatNumber);
      return {
        ...prev,
        passengers: [...existing, { seatNumber, name, phone }],
      };
    });
  };

  const handleSetPayment = (method: string) => {
    setBooking((prev) => ({ ...prev, paymentMethod: method }));
  };

  const handleConfirmBooking = async () => {
    try {
      if (!user) {
        toast.error('Please log in to book');
        navigate('/auth');
        return;
      }

      if (booking.passengers.length !== booking.selectedSeats.length) {
        toast.error('Please fill in all passenger information');
        return;
      }

      if (!priceBreakdown) {
        toast.error('Price calculation failed');
        return;
      }

      // Create booking
      const confirmation = await ShuttleService.createBooking(user.id, {
        scheduleId: booking.scheduleId!,
        serviceTypeId: booking.selectedService!.id,
        vehicleType: booking.selectedService!.vehicleType,
        rayonId: booking.rayonId!,
        seatNumbers: booking.selectedSeats,
        passengerInfo: booking.passengers,
        paymentMethod: booking.paymentMethod as 'CASH' | 'CARD' | 'TRANSFER',
        expectedTotalPrice: priceBreakdown.totalAmount,
      });

      if (confirmation) {
        setStep('confirmation');
        toast.success('Booking confirmed!');
      }
    } catch (error: any) {
      console.error('Booking error:', error);
      toast.error(error.message || 'Booking failed');
    }
  };

  const handlePreviousStep = () => {
    const currentIndex = STEP_LIST.indexOf(step);
    if (currentIndex > 0) {
      setStep(STEP_LIST[currentIndex - 1]);
    }
  };

  const handleNextStep = () => {
    const currentIndex = STEP_LIST.indexOf(step);
    if (currentIndex < STEP_LIST.length - 1) {
      setStep(STEP_LIST[currentIndex + 1]);
    }
  };

  const currentIndex = STEP_LIST.indexOf(step);
  const progress = ((currentIndex + 1) / STEP_LIST.length) * 100;

  const selectedRoute = routes?.find((r) => r.id === booking.routeId);
  const selectedSchedule = schedules?.find((s) => s.id === booking.scheduleId);
  const selectedRayon = rayons?.find((r) => r.id === booking.rayonId);

  return (
    <div className="container mx-auto py-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="booking">Book Shuttle</TabsTrigger>
          <TabsTrigger value="history">My Bookings</TabsTrigger>
        </TabsList>

        {/* Booking Tab */}
        <TabsContent value="booking" className="space-y-6 mt-6">
          {/* Progress Bar */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span>{STEP_LABELS[step]}</span>
                  <span className="text-muted-foreground">
                    Step {currentIndex + 1} of {STEP_LIST.length}
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Left Column: Step Content */}
            <div className="md:col-span-2">
              <Card>
                <CardContent className="pt-6">
                  {/* Routes Step */}
                  {step === 'routes' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Select Departure Route</h3>
                      {routesLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin mr-2" />
                          Loading routes...
                        </div>
                      ) : (
                        <RouteSelector
                          routes={routes || []}
                          onSelect={handleSelectRoute}
                        />
                      )}
                    </div>
                  )}

                  {/* Schedule Step */}
                  {step === 'schedule' && selectedRoute && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">
                        Select Schedule: {selectedRoute.origin} → {selectedRoute.destination}
                      </h3>
                      <ScheduleSelector
                        schedules={schedules || []}
                        onSelect={handleSelectSchedule}
                      />
                    </div>
                  )}

                  {/* Service & Vehicle Step */}
                  {step === 'service_vehicle' && booking.scheduleId && (
                    <div className="space-y-4">
                      <ServiceVehicleSelector
                        scheduleId={booking.scheduleId}
                        onSelect={handleSelectService}
                      />
                    </div>
                  )}

                  {/* Pickup Step */}
                  {step === 'pickup' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Select Pickup Location</h3>
                      <PickupSelector
                        rayons={rayons || []}
                        onSelect={handleSelectPickup}
                      />
                    </div>
                  )}

                  {/* Seats Step */}
                  {step === 'seats' && booking.scheduleId && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Select Seats</h3>
                      <SeatSelector
                        scheduleId={booking.scheduleId}
                        onSelect={handleSelectSeats}
                      />
                    </div>
                  )}

                  {/* Passengers Step */}
                  {step === 'passengers' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Passenger Information</h3>
                      <div className="space-y-3">
                        {booking.selectedSeats.map((seatNumber) => (
                          <GuestInfoForm
                            key={seatNumber}
                            seatNumber={seatNumber}
                            onSave={(name, phone) => handleAddPassenger(seatNumber, name, phone)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Summary Step */}
                  {step === 'summary' && selectedRoute && selectedSchedule && booking.selectedService && selectedRayon && priceBreakdown && (
                    <BookingSummary
                      route={selectedRoute}
                      schedule={{
                        departureTime: selectedSchedule.departure_time,
                        arrivalTime: selectedSchedule.arrival_time,
                      }}
                      service={booking.selectedService}
                      rayonName={selectedRayon.name}
                      seatCount={booking.selectedSeats.length}
                      priceBreakdown={priceBreakdown}
                      passengerCount={booking.passengers.length}
                    />
                  )}

                  {/* Payment Step */}
                  {step === 'payment' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Payment Method</h3>
                      <PaymentForm
                        onSelect={handleSetPayment}
                        selectedMethod={booking.paymentMethod}
                      />
                    </div>
                  )}

                  {/* Confirmation Step */}
                  {step === 'confirmation' && userBookings && userBookings.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Booking Confirmed! 🎉</h3>
                      <ShuttleTicket booking={userBookings[0]} />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Navigation Buttons */}
              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={handlePreviousStep}
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>

                <Button
                  onClick={
                    step === 'payment'
                      ? handleConfirmBooking
                      : handleNextStep
                  }
                  disabled={
                    (step === 'routes' && !booking.routeId) ||
                    (step === 'schedule' && !booking.scheduleId) ||
                    (step === 'service_vehicle' && !booking.selectedService) ||
                    (step === 'pickup' && !booking.rayonId) ||
                    (step === 'seats' && booking.selectedSeats.length === 0) ||
                    (step === 'passengers' && booking.passengers.length !== booking.selectedSeats.length)
                  }
              className="ml-auto"
                >
                  {step === 'payment' ? 'Confirm & Pay' : (
                    <>
                      Next
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Right Column: Price Summary (sticky) */}
            {priceBreakdown && (
              <div className="md:col-span-1">
                <div className="sticky top-6">
                  <PriceBreakdown breakdown={priceBreakdown} />
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              {!user ? (
                <p className="text-center text-muted-foreground py-8">
                  Please log in to view your booking history
                </p>
              ) : userBookings && userBookings.length > 0 ? (
                <div className="space-y-3">
                  {userBookings.map((booking: any) => (
                    <Card key={booking.id} className="p-3">
                      <p className="font-medium">{booking.reference_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {booking.shuttle_schedules?.shuttle_routes?.origin} →{' '}
                        {booking.shuttle_schedules?.shuttle_routes?.destination}
                      </p>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No bookings yet
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

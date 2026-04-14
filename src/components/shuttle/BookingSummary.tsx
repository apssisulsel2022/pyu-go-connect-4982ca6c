import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PriceBreakdown as PriceBreakdownType, ServiceVehicleOption } from '@/services/ShuttleService';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { PriceBreakdown } from './PriceBreakdown';

interface BookingSummaryProps {
  route: {
    name: string;
    origin: string;
    destination: string;
  };
  schedule: {
    departureTime: string;
    arrivalTime: string;
  };
  service: ServiceVehicleOption;
  rayonName: string;
  seatCount: number;
  priceBreakdown: PriceBreakdownType;
  passengerCount: number;
}

export function BookingSummary({
  route,
  schedule,
  service,
  rayonName,
  seatCount,
  priceBreakdown,
  passengerCount,
}: BookingSummaryProps) {
  const departureDate = new Date(schedule.departureTime);
  const arrivalDate = new Date(schedule.arrivalTime);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Booking Summary</h3>

      {/* Route Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Route</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Route</p>
            <p className="font-semibold">{route.origin} → {route.destination}</p>
            {route.name && <p className="text-xs text-muted-foreground">{route.name}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Schedule Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-muted-foreground">Departure</p>
              <p className="font-semibold text-lg">
                {format(departureDate, 'HH:mm', { locale: localeId })}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(departureDate, 'EEEE, dd MMMM yyyy', { locale: localeId })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Arrival</p>
              <p className="font-semibold text-lg">
                {format(arrivalDate, 'HH:mm', { locale: localeId })}
              </p>
            </div>
          </div>

          {/* Pickup Info */}
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">Pickup Location</p>
            <p className="font-medium">{rayonName}</p>
          </div>
        </CardContent>
      </Card>

      {/* Service & Seats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Service & Seats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground">Service Type</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="font-semibold">{service.serviceName}</p>
              {service.isFeatured && (
                <Badge variant="default" className="text-xs">Popular</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {service.vehicleName} • {service.capacity} seat vehicle
            </p>
          </div>

          <Separator />

          <div>
            <p className="text-xs text-muted-foreground">Passengers</p>
            <p className="font-semibold text-lg">{passengerCount} {passengerCount === 1 ? 'passenger' : 'passengers'}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {seatCount} {seatCount === 1 ? 'seat' : 'seats'} reserved
            </p>
          </div>

          {/* Facilities */}
          {service.facilities.length > 0 && (
            <div className="pt-2">
              <p className="text-xs text-muted-foreground mb-2">Amenities</p>
              <div className="flex flex-wrap gap-1">
                {service.facilities.map((facility) => (
                  <Badge key={facility} variant="secondary" className="text-xs">
                    ✓ {facility}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Price Breakdown */}
      <PriceBreakdown breakdown={priceBreakdown} />

      {/* Important Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900 space-y-1">
        <p>
          ✓ Booking will be locked for 10 minutes after confirmation
        </p>
        <p>
          ✓ Please bring a valid ID on travel day
        </p>
        <p>
          ✓ Arrive 15 minutes before departure
        </p>
      </div>
    </div>
  );
}

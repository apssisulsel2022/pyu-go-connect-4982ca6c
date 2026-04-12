import { useState } from "react";
import { Bus, Clock, MapPin, Users, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface ShuttleRoute {
  id: string;
  name: string;
  from: string;
  to: string;
  schedules: { id: string; departure: string; arrival: string; seatsAvailable: number; price: number }[];
}

const MOCK_ROUTES: ShuttleRoute[] = [
  {
    id: "1",
    name: "Jakarta — Bandung Express",
    from: "Jakarta (Gambir)",
    to: "Bandung (Pasteur)",
    schedules: [
      { id: "s1", departure: "06:00", arrival: "09:00", seatsAvailable: 12, price: 85000 },
      { id: "s2", departure: "10:00", arrival: "13:00", seatsAvailable: 5, price: 85000 },
      { id: "s3", departure: "14:00", arrival: "17:00", seatsAvailable: 0, price: 85000 },
      { id: "s4", departure: "18:00", arrival: "21:00", seatsAvailable: 8, price: 95000 },
    ],
  },
  {
    id: "2",
    name: "Jakarta — Semarang",
    from: "Jakarta (Cempaka Putih)",
    to: "Semarang (Banyumanik)",
    schedules: [
      { id: "s5", departure: "07:00", arrival: "13:00", seatsAvailable: 20, price: 150000 },
      { id: "s6", departure: "20:00", arrival: "02:00", seatsAvailable: 15, price: 175000 },
    ],
  },
];

type Step = "routes" | "seats" | "guest_info" | "confirmation";

export default function Shuttle() {
  const [step, setStep] = useState<Step>("routes");
  const [selectedRoute, setSelectedRoute] = useState<ShuttleRoute | null>(null);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [seatCount, setSeatCount] = useState(1);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [bookingRef, setBookingRef] = useState("");

  const selectedSchedule = selectedRoute?.schedules.find((s) => s.id === selectedScheduleId);

  const handleSelectSchedule = (route: ShuttleRoute, scheduleId: string) => {
    setSelectedRoute(route);
    setSelectedScheduleId(scheduleId);
    setStep("seats");
  };

  const handleConfirmSeats = () => {
    setStep("guest_info");
  };

  const handleBook = () => {
    if (!guestName || !guestPhone) {
      toast.error("Please enter your name and phone number");
      return;
    }
    const ref = "PYU-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    setBookingRef(ref);
    setStep("confirmation");
    toast.success("Booking confirmed!");
  };

  const handleReset = () => {
    setStep("routes");
    setSelectedRoute(null);
    setSelectedScheduleId(null);
    setSeatCount(1);
    setGuestName("");
    setGuestPhone("");
    setBookingRef("");
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="gradient-primary px-6 pt-10 pb-8 rounded-b-3xl">
        <h1 className="text-2xl font-extrabold text-primary-foreground mb-1">Shuttle</h1>
        <p className="text-primary-foreground/70 text-sm">Book shuttle seats — no account needed</p>
      </div>

      <div className="px-4 mt-6 space-y-4">
        {step === "routes" &&
          MOCK_ROUTES.map((route) => (
            <Card key={route.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Bus className="w-5 h-5 text-secondary" />
                  {route.name}
                </CardTitle>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {route.from} → {route.to}
                </p>
              </CardHeader>
              <CardContent className="space-y-2">
                {route.schedules.map((s) => (
                  <button
                    key={s.id}
                    disabled={s.seatsAvailable === 0}
                    onClick={() => handleSelectSchedule(route, s.id)}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-border hover:bg-accent/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="font-semibold text-sm">{s.departure}</span>
                      <ArrowRight className="w-3 h-3 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{s.arrival}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs flex items-center gap-1 text-muted-foreground">
                        <Users className="w-3 h-3" />
                        {s.seatsAvailable}
                      </span>
                      <span className="font-bold text-sm text-primary">Rp {s.price.toLocaleString("id-ID")}</span>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          ))}

        {step === "seats" && selectedSchedule && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Select Seats</CardTitle>
              <p className="text-xs text-muted-foreground">
                {selectedRoute?.name} • {selectedSchedule.departure} departure
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Number of seats</Label>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setSeatCount(Math.max(1, seatCount - 1))}>
                    -
                  </Button>
                  <span className="font-bold w-6 text-center">{seatCount}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setSeatCount(Math.min(selectedSchedule.seatsAvailable, seatCount + 1))}
                  >
                    +
                  </Button>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-extrabold text-lg">Rp {(selectedSchedule.price * seatCount).toLocaleString("id-ID")}</span>
              </div>
              <Button className="w-full gradient-primary text-primary-foreground font-bold" onClick={handleConfirmSeats}>
                Continue
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "guest_info" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Passenger Info</CardTitle>
              <p className="text-xs text-muted-foreground">No account required</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gn">Full Name</Label>
                <Input id="gn" value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Your name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gp">Phone Number</Label>
                <Input id="gp" type="tel" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} placeholder="+62 812..." required />
              </div>
              <Button className="w-full gradient-primary text-primary-foreground font-bold" onClick={handleBook}>
                Confirm Booking
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "confirmation" && (
          <Card className="text-center">
            <CardContent className="pt-8 pb-6 space-y-4">
              <div className="w-16 h-16 rounded-full gradient-primary mx-auto flex items-center justify-center">
                <Check className="w-8 h-8 text-primary-foreground" />
              </div>
              <h2 className="text-xl font-extrabold">Booking Confirmed!</h2>
              <p className="text-sm text-muted-foreground">Your reference number</p>
              <p className="text-2xl font-mono font-bold text-primary">{bookingRef}</p>
              <div className="text-left bg-muted rounded-xl p-4 space-y-1 text-sm">
                <p><strong>Route:</strong> {selectedRoute?.name}</p>
                <p><strong>Departure:</strong> {selectedSchedule?.departure}</p>
                <p><strong>Seats:</strong> {seatCount}</p>
                <p><strong>Passenger:</strong> {guestName}</p>
                <p><strong>Phone:</strong> {guestPhone}</p>
                <p><strong>Total:</strong> Rp {((selectedSchedule?.price ?? 0) * seatCount).toLocaleString("id-ID")}</p>
              </div>
              <Button variant="outline" className="w-full" onClick={handleReset}>
                Book Another
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

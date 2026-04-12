import { useEffect, useState } from "react";
import { MapView } from "@/components/map/MapView";
import { useRideStore } from "@/stores/rideStore";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, DollarSign, X } from "lucide-react";
import { toast } from "sonner";

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
    const data = await res.json();
    return data.display_name?.split(",").slice(0, 3).join(",") ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

function estimateFare(pickup: { lat: number; lng: number }, dropoff: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((dropoff.lat - pickup.lat) * Math.PI) / 180;
  const dLon = ((dropoff.lng - pickup.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((pickup.lat * Math.PI) / 180) * Math.cos((dropoff.lat * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distKm = R * c;
  const baseFare = 5000;
  const perKm = 3000;
  return Math.round((baseFare + distKm * perKm) / 500) * 500;
}

export default function Ride() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pickup, dropoff, pickupAddress, dropoffAddress, fare, rideStatus, setPickup, setDropoff, setFare, setRideStatus, resetRide } = useRideStore();
  const [selectingMode, setSelectingMode] = useState<"pickup" | "dropoff">("pickup");

  useEffect(() => {
    if (!user) {
      toast.error("Please sign in to book a ride");
      navigate("/auth");
    }
  }, [user, navigate]);

  useEffect(() => {
    if (pickup && dropoff) {
      setFare(estimateFare(pickup, dropoff));
      setRideStatus("confirming");
    }
  }, [pickup, dropoff, setFare, setRideStatus]);

  const handleMapClick = async (lat: number, lng: number) => {
    const address = await reverseGeocode(lat, lng);
    if (selectingMode === "pickup") {
      setPickup({ lat, lng }, address);
      setSelectingMode("dropoff");
    } else {
      setDropoff({ lat, lng }, address);
    }
  };

  const handleRequestRide = () => {
    setRideStatus("searching");
    // Simulate finding a driver
    setTimeout(() => {
      setRideStatus("accepted");
      toast.success("Driver found! On the way.");
    }, 3000);
  };

  if (!user) return null;

  return (
    <div className="relative h-screen">
      {/* Map */}
      <MapView pickup={pickup} dropoff={dropoff} onMapClick={handleMapClick} className="w-full h-full" />

      {/* Top bar overlay */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="bg-card/95 backdrop-blur rounded-2xl p-4 shadow-lg space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-primary shrink-0" />
            <p className="text-xs text-foreground truncate flex-1">
              {pickupAddress || "Tap map to set pick-up"}
            </p>
          </div>
          <div className="ml-1.5 border-l-2 border-dashed border-muted-foreground/30 h-3" />
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-destructive shrink-0" />
            <p className="text-xs text-foreground truncate flex-1">
              {dropoffAddress || "Then tap for drop-off"}
            </p>
          </div>
        </div>
      </div>

      {/* Selection mode indicator */}
      {rideStatus === "idle" && (
        <div className="absolute top-[140px] left-1/2 -translate-x-1/2 z-10">
          <div className="bg-foreground/80 text-background text-xs font-semibold px-4 py-2 rounded-full">
            <MapPin className="w-3 h-3 inline mr-1" />
            {selectingMode === "pickup" ? "Select pick-up location" : "Select drop-off location"}
          </div>
        </div>
      )}

      {/* Bottom panel */}
      {rideStatus === "confirming" && fare && (
        <div className="absolute bottom-20 left-4 right-4 z-10 animate-slide-up">
          <div className="bg-card rounded-2xl p-5 shadow-xl border border-border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Ride Summary</h3>
              <button onClick={resetRide} className="text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                <span className="text-2xl font-extrabold">Rp {fare.toLocaleString("id-ID")}</span>
              </div>
              <span className="text-xs text-muted-foreground">Estimated fare</span>
            </div>
            <Button className="w-full gradient-primary text-primary-foreground font-bold" size="lg" onClick={handleRequestRide}>
              <Navigation className="w-4 h-4 mr-2" />
              Request Ride
            </Button>
          </div>
        </div>
      )}

      {rideStatus === "searching" && (
        <div className="absolute bottom-20 left-4 right-4 z-10 animate-slide-up">
          <div className="bg-card rounded-2xl p-6 shadow-xl border border-border text-center">
            <div className="w-12 h-12 rounded-full gradient-primary mx-auto mb-3 animate-pulse" />
            <p className="font-bold">Finding your driver...</p>
            <p className="text-sm text-muted-foreground mt-1">Please wait</p>
          </div>
        </div>
      )}

      {rideStatus === "accepted" && (
        <div className="absolute bottom-20 left-4 right-4 z-10 animate-slide-up">
          <div className="bg-card rounded-2xl p-5 shadow-xl border border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Navigation className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-bold">Driver is on the way!</p>
                <p className="text-xs text-muted-foreground">Arriving in ~5 min</p>
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={resetRide}>
              Cancel Ride
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

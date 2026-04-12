import { create } from "zustand";

export interface LatLng {
  lat: number;
  lng: number;
}

interface RideState {
  pickup: LatLng | null;
  dropoff: LatLng | null;
  pickupAddress: string;
  dropoffAddress: string;
  fare: number | null;
  rideStatus: "idle" | "selecting_pickup" | "selecting_dropoff" | "confirming" | "searching" | "accepted" | "in_progress" | "completed" | "cancelled";
  currentRideId: string | null;
  setPickup: (loc: LatLng | null, address?: string) => void;
  setDropoff: (loc: LatLng | null, address?: string) => void;
  setFare: (fare: number | null) => void;
  setRideStatus: (status: RideState["rideStatus"]) => void;
  setCurrentRideId: (id: string | null) => void;
  resetRide: () => void;
}

export const useRideStore = create<RideState>((set) => ({
  pickup: null,
  dropoff: null,
  pickupAddress: "",
  dropoffAddress: "",
  fare: null,
  rideStatus: "idle",
  currentRideId: null,
  setPickup: (loc, address = "") => set({ pickup: loc, pickupAddress: address }),
  setDropoff: (loc, address = "") => set({ dropoff: loc, dropoffAddress: address }),
  setFare: (fare) => set({ fare }),
  setRideStatus: (rideStatus) => set({ rideStatus }),
  setCurrentRideId: (currentRideId) => set({ currentRideId }),
  resetRide: () =>
    set({
      pickup: null,
      dropoff: null,
      pickupAddress: "",
      dropoffAddress: "",
      fare: null,
      rideStatus: "idle",
      currentRideId: null,
    }),
}));

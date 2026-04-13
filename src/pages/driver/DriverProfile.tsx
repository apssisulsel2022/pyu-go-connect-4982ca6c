
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader, Truck, Zap, MapPin, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import DriverBasicInfoTab from "./tabs/DriverBasicInfoTab";
import DriverVehiclesTab from "./tabs/DriverVehiclesTab";
import DriverSettingsTab from "./tabs/DriverSettingsTab";
import { DriverProfileService } from "@/services/DriverProfileService";
import GuestAccessCard from "@/components/GuestAccessCard";

/**
 * Driver Profile Component
 * Main container for driver profile with three tabs: Basic Info, Vehicles, and Settings
 */
export default function DriverProfile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("basic");

  if (!user) {
    return (
      <GuestAccessCard
        icon={<Truck />}
        title="Akses Driver Profile Diperlukan"
        description="Daftar sebagai driver untuk mengelola kendaraan, dokumen, dan pengaturan layanan Anda. Mulai hasilkan pendapatan hari ini!"
        features={[
          "🚗 Kelola armada kendaraan Anda",
          "📋 Unggah dokumen verifikasi",
          "🗺️ Atur area layanan",
          "💰 Pantau pendapatan perjalanan",
        ]}
        ctaText="Daftar sebagai Driver"
        ctaLink="/auth"
      />
    );
  }

  const { data, isLoading, error } = useQuery({
    queryKey: ["driver-profile", user.id],
    queryFn: () => DriverProfileService.getDriverComplete(user.id),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">Error loading driver profile</p>
        </div>
      </div>
    );
  }

  if (!data?.profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Driver profile not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-6">Driver Profile</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <DriverBasicInfoTab profile={data.profile} driverId={data.profile.id} />
          </TabsContent>

          <TabsContent value="vehicles" className="space-y-6">
            <DriverVehiclesTab
              vehicles={data.vehicles}
              driverId={data.profile.id}
            />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <DriverSettingsTab
              settings={data.settings}
              driverId={data.profile.id}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

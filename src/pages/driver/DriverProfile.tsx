
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader, Truck, Zap, MapPin, TrendingUp, LogOut, FileText } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import DriverBasicInfoTab from "./tabs/DriverBasicInfoTab";
import DriverVehiclesTab from "./tabs/DriverVehiclesTab";
import DriverSettingsTab from "./tabs/DriverSettingsTab";
import { DocumentVerification } from "@/components/driver/profile/DocumentVerification";
import { DriverProfileService } from "@/services/DriverProfileService";
import GuestAccessCard from "@/components/GuestAccessCard";
import { toast } from "sonner";

/**
 * Driver Profile Component
 * Main container for driver profile with tabs: Basic Info, Vehicles, Settings, and Documents
 */
export default function DriverProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("basic");
  const [loggingOut, setLoggingOut] = useState(false);

  const { signOut } = useAuth();

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await signOut();
      toast.success("Berhasil logout");
      navigate("/");
    } catch (error) {
      toast.error("Logout gagal");
    } finally {
      setLoggingOut(false);
    }
  };

  const handleDocumentUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ["driver-profile"] });
    toast.success("Documents updated");
  };

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
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Driver Profile</h1>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleLogout}
            disabled={loggingOut}
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            {loggingOut ? "Logging out..." : "Logout"}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              Docs
            </TabsTrigger>
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

          <TabsContent value="documents" className="space-y-6">
            <DocumentVerification
              driver={data.profile}
              onUpdate={handleDocumentUpdate}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

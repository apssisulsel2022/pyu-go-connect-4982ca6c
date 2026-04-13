import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader, Lock, Zap, Heart, Shield, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import UserBasicInfoTab from "./tabs/UserBasicInfoTab";
import UserSettingsTab from "./tabs/UserSettingsTab";
import { UserProfileService } from "@/services/UserProfileService";
import GuestAccessCard from "@/components/GuestAccessCard";
import { toast } from "sonner";

export default function UserProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
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

  const { data, isLoading, error } = useQuery({
    queryKey: ["user-profile", user?.id],
    queryFn: () => UserProfileService.getUserProfileWithSettings(user!.id),
    staleTime: 5 * 60 * 1000,
    enabled: !!user,
  });

  if (!user) {
    return (
      <GuestAccessCard
        icon={<Lock />}
        title="Akses Profil Terbatas"
        description="Silakan masuk untuk melihat dan mengelola profil Anda. Nikmati pengalaman yang dipersonalisasi dan keamanan data Anda."
        features={[
          "💳 Kelola informasi pribadi Anda",
          "🔔 Atur preferensi notifikasi",
          "🛡️ Kontrol privasi akun",
          "⚡ Akses cepat ke riwayat perjalanan",
        ]}
        ctaText="Masuk Sekarang"
        ctaLink="/auth"
      />
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error || !data?.profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-destructive">{error ? "Error loading profile" : "Profile data not found"}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">My Profile</h1>
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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="basic" className="space-y-6">
            <UserBasicInfoTab profile={data.profile} userId={user.id} />
          </TabsContent>
          <TabsContent value="settings" className="space-y-6">
            <UserSettingsTab settings={data.settings} userId={user.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

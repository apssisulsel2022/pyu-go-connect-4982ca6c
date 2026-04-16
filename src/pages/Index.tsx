import { useNavigate } from "react-router-dom";
import { Wallet, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { PromoSection } from "@/components/home/PromoSection";
import { AdsBanner } from "@/components/home/AdsBanner";
import { ServiceTabs } from "@/components/home/ServiceTabs";
import { TrustBanner } from "@/components/home/TrustBanner";
import { PopularRoutes } from "@/components/home/PopularRoutes";
import { useEffect } from "react";

export default function Index() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: wallet, refetch: refetchWallet } = useQuery({
    queryKey: ["wallet", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        const { data: newWallet, error: insertError } = await supabase
          .from("wallets")
          .insert({ user_id: user.id, wallet_type: "user" })
          .select("*")
          .single();
        if (insertError) throw insertError;
        return newWallet;
      }
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user || !wallet?.id) return;

    const channel = supabase
      .channel(`wallet-updates-${wallet.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "wallets",
          filter: `id=eq.${wallet.id}`,
        },
        () => {
          refetchWallet();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, wallet?.id, refetchWallet]);

  const { data: recentRides } = useQuery({
    queryKey: ["recent-rides", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rides")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Hero */}
      <div className="gradient-primary px-6 pt-10 pb-16 relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <img src="/pyu_go_icon.png" alt="PYU GO" className="w-10 h-10 rounded-xl shadow-md" />
            <div>
              <h1 className="text-xl font-extrabold text-primary-foreground leading-tight">PYU GO</h1>
              <p className="text-primary-foreground/70 text-xs">Your super app for travel</p>
            </div>
          </div>

          {user ? (
            <button
              onClick={() => navigate("/wallet")}
              className="flex items-center gap-2 bg-primary-foreground/20 backdrop-blur-sm px-3.5 py-2 rounded-full text-primary-foreground hover:bg-primary-foreground/30 transition-all"
            >
              <Wallet className="w-4 h-4" />
              <span className="text-sm font-bold">
                Rp {(wallet?.balance || 0).toLocaleString("id-ID")}
              </span>
            </button>
          ) : (
            <Button
              onClick={() => navigate("/auth")}
              size="sm"
              variant="secondary"
              className="rounded-full font-semibold text-xs bg-primary-foreground/20 text-primary-foreground border-0 hover:bg-primary-foreground/30"
            >
              Sign In
            </Button>
          )}
        </div>

        <p className="text-primary-foreground/90 text-sm font-medium">
          {user ? `Welcome back, ${user.user_metadata?.full_name ?? "rider"}! 👋` : "Rides, shuttles & hotels — all in one app"}
        </p>
      </div>

      {/* Service Tabs Card */}
      <div className="px-4">
        <ServiceTabs />
      </div>

      {/* Ads Banner */}
      <div className="mt-4">
        <AdsBanner placement="dashboard_banner" />
      </div>

      {/* Popular Routes */}
      <div className="px-4 mt-6">
        <PopularRoutes />
      </div>

      {/* Promo Section */}
      <div className="mt-6">
        <PromoSection />
      </div>

      {/* Trust Banner */}
      <div className="px-4 mt-6">
        <TrustBanner />
      </div>

      {/* Recent Activity */}
      <div className="px-4 mt-6 flex-1 pb-4">
        <h2 className="text-lg font-bold mb-3 text-foreground">Recent Activity</h2>
        {(!user || !recentRides || recentRides.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground bg-card rounded-2xl border border-border">
            <Clock className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">{user ? "No recent rides" : "Sign in to see activity"}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentRides.map((ride) => (
              <div key={ride.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-card border border-border hover:shadow-sm transition-shadow">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate text-foreground">
                    {ride.pickup_address ?? "Pickup"} → {ride.dropoff_address ?? "Dropoff"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(new Date(ride.created_at), "dd MMM, HH:mm")}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-sm font-bold text-foreground">
                    Rp {(ride.fare ?? 0).toLocaleString("id-ID")}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">{ride.status.replace("_", " ")}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!user && (
        <div className="px-4 pb-6 sticky bottom-16">
          <Button className="w-full gradient-primary text-primary-foreground font-semibold shadow-lg" size="lg" onClick={() => navigate("/auth")}>
            Sign in to get started
          </Button>
        </div>
      )}
    </div>
  );
}

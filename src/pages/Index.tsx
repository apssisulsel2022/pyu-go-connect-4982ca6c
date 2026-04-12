import { useNavigate } from "react-router-dom";
import { Car, Bus, MapPin, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function Index() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero */}
      <div className="gradient-primary px-6 pt-12 pb-8 rounded-b-3xl">
        <div className="flex items-center gap-3 mb-6">
          <img src="/pyu_go_icon.png" alt="PYU GO" className="w-10 h-10 rounded-xl" />
          <h1 className="text-2xl font-extrabold text-primary-foreground">PYU GO</h1>
        </div>
        <p className="text-primary-foreground/80 text-sm mb-6">
          {user ? `Welcome back, ${user.user_metadata?.full_name ?? "rider"}!` : "Your super app for rides & shuttles"}
        </p>

        {/* Quick search bar */}
        <button
          onClick={() => navigate("/ride")}
          className="w-full flex items-center gap-3 bg-card/90 backdrop-blur rounded-xl px-4 py-3 shadow-lg text-left"
        >
          <MapPin className="w-5 h-5 text-primary shrink-0" />
          <span className="text-muted-foreground text-sm">Where are you going?</span>
        </button>
      </div>

      {/* Services Grid */}
      <div className="px-6 -mt-2">
        <div className="grid grid-cols-2 gap-4 mt-6">
          <ServiceCard
            icon={<Car className="w-7 h-7" />}
            title="Ride"
            description="On-demand rides"
            onClick={() => navigate("/ride")}
            color="text-primary"
          />
          <ServiceCard
            icon={<Bus className="w-7 h-7" />}
            title="Shuttle"
            description="Book shuttle seats"
            onClick={() => navigate("/shuttle")}
            color="text-secondary"
          />
        </div>
      </div>

      {/* Recent Activity placeholder */}
      <div className="px-6 mt-8 flex-1">
        <h2 className="text-lg font-bold mb-3">Recent Activity</h2>
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Shield className="w-10 h-10 mb-2 opacity-40" />
          <p className="text-sm">No recent activity</p>
        </div>
      </div>

      {!user && (
        <div className="px-6 pb-6">
          <Button className="w-full gradient-primary text-primary-foreground font-semibold" size="lg" onClick={() => navigate("/auth")}>
            Sign in to get started
          </Button>
        </div>
      )}
    </div>
  );
}

function ServiceCard({
  icon,
  title,
  description,
  onClick,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-start gap-2 p-5 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
    >
      <div className={color}>{icon}</div>
      <div>
        <p className="font-bold text-sm">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}

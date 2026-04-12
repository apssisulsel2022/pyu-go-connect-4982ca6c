import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User, LogOut, Shield, ChevronRight } from "lucide-react";

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 gap-4">
        <User className="w-16 h-16 text-muted-foreground/30" />
        <h2 className="text-xl font-bold">Not signed in</h2>
        <p className="text-sm text-muted-foreground text-center">Sign in to manage your account and view ride history</p>
        <Button className="gradient-primary text-primary-foreground font-semibold" onClick={() => navigate("/auth")}>
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="gradient-primary px-6 pt-12 pb-8 rounded-b-3xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-foreground/20 flex items-center justify-center">
            <User className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-primary-foreground">{user.user_metadata?.full_name ?? "User"}</h1>
            <p className="text-primary-foreground/70 text-sm">{user.email}</p>
          </div>
        </div>
      </div>

      <div className="px-6 mt-6 space-y-2">
        <ProfileItem label="My Rides" icon={<ChevronRight className="w-4 h-4" />} onClick={() => {}} />
        <ProfileItem label="My Shuttle Bookings" icon={<ChevronRight className="w-4 h-4" />} onClick={() => {}} />
        <ProfileItem label="Admin Dashboard" icon={<Shield className="w-4 h-4" />} onClick={() => navigate("/admin")} />

        <Button variant="outline" className="w-full mt-8 text-destructive border-destructive/30" onClick={signOut}>
          <LogOut className="w-4 h-4 mr-2" /> Sign Out
        </Button>
      </div>
    </div>
  );
}

function ProfileItem({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:bg-accent/50 transition-colors">
      <span className="font-medium text-sm">{label}</span>
      {icon}
    </button>
  );
}

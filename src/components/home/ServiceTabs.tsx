import { Car, Bus, Building2, MapPin, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

export function ServiceTabs() {
  const navigate = useNavigate();

  return (
    <div className="bg-card rounded-2xl shadow-lg border border-border p-4 -mt-8 relative z-10">
      <Tabs defaultValue="ride" className="w-full">
        <TabsList className="w-full grid grid-cols-3 bg-muted/60 rounded-xl h-12">
          <TabsTrigger value="ride" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5 text-sm font-semibold">
            <Car className="w-4 h-4" />
            Ride
          </TabsTrigger>
          <TabsTrigger value="shuttle" className="rounded-lg data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground gap-1.5 text-sm font-semibold">
            <Bus className="w-4 h-4" />
            Shuttle
          </TabsTrigger>
          <TabsTrigger value="hotel" className="rounded-lg data-[state=active]:bg-accent data-[state=active]:text-accent-foreground gap-1.5 text-sm font-semibold">
            <Building2 className="w-4 h-4" />
            Hotel
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ride" className="mt-4 space-y-3">
          <button
            onClick={() => navigate("/ride")}
            className="w-full flex items-center gap-3 bg-muted/50 rounded-xl px-4 py-3.5 text-left hover:bg-muted transition-colors"
          >
            <MapPin className="w-5 h-5 text-primary shrink-0" />
            <span className="text-muted-foreground text-sm flex-1">Where are you going?</span>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="grid grid-cols-2 gap-2">
            <QuickOption label="Car" icon={<Car className="w-4 h-4" />} onClick={() => navigate("/ride")} />
            <QuickOption label="Bike" icon={<Car className="w-4 h-4" />} onClick={() => navigate("/ride")} />
          </div>
        </TabsContent>

        <TabsContent value="shuttle" className="mt-4 space-y-3">
          <button
            onClick={() => navigate("/shuttle")}
            className="w-full flex items-center gap-3 bg-muted/50 rounded-xl px-4 py-3.5 text-left hover:bg-muted transition-colors"
          >
            <Bus className="w-5 h-5 text-secondary shrink-0" />
            <span className="text-muted-foreground text-sm flex-1">Search shuttle routes...</span>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </button>
          <Button onClick={() => navigate("/shuttle")} className="w-full gradient-primary text-primary-foreground font-semibold">
            Book Shuttle
          </Button>
        </TabsContent>

        <TabsContent value="hotel" className="mt-4 space-y-3">
          <button
            onClick={() => navigate("/hotel")}
            className="w-full flex items-center gap-3 bg-muted/50 rounded-xl px-4 py-3.5 text-left hover:bg-muted transition-colors"
          >
            <Building2 className="w-5 h-5 text-accent-foreground shrink-0" />
            <span className="text-muted-foreground text-sm flex-1">Search hotels or cities...</span>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </button>
          <Button onClick={() => navigate("/hotel")} variant="outline" className="w-full font-semibold">
            Explore Hotels
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function QuickOption({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-accent/50 hover:bg-accent transition-colors text-sm font-medium text-accent-foreground"
    >
      {icon}
      {label}
    </button>
  );
}

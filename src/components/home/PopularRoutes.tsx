import { MapPin, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const routes = [
  { from: "Bandung", to: "Jakarta", price: "Rp 150.000", color: "bg-primary/10 text-primary" },
  { from: "Bandung", to: "Cirebon", price: "Rp 120.000", color: "bg-secondary/10 text-secondary" },
  { from: "Jakarta", to: "Semarang", price: "Rp 250.000", color: "bg-accent text-accent-foreground" },
  { from: "Bandung", to: "Garut", price: "Rp 75.000", color: "bg-primary/10 text-primary" },
];

export function PopularRoutes() {
  const navigate = useNavigate();

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-foreground">Popular Routes</h2>
        <button onClick={() => navigate("/shuttle")} className="text-xs text-primary font-semibold">
          See all
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {routes.map((route, i) => (
          <button
            key={i}
            onClick={() => navigate("/shuttle")}
            className="flex flex-col gap-2 p-4 rounded-2xl bg-card border border-border hover:shadow-md transition-all text-left"
          >
            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
              {route.from}
              <ArrowRight className="w-3 h-3 text-muted-foreground" />
              {route.to}
            </div>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full w-fit ${route.color}`}>
              {route.price}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

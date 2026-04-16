import { ShieldCheck, BadgePercent, Headphones } from "lucide-react";

const items = [
  { icon: ShieldCheck, label: "Safe Rides", desc: "Verified drivers & tracking" },
  { icon: BadgePercent, label: "Best Prices", desc: "Transparent & competitive" },
  { icon: Headphones, label: "24/7 Support", desc: "Always here for you" },
];

export function TrustBanner() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex flex-col items-center text-center p-4 rounded-2xl bg-card border border-border"
        >
          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center mb-2">
            <item.icon className="w-5 h-5 text-primary" />
          </div>
          <p className="text-xs font-bold text-foreground">{item.label}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{item.desc}</p>
        </div>
      ))}
    </div>
  );
}

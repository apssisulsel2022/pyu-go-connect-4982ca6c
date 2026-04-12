import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Bus, Users, DollarSign } from "lucide-react";

const stats = [
  { label: "Active Rides", value: "24", icon: Car, color: "text-primary" },
  { label: "Shuttle Bookings Today", value: "58", icon: Bus, color: "text-secondary" },
  { label: "Registered Users", value: "1,245", icon: Users, color: "text-accent-foreground" },
  { label: "Revenue (Today)", value: "Rp 12.5M", icon: DollarSign, color: "text-primary" },
];

export default function AdminOverview() {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Dashboard Overview</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground font-medium">{s.label}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <s.icon className={`w-8 h-8 ${s.color}`} />
              <span className="text-2xl font-extrabold">{s.value}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Recent Rides</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No ride data yet. Connect to the database to see live data.</p>
        </CardContent>
      </Card>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const mockRoutes = [
  { id: "1", name: "Jakarta — Bandung Express", schedules: 4, bookingsToday: 32 },
  { id: "2", name: "Jakarta — Semarang", schedules: 2, bookingsToday: 18 },
];

export default function AdminShuttles() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Shuttle Management</h2>
        <Button size="sm" className="gradient-primary text-primary-foreground">
          <Plus className="w-4 h-4 mr-1" /> Add Route
        </Button>
      </div>
      <div className="space-y-3">
        {mockRoutes.map((r) => (
          <Card key={r.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{r.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4 text-sm text-muted-foreground">
              <span>{r.schedules} schedules</span>
              <span>{r.bookingsToday} bookings today</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

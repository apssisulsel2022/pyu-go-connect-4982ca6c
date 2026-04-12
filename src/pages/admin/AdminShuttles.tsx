import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export default function AdminShuttles() {
  const { data: routes, isLoading } = useQuery({
    queryKey: ["admin-shuttle-routes"],
    queryFn: async () => {
      const { data: routesData, error: rErr } = await supabase.from("shuttle_routes").select("*").order("name");
      if (rErr) throw rErr;

      const { data: schedulesData } = await supabase.from("shuttle_schedules").select("route_id");
      const { data: bookingsData } = await supabase.from("shuttle_bookings").select("schedule_id, payment_status, shuttle_schedules!inner(route_id)").eq("status", "confirmed");

      return routesData.map((r) => {
        const routeBookings = (bookingsData ?? []).filter((b: any) => b.shuttle_schedules?.route_id === r.id);
        return {
          ...r,
          scheduleCount: (schedulesData ?? []).filter((s) => s.route_id === r.id).length,
          bookingCount: routeBookings.length,
          paidCount: routeBookings.filter((b: any) => b.payment_status === "paid").length,
          unpaidCount: routeBookings.filter((b: any) => b.payment_status === "unpaid" || !b.payment_status).length,
        };
      });
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Shuttle Management</h2>
        <Button size="sm" className="gradient-primary text-primary-foreground">
          <Plus className="w-4 h-4 mr-1" /> Add Route
        </Button>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : !routes?.length ? (
        <p className="text-sm text-muted-foreground">No shuttle routes yet.</p>
      ) : (
        <div className="space-y-3">
          {routes.map((r) => (
            <Card key={r.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{r.name}</CardTitle>
                <p className="text-xs text-muted-foreground">{r.origin} → {r.destination}</p>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span>{r.scheduleCount} schedules</span>
                <span>{r.bookingCount} bookings</span>
                <Badge variant="secondary" className="text-xs">{r.paidCount} paid</Badge>
                <Badge variant="outline" className="text-xs">{r.unpaidCount} unpaid</Badge>
                <span>Rp {r.base_fare.toLocaleString("id-ID")}/seat</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

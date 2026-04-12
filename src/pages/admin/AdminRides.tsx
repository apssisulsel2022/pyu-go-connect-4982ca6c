import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const mockRides = [
  { id: "R001", rider: "John Doe", from: "Gambir", to: "Sudirman", status: "in_progress", fare: 25000 },
  { id: "R002", rider: "Jane Smith", from: "Blok M", to: "Senayan", status: "completed", fare: 18000 },
  { id: "R003", rider: "Ahmad", from: "Kemang", to: "SCBD", status: "pending", fare: 32000 },
];

const statusColor: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function AdminRides() {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Ride Management</h2>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">All Rides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-2 font-medium">ID</th>
                  <th className="pb-2 font-medium">Rider</th>
                  <th className="pb-2 font-medium">Route</th>
                  <th className="pb-2 font-medium">Fare</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {mockRides.map((r) => (
                  <tr key={r.id} className="border-b border-border/50">
                    <td className="py-3 font-mono text-xs">{r.id}</td>
                    <td className="py-3">{r.rider}</td>
                    <td className="py-3 text-muted-foreground">{r.from} → {r.to}</td>
                    <td className="py-3 font-semibold">Rp {r.fare.toLocaleString("id-ID")}</td>
                    <td className="py-3">
                      <Badge variant="outline" className={statusColor[r.status]}>{r.status.replace("_", " ")}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

const mockDrivers = [
  { id: "D001", name: "Budi Santoso", vehicle: "Honda Vario 125", status: "online", ridesCompleted: 245 },
  { id: "D002", name: "Sari Dewi", vehicle: "Yamaha NMAX", status: "offline", ridesCompleted: 189 },
  { id: "D003", name: "Rudi Hartono", vehicle: "Honda PCX 160", status: "on_ride", ridesCompleted: 312 },
];

export default function AdminDrivers() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Driver Management</h2>
        <Button size="sm" className="gradient-primary text-primary-foreground">
          <Plus className="w-4 h-4 mr-1" /> Add Driver
        </Button>
      </div>
      <div className="space-y-3">
        {mockDrivers.map((d) => (
          <Card key={d.id}>
            <CardContent className="flex items-center justify-between pt-4">
              <div>
                <p className="font-bold text-sm">{d.name}</p>
                <p className="text-xs text-muted-foreground">{d.vehicle} • {d.ridesCompleted} rides</p>
              </div>
              <Badge variant="outline" className={d.status === "online" ? "text-green-600 border-green-300" : d.status === "on_ride" ? "text-blue-600 border-blue-300" : "text-muted-foreground"}>
                {d.status.replace("_", " ")}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

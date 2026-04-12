import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const mockUsers = [
  { id: "U001", name: "John Doe", email: "john@email.com", rides: 12, joined: "2025-01-15" },
  { id: "U002", name: "Jane Smith", email: "jane@email.com", rides: 8, joined: "2025-02-20" },
  { id: "U003", name: "Ahmad Yani", email: "ahmad@email.com", rides: 25, joined: "2024-11-03" },
];

export default function AdminUsers() {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">User Management</h2>
      <Card>
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Email</th>
                  <th className="pb-2 font-medium">Rides</th>
                  <th className="pb-2 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {mockUsers.map((u) => (
                  <tr key={u.id} className="border-b border-border/50">
                    <td className="py-3 font-medium">{u.name}</td>
                    <td className="py-3 text-muted-foreground">{u.email}</td>
                    <td className="py-3">{u.rides}</td>
                    <td className="py-3 text-muted-foreground">{u.joined}</td>
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

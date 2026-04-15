import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import IntegratedShuttleManagement from "@/components/admin/shuttle/IntegratedShuttleManagement";
import RoutesTab from "@/components/admin/shuttle/RoutesTab";
import RayonsTab from "@/components/admin/shuttle/RayonsTab";
import BookingsTab from "@/components/admin/shuttle/BookingsTab";
import ServiceTypesTab from "@/components/admin/shuttle/ServiceTypesTab";
import PricingRulesTab from "@/components/admin/shuttle/PricingRulesTab";
import SeatLayoutBuilder from "@/components/admin/shuttle/SeatLayoutBuilder";

export default function AdminShuttles() {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Shuttle Management</h2>
      <Tabs defaultValue="integrated">
        <TabsList className="mb-4 grid w-full grid-cols-7">
          <TabsTrigger value="integrated">🚐 Integrated</TabsTrigger>
          <TabsTrigger value="routes">Routes</TabsTrigger>
          <TabsTrigger value="rayons">Rayons</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="layouts">🎨 Layouts</TabsTrigger>
        </TabsList>
        <TabsContent value="integrated"><IntegratedShuttleManagement /></TabsContent>
        <TabsContent value="routes"><RoutesTab /></TabsContent>
        <TabsContent value="rayons"><RayonsTab /></TabsContent>
        <TabsContent value="services"><ServiceTypesTab /></TabsContent>
        <TabsContent value="pricing"><PricingRulesTab /></TabsContent>
        <TabsContent value="bookings"><BookingsTab /></TabsContent>
        <TabsContent value="layouts"><SeatLayoutBuilder /></TabsContent>
      </Tabs>
    </div>
  );
}

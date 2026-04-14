import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ServiceVehicleType {
  id: string;
  service_type_id: string;
  vehicle_type: string;
  vehicle_name: string;
  capacity: number;
  facilities: string[];
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface ServiceType {
  id: string;
  name: string;
  description: string;
  active: boolean;
}

export default function ServiceTypesTab() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceVehicleType | null>(null);
  const [formData, setFormData] = useState({
    service_id: '',
    vehicle_type: '',
    vehicle_name: '',
    capacity: 1,
    facilities: '',
  });
  const queryClient = useQueryClient();

  // Query service types
  const { data: serviceTypes = [] } = useQuery({
    queryKey: ['admin-service-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shuttle_service_types')
        .select('*')
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });

  // Query service-vehicle mappings
  const { data: mappings = [], isLoading } = useQuery({
    queryKey: ['admin-service-vehicle-mappings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shuttle_service_vehicle_types')
        .select('*')
        .order('vehicle_type');
      if (error) throw error;
      return data || [];
    },
  });

  // Add mapping mutation
  const addMutation = useMutation({
    mutationFn: async (newMapping: any) => {
      const { error } = await supabase
        .from('shuttle_service_vehicle_types')
        .insert([newMapping]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-service-vehicle-mappings'] });
      toast.success('Service-Vehicle mapping added');
      setFormData({
        service_id: '',
        vehicle_type: '',
        vehicle_name: '',
        capacity: 1,
        facilities: '',
      });
      setIsAddOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add mapping');
    },
  });

  // Update mapping mutation
  const updateMutation = useMutation({
    mutationFn: async (updated: any) => {
      const { error } = await supabase
        .from('shuttle_service_vehicle_types')
        .update(updated)
        .eq('id', selectedService?.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-service-vehicle-mappings'] });
      toast.success('Service-Vehicle mapping updated');
      setIsEditOpen(false);
      setSelectedService(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update mapping');
    },
  });

  // Delete mapping mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('shuttle_service_vehicle_types')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-service-vehicle-mappings'] });
      toast.success('Service-Vehicle mapping deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete mapping');
    },
  });

  const handleAddSubmit = () => {
    if (!formData.service_id || !formData.vehicle_type || !formData.vehicle_name) {
      toast.error('Please fill in all required fields');
      return;
    }

    const facilitiesArray = formData.facilities
      .split(',')
      .map((f) => f.trim())
      .filter((f) => f);

    addMutation.mutate({
      service_type_id: formData.service_id,
      vehicle_type: formData.vehicle_type,
      vehicle_name: formData.vehicle_name,
      capacity: formData.capacity,
      facilities: facilitiesArray,
      active: true,
    });
  };

  const handleEditSubmit = () => {
    if (!selectedService) return;

    const facilitiesArray = formData.facilities
      .split(',')
      .map((f) => f.trim())
      .filter((f) => f);

    updateMutation.mutate({
      service_type_id: formData.service_id,
      vehicle_type: formData.vehicle_type,
      vehicle_name: formData.vehicle_name,
      capacity: formData.capacity,
      facilities: facilitiesArray,
    });
  };

  const handleEdit = (mapping: ServiceVehicleType) => {
    setSelectedService(mapping);
    setFormData({
      service_id: mapping.service_type_id,
      vehicle_type: mapping.vehicle_type,
      vehicle_name: mapping.vehicle_name,
      capacity: mapping.capacity,
      facilities: mapping.facilities.join(', '),
    });
    setIsEditOpen(true);
  };

  const getServiceName = (serviceId: string) => {
    return serviceTypes.find((s: any) => s.id === serviceId)?.name || 'Unknown';
  };

  return (
    <div className="space-y-6">
      {/* Info Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Service Types & Vehicles</CardTitle>
          <CardDescription>
            Manage which vehicle types are available for each service. Each schedule automatically gets all configured service options.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Add Button */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogTrigger asChild>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Add Service-Vehicle Mapping
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Service-Vehicle Mapping</DialogTitle>
            <DialogDescription>
              Link a vehicle type to a service type
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Service Type Select */}
            <div>
              <label className="text-sm font-medium">Service Type *</label>
              <select
                value={formData.service_id}
                onChange={(e) =>
                  setFormData({ ...formData, service_id: e.target.value })
                }
                className="w-full border rounded-md p-2 mt-1"
              >
                <option value="">Select Service Type</option>
                {serviceTypes.map((st: any) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Vehicle Type */}
            <div>
              <label className="text-sm font-medium">Vehicle Type Code *</label>
              <Input
                placeholder="e.g., mini-car, suv, hiace"
                value={formData.vehicle_type}
                onChange={(e) =>
                  setFormData({ ...formData, vehicle_type: e.target.value })
                }
              />
            </div>

            {/* Vehicle Name */}
            <div>
              <label className="text-sm font-medium">Vehicle Name *</label>
              <Input
                placeholder="e.g., Mini Car, SUV, Hiace"
                value={formData.vehicle_name}
                onChange={(e) =>
                  setFormData({ ...formData, vehicle_name: e.target.value })
                }
              />
            </div>

            {/* Capacity */}
            <div>
              <label className="text-sm font-medium">Capacity (seats) *</label>
              <Input
                type="number"
                min="1"
                value={formData.capacity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    capacity: parseInt(e.target.value) || 1,
                  })
                }
              />
            </div>

            {/* Facilities */}
            <div>
              <label className="text-sm font-medium">Facilities</label>
              <Input
                placeholder="e.g., AC, Radio, WiFi (comma-separated)"
                value={formData.facilities}
                onChange={(e) =>
                  setFormData({ ...formData, facilities: e.target.value })
                }
              />
            </div>

            <Button
              onClick={handleAddSubmit}
              disabled={addMutation.isPending}
              className="w-full"
            >
              {addMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Mapping'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service Type</TableHead>
                  <TableHead>Vehicle Type</TableHead>
                  <TableHead>Vehicle Name</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Facilities</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappings.map((mapping: ServiceVehicleType) => (
                  <TableRow key={mapping.id}>
                    <TableCell className="font-medium">
                      {getServiceName(mapping.service_type_id)}
                    </TableCell>
                    <TableCell>{mapping.vehicle_type}</TableCell>
                    <TableCell>{mapping.vehicle_name}</TableCell>
                    <TableCell>{mapping.capacity} seats</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {mapping.facilities.map((f) => (
                          <Badge key={f} variant="secondary" className="text-xs">
                            {f}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {mapping.active ? (
                        <Badge variant="default" className="bg-green-600">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(mapping)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMutation.mutate(mapping.id)}
                          disabled={deleteMutation.isPending}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {mappings.length === 0 && !isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              No service-vehicle mappings yet. Create one to get started.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Service-Vehicle Mapping</DialogTitle>
            <DialogDescription>Update the vehicle mapping details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Service Type Select */}
            <div>
              <label className="text-sm font-medium">Service Type *</label>
              <select
                value={formData.service_id}
                onChange={(e) =>
                  setFormData({ ...formData, service_id: e.target.value })
                }
                className="w-full border rounded-md p-2 mt-1"
              >
                <option value="">Select Service Type</option>
                {serviceTypes.map((st: any) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Vehicle Type */}
            <div>
              <label className="text-sm font-medium">Vehicle Type Code *</label>
              <Input
                placeholder="e.g., mini-car, suv, hiace"
                value={formData.vehicle_type}
                onChange={(e) =>
                  setFormData({ ...formData, vehicle_type: e.target.value })
                }
              />
            </div>

            {/* Vehicle Name */}
            <div>
              <label className="text-sm font-medium">Vehicle Name *</label>
              <Input
                placeholder="e.g., Mini Car, SUV, Hiace"
                value={formData.vehicle_name}
                onChange={(e) =>
                  setFormData({ ...formData, vehicle_name: e.target.value })
                }
              />
            </div>

            {/* Capacity */}
            <div>
              <label className="text-sm font-medium">Capacity (seats) *</label>
              <Input
                type="number"
                min="1"
                value={formData.capacity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    capacity: parseInt(e.target.value) || 1,
                  })
                }
              />
            </div>

            {/* Facilities */}
            <div>
              <label className="text-sm font-medium">Facilities</label>
              <Input
                placeholder="e.g., AC, Radio, WiFi (comma-separated)"
                value={formData.facilities}
                onChange={(e) =>
                  setFormData({ ...formData, facilities: e.target.value })
                }
              />
            </div>

            <Button
              onClick={handleEditSubmit}
              disabled={updateMutation.isPending}
              className="w-full"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Mapping'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

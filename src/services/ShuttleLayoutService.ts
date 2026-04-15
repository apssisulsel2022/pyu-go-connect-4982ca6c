import { supabase } from "@/integrations/supabase/client";

export type SeatClass = "VIP" | "Regular" | "Executive";
export type SeatType = "Passenger" | "Driver" | "Baggage" | "Aisle";

export interface LayoutSeat {
  id: string;
  number: string;
  x: number;
  y: number;
  type: SeatType;
  class: SeatClass;
  price_modifier?: number;
}

export interface LayoutObject {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
}

export interface VehicleLayout {
  id: string;
  vehicle_type: string;
  name: string;
  description?: string;
  dimensions: {
    width: number;
    height: number;
  };
  layout_data: {
    seats: LayoutSeat[];
    objects: LayoutObject[];
  };
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

class ShuttleLayoutService {
  async getLayouts() {
    const { data, error } = await supabase
      .from("shuttle_vehicle_layouts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as VehicleLayout[];
  }

  async getLayoutById(id: string) {
    const { data, error } = await supabase
      .from("shuttle_vehicle_layouts")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as VehicleLayout;
  }

  async createLayout(layout: Omit<VehicleLayout, "id" | "created_at" | "updated_at">) {
    const { data, error } = await supabase
      .from("shuttle_vehicle_layouts")
      .insert(layout)
      .select()
      .single();

    if (error) throw error;
    return data as VehicleLayout;
  }

  async updateLayout(id: string, layout: Partial<VehicleLayout>) {
    const { data, error } = await supabase
      .from("shuttle_vehicle_layouts")
      .update(layout)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as VehicleLayout;
  }

  async deleteLayout(id: string) {
    const { error } = await supabase
      .from("shuttle_vehicle_layouts")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  }

  async getActiveLayoutByVehicleType(vehicleType: string) {
    const { data, error } = await supabase
      .from("shuttle_vehicle_layouts")
      .select("*")
      .eq("vehicle_type", vehicleType)
      .eq("is_active", true)
      .maybeSingle();

    if (error) throw error;
    return data as VehicleLayout;
  }
}

export default new ShuttleLayoutService();

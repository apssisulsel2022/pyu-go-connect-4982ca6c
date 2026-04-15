import React, { useState, useRef, useEffect, useCallback, memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Armchair, Trash2, Save, Plus, Move, Square, User, Luggage } from "lucide-react";
import { toast } from "sonner";
import ShuttleLayoutService, { VehicleLayout, LayoutSeat, LayoutObject, SeatClass, SeatType } from "@/services/ShuttleLayoutService";
import { cn } from "@/lib/utils";

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 700;
const GRID_SIZE = 10;

// Optimized Sidebar Component
const Sidebar = memo(({ layouts, selectedLayoutId, onNew, onSelect, currentLayout, onLayoutChange, onSave, onAddSeat, onAddObject }: any) => (
  <div className="space-y-4">
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Layout Terdaftar</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button variant="outline" className="w-full justify-start" onClick={onNew}>
          <Plus className="w-4 h-4 mr-2" />
          Buat Baru
        </Button>
        <div className="max-h-[300px] overflow-y-auto space-y-1">
          {layouts.map((layout: any) => (
            <Button 
              key={layout.id} 
              variant={selectedLayoutId === layout.id ? "default" : "ghost"}
              className="w-full justify-start text-xs"
              onClick={() => onSelect(layout)}
            >
              {layout.name} ({layout.vehicle_type})
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Pengaturan Layout</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Nama Layout</Label>
          <Input 
            value={currentLayout.name} 
            onChange={e => onLayoutChange({...currentLayout, name: e.target.value})}
          />
        </div>
        <div className="space-y-2">
          <Label>Tipe Kendaraan</Label>
          <Select 
            value={currentLayout.vehicle_type} 
            onValueChange={v => onLayoutChange({...currentLayout, vehicle_type: v})}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MINI_CAR">Mini Car</SelectItem>
              <SelectItem value="SUV">SUV</SelectItem>
              <SelectItem value="HIACE">Hiace</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button className="w-full" onClick={onSave}>
          <Save className="w-4 h-4 mr-2" />
          Simpan Layout
        </Button>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Toolbar</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" onClick={onAddSeat}>
          <Armchair className="w-4 h-4 mr-1" />
          Kursi
        </Button>
        <Button variant="outline" size="sm" onClick={() => onAddObject("Baggage")}>
          <Luggage className="w-4 h-4 mr-1" />
          Bagasi
        </Button>
        <Button variant="outline" size="sm" onClick={() => onAddObject("Driver")}>
          <User className="w-4 h-4 mr-1" />
          Driver
        </Button>
        <Button variant="outline" size="sm" onClick={() => onAddObject("Object")}>
          <Square className="w-4 h-4 mr-1" />
          Lainnya
        </Button>
      </CardContent>
    </Card>
  </div>
));

Sidebar.displayName = "Sidebar";

// Optimized Properties Panel
const PropertiesPanel = memo(({ selectedItem, onUpdate, onDelete }: any) => {
  if (!selectedItem) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl text-muted-foreground">
        <Move className="w-8 h-8 mb-2 opacity-20" />
        <p className="text-xs text-center">Pilih item di canvas untuk mengedit properti</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm">Properti Item</CardTitle>
        <Button variant="ghost" size="icon" className="text-destructive" onClick={onDelete}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {'number' in selectedItem ? (
          <>
            <div className="space-y-2">
              <Label>Nomor Kursi</Label>
              <Input 
                value={selectedItem.number} 
                onChange={e => onUpdate({ ...selectedItem, number: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipe Item</Label>
              <Select 
                value={selectedItem.type} 
                onValueChange={v => onUpdate({ ...selectedItem, type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Passenger">Penumpang</SelectItem>
                  <SelectItem value="Driver">Driver</SelectItem>
                  <SelectItem value="Baggage">Bagasi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Kelas Kursi</Label>
              <Select 
                value={selectedItem.class} 
                onValueChange={v => onUpdate({ ...selectedItem, class: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Regular">Regular</SelectItem>
                  <SelectItem value="Executive">Executive</SelectItem>
                  <SelectItem value="VIP">VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Harga Tambahan</Label>
              <Input 
                type="number"
                value={selectedItem.price_modifier || 0} 
                onChange={e => onUpdate({ ...selectedItem, price_modifier: Number(e.target.value) })}
              />
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label>Label</Label>
              <Input 
                value={selectedItem.label || ""} 
                onChange={e => onUpdate({ ...selectedItem, label: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Lebar</Label>
                <Input 
                  type="number"
                  value={selectedItem.width} 
                  onChange={e => onUpdate({ ...selectedItem, width: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Tinggi</Label>
                <Input 
                  type="number"
                  value={selectedItem.height} 
                  onChange={e => onUpdate({ ...selectedItem, height: Number(e.target.value) })}
                />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
});

PropertiesPanel.displayName = "PropertiesPanel";

export default function SeatLayoutBuilder() {
  const [layouts, setLayouts] = useState<VehicleLayout[]>([]);
  const [selectedLayoutId, setSelectedLayoutId] = useState<string | null>(null);
  const [currentLayout, setCurrentLayout] = useState<Partial<VehicleLayout>>({
    name: "New Layout",
    vehicle_type: "SUV",
    dimensions: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
    layout_data: { seats: [], objects: [] },
    is_active: true
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    loadLayouts();
  }, []);

  const loadLayouts = useCallback(async () => {
    try {
      const data = await ShuttleLayoutService.getLayouts();
      setLayouts(data);
    } catch (error) {
      console.error("Error loading layouts:", error);
      toast.error("Gagal memuat layout");
    }
  }, []);

  const handleSave = useCallback(async () => {
    try {
      if (!currentLayout.name || !currentLayout.vehicle_type) {
        toast.error("Nama dan Tipe Kendaraan wajib diisi");
        return;
      }

      if (selectedLayoutId) {
        await ShuttleLayoutService.updateLayout(selectedLayoutId, currentLayout);
        toast.success("Layout berhasil diperbarui");
      } else {
        const newLayout = await ShuttleLayoutService.createLayout(currentLayout as any);
        setSelectedLayoutId(newLayout.id);
        toast.success("Layout berhasil dibuat");
      }
      loadLayouts();
    } catch (error) {
      console.error("Error saving layout:", error);
      toast.error("Gagal menyimpan layout");
    }
  }, [currentLayout, selectedLayoutId, loadLayouts]);

  const addSeat = useCallback(() => {
    const newSeat: LayoutSeat = {
      id: `seat-${Date.now()}`,
      number: ((currentLayout.layout_data?.seats.length || 0) + 1).toString(),
      x: 50,
      y: 50,
      type: "Passenger",
      class: "Regular",
      price_modifier: 0
    };
    setCurrentLayout(prev => ({
      ...prev,
      layout_data: {
        ...prev.layout_data!,
        seats: [...prev.layout_data!.seats, newSeat]
      }
    }));
    setSelectedId(newSeat.id);
  }, [currentLayout.layout_data]);

  const addObject = useCallback((type: string) => {
    const newObject: LayoutObject = {
      id: `obj-${Date.now()}`,
      type: type,
      x: 100,
      y: 100,
      width: type === "Baggage" ? 200 : 50,
      height: 50,
      label: type
    };
    setCurrentLayout(prev => ({
      ...prev,
      layout_data: {
        ...prev.layout_data!,
        objects: [...prev.layout_data!.objects, newObject]
      }
    }));
    setSelectedId(newObject.id);
  }, [currentLayout.layout_data]);

  const updateItemPosition = useCallback((id: string, x: number, y: number) => {
    const snappedX = Math.round(x / GRID_SIZE) * GRID_SIZE;
    const snappedY = Math.round(y / GRID_SIZE) * GRID_SIZE;

    setCurrentLayout(prev => {
      const seats = prev.layout_data!.seats.map(s => 
        s.id === id ? { ...s, x: snappedX, y: snappedY } : s
      );
      const objects = prev.layout_data!.objects.map(o => 
        o.id === id ? { ...o, x: snappedX, y: snappedY } : o
      );
      return { ...prev, layout_data: { seats, objects } };
    });
  }, []);

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    setCurrentLayout(prev => ({
      ...prev,
      layout_data: {
        seats: prev.layout_data!.seats.filter(s => s.id !== selectedId),
        objects: prev.layout_data!.objects.filter(o => o.id !== selectedId)
      }
    }));
    setSelectedId(null);
  }, [selectedId]);

  const updateItemProperties = useCallback((updatedItem: any) => {
    setCurrentLayout(prev => {
      const seats = prev.layout_data!.seats.map(s => s.id === updatedItem.id ? updatedItem : s);
      const objects = prev.layout_data!.objects.map(o => o.id === updatedItem.id ? updatedItem : o);
      return { ...prev, layout_data: { seats, objects } };
    });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedId(id);
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !selectedId || !canvasRef.current) return;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    rafRef.current = requestAnimationFrame(() => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const boundedX = Math.max(0, Math.min(x, CANVAS_WIDTH - 40));
      const boundedY = Math.max(0, Math.min(y, CANVAS_HEIGHT - 40));

      updateItemPosition(selectedId, boundedX, boundedY);
    });
  }, [isDragging, selectedId, updateItemPosition]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const selectedItem = useMemo(() => {
    if (!selectedId) return null;
    return (
      currentLayout.layout_data?.seats.find(s => s.id === selectedId) ||
      currentLayout.layout_data?.objects.find(o => o.id === selectedId)
    );
  }, [selectedId, currentLayout.layout_data]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-4">
      <Sidebar 
        layouts={layouts}
        selectedLayoutId={selectedLayoutId}
        currentLayout={currentLayout}
        onNew={() => {
          setSelectedLayoutId(null);
          setCurrentLayout({
            name: "New Layout",
            vehicle_type: "SUV",
            dimensions: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
            layout_data: { seats: [], objects: [] },
            is_active: true
          });
        }}
        onSelect={(layout: any) => {
          setSelectedLayoutId(layout.id);
          setCurrentLayout(layout);
        }}
        onLayoutChange={setCurrentLayout}
        onSave={handleSave}
        onAddSeat={addSeat}
        onAddObject={addObject}
      />

      <div className="md:col-span-2 flex flex-col items-center">
        <div className="mb-2 flex gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-500 rounded-sm" /> VIP</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded-sm" /> Executive</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-slate-400 rounded-sm" /> Regular</div>
        </div>
        <div 
          ref={canvasRef}
          className="relative bg-slate-100 border-4 border-slate-300 rounded-[40px] shadow-2xl overflow-hidden"
          style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div className="absolute top-0 left-0 w-full h-12 bg-slate-200 border-b border-slate-300 flex items-center justify-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dashboard / Front</span>
          </div>
          <div className="absolute inset-0 pointer-events-none opacity-5" 
            style={{ 
              backgroundImage: `radial-gradient(circle, #000 1px, transparent 1px)`,
              backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`
            }} 
          />

          {currentLayout.layout_data?.seats.map((seat) => (
            <div
              key={seat.id}
              onMouseDown={(e) => handleMouseDown(e, seat.id)}
              className={cn(
                "absolute cursor-move select-none flex flex-col items-center justify-center transition-transform hover:scale-110 active:scale-95",
                selectedId === seat.id ? "ring-2 ring-primary ring-offset-2 z-50" : "z-10"
              )}
              style={{ left: seat.x, top: seat.y, width: 44, height: 44 }}
            >
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-md",
                seat.class === "VIP" && "bg-blue-500",
                seat.class === "Executive" && "bg-green-500",
                seat.class === "Regular" && "bg-slate-400",
                seat.type === "Driver" && "bg-slate-800"
              )}>
                {seat.type === "Driver" ? "D" : <Armchair size={20} />}
              </div>
              <span className="text-[10px] font-bold mt-0.5 text-slate-600">{seat.number}</span>
            </div>
          ))}

          {currentLayout.layout_data?.objects.map((obj) => (
            <div
              key={obj.id}
              onMouseDown={(e) => handleMouseDown(e, obj.id)}
              className={cn(
                "absolute cursor-move select-none flex items-center justify-center border-2 border-dashed transition-transform",
                selectedId === obj.id ? "ring-2 ring-primary ring-offset-2 z-50" : "z-10",
                obj.type === "Baggage" ? "bg-orange-100 border-orange-300 text-orange-600" : "bg-slate-200 border-slate-400 text-slate-600"
              )}
              style={{ left: obj.x, top: obj.y, width: obj.width, height: obj.height }}
            >
              <span className="text-[10px] font-bold uppercase tracking-tighter">{obj.label || obj.type}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <PropertiesPanel 
          selectedItem={selectedItem}
          onUpdate={updateItemProperties}
          onDelete={deleteSelected}
        />
      </div>
    </div>
  );
}

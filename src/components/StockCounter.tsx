import { useState, useCallback, useRef } from "react";
import { Calendar, Upload, Download, Save, Mic, MicOff, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Papa from "papaparse";
import { InventoryTable } from "./InventoryTable";
import { VoiceController } from "./VoiceController";

interface InventoryItem {
  id: string;
  name: string;
  count: number;
  category?: string;
  notes?: string;
}

export const StockCounter = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [stockDate, setStockDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [isListening, setIsListening] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        console.log('CSV parsing results:', results);
        console.log('Raw CSV data:', results.data);
        console.log('CSV headers detected:', results.meta?.fields);
        
        const items: InventoryItem[] = results.data
          .filter((row: any) => {
            console.log('Processing row:', row);
            // Try multiple possible column names for wine name
            const wineName = row.name || row.Name || row.wine || row.Wine || row['Wine Name'] || row['wine name'];
            return wineName && wineName.toString().trim() !== "";
          })
          .map((row: any, index) => {
            // Try multiple possible column names
            const wineName = row.name || row.Name || row.wine || row.Wine || row['Wine Name'] || row['wine name'];
            const wineCount = row.count || row.Count || row.quantity || row.Quantity || row.stock || row.Stock || 0;
            
            return {
              id: `item-${index}`,
              name: wineName.toString().trim(),
              count: parseInt(wineCount) || 0,
              category: row.category || row.Category || row.type || row.Type || "",
              notes: row.notes || row.Notes || row.description || row.Description || ""
            };
          });
        
        console.log('Processed items:', items);
        setInventory(items);
        toast.success(`Imported ${items.length} items from ${file.name}`);
      },
      error: (error) => {
        toast.error(`Error importing file: ${error.message}`);
      }
    });
  }, []);

  const updateInventoryItem = useCallback((itemName: string, count: number) => {
    setInventory(prev => {
      const existingIndex = prev.findIndex(
        item => item.name.toLowerCase() === itemName.toLowerCase()
      );
      
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], count };
        return updated;
      } else {
        // Add new item
        const newItem: InventoryItem = {
          id: `item-${Date.now()}`,
          name: itemName,
          count,
          category: "",
          notes: ""
        };
        return [...prev, newItem];
      }
    });
  }, []);

  const handleVoiceUpdate = useCallback((itemName: string, count: number) => {
    updateInventoryItem(itemName, count);
    toast.success(`Updated ${itemName}: ${count}`, {
      duration: 2000,
    });
  }, [updateInventoryItem]);

  const exportToCSV = useCallback(() => {
    if (inventory.length === 0) {
      toast.error("No inventory data to export");
      return;
    }

    const csv = Papa.unparse(inventory.map(item => ({
      name: item.name,
      count: item.count,
      category: item.category || "",
      notes: item.notes || ""
    })));

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    const date = new Date(stockDate);
    const monthYear = `${date.toLocaleString('default', { month: 'long' })}_${date.getFullYear()}`;
    const filename = `wine_inventory_${monthYear}.csv`;
    
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    
    toast.success(`Exported inventory as ${filename}`);
  }, [inventory, stockDate]);

  const saveStockCount = useCallback(() => {
    // This would typically save to a backend/database
    // For now, we'll just simulate saving and show success
    const date = new Date(stockDate);
    const monthYear = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
    
    toast.success(`Stock count saved for ${monthYear}`, {
      description: `${inventory.length} items recorded`,
      duration: 3000,
    });
  }, [inventory, stockDate]);

  return (
    <div className="min-h-screen bg-gradient-subtle p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-gradient-wine text-wine-champagne shadow-wine">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">
              🍷 Wine Inventory Voice Assistant
            </CardTitle>
            <p className="text-center text-wine-champagne/90">
              Speak your stock count naturally - I'll update your inventory in real-time
            </p>
          </CardHeader>
        </Card>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Date Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-wine-burgundy">
                <Calendar className="h-5 w-5" />
                Stock Count Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="stock-date">Select Date</Label>
              <Input
                id="stock-date"
                type="date"
                value={stockDate}
                onChange={(e) => setStockDate(e.target.value)}
                className="mt-2"
              />
            </CardContent>
          </Card>

          {/* File Import */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-wine-burgundy">
                <Upload className="h-5 w-5" />
                Import Inventory
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="w-full"
              >
                Choose CSV File
              </Button>
              {fileName && (
                <p className="text-sm text-muted-foreground truncate">
                  {fileName}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-wine-burgundy">
                <Save className="h-5 w-5" />
                Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={saveStockCount}
                variant="secondary"
                className="w-full"
                disabled={inventory.length === 0}
              >
                Save Stock Count
              </Button>
              <Button
                onClick={exportToCSV}
                variant="outline"
                className="w-full"
                disabled={inventory.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Voice Controller */}
        <VoiceController
          onVoiceUpdate={handleVoiceUpdate}
          isActive={isListening}
          onActiveChange={setIsListening}
        />

        {/* Inventory Table */}
        {(inventory.length > 0 || isListening) && (
          <InventoryTable
            inventory={inventory}
            onUpdateItem={updateInventoryItem}
          />
        )}
      </div>
    </div>
  );
};

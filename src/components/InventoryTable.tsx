import { useState } from "react";
import { Edit3, Save, X, Wine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface InventoryItem {
  id: string;
  name: string;
  count: number;
  category?: string;
  notes?: string;
}

interface InventoryTableProps {
  inventory: InventoryItem[];
  onUpdateItem: (itemName: string, count: number) => void;
}

export const InventoryTable = ({ inventory, onUpdateItem }: InventoryTableProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCount, setEditCount] = useState<number>(0);

  const handleEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setEditCount(item.count);
  };

  const handleSave = (item: InventoryItem) => {
    onUpdateItem(item.name, editCount);
    setEditingId(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditCount(0);
  };

  const getTotalCount = () => {
    return inventory.reduce((total, item) => total + item.count, 0);
  };

  const getCountBadgeVariant = (count: number) => {
    if (count === 0) return "destructive";
    if (count < 5) return "secondary";
    return "default";
  };

  return (
    <Card className="shadow-elegant">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-wine-burgundy">
          <div className="flex items-center gap-2">
            <Wine className="h-5 w-5" />
            Wine Inventory
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Badge variant="outline" className="text-wine-burgundy border-wine-burgundy">
              {inventory.length} Items
            </Badge>
            <Badge variant="secondary" className="bg-wine-gold text-wine-dark">
              Total: {getTotalCount()} bottles
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-wine-gold/20">
                <TableHead className="text-wine-burgundy font-semibold">Wine Name</TableHead>
                <TableHead className="text-wine-burgundy font-semibold text-center">Count</TableHead>
                <TableHead className="text-wine-burgundy font-semibold">Category</TableHead>
                <TableHead className="text-wine-burgundy font-semibold">Notes</TableHead>
                <TableHead className="text-wine-burgundy font-semibold text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory.map((item) => (
                <TableRow 
                  key={item.id} 
                  className="border-wine-gold/10 hover:bg-wine-champagne/50 transition-colors"
                >
                  <TableCell className="font-medium text-wine-dark">
                    {item.name}
                  </TableCell>
                  <TableCell className="text-center">
                    {editingId === item.id ? (
                      <div className="flex items-center justify-center gap-2">
                        <Input
                          type="number"
                          value={editCount}
                          onChange={(e) => setEditCount(parseInt(e.target.value) || 0)}
                          className="w-20 text-center"
                          min="0"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <Badge 
                        variant={getCountBadgeVariant(item.count)}
                        className="font-mono text-sm"
                      >
                        {item.count}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground text-sm">
                      {item.category || "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground text-sm">
                      {item.notes || "—"}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {editingId === item.id ? (
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          size="sm"
                          onClick={() => handleSave(item)}
                          className="h-8 w-8 p-0 bg-wine-burgundy hover:bg-wine-burgundy/90"
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancel}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(item)}
                        className="h-8 w-8 p-0 text-wine-burgundy hover:bg-wine-champagne hover:text-wine-burgundy"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {inventory.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Wine className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium mb-2">Start speaking to add items</p>
            <p>Say the wine name followed by the count number</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

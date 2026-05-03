import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  CheckSquare,
  Trash2,
  Mail,
  Download,
  Archive,
  CheckCircle,
  XCircle,
  MoreHorizontal
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BulkActionsProps<T> {
  items: T[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onBulkAction: (action: string, ids: string[]) => Promise<void>;
  actions?: {
    label: string;
    value: string;
    icon: React.ComponentType<{ className?: string }>;
    variant?: "default" | "destructive";
  }[];
}

export function BulkActions<T extends { id: string }>({
  items,
  selectedIds,
  onSelectionChange,
  onBulkAction,
  actions = [
    { label: "Delete", value: "delete", icon: Trash2, variant: "destructive" as const },
    { label: "Send Email", value: "email", icon: Mail },
    { label: "Export", value: "export", icon: Download },
    { label: "Archive", value: "archive", icon: Archive },
  ]
}: BulkActionsProps<T>) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSelectAll = () => {
    if (selectedIds.length === items.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(items.map(item => item.id));
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedIds.length === 0) {
      toast({
        title: "No items selected",
        description: "Please select at least one item",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      await onBulkAction(action, selectedIds);
      toast({
        title: "Success",
        description: `${action} completed for ${selectedIds.length} item(s)`,
      });
      onSelectionChange([]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="flex items-center gap-4 mb-4 p-4 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-2">
        <Checkbox
          checked={selectedIds.length === items.length}
          onCheckedChange={handleSelectAll}
          aria-label="Select all"
        />
        <span className="text-sm font-medium">
          {selectedIds.length > 0 ? (
            <Badge variant="secondary">
              {selectedIds.length} of {items.length} selected
            </Badge>
          ) : (
            `Select all (${items.length})`
          )}
        </span>
      </div>

      {selectedIds.length > 0 && (
        <div className="flex items-center gap-2 ml-auto">
          {actions.map((action) => (
            <Button
              key={action.value}
              variant={action.variant || "outline"}
              size="sm"
              onClick={() => handleBulkAction(action.value)}
              disabled={loading}
            >
              <action.icon className="h-4 w-4 mr-2" />
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
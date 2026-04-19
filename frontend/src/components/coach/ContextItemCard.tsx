import type { PerformanceContextItem } from "@/types";
import { cn } from "@/lib/utils";
import { Calendar, BarChart2 } from "lucide-react";

interface ContextItemCardProps {
  item: PerformanceContextItem;
  isSelected: boolean;
  onSelect: (item: PerformanceContextItem) => void;
}

export function ContextItemCard({ item, isSelected, onSelect }: ContextItemCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-red-500 bg-red-50 border-red-100";
      case "medium": return "text-amber-500 bg-amber-50 border-amber-100";
      case "low": return "text-blue-500 bg-blue-50 border-blue-100";
      default: return "text-gray-500 bg-gray-50 border-gray-100";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active": return "进行中";
      case "completed": return "已完成";
      case "archived": return "已归档";
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-700";
      case "completed": return "bg-blue-100 text-blue-700";
      case "archived": return "bg-gray-100 text-gray-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div
      onClick={() => onSelect(item)}
      className={cn(
        "cursor-pointer rounded-lg border p-4 transition-all hover:shadow-md",
        isSelected
          ? "border-notion-blue bg-blue-50/20 ring-1 ring-notion-blue"
          : "border-gray-200 bg-white hover:border-notion-blue/30"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-bold text-foreground line-clamp-2">{item.title}</h3>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
            getStatusColor(item.status)
          )}
        >
          {getStatusLabel(item.status)}
        </span>
      </div>
      
      <p className="mt-2 text-xs text-notion-gray-500 line-clamp-2">{item.summary}</p>
      
      <div className="mt-4 flex flex-wrap items-center gap-3 text-[10px] text-notion-gray-400">
        {item.target_date && (
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{new Date(item.target_date).toLocaleDateString()}</span>
          </div>
        )}
        <div className={cn("flex items-center gap-1 rounded border px-1.5 py-0.5 font-semibold", getPriorityColor(item.priority))}>
          <BarChart2 className="h-2.5 w-2.5" />
          <span className="capitalize">{item.priority}</span>
        </div>
      </div>
    </div>
  );
}

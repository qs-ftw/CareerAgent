import { Plus } from "lucide-react";
import type { PerformanceContextItem } from "@/types";
import { ContextItemCard } from "./ContextItemCard";

interface ContextItemListProps {
  items: PerformanceContextItem[];
  selectedId?: string;
  onSelect: (item: PerformanceContextItem) => void;
  onAdd: () => void;
}

export function ContextItemList({ items, selectedId, onSelect, onAdd }: ContextItemListProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-notion-gray-500 uppercase tracking-wider">上下文项</h2>
        <button
          onClick={onAdd}
          className="rounded p-1 text-notion-gray-500 hover:bg-notion-bg-secondary hover:text-foreground"
          title="添加上下文"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      
      <div className="flex flex-col gap-3">
        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-xs text-notion-gray-400">
            暂无上下文，点击上方 + 开始添加
          </div>
        ) : (
          items.map((item) => (
            <ContextItemCard
              key={item.id}
              item={item}
              isSelected={item.id === selectedId}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </div>
  );
}

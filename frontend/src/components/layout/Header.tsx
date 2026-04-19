import type { ReactNode } from "react";

interface HeaderProps {
  title: ReactNode;
  description?: string;
  actions?: ReactNode;
}

export function Header({ title, description, actions }: HeaderProps) {
  return (
    <div className="border-b border-border bg-white px-8 py-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight-sub text-foreground leading-none">
            {title}
          </h2>
          {description && (
            <p className="text-sm font-medium text-notion-gray-500">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

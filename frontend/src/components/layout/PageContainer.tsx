import type { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <main className="flex-1 overflow-auto">
      <div className={`mx-auto max-w-7xl px-8 py-8 ${className ?? ""}`}>
        {children}
      </div>
    </main>
  );
}

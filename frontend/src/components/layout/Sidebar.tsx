import { NavLink, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Target,
  FileText,
  BarChart3,
  UserCircle,
  Briefcase,
  Map,
  Sparkles,
  Library,
  BookOpen,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "仪表盘", icon: LayoutDashboard },
  { to: "/profile", label: "个人画像", icon: UserCircle },
  { to: "/portfolio", label: "职业履历", icon: Briefcase },
  { to: "/coach", label: "绩效教练", icon: Trophy },
  { to: "/roles", label: "岗位目标", icon: Target },
  { to: "/resumes", label: "简历管理", icon: FileText },
  { to: "/knowledge", label: "专业知识库", icon: BookOpen },
  { to: "/stories", label: "故事库", icon: Library },
  { to: "/gaps", label: "Gap 看板", icon: BarChart3 },
  { to: "/guide", label: "新手指南", icon: Map },
];

export function Sidebar() {
  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-white">
      <div className="flex h-14 items-center border-b border-border px-4">
        <Link to="/" className="group flex items-center gap-2.5 hover:opacity-90 transition-all">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-notion-blue text-white shadow-notion-card group-hover:rotate-3 transition-transform duration-300">
            <Sparkles className="h-5 w-5 fill-white/20" />
            <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white border border-notion-blue/10 shadow-sm">
              <div className="h-1.5 w-1.5 rounded-full bg-notion-blue animate-pulse" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-notion-blue uppercase tracking-widest leading-none mb-0.5">Oh My</span>
            <span className="text-sm font-extrabold text-foreground leading-none tracking-tight">Career Agent</span>
          </div>
        </Link>
      </div>
      <nav className="flex-1 space-y-0.5 p-3 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-1.5 text-sm font-medium transition-all group",
                isActive
                  ? "bg-notion-warm-white text-notion-blue shadow-sm"
                  : "text-notion-gray-500 hover:bg-notion-warm-white hover:text-foreground"
              )
            }
          >
            <item.icon className={cn("h-4 w-4", "group-hover:text-notion-blue transition-colors")} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-border p-4 bg-notion-warm-white/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] font-bold text-notion-gray-300 uppercase tracking-tighter">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
            v0.1.0 CONNECTED
          </div>
        </div>
      </div>
    </aside>
  );
}

import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  CalendarDays, 
  BarChart3, 
  Settings, 
  PenSquare, 
  Zap,
  LayoutGrid,
  Sparkles,
  Clapperboard
} from "lucide-react";

const NAV_ITEMS = [
  { icon: PenSquare, label: "Planificateur", href: "/planner" },
  { icon: Clapperboard, label: "Laboratoire Vidéo", href: "/video-lab" },
  { icon: CalendarDays, label: "Calendrier", href: "/calendar" },
  { icon: LayoutGrid, label: "Kanban", href: "/kanban" },
  { icon: BarChart3, label: "Analytics", href: "/analytics" },
  { icon: Settings, label: "Paramètres", href: "/settings" },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-72 border-r border-gray-100 bg-white flex flex-col h-screen fixed left-0 top-0 z-50 shadow-sm">
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-200">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-gray-900 tracking-tight">Social Planner</h1>
            <p className="text-xs text-gray-500">Pro Edition</p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        <p className="px-4 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Menu</p>
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href || (item.href === "/planner" && location === "/");
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className={cn(
                "flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-all duration-200 group",
                isActive
                  ? "sidebar-item-active"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              <div className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200",
                isActive 
                  ? "bg-gradient-to-br from-violet-500 to-purple-600 shadow-md shadow-violet-200" 
                  : "bg-gray-100 group-hover:bg-gray-200"
              )}>
                <item.icon className={cn(
                  "w-4 h-4 transition-colors",
                  isActive ? "text-white" : "text-gray-500 group-hover:text-gray-700"
                )} />
              </div>
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 space-y-4 border-t border-gray-100">
        {/* Pro Badge */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-violet-600" />
            <span className="text-xs font-semibold text-violet-700">Pro Features</span>
          </div>
          <p className="text-xs text-gray-600">IA, webhooks Make.com et plus encore.</p>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
            JD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">John Doe</p>
            <p className="text-xs text-gray-500 truncate">john@example.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

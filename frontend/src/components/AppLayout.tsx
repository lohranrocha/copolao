import { NavLink, Outlet } from "react-router-dom";
import { BarChart3, CalendarDays, ClipboardList, Home, ListChecks, LogOut, Shield, Trophy, type LucideIcon } from "lucide-react";
import clsx from "clsx";
import { useAuth } from "../api/auth";

const baseItems = [
  { to: "/", label: "Inicio", icon: Home },
  { to: "/jogos", label: "Jogos", icon: CalendarDays },
  { to: "/palpites", label: "Palpites", icon: ClipboardList },
  { to: "/ranking", label: "Ranking", icon: BarChart3 },
  { to: "/regras", label: "Regras", icon: ListChecks }
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const items = user?.role === "ADMIN" ? [...baseItems, { to: "/admin", label: "Admin", icon: Shield }] : baseItems;

  return (
    <div className="min-h-screen bg-slate-50 text-night">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-pitch text-white shadow-soft">
              <Trophy size={22} />
            </div>
            <div>
              <p className="text-sm font-semibold leading-5">Bolao Copa</p>
              <p className="text-xs text-slate-500">{user?.nickname || user?.name}</p>
            </div>
          </div>
          <button
            className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600"
            type="button"
            title="Sair"
            onClick={logout}
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-1 md:grid-cols-[220px_1fr]">
        <aside className="hidden min-h-[calc(100vh-65px)] border-r border-slate-200 bg-white p-3 md:block">
          <nav className="space-y-1">
            {items.map((item) => (
              <NavItem key={item.to} {...item} />
            ))}
          </nav>
        </aside>

        <main className="px-4 pb-24 pt-5 md:px-6 md:pb-8">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white px-2 py-2 shadow-soft md:hidden">
        <div className="grid grid-cols-4 gap-1">
          {items.slice(0, 4).map((item) => (
            <NavItem key={item.to} {...item} compact />
          ))}
        </div>
      </nav>
    </div>
  );
}

function NavItem({
  to,
  label,
  icon: Icon,
  compact = false
}: {
  to: string;
  label: string;
  icon: LucideIcon;
  compact?: boolean;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        clsx(
          "flex items-center rounded-lg text-sm font-medium transition",
          compact ? "h-14 flex-col justify-center gap-1 px-1" : "h-11 gap-3 px-3",
          isActive ? "bg-pitch text-white" : "text-slate-600 hover:bg-slate-100"
        )
      }
    >
      <Icon size={compact ? 18 : 19} />
      <span className={compact ? "text-[11px]" : ""}>{label}</span>
    </NavLink>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Puzzle,
  Building2,
  CheckSquare,
  BarChart3,
  Shield,
  ScrollText,
  Settings,
  Users,
  FileKey,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navSections = [
  {
    label: "Main",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/skills", label: "Skills", icon: Puzzle },
      { href: "/review", label: "Review Queue", icon: CheckSquare },
    ],
  },
  {
    label: "Organization",
    items: [
      { href: "/org", label: "Structure", icon: Building2 },
      { href: "/org/members", label: "Members", icon: Users },
      { href: "/org/policies", label: "Access Policies", icon: FileKey },
    ],
  },
  {
    label: "Insights",
    items: [
      { href: "/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/admin/audit", label: "Audit Logs", icon: ScrollText },
      { href: "/admin/security", label: "Security", icon: Shield },
    ],
  },
  {
    label: "Admin",
    items: [
      { href: "/admin/settings", label: "Settings", icon: Settings },
      { href: "/settings/profile", label: "Profile", icon: UserCog },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Puzzle className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-semibold">Skills Hub</div>
            <div className="text-xs text-muted-foreground">Enterprise</div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {navSections.map((section) => (
          <div key={section.label}>
            <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {section.label}
            </div>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
            <span className="text-xs font-medium">AC</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">Alice Chen</div>
            <div className="text-xs text-muted-foreground truncate">alice@acme.com</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

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
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/session";
import { useTheme } from "@/components/layout/ThemeProvider";
import { useState, useRef, useEffect } from "react";

// Role hierarchy — higher number = more privilege
const ROLE_LEVELS: Record<string, number> = {
  owner: 100,
  admin: 90,
  bu_admin: 70,
  dept_admin: 50,
  team_admin: 30,
  member: 10,
  viewer: 1,
};

function hasMinRole(userRole: string | null, requiredRole: string): boolean {
  if (!userRole) return false;
  return (ROLE_LEVELS[userRole] ?? 0) >= (ROLE_LEVELS[requiredRole] ?? 0);
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  minRole?: string;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    label: "Main",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/skills", label: "Skills", icon: Puzzle },
      { href: "/review", label: "Review Queue", icon: CheckSquare, minRole: "admin" },
    ],
  },
  {
    label: "Organization",
    items: [
      { href: "/org", label: "Structure", icon: Building2 },
      { href: "/org/members", label: "Members", icon: Users, minRole: "admin" },
      { href: "/org/policies", label: "Access Policies", icon: FileKey, minRole: "admin" },
    ],
  },
  {
    label: "Insights",
    items: [
      { href: "/analytics", label: "Analytics", icon: BarChart3, minRole: "admin" },
      { href: "/admin/audit", label: "Audit Logs", icon: ScrollText, minRole: "admin" },
      { href: "/admin/security", label: "Security", icon: Shield, minRole: "admin" },
    ],
  },
  {
    label: "Admin",
    items: [
      { href: "/admin/settings", label: "Settings", icon: Settings, minRole: "admin" },
      { href: "/settings/profile", label: "Profile", icon: UserCog },
    ],
  },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, org, role } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [themeOpen, setThemeOpen] = useState(false);
  const themeRef = useRef<HTMLDivElement>(null);

  // Filter nav items based on user role — items without minRole are visible to all
  const visibleSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.minRole || hasMinRole(role, item.minRole)),
    }))
    .filter((section) => section.items.length > 0);

  // Close theme dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setThemeOpen(false);
      }
    }
    if (themeOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [themeOpen]);

  const initials = user?.name ? getInitials(user.name) : "??";
  const displayName = user?.name ?? "Unknown";
  const displayEmail = user?.email ?? "";

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
        {visibleSections.map((section) => (
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

      {/* Footer: Theme toggle + User info */}
      <div className="border-t p-4 space-y-3">
        {/* Theme Toggle */}
        <div className="relative" ref={themeRef}>
          <button
            onClick={() => setThemeOpen(!themeOpen)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {resolvedTheme === "dark" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
            <span>Theme: {theme === "system" ? "System" : theme === "dark" ? "Dark" : "Light"}</span>
          </button>
          {themeOpen && (
            <div className="absolute bottom-full left-0 mb-1 w-full rounded-lg border bg-popover p-1 shadow-lg">
              {([
                { value: "light" as const, label: "Light", icon: Sun },
                { value: "dark" as const, label: "Dark", icon: Moon },
                { value: "system" as const, label: "System", icon: Monitor },
              ]).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setTheme(opt.value); setThemeOpen(false); }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
                    theme === opt.value
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <opt.icon className="h-4 w-4" />
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={displayName} className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <span className="text-xs font-medium">{initials}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{displayName}</div>
            <div className="text-xs text-muted-foreground truncate">{displayEmail}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Puzzle,
  CheckSquare,
  Building2,
  BarChart3,
  Shield,
  ScrollText,
  Settings,
  Plus,
  UserPlus,
  Search,
  Command,
} from "lucide-react";
import { cn } from "@/lib/utils";

type CommandItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  section: "Navigation" | "Actions";
  href?: string;
  shortcut?: string;
  action?: () => void;
};

const commandItems: CommandItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, section: "Navigation", href: "/" },
  { id: "skills", label: "Skills", icon: Puzzle, section: "Navigation", href: "/skills" },
  { id: "review", label: "Review Queue", icon: CheckSquare, section: "Navigation", href: "/review" },
  { id: "org", label: "Organization", icon: Building2, section: "Navigation", href: "/org" },
  { id: "analytics", label: "Analytics", icon: BarChart3, section: "Navigation", href: "/analytics" },
  { id: "audit", label: "Audit Logs", icon: ScrollText, section: "Navigation", href: "/admin/audit" },
  { id: "security", label: "Security", icon: Shield, section: "Navigation", href: "/admin/security" },
  { id: "settings", label: "Settings", icon: Settings, section: "Navigation", href: "/settings/profile" },
  { id: "new-skill", label: "New Skill", icon: Plus, section: "Actions", href: "/skills/new" },
  { id: "invite-member", label: "Invite Member", icon: UserPlus, section: "Actions", action: () => {} },
];

function fuzzyMatch(query: string, text: string): boolean {
  const lowerQuery = query.toLowerCase();
  const lowerText = text.toLowerCase();
  let queryIndex = 0;

  for (let i = 0; i < lowerText.length && queryIndex < lowerQuery.length; i++) {
    if (lowerText[i] === lowerQuery[queryIndex]) {
      queryIndex++;
    }
  }

  return queryIndex === lowerQuery.length;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const filteredItems = commandItems.filter((item) =>
    query === "" ? true : fuzzyMatch(query, item.label)
  );

  const groupedItems = {
    Navigation: filteredItems.filter((item) => item.section === "Navigation"),
    Actions: filteredItems.filter((item) => item.section === "Actions"),
  };

  const flatFiltered = [...groupedItems.Navigation, ...groupedItems.Actions];

  const handleOpen = useCallback(() => {
    setOpen(true);
    setQuery("");
    setSelectedIndex(0);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  const handleSelect = useCallback(
    (item: CommandItem) => {
      handleClose();
      if (item.href) {
        router.push(item.href);
      } else if (item.action) {
        item.action();
      }
    },
    [handleClose, router]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (open) {
          handleClose();
        } else {
          handleOpen();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, handleOpen, handleClose]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleListKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % flatFiltered.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + flatFiltered.length) % flatFiltered.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flatFiltered[selectedIndex]) {
        handleSelect(flatFiltered[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleClose();
    }
  };

  useEffect(() => {
    if (!listRef.current) return;
    const activeElement = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
    if (activeElement) {
      activeElement.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  if (!open) return null;

  let flatIndex = -1;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      {/* Dialog */}
      <div
        className="relative w-full max-w-lg rounded-xl border bg-card shadow-2xl"
        onKeyDown={handleListKeyDown}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 border-b px-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent py-4 text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="pointer-events-none flex h-5 items-center gap-1 rounded border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
            <Command className="h-3 w-3" />K
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-80 overflow-y-auto p-2">
          {flatFiltered.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No results found.
            </div>
          )}

          {(["Navigation", "Actions"] as const).map((section) => {
            const items = groupedItems[section];
            if (items.length === 0) return null;

            return (
              <div key={section} className="mb-2">
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  {section}
                </div>
                {items.map((item) => {
                  flatIndex++;
                  const currentIndex = flatIndex;
                  const Icon = item.icon;
                  const isSelected = currentIndex === selectedIndex;

                  return (
                    <button
                      key={item.id}
                      data-index={currentIndex}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                        isSelected
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.shortcut && (
                        <kbd className="flex h-5 items-center rounded border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
                          {item.shortcut}
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

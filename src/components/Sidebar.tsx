"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import Wordmark from "@/components/Wordmark";
import {
  Home,
  Settings,
  LogOut,
  Map,
  FileText,
  ClipboardList,
  Tractor,
  Layers,
  Users,
  ClipboardCheck,
  Menu,
  X,
  User,
} from "lucide-react";

const supervisorNav = [
  { name: "Executive Overview",  href: "/supervisor",            icon: Home },
  { name: "Agribusiness Herd",  href: "/supervisor/herd",       icon: Layers },
  { name: "Cereal Contracts",   href: "/supervisor/operations",   icon: Map },
  { name: "Gross Revenue",      href: "/supervisor/finances",     icon: Tractor },
  { name: "Staff Directory",    href: "/supervisor/people",       icon: Users },
  { name: "Print Reports",      href: "/supervisor/reports",      icon: FileText },
];

const managerNav = [
  { name: "Dashboard",  href: "/manager",           icon: Home },
  { name: "Livestock",  href: "/manager/livestock", icon: Layers },
  { name: "Fields",     href: "/manager/fields",    icon: Map },
  { name: "Inventory",  href: "/manager/inventory",  icon: ClipboardList },
  { name: "Equipment",  href: "/manager/equipment",  icon: Tractor },
  { name: "Requests",   href: "/manager/requests",   icon: FileText },
  { name: "Tasks",      href: "/manager/tasks",      icon: ClipboardCheck },
  { name: "Workers",    href: "/manager/workers",    icon: Users },
];

const workerNav = [
  { name: "Dashboard",    href: "/worker",              icon: Home },
  { name: "Yield Logging", href: "/worker/milk",         icon: Layers },
  { name: "Field Log",    href: "/worker/record/crops", icon: Map },
  { name: "Health Log",   href: "/worker/record/health", icon: ClipboardCheck },
  { name: "Inventory",    href: "/worker/inventory",    icon: ClipboardList },
  { name: "Equipment",    href: "/worker/equipment",    icon: Tractor },
  { name: "Requests",     href: "/worker/requests",     icon: FileText },
  { name: "Tasks",        href: "/worker/tasks",        icon: ClipboardCheck },
];

function NavItem({
  item,
  pathname,
  onClick,
}: {
  item: { name: string; href: string; icon: any };
  pathname: string;
  onClick?: () => void;
}) {
  const isActive =
    item.href === "/manager" || item.href === "/worker" || item.href === "/supervisor"
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(item.href + "/");

  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      id={`nav-${item.href.replace(/\//g, "-")}`}
      className={`
        group flex items-center gap-3 px-3 py-2 rounded-none text-sm font-medium
        transition-colors duration-100 border border-transparent
        ${
          isActive
            ? "bg-moss text-cream border-moss"
            : "text-ink hover:bg-paper-2 hover:text-ink border-transparent"
        }
      `}
    >
      <Icon
        className={`h-4 w-4 shrink-0 transition-colors ${
          isActive ? "text-cream" : "text-muted group-hover:text-ink"
        }`}
      />
      <span className="flex-1 truncate">{item.name}</span>
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuthActions();
  const user = useQuery(api.users.viewer);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/signin");
    } catch (error) {
      console.error("[Auth] signOut failed:", error);
    }
  };

  const role = user?.role ?? "worker";
  
  let navItems = workerNav;
  if (role === "supervisor") navItems = supervisorNav;
  else if (role === "manager") navItems = managerNav;

  const settingsHref = role === "worker" ? "/worker/settings" : "/settings";

  // Avatar renderer helper
  const renderAvatar = () => {
    if (user?.image && user.image.startsWith("avatar:")) {
      const parts = user.image.split(":");
      const type = parts[1];
      // Inline visual fallback for presetted avatars
      return (
        <div className="w-7 h-7 bg-moss flex items-center justify-center shrink-0 border border-cream font-display text-cream text-[10px]">
          {type.charAt(0).toUpperCase()}
        </div>
      );
    }
    if (user?.imageUrl) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.imageUrl}
          alt={user?.name ?? "PFP"}
          className="w-7 h-7 rounded-none object-cover shrink-0 border border-rule"
        />
      );
    }
    return (
      <div className="w-7 h-7 bg-moss flex items-center justify-center shrink-0 text-cream text-[10px] font-medium font-sans">
        {(user?.name ?? "U").charAt(0).toUpperCase()}
      </div>
    );
  };

  return (
    <>
      {/* ── Mobile top bar ──────────────────────────── */}
      <header className="md:hidden w-full bg-cream border-b border-rule px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <Wordmark size={20} tone="moss" />
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-none hover:bg-paper-2 text-ink transition-colors"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* ── Mobile drawer ───────────────────────────── */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[49px] bg-paper z-30 flex flex-col px-4 py-4 overflow-y-auto border-t border-rule">
          <nav className="space-y-0.5 flex-1">
            {navItems.map((item) => (
              <NavItem
                key={item.href}
                item={item}
                pathname={pathname}
                onClick={() => setMobileMenuOpen(false)}
              />
            ))}
             <NavItem
              item={{ name: "Settings", href: settingsHref, icon: Settings }}
              pathname={pathname}
              onClick={() => setMobileMenuOpen(false)}
            />
          </nav>

          <div className="mt-6 pt-4 border-t border-rule">
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 h-10 rounded-none border border-rule text-ink text-sm font-medium hover:bg-paper-2 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* ── Desktop sidebar ─────────────────────────── */}
      <aside
        className="hidden md:flex flex-col w-[240px] shrink-0 h-screen sticky top-0 z-20 bg-cream border-r border-rule"
      >
        {/* Logo block */}
        <div className="px-5 py-4 border-b border-rule">
          <div className="flex items-center gap-2 mb-2">
            <Wordmark size={22} tone="moss" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-[0.1em] text-muted">
              {role} portal
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5 custom-scrollbar">
          {navItems.map((item) => (
            <NavItem key={item.href} item={item} pathname={pathname} />
          ))}

          <div className="pt-2 mt-2 border-t border-rule">
            <NavItem
              item={{ name: "Settings", href: settingsHref, icon: Settings }}
              pathname={pathname}
            />
          </div>
        </nav>

        {/* User footer */}
        <div className="px-3 pb-4 border-t border-rule pt-3 space-y-3">
          <div className="flex items-center gap-3 px-2 py-2 rounded-none border border-rule bg-paper">
            {renderAvatar()}
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-bold text-ink truncate leading-tight">
                {user?.name ?? "User"}
              </p>
              <p className="text-[11px] text-muted truncate leading-tight">
                {user?.email ?? "loading..."}
              </p>
            </div>
            <Link
              href={settingsHref}
              title="Settings"
              className="p-1.5 rounded-none hover:bg-paper-2 text-ink hover:text-ink transition-colors shrink-0"
            >
              <Settings className="h-3.5 w-3.5" />
            </Link>
          </div>

          <button
            type="button"
            id="signout-btn"
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 h-9 rounded-none border border-rule text-ink text-[12px] font-medium hover:bg-paper-2 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}

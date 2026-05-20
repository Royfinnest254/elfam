"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
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
  ChevronRight,
} from "lucide-react";

const managerNav = [
  { name: "Dashboard",  href: "/manager",           icon: Home },
  { name: "Livestock",  href: "/manager/livestock",  icon: Layers },
  { name: "Crops",      href: "/manager/crops",      icon: Map },
  { name: "Inventory",  href: "/manager/inventory",  icon: ClipboardList },
  { name: "Equipment",  href: "/manager/equipment",  icon: Tractor },
  { name: "Requests",   href: "/manager/requests",   icon: FileText },
  { name: "Tasks",      href: "/manager/tasks",      icon: ClipboardCheck },
  { name: "Workers",    href: "/manager/workers",    icon: Users },
];

const workerNav = [
  { name: "Dashboard",  href: "/worker",            icon: Home },
  { name: "Livestock",  href: "/worker/livestock",   icon: Layers },
  { name: "Crops",      href: "/worker/crops",       icon: Map },
  { name: "Inventory",  href: "/worker/inventory",   icon: ClipboardList },
  { name: "Equipment",  href: "/worker/equipment",   icon: Tractor },
  { name: "Requests",   href: "/worker/requests",    icon: FileText },
  { name: "Tasks",      href: "/worker/tasks",       icon: ClipboardCheck },
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
    item.href === "/manager" || item.href === "/worker"
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(item.href + "/");

  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      id={`nav-${item.href.replace(/\//g, "-")}`}
      className={`
        group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold
        transition-all duration-150
        ${
          isActive
            ? "bg-[#EBF7F9] text-[#00869B]"
            : "text-[#374151] hover:bg-[#F3F4F6] hover:text-[#111827]"
        }
      `}
    >
      <Icon
        className={`h-4 w-4 shrink-0 transition-colors ${
          isActive ? "text-[#00869B]" : "text-[#9CA3AF] group-hover:text-[#374151]"
        }`}
      />
      <span className="flex-1 truncate">{item.name}</span>
      {isActive && (
        <ChevronRight className="h-3.5 w-3.5 text-[#00869B] shrink-0" />
      )}
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
  const navItems = role === "worker" ? workerNav : managerNav;

  return (
    <>
      {/* ── Mobile top bar ──────────────────────────── */}
      <header className="md:hidden w-full bg-white border-b border-[#E4E7EC] px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <span className="text-[#0F1B2D] font-black uppercase tracking-[0.25em] select-none text-[16px] font-sans">
            Elfam
          </span>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-[#F3F4F6] text-[#374151] transition-colors"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* ── Mobile drawer ───────────────────────────── */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[57px] bg-white z-30 flex flex-col px-4 py-4 overflow-y-auto">
          <nav className="space-y-1 flex-1">
            {navItems.map((item) => (
              <NavItem
                key={item.href}
                item={item}
                pathname={pathname}
                onClick={() => setMobileMenuOpen(false)}
              />
            ))}
            <NavItem
              item={{ name: "Settings", href: "/settings", icon: Settings }}
              pathname={pathname}
              onClick={() => setMobileMenuOpen(false)}
            />
          </nav>

          <div className="mt-6 pt-4 border-t border-[#E4E7EC]">
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 h-10 rounded-lg border border-[#E4E7EC] text-[#6B7280] text-sm font-semibold hover:bg-[#F3F4F6] hover:text-[#111827] transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* ── Desktop sidebar ─────────────────────────── */}
      <aside
        className="hidden md:flex flex-col w-[240px] shrink-0 h-screen sticky top-0 z-20 bg-white border-r border-[#E4E7EC]"
        style={{ boxShadow: "1px 0 0 #E4E7EC" }}
      >
        {/* Logo block */}
        <div className="px-5 py-5 border-b border-[#E4E7EC]">
          <div className="flex items-center gap-2.5 mb-3">
            <span className="text-[#0F1B2D] font-black uppercase tracking-[0.25em] select-none text-[17px] font-sans">
              Elfam
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.09em] text-[#00869B] font-sans">
              {role} portal
            </span>
            <span className="text-[10px] text-[#9CA3AF] font-sans">
              Moiben, KE
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5 custom-scrollbar">
          {navItems.map((item) => (
            <NavItem key={item.href} item={item} pathname={pathname} />
          ))}

          <div className="pt-2 mt-2 border-t border-[#E4E7EC]">
            <NavItem
              item={{ name: "Settings", href: "/settings", icon: Settings }}
              pathname={pathname}
            />
          </div>
        </nav>

        {/* User footer */}
        <div className="px-3 pb-4 border-t border-[#E4E7EC] pt-3 space-y-3">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-[#F9FAFB]">
            <div className="w-7 h-7 rounded-full bg-[#0F1B2D] flex items-center justify-center shrink-0">
              <span className="text-white text-[10px] font-bold select-none">
                {(user?.name ?? "U").charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-bold text-[#111827] truncate leading-tight">
                {user?.name ?? "Registry User"}
              </p>
              <p className="text-[11px] text-[#9CA3AF] truncate leading-tight">
                {user?.email ?? "loading..."}
              </p>
            </div>
            <Link
              href="/settings"
              title="Settings"
              className="p-1.5 rounded-md hover:bg-[#E4E7EC] text-[#9CA3AF] hover:text-[#374151] transition-colors shrink-0"
            >
              <Settings className="h-3.5 w-3.5" />
            </Link>
          </div>

          <button
            type="button"
            id="signout-btn"
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 h-9 rounded-lg border border-[#E4E7EC] text-[#6B7280] text-[12px] font-semibold hover:bg-[#F3F4F6] hover:text-[#111827] transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}

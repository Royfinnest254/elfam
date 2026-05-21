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
        group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
        transition-colors duration-100
        ${
          isActive
            ? "bg-[#E8F0FE] text-[#1A56DB]"
            : "text-[#5F6368] hover:bg-[#F1F3F4] hover:text-[#202124]"
        }
      `}
    >
      <Icon
        className={`h-4 w-4 shrink-0 transition-colors ${
          isActive ? "text-[#1A56DB]" : "text-[#9AA0A6] group-hover:text-[#5F6368]"
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
  const navItems = role === "worker" ? workerNav : managerNav;

  return (
    <>
      {/* ── Mobile top bar ──────────────────────────── */}
      <header className="md:hidden w-full bg-white border-b border-[#DADCE0] px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <span className="text-[#1A56DB] font-semibold tracking-[0.15em] select-none text-[16px] font-sans">
            Elfam
          </span>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-[#F1F3F4] text-[#5F6368] transition-colors"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* ── Mobile drawer ───────────────────────────── */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[57px] bg-white z-30 flex flex-col px-4 py-4 overflow-y-auto">
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
              item={{ name: "Settings", href: "/settings", icon: Settings }}
              pathname={pathname}
              onClick={() => setMobileMenuOpen(false)}
            />
          </nav>

          <div className="mt-6 pt-4 border-t border-[#DADCE0]">
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 h-10 rounded-lg border border-[#DADCE0] text-[#5F6368] text-sm font-medium hover:bg-[#F8F9FA] hover:text-[#202124] transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* ── Desktop sidebar ─────────────────────────── */}
      <aside
        className="hidden md:flex flex-col w-[240px] shrink-0 h-screen sticky top-0 z-20 bg-white border-r border-[#DADCE0]"
        style={{ boxShadow: "1px 0 0 #DADCE0" }}
      >
        {/* Logo block */}
        <div className="px-5 py-4 border-b border-[#DADCE0]">
          <div className="flex items-center gap-2.5 mb-2">
            <span className="text-[#1A56DB] font-semibold tracking-[0.15em] select-none text-[17px] font-sans">
              Elfam
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#5F6368] font-sans">
              {role} portal
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5 custom-scrollbar">
          {navItems.map((item) => (
            <NavItem key={item.href} item={item} pathname={pathname} />
          ))}

          <div className="pt-2 mt-2 border-t border-[#DADCE0]">
            <NavItem
              item={{ name: "Settings", href: "/settings", icon: Settings }}
              pathname={pathname}
            />
          </div>
        </nav>

          {/* User footer */}
          <div className="px-3 pb-4 border-t border-[#DADCE0] pt-3 space-y-3">
            <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-[#F8F9FA]">
              <div className="w-7 h-7 rounded-full bg-[#1A73E8] flex items-center justify-center shrink-0">
                <span className="text-white text-[10px] font-medium select-none">
                  {(user?.name ?? "U").charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-medium text-[#202124] truncate leading-tight">
                  {user?.name ?? "User"}
                </p>
                <p className="text-[11px] text-[#5F6368] truncate leading-tight">
                  {user?.email ?? "loading..."}
                </p>
              </div>
              <Link
                href="/settings"
                title="Settings"
                className="p-1.5 rounded-md hover:bg-[#DADCE0] text-[#9AA0A6] hover:text-[#5F6368] transition-colors shrink-0"
              >
                <Settings className="h-3.5 w-3.5" />
              </Link>
            </div>

            <button
              type="button"
              id="signout-btn"
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 h-9 rounded-lg border border-[#DADCE0] text-[#5F6368] text-[12px] font-medium hover:bg-[#F8F9FA] hover:text-[#202124] transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>
          </div>
      </aside>
    </>
  );
}

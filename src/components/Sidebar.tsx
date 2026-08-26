"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AddProblemButton } from "@/components/AddProblemButton";
import { cn } from "@/lib/cn";

const PRIMARY_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/progress", label: "Progress" },
  { href: "/problems", label: "Problems" },
  { href: "/tags", label: "Tags" },
  { href: "/goals", label: "Goals" },
  { href: "/calendar", label: "Calendar" },
];

const SECONDARY_LINKS = [{ href: "/settings", label: "Settings" }];

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={cn(
        "block rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-accent-soft text-accent"
          : "text-content-muted hover:bg-surface-sunken hover:text-content",
      )}
    >
      {label}
    </Link>
  );
}

export function Sidebar() {
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-surface-raised">
      <div className="space-y-4 px-5 py-6">
        <Link href="/dashboard" className="block text-lg font-semibold tracking-tight">
          LeetTrack
        </Link>
        <AddProblemButton className="w-full" />
      </div>

      <nav className="flex flex-1 flex-col justify-between px-3 pb-4">
        <div className="space-y-1">
          {PRIMARY_LINKS.map((link) => (
            <NavLink key={link.href} {...link} />
          ))}
        </div>
        <div className="space-y-1">
          {SECONDARY_LINKS.map((link) => (
            <NavLink key={link.href} {...link} />
          ))}
        </div>
      </nav>
    </aside>
  );
}

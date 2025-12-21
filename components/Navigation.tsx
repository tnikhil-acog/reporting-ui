"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Home", icon: "🏠" },
    { href: "/generate", label: "Generate", icon: "✨" },
    { href: "/jobs", label: "My Jobs", icon: "📋" },
    { href: "/reports", label: "Reports", icon: "📖" },
    { href: "/profiles", label: "Profiles", icon: "🔐" },
  ];

  return (
    <nav className="border-b border-gray-200 bg-white/80 backdrop-blur dark:border-slate-700 dark:bg-slate-800/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">📊</span>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              Report Hub
            </span>
          </Link>

          <div className="hidden md:flex gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white dark:bg-blue-500"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700"
                  }`}
                >
                  <span>{item.icon}</span> {item.label}
                </Link>
              );
            })}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button className="inline-flex items-center justify-center rounded-lg p-2 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700">
              <span className="text-xl">☰</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

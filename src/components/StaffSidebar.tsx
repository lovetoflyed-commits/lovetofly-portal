"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const menu = [
  { label: "Dashboard", href: "/staff/dashboard", icon: "🏠" },
  { label: "Verificações", href: "/staff/verifications", icon: "👤" },
  { label: "Reservas/Listagens", href: "/staff/reservations", icon: "📅" },
  { label: "Relatórios", href: "/staff/reports", icon: "📊" },
];

export default function StaffSidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-64 min-h-screen bg-blue-900 text-white flex flex-col py-8 px-4">
      <div className="mb-10 text-2xl font-black tracking-tight flex items-center gap-2">
        <span>✈️</span> Staff Portal
      </div>
      <nav className="flex-1">
        <ul className="space-y-2">
          {menu.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition font-semibold hover:bg-blue-800 ${pathname === item.href ? "bg-blue-800" : ""}`}
              >
                <span className="text-xl">{item.icon}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

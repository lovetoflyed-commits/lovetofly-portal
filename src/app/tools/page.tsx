"use client";

import AuthGuard from "@/components/AuthGuard";
import Link from "next/link";

export default function ToolsPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h1 className="text-3xl font-bold text-blue-900 mb-2">🧭 Planejamento de Voo</h1>
            <p className="text-gray-600">Ferramentas e atalhos para preparar seu voo</p>
            <div className="mt-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <span className="text-lg">←</span>
                Voltar ao Dashboard
              </Link>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-3">Acesso Rápido</h2>
              <div className="grid grid-cols-1 gap-3">
                <Link href="/weather" className="px-4 py-3 rounded-md bg-blue-50 text-blue-800 hover:bg-blue-100 transition">
                  ☁️ Meteorologia (METAR & TAF)
                </Link>
                <Link href="/weather/radar" className="px-4 py-3 rounded-md bg-blue-50 text-blue-800 hover:bg-blue-100 transition">
                  🌦️ Radar Meteorológico
                </Link>
                <Link href="/tools/e6b" className="px-4 py-3 rounded-md bg-blue-50 text-blue-800 hover:bg-blue-100 transition">
                  📐 Computador de Voo (E6B)
                </Link>
                <Link href="/tools/ifr-simulator" className="px-4 py-3 rounded-md bg-blue-50 text-blue-800 hover:bg-blue-100 transition">
                  🧪 Simulador IFR (em breve)
                </Link>
                <Link href="/tools/glass-cockpit" className="px-4 py-3 rounded-md bg-blue-50 text-blue-800 hover:bg-blue-100 transition">
                  🖥️ Glass Cockpit (em breve)
                </Link>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <h3 className="font-bold text-blue-900 mb-2">Checklist de Planejamento</h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>• Meteorologia da rota e alternados</li>
                <li>• Peso e balanceamento</li>
                <li>• Performance e combustível</li>
                <li>• NOTAMs e rota</li>
                <li>• Briefing e documentação</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

/** @format */

"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";

type Health = {
  backend: boolean;
  database: boolean;
  llm: boolean;
};

function Card({ title, ok }: { title: string; ok?: boolean }) {

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-600 rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold text-lg">{title}</h3>

        <div
          className={`px-3 py-1 rounded-full text-xs font-semibold
          ${
            ok
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-red-500/20 text-red-400"
          }
          `}
        >
          {ok ? "Healthy" : "Offline"}
        </div>
      </div>
    </div>
  );
}

export default function SystemHealthPage() {
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    fetch("/api/system-health")
      .then((r) => r.json())
      .then(setHealth)
      .catch(() =>
        setHealth({
          backend: false,
          database: false,
          llm: false,
        }),
      );
  }, []);

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />

      <div className="max-w-5xl mx-auto py-12 px-6">
        <h1 className="text-3xl font-bold text-white mb-10">System Health</h1>

        {!health ? (
          <div className="text-slate-400">Checking system...</div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            <Card title="Backend API" ok={health.backend} />
            <Card title="Database" ok={health.database} />
            <Card title="Gemini LLM" ok={health.llm} />
          </div>
        )}
      </div>
    </div>
  );
}

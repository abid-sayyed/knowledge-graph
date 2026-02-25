"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {

  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <div className="bg-gradient-to-r from-slate-800 to-slate-700 shadow-lg border-b border-slate-600">
      <div className="p-4 flex items-center gap-4">

        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
          <h1 className="text-white font-semibold text-lg">
            Knowledge Graph
          </h1>
        </div>

        <div className="flex-1"></div>

        <div className="flex items-center gap-2 border-l border-slate-600 pl-4">

          <Link
            href="/"
            className={`px-3 py-2 rounded-lg text-sm ${
              isActive('/upload')
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 hover:bg-slate-600 text-white'
            }`}
          >
            Upload
          </Link>

          <Link
            href="/workspace"
            className={`px-3 py-2 rounded-lg text-sm ${
              isActive('/workspace')
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 hover:bg-slate-600 text-white'
            }`}
          >
            Workspace
          </Link>

          <Link
            href="/system-health"
            className={`px-3 py-2 rounded-lg text-sm ${
              isActive('/system-health')
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 hover:bg-slate-600 text-white'
            }`}
          >
            System Health
          </Link>

        </div>
      </div>
    </div>
  );
}
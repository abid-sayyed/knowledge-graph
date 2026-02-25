/** @format */

import Navbar from "@/components/Navbar";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export const dynamic = "force-dynamic";

export default async function WorkspaceListPage() {
  // ---------- GET WORKSPACES ----------
  const { data: workspaces } = await supabase
    .from("workspaces")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />

      <div className="max-w-6xl mx-auto py-10 px-6">
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Workspaces</h1>
          <p className="text-slate-400 text-sm">
            Manage and explore your knowledge graph workspaces
          </p>
        </div>

        {!workspaces?.length ? (
          <div className="text-slate-400">No workspaces yet</div>
        ) : (
          <div className="space-y-4">
            {await Promise.all(
              workspaces.map(async (ws) => {
                // ✅ FETCH FILES FOR THIS WORKSPACE ONLY
                const { data: workspaceFiles } = await supabase
                  .from("files")
                  .select("*")
                  .eq("workspace_id", ws.id);

                return (
                  <details
                    key={ws.id}
                    className="bg-slate-800 border border-slate-600 rounded-xl"
                  >
                    {/* HEADER */}
                    <summary className="cursor-pointer p-6 flex justify-between">
                      <div>
                        <div className="text-xl text-white font-semibold">
                          {ws.name || "Untitled Workspace"}
                        </div>

                        <div className="text-sm text-slate-400 mt-1">
                          {formatDate(ws.created_at)}
                        </div>

                        <div className="text-xs text-slate-500 mt-1">
                          {workspaceFiles?.length || 0} files
                        </div>
                      </div>

                      <Link
                        href={`/workspace/${ws.id}`}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg shadow-blue-500/50 hover:shadow-blue-500/70"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                        <span>Open Graph</span>
                      </Link>
                    </summary>

                    {/* FILE LIST */}
                    <div className="border-t border-slate-700 px-6 pb-6">
                      {!workspaceFiles?.length ? (
                        <div className="text-slate-400 py-6">
                          No files uploaded
                        </div>
                      ) : (
                        <div className="mt-4 space-y-2">
                          {workspaceFiles.map((file) => {
                            // ✅ GENERATE STORAGE URL
                            const { data } = supabase.storage
                              .from("workspace-file")
                              .getPublicUrl(file.storage_path);

                            return (
                              <div
                                key={file.id}
                                className="flex justify-between bg-slate-700 px-4 py-3 rounded-lg"
                              >
                                <span className="text-slate-200">
                                  {file.filename}
                                </span>

                                {/* <a
                                    href={data.publicUrl}
                                    target="_blank"
                                    className="text-blue-400"
                                    >
                                    Download
                                    </a> */}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </details>
                );
              }),
            )}
          </div>
        )}
      </div>
    </div>
  );
}

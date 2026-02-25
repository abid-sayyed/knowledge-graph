/** @format */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { WorkspacePayload } from "@/types/graph";
import Navbar from "@/components/Navbar";

const ALLOWED_TYPES = ["text/plain", "application/pdf"];
const MAX_FILES = 10;

export default function HomePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [steps, setSteps] = useState<string[]>([]);

  const [graphData, setGraphData] = useState<WorkspacePayload | null>(null);
  const router = useRouter();

  // ---------- helper ----------
  function addStep(msg: string) {
    setSteps((prev) => [...prev, msg]);
  }

  // ---------- file validation ----------
  function validateFiles(fileList: FileList | null) {
    setError(null);
    setSuccess(null);

    if (!fileList) return;

    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name));
      const updated = [...prev];

      for (const file of Array.from(fileList)) {
        if (!ALLOWED_TYPES.includes(file.type)) {
          setError("Only .txt and .pdf files allowed.");
          return prev;
        }

        if (existing.has(file.name)) continue;

        updated.push(file);
      }

      if (updated.length > MAX_FILES) {
        setError(`Maximum ${MAX_FILES} files allowed.`);
        return prev;
      }

      return updated;
    });
  }

  // ---------- upload pipeline ----------
  async function handleUpload() {
    try {
      setError(null);
      setSuccess(null);
      setSteps([]);

      if (!files.length) {
        setError("No files selected.");
        return;
      }

      setLoading(true);

      addStep("Uploading files...");

      // ---------- STEP 1 upload ----------
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.error || "Upload failed");
      }

      addStep("Files uploaded successfully");
      addStep("Parsing documents...");

      const uploadData = await uploadRes.json();
      const combinedText = uploadData.combinedText;

      if (!combinedText) {
        throw new Error("No parsed text returned");
      }

      // ---------- STEP 2 extraction ----------
      addStep("Sending text to AI for entity extraction...");

      const extractRes = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ combinedText }),
      });

      if (!extractRes.ok) {
        const err = await extractRes.json();
        throw new Error(err.error || "Extraction failed");
      }

      const graphData: WorkspacePayload = await extractRes.json();

      setGraphData(graphData);

      addStep("Entities extracted");
      addStep("Generating relationships...");
      addStep("Preparing workspace...");

      // ---------- STEP 3 save workspace ----------
      addStep("Saving workspace...");

      const workspaceForm = new FormData();

      workspaceForm.append("entities", JSON.stringify(graphData.entities));

      workspaceForm.append(
        "relationships",
        JSON.stringify(graphData.relationships),
      );

      files.forEach((f) => workspaceForm.append("files", f));

      const saveRes = await fetch("/api/workspace", {
        method: "POST",
        body: workspaceForm,
      });

      if (!saveRes.ok) {
        throw new Error("Failed to save workspace");
      }

      const { workspaceId } = await saveRes.json();

      addStep("Workspace created successfully");
      addStep("Redirecting...");

      console.log(workspaceId, "workspace id");

      router.push(`/workspace/${workspaceId}`);

      setSuccess("Documents processed successfully");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something failed");
    } finally {
      setLoading(false);
    }
  }

  // ---------- remove file ----------
  function removeFile(name: string) {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-slate-900">
        <div className="mx-auto max-w-4xl px-6 py-12">
          {/* HEADER */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <h1 className="text-3xl font-bold text-white">
                Knowledge Graph Builder
              </h1>
            </div>
            <p className="text-slate-400 text-sm ml-6">
              Upload documents to extract entities automatically
            </p>
          </div>

          {/* HOW IT WORKS */}
          <div className="mb-6 bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-600 rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <svg
                className="w-5 h-5 text-emerald-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h2 className="text-lg font-semibold text-white">How it works</h2>
            </div>

            <ol className="space-y-3 text-sm text-slate-300">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-semibold">
                  1
                </span>
                <span className="pt-0.5">
                  Upload 3–10 text or PDF documents
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-semibold">
                  2
                </span>
                <span className="pt-0.5">
                  System extracts entities & relationships
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-semibold">
                  3
                </span>
                <span className="pt-0.5">
                  View and edit the knowledge graph
                </span>
              </li>
            </ol>
          </div>

          {/* UPLOAD SECTION */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-600 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <svg
                    className="w-5 h-5 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <h2 className="text-lg font-semibold text-white">
                    Upload documents
                  </h2>
                </div>
                <p className="text-xs text-slate-400 ml-7">
                  Only .txt and .pdf files allowed
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-400">Files:</span>
                <span
                  className={`font-semibold ${files.length >= MAX_FILES ? "text-yellow-400" : "text-blue-400"}`}
                >
                  {files.length}/{MAX_FILES}
                </span>
              </div>
            </div>

            {/* FILE INPUT */}
            <div className="relative">
              <input
                type="file"
                multiple
                disabled={loading}
                accept=".txt,.pdf,text/plain,application/pdf"
                onChange={(e) => {
                  validateFiles(e.target.files);
                  e.target.value = "";
                }}
                className="block w-full text-sm text-slate-300
                file:mr-4 file:rounded-lg file:border-0
                file:bg-blue-600 file:px-5 file:py-2.5
                file:text-white file:font-medium file:shadow-lg file:shadow-blue-500/50
                hover:file:bg-blue-700 file:transition-all file:duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                cursor-pointer"
              />
            </div>

            {/* FILE LIST */}
            {files.length > 0 && (
              <div className="mt-6 rounded-lg border border-slate-600 bg-slate-700/50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <svg
                    className="w-4 h-4 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span className="text-sm font-semibold text-slate-300">
                    Selected files ({files.length})
                  </span>
                </div>

                <div className="space-y-2">
                  {files.map((f) => (
                    <div
                      key={f.name}
                      className="flex items-center justify-between bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 hover:bg-slate-750 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <svg
                          className="w-5 h-5 text-blue-400 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="truncate text-sm text-slate-200 font-medium">
                          {f.name}
                        </span>
                      </div>

                      <button
                        disabled={loading}
                        onClick={() => removeFile(f.name)}
                        className="ml-3 flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ERROR */}
            {error && (
              <div className="mt-4 flex items-start gap-3 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3">
                <svg
                  className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-sm text-red-300">{error}</span>
              </div>
            )}

            {/* SUCCESS */}
            {success && (
              <div className="mt-4 flex items-start gap-3 rounded-lg border border-green-500/50 bg-green-500/10 px-4 py-3">
                <svg
                  className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-sm text-green-300">{success}</span>
              </div>
            )}

            {/* PROCESSING STEPS */}
            {steps.length > 0 && (
              <div className="mt-4 rounded-lg border border-slate-600 bg-slate-700/50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <svg
                    className="w-5 h-5 text-blue-400 animate-spin"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  <span className="text-sm font-semibold text-slate-300">
                    Processing status
                  </span>
                </div>

                <ul className="space-y-2">
                  {steps.map((s, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-slate-400"
                    >
                      <svg
                        className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* DEBUG GRAPH */}
            {graphData && (
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-2">
                  <svg
                    className="w-4 h-4 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                    />
                  </svg>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Graph Data
                  </span>
                </div>
                <pre className="rounded-lg border border-slate-600 bg-slate-900 p-4 text-xs text-slate-300 overflow-auto max-h-96">
                  {JSON.stringify(graphData, null, 2)}
                </pre>
              </div>
            )}

            {/* UPLOAD BUTTON */}
            <button
              onClick={handleUpload}
              disabled={loading || files.length === 0}
              className="mt-6 w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/50 hover:shadow-blue-500/70 transition-all duration-200"
            >
              {loading ? (
                <>
                  <svg
                    className="w-5 h-5 animate-spin"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  Upload & Process
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}

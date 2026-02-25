/** @format */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { WorkspacePayload } from "@/types/graph";

const ALLOWED_TYPES = ["text/plain", "application/pdf"];
const MAX_FILES = 10;

export default function HomePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const [graphData, setGraphData] = useState<WorkspacePayload | null>(null);
  const router = useRouter();

  function validateFiles(fileList: FileList | null) {
    setError(null);
    setSuccess(null);
    if (!fileList) return;

    setFiles((prev) => {
      const existingNames = new Set(prev.map((f) => f.name));
      const updated = [...prev];

      for (const file of Array.from(fileList)) {
        if (!ALLOWED_TYPES.includes(file.type)) {
          setError("Only .txt and .pdf files allowed.");
          return prev;
        }

        if (existingNames.has(file.name)) continue;

        updated.push(file);
      }

      if (updated.length > MAX_FILES) {
        setError(`Maximum ${MAX_FILES} files allowed.`);
        return prev;
      }

      return updated;
    });
  }

  async function handleUpload() {
    try {
      setError(null);
      setSuccess(null);

      if (files.length === 0) {
        setError("No files selected.");
        return;
      }

      setLoading(true);

      // ---------- STEP 1: upload ----------
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

      const uploadData = await uploadRes.json();
      const combinedText = uploadData.combinedText;

      if (!combinedText) {
        throw new Error("No parsed text returned");
      }

      // ---------- STEP 2: extract ----------
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
      console.log("EXTRACTED GRAPH:", graphData);
      setGraphData(graphData);

      // ---------- STEP 3: SAVE WORKSPACE ⭐ ADD HERE ----------
      const saveRes = await fetch("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entities: graphData.entities,
          relationships: graphData.relationships,
        }),
      });

      if (!saveRes.ok) {
        throw new Error("Failed to save workspace");
      }

      const { workspaceId } = await saveRes.json();

      // ---------- STEP 4: REDIRECT ----------
      console.log(workspaceId, "wkid");
      // router.push(`/workspace/${workspaceId}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something failed");
    } finally {
      setLoading(false);
    }
  }

  function removeFile(name: string) {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-2xl font-semibold text-gray-900">
          Knowledge Graph Builder
        </h1>

        <p className="mt-2 text-sm text-gray-600">
          Upload documents to extract entities automatically.
        </p>

        {/* HOW IT WORKS */}
        <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="font-medium text-gray-900">How it works</h2>

          <ol className="mt-4 space-y-2 text-sm text-gray-700 list-decimal list-inside">
            <li>Upload 3–10 text or PDF documents</li>
            <li>System extracts entities & relationships</li>
            <li>View and edit the knowledge graph</li>
          </ol>
        </div>

        {/* UPLOAD */}
        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm text-gray-900">
          <h2 className="font-medium text-gray-900">Upload documents</h2>

          <p className="mt-1 text-xs text-gray-500">
            Only .txt and .pdf files allowed
          </p>

          <p className="mt-1 text-xs text-gray-500">
            {files.length}/{MAX_FILES} files selected
          </p>

          <input
            type="file"
            multiple
            accept=".txt,.pdf,text/plain,application/pdf"
            onChange={(e) => {
              validateFiles(e.target.files);
              e.target.value = ""; // allow selecting same file again
            }}
            className="mt-4 block w-full text-sm
              file:mr-4 file:rounded-md file:border-0
              file:bg-gray-900 file:px-4 file:py-2
              file:text-white hover:file:bg-gray-700"
          />

          {/* FILE LIST */}
          {files.length > 0 && (
            <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-3 text-sm">
              <div className="font-medium mb-2 text-gray-900">
                Selected files:
              </div>

              <div className="space-y-2">
                {files.map((f) => (
                  <div
                    key={f.name}
                    className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2"
                  >
                    <span className="truncate text-gray-800">{f.name}</span>

                    <button
                      type="button"
                      onClick={() => removeFile(f.name)}
                      className="ml-3 text-xs font-medium text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ERROR */}
          {error && (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* SUCCESS */}
          {success && (
            <div className="mt-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              {success}
            </div>
          )}

          {/* Graph json data */}
          {graphData && (
            <pre className="mt-6 rounded-md border bg-white p-4 text-xs overflow-auto">
              {JSON.stringify(graphData, null, 2)}
            </pre>
          )}

          <button
            onClick={handleUpload}
            disabled={loading || files.length === 0}
            className="mt-5 rounded-md bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </div>
    </main>
  );
}

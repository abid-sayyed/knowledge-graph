/** @format */

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type {
  WorkspacePayload,
  EntityInput,
  RelationshipInput,
} from "@/types/graph";

export const runtime = "nodejs";

type InsertedEntityRow = {
  id: string;
  name: string;
};

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const entities = JSON.parse(form.get("entities") as string);
    const relationships = JSON.parse(form.get("relationships") as string);

    const files = form.getAll("files") as File[];
    // =========================
    // CREATE WORKSPACE
    // =========================
    const { data: workspace, error: wsError } = await supabase
      .from("workspaces")
      .insert({})
      .select()
      .single();

    if (wsError || !workspace)
      throw wsError ?? new Error("Workspace not created");

    const workspaceId = workspace.id;

    // =========================
    // UPLOAD FILES TO STORAGE
    // =========================

    for (const file of files) {
      const uniqueName = `${workspaceId}/${Date.now()}-${file.name.replace(/\s+/g, "_")}`;

      const buffer = Buffer.from(await file.arrayBuffer());

      const { error } = await supabase.storage
        .from("workspace-files")
        .upload(uniqueName, buffer);

      if (error) throw error;

      const { error: fileDbError } = await supabase
        .from("files") // ⭐ FIXED HERE
        .insert({
          workspace_id: workspaceId,
          filename: file.name,
          storage_path: uniqueName,
        });

      if (fileDbError) throw fileDbError;
    }

    // =========================
    // INSERT ENTITIES
    // =========================
    const entityRows = entities.map((e: EntityInput) => ({
      workspace_id: workspaceId,
      name: e.name,
      type: e.type ?? null,
      aliases: e.aliases ?? [],
    }));

    const { data: insertedEntities, error: entError } = await supabase
      .from("entities")
      .insert(entityRows)
      .select();

    if (entError || !insertedEntities)
      throw entError ?? new Error("Entity insert failed");

    // =========================
    // BUILD NAME → UUID MAP
    // =========================
    const entityMap = new Map<string, string>();

    insertedEntities.forEach((e: InsertedEntityRow) => {
      entityMap.set(e.name, e.id);
    });

    // =========================
    // INSERT RELATIONSHIPS
    // =========================
    const relationshipRows = relationships
      .map((r: RelationshipInput) => {
        const fromId = entityMap.get(r.from);
        const toId = entityMap.get(r.to);

        // Skip invalid relations safely
        if (!fromId || !toId) return null;

        return {
          workspace_id: workspaceId,
          from_entity: fromId,
          to_entity: toId,
          type: r.type ?? null,
          snippet: r.snippet ?? null,
        };
      })
      .filter(Boolean);

    if (relationshipRows.length > 0) {
      const { error: relError } = await supabase
        .from("relationships")
        .insert(relationshipRows);

      if (relError) throw relError;
    }

    return NextResponse.json({ workspaceId });
  } catch (err: unknown) {
    console.error("WORKSPACE SAVE ERROR:", err);

    const message = err instanceof Error ? err.message : "Unknown error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

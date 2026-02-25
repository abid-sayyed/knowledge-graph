/** @format */

export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

import type {
  EntityInput,
  RelationshipInput,
  WorkspacePayload,
} from "@/types/graph";

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

const MODEL = "gemini-3-flash-preview";


// ============================
// JSON SCHEMA FOR GEMINI
// ============================

const graphJsonSchema = {
  type: "object",
  properties: {
    entities: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          type: { type: "string" },
          aliases: {
            type: "array",
            items: { type: "string" }
          }
        },
        required: ["name"]
      }
    },
    relationships: {
      type: "array",
      items: {
        type: "object",
        properties: {
          from: { type: "string" },
          to: { type: "string" },
          type: { type: "string" },
          snippet: { type: "string" }
        },
        required: ["from","to"]
      }
    }
  },
  required: ["entities","relationships"]
};


// ============================
// ZOD VALIDATION (BACKEND SAFETY)
// ============================

const entitySchema = z.object({
  name: z.string(),
  type: z.string().optional(),
  aliases: z.array(z.string()).optional(),
});

const relationshipSchema = z.object({
  from: z.string(),
  to: z.string(),
  type: z.string().optional(),
  snippet: z.string().optional(),
});

const graphSchema = z.object({
  entities: z.array(entitySchema),
  relationships: z.array(relationshipSchema),
});


// ============================
// CHUNK TEXT
// ============================

function chunkText(text: string, size = 6000, overlap = 800) {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = start + size;
    chunks.push(text.slice(start, end));
    start += size - overlap;
  }

  return chunks;
}


// ============================
// NORMALIZE NAME
// ============================

function normalizeName(name: string) {
  return name.trim().toLowerCase();
}


// ============================
// PROMPT
// ============================

function buildPrompt(chunk: string) {
  return `
Extract entities and relationships from the text.

Entities:
- people
- companies
- product features
- dates

Return structured JSON only.

TEXT:
${chunk}
`;
}


// ============================
// ROUTE
// ============================

export async function POST(req: Request) {

  try {

    const { combinedText } = (await req.json()) as { combinedText: string };

    if (!combinedText) {
      return NextResponse.json(
        { error: "No text provided" },
        { status: 400 }
      );
    }

    const chunks = chunkText(combinedText);

    const entityMap = new Map<
      string,
      { name: string; type: string; aliases: Set<string> }
    >();

    const relationships: RelationshipInput[] = [];

    for (const chunk of chunks) {

      const response = await ai.models.generateContent({

        model: MODEL,

        contents: buildPrompt(chunk),

        config: {
          responseMimeType: "application/json",
          responseJsonSchema: graphJsonSchema,
        },

      });

      const raw = response.text || "{}";

      let parsed: WorkspacePayload;

      try {

        parsed = graphSchema.parse(JSON.parse(raw));

      } catch {

        console.warn("Invalid structured JSON skipped");

        continue;

      }

      // merge entities
      for (const e of parsed.entities ?? []) {

        const key = normalizeName(e.name);

        if (!entityMap.has(key)) {

          entityMap.set(key, {
            name: e.name,
            type: e.type ?? "unknown",
            aliases: new Set(e.aliases ?? []),
          });

        } else {

          entityMap.get(key)!.aliases.add(e.name);

        }
      }

      relationships.push(...(parsed.relationships ?? []));
    }


    const entities: EntityInput[] =
      Array.from(entityMap.values()).map(e => ({
        name: e.name,
        type: e.type,
        aliases: Array.from(e.aliases),
      }));


    return NextResponse.json({
      entities,
      relationships,
    });

  } catch (err) {

    console.error("EXTRACT ERROR:", err);

    return NextResponse.json(
      { error: "Extraction failed" },
      { status: 500 }
    );
  }
}
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { GoogleGenAI } from "@google/genai";

export async function GET() {

  const health = {
    backend: false,
    database: false,
    llm: false,
  };

  // ✅ BACKEND CHECK (this route executed → backend alive)
  health.backend = true;

  // ✅ DATABASE CHECK
  try {
    const { error } = await supabase
      .from("workspaces")
      .select("id")
      .limit(1);

    if (!error) health.database = true;
  } catch {}

  // ✅ GEMINI CHECK
  try {

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error();

    const ai = new GoogleGenAI({ apiKey });

    await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "ping",
    });

    health.llm = true;

  } catch {}

  return NextResponse.json(health);
}
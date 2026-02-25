export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";

const MAX_FILES = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES = [
  "text/plain",
  "application/pdf",
];

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files?.length) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FILES} files allowed` },
        { status: 400 }
      );
    }

    const parsedDocs: { name: string; text: string }[] = [];

    for (const file of files) {

      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.name}` },
          { status: 400 }
        );
      }

      if (!file.size) {
        return NextResponse.json(
          { error: `Empty file: ${file.name}` },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File too large: ${file.name}` },
          { status: 400 }
        );
      }

      let text = "";

      // TXT
      if (file.type === "text/plain") {
        text = await file.text();
      }

      // PDF  ✅ CORRECT NEW API USAGE
      else if (file.type === "application/pdf") {

        const buffer = Buffer.from(await file.arrayBuffer());

        const parser = new PDFParse({ data: buffer });

        const result = await parser.getText();

        await parser.destroy();

        text = result.text;
      }

      if (!text.trim()) {
        return NextResponse.json(
          { error: `Could not extract text from ${file.name}` },
          { status: 400 }
        );
      }

      parsedDocs.push({
        name: file.name,
        text,
      });
    }

    const combinedText = parsedDocs
      .map(d => `FILE: ${d.name}\n${d.text}`)
      .join("\n\n----------------\n\n");

    return NextResponse.json({
      success: true,
      documents: parsedDocs,
      combinedText,
    });

  } catch (err) {

    console.error("UPLOAD ERROR:", err);

    return NextResponse.json(
      { error: "Server failed to process files" },
      { status: 500 }
    );
  }
}
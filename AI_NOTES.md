# AI_NOTES.md

## Use of AI During Development

AI tools were used as development assistants during this project.

### ChatGPT was used for:

* Writing initial boilerplate (barebone structure)
* Debugging TypeScript and Next.js errors
* Creating multiple small helper functions
* Understanding ReactFlow concepts and usage patterns
* Fixing Supabase client/server issues

### Claude was used for:

* Improving and refining UI layout and styling

AI was used as a support tool, not as a full project generator.

---

## What Was Designed and Implemented Manually

The following were fully designed and implemented manually:

* Overall system architecture (Next.js + Supabase + Gemini + ReactFlow)
* Connecting the complete architecture together
* Folder structure design
* ReactFlow graph logic and interaction design decisions
* Database schema design (entities, relationships, files, workspaces)
* File upload flow and server-side text extraction
* Chunking strategy for sending large text to the LLM
* Sidebar editing workflow and connection logic

All architectural decisions and system integration were done manually.

---

## What Was Tested and Verified Manually

The following were manually tested and validated:

* Uploading multiple TXT and PDF files
* Text extraction correctness
* Gemini structured JSON response handling
* Database inserts for workspace, entities, relationships, and files
* Graph rendering with correct node layout
* Editing node name/type persistence
* Creating connections and confirming they update both graph and database

---

## Summary

AI was used as a productivity and debugging assistant.
All core architecture, integration logic, and data flow decisions were designed and verified manually.

# Knowledge Graph Builder

A web application that extracts entities and relationships from uploaded documents and builds an interactive knowledge graph.

---

## 🚀 How to Run

### 1. Install dependencies

```bash
npm install
```

---

### 2. Setup environment variables

Create:

```
.env
```

Add:

```
GEMINI_API_KEY=your_gemini_key

NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

---

### 3. Start the app

```bash
npm run dev
```

Open:

```
http://localhost:3000
```

---

## 🧭 How to Use the Application

### Upload documents

1. Upload **1–10 files** using the Browse button
2. Files can be:

* TXT files
* PDF files
* or a mix of both

3. Click **Upload & Process**

---

### Processing flow

The web app will:

1. Extract text on the server
2. Send combined text to Gemini LLM
3. Wait for response (speed depends on Gemini free-tier limits)
4. Receive structured entities + relationships
5. Automatically generate a graph

---

### View and edit the knowledge graph

* Click any node
* Sidebar will open

Inside sidebar you can:

✅ Change node name
✅ Change node type
✅ Save changes instantly

You can also:

✅ Add new connections between nodes
(All changes are saved immediately)

---

### View previous workspaces

Use the **Workspace** menu at the top.

There you can:

* See all created workspaces
* Expand a workspace to view uploaded files

## Example test files are included in:

```
test-file/
```

---

## ✅ What Is Done

### Document processing

* TXT extraction on server
* PDF extraction on server
* Combined text sent to Gemini server-side

---

### LLM structured extraction

Gemini returns data in this format:

```ts
EntityInput = {
  name: string;
  type?: string;
  aliases?: string[];
};

RelationshipInput = {
  from: string;
  to: string;
  type?: string;
  snippet?: string;
};
```

---

### Graph generation

* Entities and relationships are visualized using **ReactFlow**
* Graph layout auto-generated

---

### Editing support

Currently supported:

✅ Rename node
✅ Change node type
✅ Add connection
✅ Changes persist in database

---

### Infrastructure

* Frontend: Next.js App Router
* Backend: Next.js API routes
* Database: Supabase (PostgreSQL)
* Storage: Supabase bucket
* LLM: Google Gemini

---

## ⚠️ What Is NOT Done (Planned Improvements)

Due to limited time, the following features are not fully implemented:

### Graph editing (visual mode)

Planned but not completed:

* Drag-create nodes visually
* Connect nodes using mouse handles
* Delete nodes directly from graph
* Full visual editing workflow

Currently this is handled through the sidebar form.

---

### Workspace management

Not finished yet:

* Naming workspace during creation
* Downloading uploaded files from UI
* Viewing parsed extracted text
* Deleting workspace

---

### Authentication

* No login system yet

---

### Backend architecture

Originally planned:

* Prisma ORM
* Express backend
* Separate VPS backend hosting

Due to time constraints:

* Next.js used for both frontend + backend
* Supabase used directly for PostgreSQL

---

## 📌 Notes

Processing speed depends on:

* Gemini free tier limits
* Document size
* Number of uploaded files

Large uploads may take some time.

---

## 👤 Author

Abid Sayyed

---

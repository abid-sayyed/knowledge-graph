import { supabase } from "@/lib/supabase";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function WorkspacePage({ params }: Props) {

  const { id: workspaceId } = await params;   // ← THIS is the correct way

  const { data: entities } = await supabase
    .from("entities")
    .select("*")
    .eq("workspace_id", workspaceId);

  const { data: relationships } = await supabase
    .from("relationships")
    .select("*")
    .eq("workspace_id", workspaceId);

  return (
    <main className="p-8">

      <h1 className="text-xl font-semibold mb-6">
        Workspace {workspaceId}
      </h1>

      <h2 className="font-medium mt-6">Entities</h2>

      <pre className="mt-2 bg-gray-100 p-4 rounded overflow-auto text-xs">
        {JSON.stringify(entities, null, 2)}
      </pre>

      <h2 className="font-medium mt-6">Relationships</h2>

      <pre className="mt-2 bg-gray-100 p-4 rounded overflow-auto text-xs">
        {JSON.stringify(relationships, null, 2)}
      </pre>

    </main>
  );
}
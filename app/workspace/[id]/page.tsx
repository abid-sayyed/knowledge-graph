import { supabase } from "@/lib/supabase";
import GraphView from "./GraphView";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function WorkspacePage({ params }: Props) {

  const { id } = await params;

  const { data: entities } = await supabase
    .from("entities")
    .select("*")
    .eq("workspace_id", id);

  const { data: relationships } = await supabase
    .from("relationships")
    .select("*")
    .eq("workspace_id", id);

  return (
    <GraphView
      entities={entities || []}
      relationships={relationships || []}
    />
  );
}
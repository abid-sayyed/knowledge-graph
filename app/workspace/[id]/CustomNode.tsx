import { NodeProps, Handle, Position, Node } from "@xyflow/react";

type NodeData = { label: string };
type CustomNodeType = Node<NodeData>;

export default function CustomNode({ data, selected }: NodeProps<CustomNodeType>) {
  return (
    <div
      className={`px-4 py-2 rounded-lg shadow-md border-2 transition-all ${
        selected
          ? "border-blue-500 shadow-lg"
          : "border-gray-300 hover:border-gray-400"
      }`}
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "#ffffff",
        minWidth: "180px",
      }}
    >
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <div className="font-medium text-center">{data.label}</div>
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
}
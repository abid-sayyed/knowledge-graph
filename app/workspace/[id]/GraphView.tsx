/** @format */

"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  BackgroundVariant,
  NodeProps,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import dagre from "dagre";

type Entity = {
  id: string;
  name: string;
  type?: string;
};

type Relationship = {
  id: string;
  from_entity: string;
  to_entity: string;
  type?: string;
  snippet?: string;
};

type NodeData = {
  label: string;
};
type CustomNodeType = Node<NodeData>;

type Props = {
  entities: Entity[];
  relationships: Relationship[];
};

// ---------- CUSTOM NODE COMPONENT ----------
function CustomNode({ data, selected }: NodeProps<CustomNodeType>) {
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

const nodeTypes = {
  custom: CustomNode,
};

// ---------- DAGRE LAYOUT ----------
function layout(nodes: Node[], edges: Edge[]) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));

  g.setGraph({ rankdir: "LR", nodesep: 100, ranksep: 150 });

  nodes.forEach((n) => {
    g.setNode(n.id, { width: 180, height: 50 });
  });

  edges.forEach((e) => {
    g.setEdge(e.source, e.target);
  });

  dagre.layout(g);

  return nodes.map((n) => {
    const pos = g.node(n.id);
    return {
      ...n,
      position: {
        x: pos.x - 90,
        y: pos.y - 25,
      },
    };
  });
}

export default function GraphView({ entities, relationships }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [localEntities, setLocalEntities] = useState<Entity[]>(entities);
  const [search, setSearch] = useState("");

  // ---------- SEARCH ----------
  const visibleEntities = useMemo(() => {
    if (!search) return localEntities;

    return localEntities.filter((e) =>
      e.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [search, localEntities]);

  // ---------- BUILD INITIAL NODES ----------
  const initialNodes: Node[] = useMemo(
    () =>
      visibleEntities.map((e) => ({
        id: e.id,
        type: "custom",
        data: { label: e.name },
        position: { x: 0, y: 0 },
      })),
    [visibleEntities],
  );

  // ---------- BUILD EDGES ----------
  const initialEdges: Edge[] = useMemo(
    () =>
      relationships.map((r) => ({
        id: r.id,
        source: r.from_entity,
        target: r.to_entity,
        label: r.type,
        type: "smoothstep",
        animated: true,
        style: { stroke: "#94a3b8", strokeWidth: 2 },
        labelStyle: {
          fill: "#475569",
          fontWeight: 500,
          fontSize: 12,
        },
        labelBgStyle: {
          fill: "#f8fafc",
          fillOpacity: 0.9,
        },
      })),
    [relationships],
  );

  const layoutedNodes = useMemo(
    () => layout(initialNodes, initialEdges),
    [initialNodes, initialEdges],
  );

  // ---------- USE NODES AND EDGES STATE ----------
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  //edit state
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Update nodes when layout changes
  useEffect(() => {
    setNodes(layoutedNodes);
    setEdges(initialEdges);
  }, [layoutedNodes, initialEdges, setNodes, setEdges]);

  // ---------- HANDLE NODE CLICK ----------
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const entity = localEntities.find((e) => e.id === node.id);

      if (!entity) return;

      setSelected(node.id);

      // ⭐ initialize edit values HERE instead of useEffect
      setEditName(entity.name);
      setEditType(entity.type || "");
      setIsEditing(false);
    },
    [localEntities],
  );

  // ---------- SIDEBAR ----------
  const selectedEntity = localEntities.find((e) => e.id === selected);

  const connected = relationships.filter(
    (r) => r.from_entity === selected || r.to_entity === selected,
  );

  // ---------- FOR EDIT NODE ----------

  function updateVisualNode(id: string, newName: string) {
    setNodes((nodes) =>
      nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, label: newName } } : n,
      ),
    );
  }

  async function saveEntity() {
    if (!selected) return;

    await fetch("/api/entity-update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: selected,
        name: editName,
        type: editType,
      }),
    });

    // update graph node
    updateVisualNode(selected, editName);

    // ⭐ update sidebar data too
    setLocalEntities((prev) =>
      prev.map((e) =>
        e.id === selected ? { ...e, name: editName, type: editType } : e,
      ),
    );

    setIsEditing(false);
  }

  return (
    <div className="flex h-[92vh] bg-linear-to-br from-slate-50 to-slate-100">
      {/* GRAPH */}
      <div className="flex-1 flex flex-col">
        {/* TOP BAR */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 shadow-lg border-b border-slate-600">
          <div className="p-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              <h1 className="text-white font-semibold text-lg">
                Knowledge Graph
              </h1>
            </div>

            {/* SEARCH */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg pl-10 pr-4 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Search entities..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-300 text-sm">
              <span className="font-medium">{localEntities.length}</span>
              <span>entities</span>
              <span className="mx-2">•</span>
              <span className="font-medium">{relationships.length}</span>
              <span>connections</span>
            </div>
          </div>
        </div>

        {/* REACT FLOW */}
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            style={{ background: "#f8fafc" }}
            defaultEdgeOptions={{
              type: "smoothstep",
              animated: true,
            }}
          >
            <MiniMap
              nodeColor={(node) => {
                return node.id === selected ? "#3b82f6" : "#8b5cf6";
              }}
              maskColor="rgba(0, 0, 0, 0.1)"
              style={{
                backgroundColor: "#1e293b",
              }}
            />
            <Controls className="bg-white shadow-lg rounded-lg border border-slate-200" />
            <Background
              variant={BackgroundVariant.Dots}
              gap={16}
              size={1}
              color="#cbd5e1"
            />
          </ReactFlow>
        </div>
      </div>

      {/* SIDEBAR */}
      {selectedEntity && (
        <div className="w-96 bg-white shadow-2xl border-l border-slate-200 flex flex-col">
          {/* SIDEBAR HEADER */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-4 flex items-center justify-between">
            <h2 className="text-white font-semibold text-lg">Entity Details</h2>
            <button
              onClick={() => setSelected(null)}
              className="text-slate-300 hover:text-white transition-colors p-1 hover:bg-slate-600 rounded"
              aria-label="Close sidebar"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* SIDEBAR CONTENT */}
          <div className="flex-1 overflow-auto p-6">
            <div className="mb-6 space-y-3">
              {/* TYPE */}
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <div className="flex-1">
                    <div className="text-xs font-medium text-slate-500 mb-1">
                      Type
                    </div>
                    <input
                      value={editType}
                      onChange={(e) => setEditType(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter type"
                    />
                  </div>
                ) : (
                  <div className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                    {selectedEntity.type || "Unknown Type"}
                  </div>
                )}
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                    aria-label="Edit"
                  >
                    <svg
                      className="w-4 h-4 text-slate-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                )}
              </div>

              {/* NAME */}
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <div className="flex-1">
                    <div className="text-xs font-medium text-slate-500 mb-1">
                      Name
                    </div>
                    <input
                      value={editName}
                      onChange={(e) => {
                        setEditName(e.target.value);
                        updateVisualNode(selected!, e.target.value);
                      }}
                      className="w-full font-semibold border border-slate-300 px-3 py-1.5 rounded-lg text-base text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter name"
                    />
                  </div>
                ) : (
                  <h3 className="text-2xl font-bold text-slate-800">
                    {selectedEntity.name}
                  </h3>
                )}
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                    aria-label="Edit"
                  >
                    <svg
                      className="w-4 h-4 text-slate-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                )}
              </div>

              {/* SAVE/CANCEL BUTTONS */}
              {isEditing && (
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={saveEntity}
                    className="flex-1 bg-gradient-to-r from-slate-800 to-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Save Changes
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors border border-slate-300"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {connected.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <svg
                    className="w-5 h-5 text-slate-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                  <h4 className="font-semibold text-slate-700">
                    Connections ({connected.length})
                  </h4>
                </div>

                <div className="space-y-3">
                  {connected.map((r) => {
                    const otherId =
                      r.from_entity === selected ? r.to_entity : r.from_entity;
                    const other = localEntities.find((e) => e.id === otherId);
                    const direction = r.from_entity === selected ? "→" : "←";

                    return (
                      <div
                        key={r.id}
                        className="bg-slate-50 rounded-lg p-4 border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer"
                        onClick={() => setSelected(otherId)}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-slate-400 text-lg">
                            {direction}
                          </span>
                          <div className="flex-1">
                            <div className="font-medium text-slate-800 mb-1">
                              {other?.name}
                            </div>
                            <div className="text-xs text-purple-600 font-medium mb-2">
                              {r.type}
                            </div>
                            {r.snippet && (
                              <div className="text-sm text-slate-600 leading-relaxed">
                                {r.snippet}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {connected.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <svg
                  className="w-12 h-12 mx-auto mb-3 text-slate-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <p>No connections found</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

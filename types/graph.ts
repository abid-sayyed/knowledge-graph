export type EntityInput = {
  name: string;
  type?: string;
  aliases?: string[];
};

export type RelationshipInput = {
  from: string;
  to: string;
  type?: string;
  snippet?: string;
};

export type WorkspacePayload = {
  entities: EntityInput[];
  relationships: RelationshipInput[];
};
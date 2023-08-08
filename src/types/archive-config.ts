import { ChangeStreamNameSpace, Document } from "mongodb";

export type GameConfigInfo = { gameId?: number; name: string };

export type SchemaNamespacePostfix = Record<"db" | "postfix", string>;

export type AliasConfig = Record<"time", string>;

export type ArchiveStatusConfig = Record<"field" | "value", string>;

export type SchemaArchiveConfigDetail = {
    cutOffsetHours?: number;
    localField?: string;
    updateOnly?: boolean;
};

export type SchemaChildArchiveConfigDetail = {
    foreignField: string;
    updateOnly?: boolean;
};

export type SchemaChildArchiveConfig = {
    from: SchemaNamespacePostfix;
    to: SchemaNamespacePostfix;
    filter?: string;
    config: SchemaChildArchiveConfigDetail;
    log?: ArchiveStatusConfig;
};

export type SchemaArchiveConfig = {
    category: string;
    type: number;
    gameConfigs: GameConfigInfo;
    from: SchemaNamespacePostfix;
    to: SchemaNamespacePostfix;
    alias?: AliasConfig;
    filter?: string;
    config?: SchemaArchiveConfigDetail;
    childs: SchemaChildArchiveConfig[];
    log?: ArchiveStatusConfig;
};

export type ArchiveConfigDetail = {
    cutoffTime: Date;
    localField: string | undefined;
    updateOnly: boolean;
};

export type ChildArchiveConfigDetail = {
    foreignField: string;
    updateOnly: boolean;
};

export type ChildArchiveConfig = {
    from: ChangeStreamNameSpace;
    to: ChangeStreamNameSpace;
    filter: Document;
    config: ChildArchiveConfigDetail;
    log?: ArchiveStatusConfig;
};

export type ArchiveConfig = {
    gameConfigs: GameConfigInfo;
    from: ChangeStreamNameSpace;
    to: ChangeStreamNameSpace;
    alias: AliasConfig;
    filter: Document;
    config: ArchiveConfigDetail;
    childs: ChildArchiveConfig[];
    log?: ArchiveStatusConfig;
};

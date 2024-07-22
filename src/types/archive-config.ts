import type { ChangeStreamNameSpace, Document } from "@ldb/mongo";

export type OpsArchiveConfig = {
    /** Category of the archiving collections */
    category: string;
    /** The collection group type within category */
    type: number;
    /** The identifier within group type */
    id: number;
    /** Metadata of the group type */
    gameConfigs: GameConfigInfo;
    /** From collection */
    from: SchemaNamespacePostfix;
    /** To collection */
    to: SchemaNamespacePostfix;
    /** List of field aliases */
    alias?: AliasConfig;
    /** Old filter */
    filter?: string;
    /** New filter */
    filterConfigs?: FilterConfigs;
    config?: SchemaArchiveConfigDetail;
    /** Config for child collections */
    childs?: OpsArchiveChildConfig[];
    log?: ArchiveStatusConfig;
};

export type GameConfigInfo = { type?: string; gameId?: number; name: string };

export type SchemaNamespacePostfix = { db: string; postfix: string };

export type AliasConfig = Record<"time", string>;

export type FilterConfigs = NoneFilter | InternalFilter | GroupFilter | ExternalFilter;
export type NoneFilter = { __brand: "none" };
export type InternalFilter = {
    /** Internal brand */
    __brand: "internal";
    /** Expression for passing into `$match` stage */
    filterExpr: string;
};
export type GroupFilter = {
    /** Group brand */
    __brand: "group";
    /** Target collection to lookup from, need to combine with `gameConfigs.name` to get full collection name */
    lookupFrom: { postfix: string };
    /** 1-1 relationship lookup if possible */
    lookupField?: { local: string; foreign: string };
    /** List of user-defined global variables for lookup pipeline */
    let?: Record<string, string>;
    /** **IMPORTANT**: Always include `{"$limit":1}` & `{"$project":{...}}` stage to optimize data throughput */
    pipeline: string;
    /** Expression for passing into `$match` stage */
    filterExpr: string;
};
export type ExternalFilter = {
    /** External brand */
    __brand: "external";
    /** Target collection to lookup from */
    lookupFrom: { coll: string };
    /** 1-1 relationship lookup if possible */
    lookupField?: { local: string; foreign: string };
    /** List of user-defined global variables for lookup pipeline */
    let?: Record<string, string>;
    /** **IMPORTANT**: Always include `{"$limit":1}` & `{"$project":{...}}` stage to optimize data throughput */
    pipeline: string;
    /** Expression for passing into `$match` stage */
    filterExpr: string;
};

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

export type OpsArchiveChildConfig = {
    /** Source collection to get data from */
    from: SchemaNamespacePostfix;
    /** Target collection to insert data to */
    to: SchemaNamespacePostfix;
    /** Old filter */
    filter?: string;
    /** New filter */
    filterConfigs?: FilterConfigs;
    config: SchemaChildArchiveConfigDetail;
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
    filterPipeline: Document[];
    config: ChildArchiveConfigDetail;
    log?: ArchiveStatusConfig;
};

export type ArchiveConfig = {
    id: number;
    gameConfigs: GameConfigInfo;
    from: ChangeStreamNameSpace;
    to: ChangeStreamNameSpace;
    alias: AliasConfig;
    filterPipeline: Document[];
    config: ArchiveConfigDetail;
    childs: ChildArchiveConfig[];
    log?: ArchiveStatusConfig;
};

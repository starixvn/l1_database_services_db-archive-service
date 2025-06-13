import type { ChangeStreamNameSpace } from "@ldb/mongo";

export const namespaces = {
    archiveConfigCollection: { db: "ops_configs", coll: "archive_configs" },
} as const satisfies Record<string, ChangeStreamNameSpace>;

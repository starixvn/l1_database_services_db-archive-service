import { ChangeStreamNameSpace } from "mongodb";

export const namespaces: Record<string, ChangeStreamNameSpace> = {
    archiveConfigCollection: { db: "ops_configs", coll: "archive_configs" },
    archiveStatusCollection: { db: "minigame", coll: "archive_statuses" },
};

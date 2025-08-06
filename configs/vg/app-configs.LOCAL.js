/** @typedef {import("@ldb/logger").LumiLoggerConfig} LumiLoggerConfig */
/** @typedef {import("@ldb/mongo").ChangeStreamNameSpace} ChangeStreamNameSpace */

import { name, version } from "./metadata.js";

export const environment = "VG-LOCAL-0";
export const healthcheckPort = 5000;

/** @type {LumiLoggerConfig} */
export const lumiLoggerConfig = {
    sentryNodeOptions: {
        dsn: "https://d6f025dd4f7c1eb4de459a6257f494d1@sentry-k8s.lumigame.com/22",
        environment,
        initialScope: {
            tags: { service: name },
        },
        release: `${name}@${version}`,
    },
    skynexOptions: {
        conversationIds: {
            telegram: -1001604444158,
            slack: "B08GPPK88MS:T08ACMHMMFS:C091FAL49UG",
        },
    },
    environment,
};

const srcCred = "lmn_archive:LmnArchive";
const srcSrv = "10.10.50.12:39200,10.10.50.13:39200,10.10.50.14:39200";
const srcRepl = "L2Local";

const arcCred = "lmn_archive:LmnArchive";
const arcSrv = "10.10.50.12:39200,10.10.50.13:39200,10.10.50.14:39200";
const arcRepl = "L2Local";

export const database = {
    sourceUrl: `mongodb://${srcCred}@${srcSrv}/admin?authSource=admin&appName=${encodeURIComponent(name)}&replicaSet=${srcRepl}`,
    archiveUrl: `mongodb://${arcCred}@${arcSrv}/admin?authSource=admin&appName=${encodeURIComponent(name)}&replicaSet=${arcRepl}`,
};

export const schedulerConfig = {
    RUN_ARCHIVE: [600_000, 0],
};

export const archiveStatusCollectionName = "archive_statuses";

/** @type {Record<string, ChangeStreamNameSpace>} */
export const namespaces = {
    archiveConfigCollection: { db: "ops_configs", coll: "archive_configs" },
};

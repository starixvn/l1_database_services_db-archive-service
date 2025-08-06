/** @typedef {import("@ldb/logger").LumiLoggerConfig} LumiLoggerConfig */
/** @typedef {import("@ldb/mongo").ChangeStreamNameSpace} ChangeStreamNameSpace */

import { name, version } from "./metadata.js";

export const environment = "XD-LOCAL-0";
export const healthcheckPort = 5000;

/** @type {LumiLoggerConfig} */
export const lumiLoggerConfig = {
    sentryNodeOptions: {
        dsn: "https://eacc58fec0768b74e8ce04af770fc783@sentry-k8s.lumigame.com/23",
        environment,
        initialScope: {
            tags: { service: name },
        },
        release: `${name}@${version}`,
    },
    skynexOptions: {
        conversationIds: {
            telegram: -1002034115006,
            slack: "B08GPPK88MS:T08ACMHMMFS:C091FAL49UG",
        },
    },
    environment,
};

const srcCred = "lmn_archive:LmnArchive";
const srcSrv = "10.10.50.12:39300,10.10.50.13:39300,10.10.50.14:39300";
const srcRepl = "GNLocal0";

const arcCred = "lmn_archive:LmnArchive";
const arcSrv = "10.10.50.12:39300,10.10.50.13:39300,10.10.50.14:39300";
const arcRepl = "GNLocal0";

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

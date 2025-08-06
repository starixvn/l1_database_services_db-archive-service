/** @typedef {import("@ldb/logger").LumiLoggerConfig} LumiLoggerConfig */
/** @typedef {import("@ldb/mongo").ChangeStreamNameSpace} ChangeStreamNameSpace */

import { name, version } from "./metadata.js";

export const environment = "HD-MIS-SIT";
export const healthcheckPort = 5000;

/** @type {LumiLoggerConfig} */
export const lumiLoggerConfig = {
    sentryNodeOptions: {
        dsn: "https://9e03285f9c3ff7b4b44903dd009f49dd@sentry-kl.sgamesuat.com/22",
        environment,
        initialScope: {
            tags: { service: name },
        },
        release: `${name}@${version}`,
    },
    skynexOptions: {
        conversationIds: {
            telegram: -1002034115006,
            slack: "B08GPPK88MS:T08ACMHMMFS:C090ALHP2DD",
        },
    },
    environment,
};

const srcCred = "lmn_archive:%4c%6d%6e%41%72%63%68%69%76%65%40%35%31%37";
const srcSrv = "172.16.4.111:35301";
const srcRepl = "SP-SIT";

const arcCred = "lmn_archive:%4c%6d%6e%41%72%63%68%69%76%65%40%35%31%37";
const arcSrv = "172.16.4.111:35351";
const arcRepl = "SP-SITArc";

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
    archiveConfigCollection: { db: "hotdog_ops_configs", coll: "archive_configs" },
};

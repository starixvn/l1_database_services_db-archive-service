/** @typedef {import("@ldb/logger").LumiLoggerConfig} LumiLoggerConfig */
/** @typedef {import("@ldb/mongo").ChangeStreamNameSpace} ChangeStreamNameSpace */

import { name, version } from "./metadata.js";

export const environment = "XD-KL-PROD";
export const healthcheckPort = 5000;

/** @type {LumiLoggerConfig} */
export const lumiLoggerConfig = {
    sentryNodeOptions: {
        dsn: "http://21ae56685b792a67a38aa9ce7f2716cb@sentrypro-sc.ops-klprod.gamora.prod/21",
        environment,
        initialScope: {
            tags: { service: name },
        },
        release: `${name}@${version}`,
    },
    skynexOptions: {
        conversationIds: {
            telegram: -1002096556100,
            slack: "B08GPPK88MS:T08ACMHMMFS:C090GANNXP1",
        },
        proxy: {
            protocol: "http",
            host: "iusqd.gamora.prod",
            port: 8801,
        },
    },
    environment,
};

const srcCred = "lmn_archive:%6e%2a%40%63%27%4c%26%6c%53%40%7c%42%75%5e%46%54%28%29%71%40%75%3e%42%2a%4b%61%5e%3e%5c%36%47%67";
const srcSrv = "10.146.34.26:39410,10.146.34.27:39410,10.146.34.30:39410,10.146.34.28:39410";
const srcRepl = "SN-Main";

const arcCred = "lmn_archive:%6e%2a%40%63%27%4c%26%6c%53%40%7c%42%75%5e%46%54%28%29%71%40%75%3e%42%2a%4b%61%5e%3e%5c%36%47%67";
const arcSrv = "10.146.34.26:39415,10.146.34.27:39415,10.146.34.30:39415,10.146.34.28:39415";
const arcRepl = "SN-Arc";

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

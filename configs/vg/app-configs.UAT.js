/** @typedef {import("@ldb/logger").LumiLoggerConfig} LumiLoggerConfig */

import { name, version } from "./metadata.js";

export const environment = "VG-UAT";
export const healthcheckPort = 5000;

/** @type {LumiLoggerConfig} */
export const lumiLoggerConfig = {
    sentryNodeOptions: {
        dsn: "http://e43d25740996f1617e8aaf37b1f14c79@sentryuat-sc.nebula.prod/22",
        environment,
        initialScope: {
            tags: { service: name },
        },
        release: `${name}@${version}`,
    },
    skynexOptions: {
        conversationIds: {
            telegram: -1001604444158,
            slack: "B08GPPK88MS:T08ACMHMMFS:C090ALHP2DD",
        },
        proxy: {
            protocol: "http",
            host: "lisasqd.nebula.prod",
            port: 8801,
        },
    },
    environment,
};

const srcCred = "lmn_archive:%4c%6d%6e%41%72%63%68%69%76%65%40%32%32%30%32%37";
const srcSrv = "10.99.99.53:39220,10.99.99.54:39220,10.99.99.188:39220,10.99.99.187:39220";
const srcRepl = "SabaL2UAT";

const arcCred = "lmn_archive:%4c%6d%6e%41%72%63%68%69%76%65%40%32%32%30%32%37";
const arcSrv = "10.99.99.53:39225,10.99.99.54:39225,10.99.99.188:39225,10.99.99.187:39225";
const arcRepl = "SabaL2UATArc";

export const database = {
    sourceUrl: `mongodb://${srcCred}@${srcSrv}/admin?authSource=admin&appName=${encodeURIComponent(name)}&replicaSet=${srcRepl}`,
    archiveUrl: `mongodb://${arcCred}@${arcSrv}/admin?authSource=admin&appName=${encodeURIComponent(name)}&replicaSet=${arcRepl}`,
};

export const schedulerConfig = {
    RUN_ARCHIVE: [600_000, 0],
};

export const archiveStatusCollectionName = "archive_statuses";

/** @typedef {import("@ldb/logger").LumiLoggerConfig} LumiLoggerConfig */
/** @typedef {import("@ldb/mongo").ChangeStreamNameSpace} ChangeStreamNameSpace */

import { name, version } from "./metadata.js";

export const environment = "VG-KL-PROD";
export const healthcheckPort = 5000;

/** @type {LumiLoggerConfig} */
export const lumiLoggerConfig = {
    sentryNodeOptions: {
        dsn: "http://6dedea44b8f8e60b6519ff864484357a@sentrypro-sc.ops-klprod.gamora.prod/20",
        environment,
        initialScope: {
            tags: { service: name },
        },
        release: `${name}@${version}`,
    },
    skynexOptions: {
        conversationIds: {
            telegram: -1001948416210,
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

const srcCred = "lmn_archive:%65%7b%68%4c%66%68%44%78%3f%7e%2b%3e%38%70%38%36%24%29%3d%26%71%65%59%31%4a%7b%67%2a%73%70%4a%2a";
const srcSrv = "10.146.34.26:39210,10.146.34.27:39210,10.146.34.30:39210,10.146.34.28:39210";
const srcRepl = "L2_SabaMain";

const arcCred = "lmn_archive:%65%7b%68%4c%66%68%44%78%3f%7e%2b%3e%38%70%38%36%24%29%3d%26%71%65%59%31%4a%7b%67%2a%73%70%4a%2a";
const arcSrv = "10.146.34.26:39215,10.146.34.27:39215,10.146.34.30:39215,10.146.34.28:39215";
const arcRepl = "L2_SabaArc";

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

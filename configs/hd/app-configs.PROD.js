/** @typedef {import("@ldb/logger").LumiLoggerConfig} LumiLoggerConfig */

import { name, version } from "./metadata.js";

export const environment = "HD-PROD";
export const healthcheckPort = 5000;

/** @type {LumiLoggerConfig} */
export const lumiLoggerConfig = {
    sentryNodeOptions: {
        dsn: "http://3d919d26cf198749e16d574f81b04943@sentrypro-sc.nebula.prod/22",
        environment,
        initialScope: {
            tags: { service: name },
        },
        release: `${name}@${version}`,
    },
    skynexOptions: {
        conversationIds: {
            telegram: -1002096556100,
            slack: "B08GPPK88MS:T08ACMHMMFS:C090VPU8KFF",
        },
        proxy: {
            protocol: "http",
            host: "lisasqd.nebula.prod",
            port: 8801,
        },
    },
    environment,
};

const srcCred = "lmn_archive:Se5HtSAnJR1zu%2AG%26%2AWyLRxL%5Em61ESCQ5";
const srcSrv = "10.99.99.53:39510,10.99.99.54:39510,10.99.99.188:39510,10.99.99.187:39510";
const srcRepl = "SP-Main";

const arcCred = "lmn_archive:Se5HtSAnJR1zu%2AG%26%2AWyLRxL%5Em61ESCQ5";
const arcSrv = "10.99.99.53:39515,10.99.99.54:39515,10.99.99.188:39515,10.99.99.187:39515";
const arcRepl = "SP-Arc";

export const database = {
    sourceUrl: `mongodb://${srcCred}@${srcSrv}/admin?authSource=admin&appName=${encodeURIComponent(name)}&replicaSet=${srcRepl}`,
    archiveUrl: `mongodb://${arcCred}@${arcSrv}/admin?authSource=admin&appName=${encodeURIComponent(name)}&replicaSet=${arcRepl}`,
};

export const schedulerConfig = {
    RUN_ARCHIVE: [600_000, 0],
};

export const archiveStatusCollectionName = "archive_statuses";

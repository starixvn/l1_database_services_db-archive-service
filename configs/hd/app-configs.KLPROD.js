/** @typedef {import("@ldb/logger").LumiLoggerConfig} LumiLoggerConfig */

import { name, version } from "./metadata.js";

export const environment = "HD-KLPROD";
export const healthcheckPort = 5000;

/** @type {LumiLoggerConfig} */
export const lumiLoggerConfig = {
    sentryNodeOptions: {
        dsn: "http://9e03285f9c3ff7b4b44903dd009f49dd@sentrypro-sc.ops-klprod.gamora.prod/22",
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

const srcCred = "lmn_archive:Se5HtSAnJR1zu%2AG%26%2AWyLRxL%5Em61ESCQ5";
const srcSrv = "10.146.34.26:39510,10.146.34.27:39510,10.146.34.30:39510,10.146.34.28:39510";
const srcRepl = "SP-Main";

const arcCred = "lmn_archive:Se5HtSAnJR1zu%2AG%26%2AWyLRxL%5Em61ESCQ5";
const arcSrv = "10.146.34.26:39515,10.146.34.27:39515,10.146.34.30:39515,10.146.34.28:39515";
const arcRepl = "SP-Arc";

export const database = {
    sourceUrl: `mongodb://${srcCred}@${srcSrv}/admin?authSource=admin&appName=${encodeURIComponent(name)}&replicaSet=${srcRepl}`,
    archiveUrl: `mongodb://${arcCred}@${arcSrv}/admin?authSource=admin&appName=${encodeURIComponent(name)}&replicaSet=${arcRepl}`,
};

export const schedulerConfig = {
    RUN_ARCHIVE: [600_000, 0],
};

export const archiveStatusCollectionName = "archive_statuses";

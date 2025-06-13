/** @typedef {import("@ldb/logger").LumiLoggerConfig} LumiLoggerConfig */

import { name, version } from "./metadata.js";

export const environment = "SG-LOCAL-1";
export const healthcheckPort = 5000;

/** @type {LumiLoggerConfig} */
export const lumiLoggerConfig = {
    sentryNodeOptions: {
        dsn: "https://65203d3a46ca4b5c95eeba210120b017@sentry-k8s.lumigame.com/21",
        environment,
        initialScope: {
            tags: { service: name },
        },
        release: `${name}@${version}`,
    },
    skynexOptions: {
        conversationIds: {
            telegram: -1001964283718,
            slack: "B08GPPK88MS:T08ACMHMMFS:C091FAL49UG",
        },
    },
    environment,
};

const srcCred = "lmn_archive:LmnArchive";
const srcSrv = "10.10.50.12:39101,10.10.50.13:39101,10.10.50.14:39101";
const srcRepl = "L1pLocal";

const arcCred = "lmn_archive:LmnArchive";
const arcSrv = "10.10.50.12:39101,10.10.50.13:39101,10.10.50.14:39101";
const arcRepl = "L1pLocal";

export const database = {
    sourceUrl: `mongodb://${srcCred}@${srcSrv}/admin?authSource=admin&appName=${encodeURIComponent(name)}&replicaSet=${srcRepl}`,
    archiveUrl: `mongodb://${arcCred}@${arcSrv}/admin?authSource=admin&appName=${encodeURIComponent(name)}&replicaSet=${arcRepl}`,
};

export const schedulerConfig = {
    RUN_ARCHIVE: [600_000, 0],
};

export const archiveStatusCollectionName = "archive_statuses";

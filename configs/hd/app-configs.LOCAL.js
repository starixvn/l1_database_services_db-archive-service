/** @typedef {import("@ldb/logger").LumiLoggerConfig} LumiLoggerConfig */

import { name, version } from "./metadata.js";

export const environment = "HD-LOCAL-0";
export const healthcheckPort = 5000;

/** @type {LumiLoggerConfig} */
export const lumiLoggerConfig = {
    sentryNodeOptions: {
        dsn: "https://42cb349f8a4fbd2297e870bb3fc41821@sentry-k8s.lumigame.com/25",
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
const srcSrv = "10.10.50.12:39400,10.10.50.13:39400,10.10.50.14:39400";
const srcRepl = "SPLocal0";

const arcCred = "lmn_archive:LmnArchive";
const arcSrv = "10.10.50.12:39400,10.10.50.13:39400,10.10.50.14:39400";
const arcRepl = "SPLocal0";

export const database = {
    sourceUrl: `mongodb://${srcCred}@${srcSrv}/admin?authSource=admin&appName=${encodeURIComponent(name)}&replicaSet=${srcRepl}`,
    archiveUrl: `mongodb://${arcCred}@${arcSrv}/admin?authSource=admin&appName=${encodeURIComponent(name)}&replicaSet=${arcRepl}`,
};

export const schedulerConfig = {
    RUN_ARCHIVE: [600_000, 0],
};

export const archiveStatusCollectionName = "archive_statuses";

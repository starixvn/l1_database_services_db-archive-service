/** @typedef {import("@ldb/logger").LumiLoggerConfig} LumiLoggerConfig */

import { name, version } from "./metadata.js";

export const environment = "SG-PROD";
export const healthcheckPort = 5000;

/** @type {LumiLoggerConfig} */
export const lumiLoggerConfig = {
    sentryNodeOptions: {
        dsn: "http://dfda4d5e4eabf49adb8dbb4b0c54bc48@sentrypro-sc.nebula.prod/19",
        environment,
        initialScope: {
            tags: { service: name },
        },
        release: `${name}@${version}`,
    },
    skynexOptions: {
        conversationIds: {
            telegram: -1001893615808,
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

const srcCred = "lmn_archive:%6c%6d%52%56%3c%6f%38%42%32%63%77%24%48%63%3d%47%44%69%32%4e%44%4b%66%4f%52%30%57%36%67%59%47%74";
const srcSrv = "10.99.99.53:39110,10.99.99.54:39110,10.99.99.188:39110,10.99.99.187:39110";
const srcRepl = "SabaMain";

const arcCred = "lmn_archive:%6c%6d%52%56%3c%6f%38%42%32%63%77%24%48%63%3d%47%44%69%32%4e%44%4b%66%4f%52%30%57%36%67%59%47%74";
const arcSrv = "10.99.99.53:39115,10.99.99.54:39115,10.99.99.188:39115,10.99.99.187:39115";
const arcRepl = "L1_SabaArc";

export const database = {
    sourceUrl: `mongodb://${srcCred}@${srcSrv}/admin?authSource=admin&appName=${encodeURIComponent(name)}&replicaSet=${srcRepl}`,
    archiveUrl: `mongodb://${arcCred}@${arcSrv}/admin?authSource=admin&appName=${encodeURIComponent(name)}&replicaSet=${arcRepl}`,
};

export const schedulerConfig = {
    RUN_ARCHIVE: [600_000, 0],
};

export const archiveStatusCollectionName = "archive_statuses";

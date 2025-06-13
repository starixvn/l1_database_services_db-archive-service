/** @typedef {import("@ldb/logger").LumiLoggerConfig} LumiLoggerConfig */

import { name, version } from "./metadata.js";

export const environment = "SG-KLPROD";
export const healthcheckPort = 5000;

/** @type {LumiLoggerConfig} */
export const lumiLoggerConfig = {
    sentryNodeOptions: {
        dsn: "http://a44301722794b9e2d74cb4efc1655964@sentrypro-sc.ops-klprod.gamora.prod/19",
        environment,
        initialScope: {
            tags: { service: name },
        },
        release: `${name}@${version}`,
    },
    skynexOptions: {
        conversationIds: {
            telegram: -1001893615808,
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

const srcCred = "lmn_archive:%6c%6d%52%56%3c%6f%38%42%32%63%77%24%48%63%3d%47%44%69%32%4e%44%4b%66%4f%52%30%57%36%67%59%47%74";
const srcSrv = "10.146.34.26:39110,10.146.34.27:39110,10.146.34.30:39110,10.146.34.28:39110";
const srcRepl = "SabaMain";

const arcCred = "lmn_archive:%6c%6d%52%56%3c%6f%38%42%32%63%77%24%48%63%3d%47%44%69%32%4e%44%4b%66%4f%52%30%57%36%67%59%47%74";
const arcSrv = "10.146.34.26:39115,10.146.34.27:39115,10.146.34.30:39115,10.146.34.28:39115";
const arcRepl = "L1_SabaArc";

export const database = {
    sourceUrl: `mongodb://${srcCred}@${srcSrv}/admin?authSource=admin&appName=${encodeURIComponent(name)}&replicaSet=${srcRepl}`,
    archiveUrl: `mongodb://${arcCred}@${arcSrv}/admin?authSource=admin&appName=${encodeURIComponent(name)}&replicaSet=${arcRepl}`,
};

export const schedulerConfig = {
    RUN_ARCHIVE: [600_000, 0],
};

export const archiveStatusCollectionName = "archive_statuses";

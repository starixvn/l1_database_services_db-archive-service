/** @typedef {import("@ldb/logger").LumiLoggerConfig} LumiLoggerConfig */

import { name, version } from "./metadata.js";

export const environment = "XD-PROD";
export const healthcheckPort = 5000;

/** @type {LumiLoggerConfig} */
export const lumiLoggerConfig = {
    sentryNodeOptions: {
        dsn: "http://36fed42b6d2c8eab09bd46ffbd276073@sentrypro-sc.nebula.prod/21",
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

const srcCred = "lmn_archive:%6e%2a%40%63%27%4c%26%6c%53%40%7c%42%75%5e%46%54%28%29%71%40%75%3e%42%2a%4b%61%5e%3e%5c%36%47%67";
const srcSrv = "10.99.99.53:39410,10.99.99.54:39410,10.99.99.188:39410,10.99.99.187:39410";
const srcRepl = "SN-Main";

const arcCred = "lmn_archive:%6e%2a%40%63%27%4c%26%6c%53%40%7c%42%75%5e%46%54%28%29%71%40%75%3e%42%2a%4b%61%5e%3e%5c%36%47%67";
const arcSrv = "10.99.99.53:39415,10.99.99.54:39415,10.99.99.188:39415,10.99.99.187:39415";
const arcRepl = "SN-Arc";

export const database = {
    sourceUrl: `mongodb://${srcCred}@${srcSrv}/admin?authSource=admin&appName=${encodeURIComponent(name)}&replicaSet=${srcRepl}`,
    archiveUrl: `mongodb://${arcCred}@${arcSrv}/admin?authSource=admin&appName=${encodeURIComponent(name)}&replicaSet=${arcRepl}`,
};

export const schedulerConfig = {
    RUN_ARCHIVE: [600_000, 0],
};

export const archiveStatusCollectionName = "archive_statuses";

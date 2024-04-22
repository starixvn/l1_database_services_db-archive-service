import { name, version } from "./metadata.js";

export const environment = "XD-PROD";
export const healthcheckPort = 5000;

export const sentrySeverityLevel = "warning";
export const sentryNodeOptions = {
    dsn: "http://9326bb3634924b3baf140399926a6df3@10.2.189.50:9009/170",
    environment,
    initialScope: {
        tags: { service: name },
    },
    release: `${name}@${version}`,
};
export const sentryOptions = {};

export const skynexSeverityLevel = "warning";
export const skynexOptions = {
    conversationIds: {
        telegram: -1002096556100,
        teams: "19:1757113a88734d85be13ad84f3dcbc66@thread.tacv2",
    },
    proxy: {
        protocol: "http",
        host: "lisasqd.nebula.prod",
        port: 8801,
    },
};

export const terminalSeverityLevel = "log";

const srcCred = "lmn_archive:%6e%2a%40%63%27%4c%26%6c%53%40%7c%42%75%5e%46%54%28%29%71%40%75%3e%42%2a%4b%61%5e%3e%6%47%67";
const srcSrv = "10.99.99.53:39410,10.99.99.54:39410,10.99.99.188:39410,10.99.99.187:39410";
const srcRepl = "SN-Main";

const arcCred = "lmn_archive:%6e%2a%40%63%27%4c%26%6c%53%40%7c%42%75%5e%46%54%28%29%71%40%75%3e%42%2a%4b%61%5e%3e%6%47%67";
const arcSrv = "10.99.99.53:39415,10.99.99.54:39415,10.99.99.188:39415,10.99.99.187:39415";
const arcRepl = "SN-Arc";

export const database = {
    sourceUrl: `mongodb://${srcCred}@${srcSrv}/admin?authSource=admin&appName=${encodeURIComponent(name)}&replicaSet=${srcRepl}`,
    archiveUrl: `mongodb://${arcCred}@${arcSrv}/admin?authSource=admin&appName=${encodeURIComponent(name)}&replicaSet=${arcRepl}`,
};

export const eventConfigs = {
    RUN_ARCHIVE: 600_000,
};

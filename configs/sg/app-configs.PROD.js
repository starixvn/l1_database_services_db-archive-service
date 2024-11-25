import { name, version } from "./metadata.js";

export const environment = "SG-PROD";
export const healthcheckPort = 5000;

export const sentrySeverityLevel = "warning";
export const sentryNodeOptions = {
    dsn: "http://d84f2c9daa5044c48bca9930aa7e98b0@10.2.189.50:9009/168",
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
        telegram: -1001893615808,
        teams: "19:61ccda09f02444a9ab8355852903a598@thread.tacv2",
    },
    proxy: {
        protocol: "http",
        host: "lisasqd.nebula.prod",
        port: 8801,
    },
};

export const terminalSeverityLevel = "log";

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

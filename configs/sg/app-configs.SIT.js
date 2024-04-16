import { name, version } from "./metadata.js";

export const environment = "SG-SIT";
export const healthcheckPort = 5000;

export const sentrySeverityLevel = "warning";
export const sentryNodeOptions = {
    dsn: "https://7820c1cec9bc47f1b52a054861b55256@10.2.190.51:9009/295",
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
        telegram: -1001964283718,
        teams: "19:b9580a426bbe409fb9457129f486c63b@thread.tacv2",
    },
    proxy: {
        protocol: "http",
        host: "lisasqd.nebula.prod",
        port: 8801,
    },
};

export const terminalSeverityLevel = "log";

const srcCred = "lmn_archive:%4c%6d%6e%41%72%63%68%69%76%65%40%35%31%37";
const srcSrv = "10.99.99.53:39130,10.99.99.54:39130,10.99.99.188:39130,10.99.99.187:39130";
const srcRepl = "SabaSIT";

const arcCred = "lmn_archive:%4c%6d%6e%41%72%63%68%69%76%65%40%35%31%37";
const arcSrv = "10.99.99.53:39135,10.99.99.54:39135,10.99.99.188:39135,10.99.99.187:39135";
const arcRepl = "SabaSITArc";

export const database = {
    sourceUrl: `mongodb://${srcCred}@${srcSrv}/admin?authSource=admin&appName=${encodeURIComponent(name)}&replicaSet=${srcRepl}`,
    archiveUrl: `mongodb://${arcCred}@${arcSrv}/admin?authSource=admin&appName=${encodeURIComponent(name)}&replicaSet=${arcRepl}`,
};

export const eventConfigs = {
    RUN_ARCHIVE: 600_000,
};

import { name, version } from "./metadata.js";

export const environment = "XD-SIT";
export const healthcheckPort = 5000;

export const sentrySeverityLevel = "warning";
export const sentryNodeOptions = {
    dsn: "https://deb8a0a2ea0e4788a8d19b9aee8b2aa9@10.2.190.51:9009/297",
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
        telegram: -1002034115006,
        teams: "19:d7150ed870de4bef928c69ea6949c6ff@thread.tacv2",
    },
    proxy: {
        protocol: "http",
        host: "lisasqd.nebula.prod",
        port: 8801,
    },
};

export const terminalSeverityLevel = "log";

const srcCred = "lmn_archive:%4c%6d%6e%41%72%63%68%69%76%65%40%35%31%37";
const srcSrv = "10.99.99.53:39430,10.99.99.54:39430,10.99.99.188:39430,10.99.99.187:39430";
const srcRepl = "SN-SIT";

const arcCred = "lmn_archive:%4c%6d%6e%41%72%63%68%69%76%65%40%35%31%37";
const arcSrv = "10.99.99.53:39435,10.99.99.54:39435,10.99.99.188:39435,10.99.99.187:39435";
const arcRepl = "SN-SITArc";

export const database = {
    sourceUrl: `mongodb://${srcCred}@${srcSrv}/admin?authSource=admin&appName=${encodeURIComponent(name)}&replicaSet=${srcRepl}`,
    archiveUrl: `mongodb://${arcCred}@${arcSrv}/admin?authSource=admin&appName=${encodeURIComponent(name)}&replicaSet=${arcRepl}`,
};

export const eventConfigs = {
    RUN_ARCHIVE: 600_000,
};

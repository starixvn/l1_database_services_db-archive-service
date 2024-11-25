import { name, version } from "./metadata.js";

export const environment = "SG-UAT";
export const healthcheckPort = 5000;

export const sentrySeverityLevel = "warning";
export const sentryNodeOptions = {
    dsn: "http://7820c1cec9bc47f1b52a054861b55256@10.2.190.51:9009/295",
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

const srcCred = "lmn_archive:%4c%6d%6e%41%72%63%68%69%76%65%40%32%32%30%32%37";
const srcSrv = "10.99.99.53:39120,10.99.99.54:39120,10.99.99.188:39120,10.99.99.187:39120";
const srcRepl = "SabaUAT";

const arcCred = "lmn_archive:%4c%6d%6e%41%72%63%68%69%76%65%40%32%32%30%32%37";
const arcSrv = "10.99.99.53:39125,10.99.99.54:39125,10.99.99.188:39125,10.99.99.187:39125";
const arcRepl = "SabaUATArc";

export const database = {
    sourceUrl: `mongodb://${srcCred}@${srcSrv}/admin?authSource=admin&appName=${encodeURIComponent(name)}&replicaSet=${srcRepl}`,
    archiveUrl: `mongodb://${arcCred}@${arcSrv}/admin?authSource=admin&appName=${encodeURIComponent(name)}&replicaSet=${arcRepl}`,
};


export const schedulerConfig = {
    RUN_ARCHIVE: [600_000, 0],
};

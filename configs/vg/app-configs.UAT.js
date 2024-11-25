import { name, version } from "./metadata.js";

export const environment = "VG-UAT";
export const healthcheckPort = 5000;

export const sentrySeverityLevel = "warning";
export const sentryNodeOptions = {
    dsn: "http://4d147849b1a44d53844166ff9487dd6b@10.2.190.51:9009/296",
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
        telegram: -1001604444158,
        teams: "19:8d4e742134134c3893e78891257d6c3c@thread.tacv2",
    },
    proxy: {
        protocol: "http",
        host: "lisasqd.nebula.prod",
        port: 8801,
    },
};

export const terminalSeverityLevel = "log";

const srcCred = "lmn_archive:%4c%6d%6e%41%72%63%68%69%76%65%40%32%32%30%32%37";
const srcSrv = "10.99.99.53:39220,10.99.99.54:39220,10.99.99.188:39220,10.99.99.187:39220";
const srcRepl = "SabaL2UAT";

const arcCred = "lmn_archive:%4c%6d%6e%41%72%63%68%69%76%65%40%32%32%30%32%37";
const arcSrv = "10.99.99.53:39225,10.99.99.54:39225,10.99.99.188:39225,10.99.99.187:39225";
const arcRepl = "SabaL2UATArc";

export const database = {
    sourceUrl: `mongodb://${srcCred}@${srcSrv}/admin?authSource=admin&appName=${encodeURIComponent(name)}&replicaSet=${srcRepl}`,
    archiveUrl: `mongodb://${arcCred}@${arcSrv}/admin?authSource=admin&appName=${encodeURIComponent(name)}&replicaSet=${arcRepl}`,
};

export const schedulerConfig = {
    RUN_ARCHIVE: [600_000, 0],
};

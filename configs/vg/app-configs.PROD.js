import { name, version } from "./metadata.js";

export const environment = "VG-PROD";
export const healthcheckPort = 5000;

export const sentrySeverityLevel = "warning";
export const sentryNodeOptions = {
    dsn: "http://bb368dd4964d4f28bdeec2494d4742bf@10.2.189.50:9009/169",
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
        telegram: -1001948416210,
        teams: "19:4cc06ce67599405ead9238b3408147f7@thread.tacv2",
    },
    proxy: {
        protocol: "http",
        host: "lisasqd.nebula.prod",
        port: 8801,
    },
};

export const terminalSeverityLevel = "log";

const srcCred = "lmn_archive:%65%7b%68%4c%66%68%44%78%3f%7e%2b%3e%38%70%38%36%24%29%3d%26%71%65%59%31%4a%7b%67%2a%73%70%4a%2a";
const srcSrv = "10.99.99.53:39210,10.99.99.54:39210,10.99.99.188:39210,10.99.99.187:39210";
const srcRepl = "L2_SabaMain";

const arcCred = "lmn_archive:%65%7b%68%4c%66%68%44%78%3f%7e%2b%3e%38%70%38%36%24%29%3d%26%71%65%59%31%4a%7b%67%2a%73%70%4a%2a";
const arcSrv = "10.99.99.53:39215,10.99.99.54:39215,10.99.99.188:39215,10.99.99.187:39215";
const arcRepl = "L2_SabaArc";

export const database = {
    sourceUrl: `mongodb://${srcCred}@${srcSrv}/admin?authSource=admin&appName=${encodeURIComponent(name)}&replicaSet=${srcRepl}`,
    archiveUrl: `mongodb://${arcCred}@${arcSrv}/admin?authSource=admin&appName=${encodeURIComponent(name)}&replicaSet=${arcRepl}`,
};

export const eventConfigs = {
    RUN_ARCHIVE: 600_000,
};

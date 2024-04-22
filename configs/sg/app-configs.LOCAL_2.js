import { name, version } from "./metadata.js";

export const environment = "SG-LOCAL-2";
export const healthcheckPort = 5000;

export const sentrySeverityLevel = "warning";
export const sentryNodeOptions = {
    dsn: "https://098a0c6ad1d74e8eb39ec7df895e59e0@sentry.lumigame.com/76",
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
};

export const terminalSeverityLevel = "log";

const srcCred = "lmn_archive:LmnArchive";
const srcSrv = "10.10.50.12:39102,10.10.50.13:39102,10.10.50.14:39102";
const srcRepl = "L1ppLocal";

const arcCred = "lmn_archive:LmnArchive";
const arcSrv = "10.10.50.12:39102,10.10.50.13:39102,10.10.50.14:39102";
const arcRepl = "L1ppLocal";

export const database = {
    sourceUrl: `mongodb://${srcCred}@${srcSrv}/admin?authSource=admin&appName=${encodeURIComponent(name)}&replicaSet=${srcRepl}`,
    archiveUrl: `mongodb://${arcCred}@${arcSrv}/admin?authSource=admin&appName=${encodeURIComponent(name)}&replicaSet=${arcRepl}`,
};

export const eventConfigs = {
    RUN_ARCHIVE: 60_000,
};

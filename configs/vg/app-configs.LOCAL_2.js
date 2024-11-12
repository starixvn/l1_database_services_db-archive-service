import { name, version } from "./metadata.js";

export const environment = "VG-LOCAL-2";
export const healthcheckPort = 5000;

export const sentrySeverityLevel = "warning";
export const sentryNodeOptions = {
    dsn: "https://be2c83ae1b01424ab32f27411f22f8c5@sentry.lumigame.com/77",
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
};

export const terminalSeverityLevel = "log";

const srcCred = "lmn_archive:LmnArchive";
const srcSrv = "10.10.50.12:39202,10.10.50.13:39202,10.10.50.14:39202";
const srcRepl = "L2ppLocal";

const arcCred = "lmn_archive:LmnArchive";
const arcSrv = "10.10.50.12:39202,10.10.50.13:39202,10.10.50.14:39202";
const arcRepl = "L2ppLocal";

export const database = {
    sourceUrl: `mongodb://${srcCred}@${srcSrv}/admin?authSource=admin&appName=${encodeURIComponent(name)}&replicaSet=${srcRepl}`,
    archiveUrl: `mongodb://${arcCred}@${arcSrv}/admin?authSource=admin&appName=${encodeURIComponent(name)}&replicaSet=${arcRepl}`,
};

export const schedulerConfig = {
    RUN_ARCHIVE: [600_000, 0],
};

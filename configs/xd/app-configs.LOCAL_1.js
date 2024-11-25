import { name, version } from "./metadata.js";

export const environment = "XD-LOCAL-1";
export const healthcheckPort = 5000;

export const sentrySeverityLevel = "warning";
export const sentryNodeOptions = {
    dsn: "https://9ea52e989cbd40458728a6b26c1107b1@sentry.lumigame.com/88",
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
};

export const terminalSeverityLevel = "log";

const srcCred = "lmn_archive:LmnArchive";
const srcSrv = "10.10.50.12:39301,10.10.50.13:39301,10.10.50.14:39301";
const srcRepl = "GNLocal1";

const arcCred = "lmn_archive:LmnArchive";
const arcSrv = "10.10.50.12:39301,10.10.50.13:39301,10.10.50.14:39301";
const arcRepl = "GNLocal1";

export const database = {
    sourceUrl: `mongodb://${srcCred}@${srcSrv}/admin?authSource=admin&appName=${encodeURIComponent(name)}&replicaSet=${srcRepl}`,
    archiveUrl: `mongodb://${arcCred}@${arcSrv}/admin?authSource=admin&appName=${encodeURIComponent(name)}&replicaSet=${arcRepl}`,
};

export const schedulerConfig = {
    RUN_ARCHIVE: [600_000, 0],
};

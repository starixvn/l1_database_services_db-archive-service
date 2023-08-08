import { SERVICE_VERSION } from "./service-version";

const sourceDb = {
    credential: "lmn_archive:LmnArchive",
    server: "10.10.50.12:39101,10.10.50.13:39101,10.10.50.14:39101",
    replSet: "L1pLocal",
};
const targetDb = {
    credential: "lmn_archive:LmnArchive",
    server: "10.10.50.12:39101,10.10.50.13:39101,10.10.50.14:39101",
    replSet: "L1pLocal",
};
const appName = encodeURI("Archive Process");

const environment = "LOCAL-1";

export const eventConfigs = {
    RUN_ARCHIVE: 30 * 60_000,
};

export const sentryOptions = {
    dsn: "https://098a0c6ad1d74e8eb39ec7df895e59e0@sentry.lumigame.com/76",
    environment,
    initialScope: {
        tags: { service: "archive-process" },
    },
    release: `archive-process-service@${SERVICE_VERSION}`,
};

export const skynexOptions = {
    token: "0A40aOc7CtpzjbBSJu8KNWQRoXyjRvf9",
    environment,
    conversationIds: { NotiChannel: -1001964283718 },
};

export const hostingPort = 5000;

export const database = {
    sourceUrl: `mongodb://${sourceDb.credential}@${sourceDb.server}/admin?authSource=admin&appName=${appName}&replicaSet=${sourceDb.replSet}`,
    archiveUrl: `mongodb://${targetDb.credential}@${targetDb.server}/admin?authSource=admin&appName=${appName}&replicaSet=${targetDb.replSet}`,
};

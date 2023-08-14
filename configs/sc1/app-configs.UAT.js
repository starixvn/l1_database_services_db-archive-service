import { SERVICE_VERSION } from "./service-version";

const sourceDb = {
    credential: `lmn_archive:${encodeURIComponent("LmnArchive@22027")}`,
    server: "10.99.99.187:27201",
    replSet: "SabaUAT",
};
const targetDb = {
    credential: `lmn_archive:${encodeURIComponent("LmnArchive@22027")}`,
    server: "10.99.99.187:27201",
    replSet: "SabaUAT",
};
const appName = encodeURI("Archive Process");

const environment = "UAT";

export const eventConfigs = {
    RUN_ARCHIVE: 10 * 60_000,
};

export const sentryOptions = {
    dsn: "http://9393be4d15fe43219a1d1bc47144a632@10.2.190.51:9009/275",
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

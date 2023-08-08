import { SchedulerConfigs } from "@ldb/scheduler";
import { NodeOptions } from "@sc-logger/sentry";
import { SkynexConfigs } from "@sc-logger/skynex";
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
const appName = encodeURI("Archive Process DevMode");

const environment = "LOCAL-DEV";

export const eventConfigs: SchedulerConfigs = {
    RUN_ARCHIVE: 1 * 60_000,
};

export const sentryOptions: NodeOptions = {
    dsn: "https://098a0c6ad1d74e8eb39ec7df895e59e0@sentry.lumigame.com/76",
    environment,
    initialScope: {
        tags: { service: "archive-process" },
    },
    release: `archive-process-service@${SERVICE_VERSION}`,
};

export const skynexOptions: SkynexConfigs = {
    token: "0A40aOc7CtpzjbBSJu8KNWQRoXyjRvf9",
    environment,
    conversationIds: { NotiChannel: -1001911631568 },
};

export const hostingPort = 5000;

export const database = {
    sourceUrl: `mongodb://${sourceDb.credential}@${sourceDb.server}/admin?authSource=admin&appName=${appName}&replicaSet=${sourceDb.replSet}`,
    archiveUrl: `mongodb://${targetDb.credential}@${targetDb.server}/admin?authSource=admin&appName=${appName}&replicaSet=${targetDb.replSet}`,
};

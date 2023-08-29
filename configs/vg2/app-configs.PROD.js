import { SERVICE_VERSION } from "./service-version";

const sourceDb = {
    credential: "lmn_archive:e%7BhLfhDx%3F~%2B%3E8p86%24)%3D%26qeY1J%7Bg*spJ*",
    server: "10.99.99.54:37101,10.99.99.53:37102",
    replSet: "L2_SabaMain",
};
const targetDb = {
    credential: "lmn_archive:e%7BhLfhDx%3F~%2B%3E8p86%24)%3D%26qeY1J%7Bg*spJ*",
    server: "10.99.99.187:37151",
    replSet: "L2_SabaArc",
};
const appName = encodeURI("Archive Process");

const environment = "PROD";

export const eventConfigs = {
    RUN_ARCHIVE: 10 * 60_000,
};

export const sentryOptions = {
    dsn: "http://0d16904ac82244349459372e629d8d39@10.2.189.50:9009/165",
    environment,
    initialScope: {
        tags: { service: "archive-process" },
    },
    release: `archive-process-service@${SERVICE_VERSION}`,
};

export const skynexOptions = {
    token: "0A40aOc7CtpzjbBSJu8KNWQRoXyjRvf9",
    environment,
    conversationIds: { NotiChannel: -1001948416210 },
    proxy: {
        protocol: "http",
        host: "10.2.252.100",
        port: 8801,
    },
};

export const hostingPort = 5000;

export const database = {
    sourceUrl: `mongodb://${sourceDb.credential}@${sourceDb.server}/admin?authSource=admin&appName=${appName}&replicaSet=${sourceDb.replSet}`,
    archiveUrl: `mongodb://${targetDb.credential}@${targetDb.server}/admin?authSource=admin&appName=${appName}&replicaSet=${targetDb.replSet}`,
};

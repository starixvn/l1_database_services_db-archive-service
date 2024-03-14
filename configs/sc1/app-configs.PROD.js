import { SERVICE_VERSION } from "./service-version";

const sourceDb = {
    credential: "lmn_archive:lmRV%3Co8B2cw%24Hc%3DGDi2NDKfOR0W6gYGt",
    server: "10.99.99.54:27101,10.99.99.53:27102",
    replSet: "SabaMain",
};
const targetDb = {
    credential: "lmn_archive:lmRV%3Co8B2cw%24Hc%3DGDi2NDKfOR0W6gYGt",
    server: "10.99.99.187:27151",
    replSet: "L1_SabaArc",
};
const appName = encodeURI("Archive Process");

const environment = "PROD";

export const eventConfigs = {
    RUN_ARCHIVE: 10 * 60_000,
};

export const sentryOptions = {
    dsn: "http://24da377728fa4ea98635f5dfff6785d5@10.2.189.50:9009/163",
    environment,
    initialScope: {
        tags: { service: "archive-process" },
    },
    release: `archive-process-service@${SERVICE_VERSION}`,
};

export const skynexOptions = {
    token: "0A40aOc7CtpzjbBSJu8KNWQRoXyjRvf9",
    environment,
    conversationIds: { NotiChannel: -1001893615808 },
    proxy: {
        protocol: "http",
        host: "lisasqd.nebula.prod",
        port: 8801,
    },
};

export const hostingPort = 5000;

export const database = {
    sourceUrl: `mongodb://${sourceDb.credential}@${sourceDb.server}/admin?authSource=admin&appName=${appName}&replicaSet=${sourceDb.replSet}`,
    archiveUrl: `mongodb://${targetDb.credential}@${targetDb.server}/admin?authSource=admin&appName=${appName}&replicaSet=${targetDb.replSet}`,
};

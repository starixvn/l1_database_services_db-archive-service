import type { LumiLoggerConfig } from "@ldb/logger";
import { name, version } from "./metadata.js";
import type { SchedulerConfigs } from "./types/scheduler.js";

export const environment = "DEV" as const;
export const healthcheckPort = 5000 as const;

export const lumiLoggerConfig = {
    sentryNodeOptions: {
        dsn: "https://e83926b2bc60caab91f825f6fce3d658@sentry-k8s.lumigame.com/24",
        environment,
        initialScope: {
            tags: { service: name },
        },
        release: `${name}@${version}`,
    },
    skynexOptions: {
        conversationIds: {
            telegram: -1001911631568,
            slack: "B08GPPK88MS:T08ACMHMMFS:C090SSUCJ10",
        },
    },
    environment,
    terminalSeverityLevel: "debug",
} as const satisfies LumiLoggerConfig;

const srcCred = "lmn_archive:LmnArchive" as const;
const srcSrv = "10.10.50.12:39400,10.10.50.13:39400,10.10.50.14:39400" as const;
const srcRepl = "SPLocal0" as const;

const arcCred = "lmn_archive:LmnArchive" as const;
const arcSrv = "10.10.50.12:39400,10.10.50.13:39400,10.10.50.14:39400" as const;
const arcRepl = "SPLocal0" as const;

export const database = {
    sourceUrl: `mongodb://${srcCred}@${srcSrv}/admin?authSource=admin&appName=${encodeURIComponent(name)}&replicaSet=${srcRepl}`,
    archiveUrl: `mongodb://${arcCred}@${arcSrv}/admin?authSource=admin&appName=${encodeURIComponent(name)}&replicaSet=${arcRepl}`,
} as const;

export const schedulerConfig = {
    RUN_ARCHIVE: [60_000, 0],
} as const satisfies SchedulerConfigs;

export const archiveStatusCollectionName = "archive_statuses" as const;

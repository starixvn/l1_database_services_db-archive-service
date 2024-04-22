import type { FireListener, Scheduler, SchedulerConfigs as SchedulerConfigsUpstream } from "@ldb/scheduler";
type Satisfies<T extends U, U> = T;
export type SchedulerKeys = "RUN_ARCHIVE";
export type SchedulerEvents = Record<SchedulerKeys, FireListener>;
export type SchedulerConfigs = Satisfies<Record<SchedulerKeys, number>, SchedulerConfigsUpstream>;
export type { Scheduler };

import type { BaseLogger } from "@ldb/base-logger";
import type { Collection } from "@ldb/mongo";
import { parseArchiveConfig } from "../../helpers/archive-configs.js";
import type { ArchiveConfig, SchemaArchiveConfig } from "../../types/archive-config.js";
import type { Scheduler, SchedulerEvents, SchedulerKeys } from "../../types/scheduler.js";
import { Dispatcher } from "../dispatcher.js";

export type InitiatorEvents = {
    ARCHIVE: (c: ArchiveConfig) => Promise<void>;
};

export class ArchiveInitiator extends Dispatcher<InitiatorEvents, SchedulerKeys, SchedulerEvents, Scheduler> {
    constructor(private readonly archiveConfigCollection: Collection, logger: BaseLogger) {
        super(logger);
        this.selfBound();
    }

    private selfBound() {
        this.initArchive = this.initArchive.bind(this);
    }

    async initArchive() {
        const rawConfigs = this.getArchiveConfigs();

        for await (const rawConfig of rawConfigs) {
            const config = parseArchiveConfig(rawConfig);
            this.emit<"ARCHIVE">("ARCHIVE", config);
        }
    }

    private getArchiveConfigs() {
        return this.archiveConfigCollection.find<SchemaArchiveConfig>({}, { projection: { _id: 0 } });
    }

    subscribe(publisher: Scheduler) {
        return super.subscribe(publisher, "RUN_ARCHIVE", this.initArchive);
    }

    unsubscribe(publisher: Scheduler) {
        return super.unsubscribe(publisher, "RUN_ARCHIVE", this.initArchive);
    }
}

import { BaseApp } from "@ldb/base-app";
import type { BaseLogger } from "@ldb/logger";
import type { Scheduler } from "@ldb/scheduler";
import { name, version } from "./metadata.js";
import { MultipleArchiver } from "./modules/archivers/multiple-archiver.js";
import { SingleArchiver } from "./modules/archivers/single-archiver.js";
import type { ArchiveInitiator } from "./modules/initiators/archive-initiator.js";
import { ArchiveProcessor } from "./modules/processors/archive-processor.js";
import { ArchiveStatusUpdater } from "./modules/status-updaters/archive-status-updater.js";
import type { SchedulerKeys } from "./types/scheduler.js";

export class App extends BaseApp {
    constructor(
        private readonly scheduler: Scheduler<SchedulerKeys>,
        private readonly archiveInitiator: ArchiveInitiator,
        private readonly archiveProcessor: ArchiveProcessor,
        private readonly singleArchiver: SingleArchiver,
        private readonly multipleArchiver: MultipleArchiver,
        private readonly archiveStatusUpdater: ArchiveStatusUpdater,
        logger: BaseLogger,
    ) {
        super({ name, version }, logger);
    }

    initiate() {
        this.archiveStatusUpdater.subscribe(this.singleArchiver);
        this.archiveStatusUpdater.subscribe(this.multipleArchiver);

        this.singleArchiver.subscribe(this.archiveProcessor);
        this.multipleArchiver.subscribe(this.archiveProcessor);

        this.archiveProcessor.subscribe(this.archiveInitiator);

        this.archiveInitiator.subscribe(this.scheduler);

        super.initiate();
    }

    terminate() {
        this.archiveInitiator.unsubscribe(this.scheduler);

        this.archiveProcessor.unsubscribe(this.archiveInitiator);

        this.singleArchiver.unsubscribe(this.archiveProcessor);
        this.multipleArchiver.unsubscribe(this.archiveProcessor);

        this.archiveStatusUpdater.unsubscribe(this.singleArchiver);
        this.archiveStatusUpdater.unsubscribe(this.multipleArchiver);

        super.terminate();
    }
}

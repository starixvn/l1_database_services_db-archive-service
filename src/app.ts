import type { BaseLogger } from "@ldb/base-logger";
import type { Scheduler } from "@ldb/scheduler";
import { name, version } from "./metadata.js";
import { MultipleArchiver } from "./modules/archivers/multiple-archiver.js";
import { SingleArchiver } from "./modules/archivers/single-archiver.js";
import type { ArchiveInitiator } from "./modules/initiators/archive-initiator.js";
import { ArchiveProcessor } from "./modules/processors/archive-processor.js";
import { ArchiveStatusUpdater } from "./modules/status-updaters/archive-status-updater.js";

let exiting = false;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class App {
    constructor(
        private readonly scheduler: Scheduler,
        private readonly archiveInitiator: ArchiveInitiator,
        private readonly archiveProcessor: ArchiveProcessor,
        private readonly singleArchiver: SingleArchiver,
        private readonly multipleArchiver: MultipleArchiver,
        private readonly archiveStatusUpdater: ArchiveStatusUpdater,
        private readonly logger: BaseLogger
    ) {
        this.selfBound();
        this.handleExceptions();
    }

    get className() {
        return this.constructor.name;
    }

    private selfBound() {
        this.handleUncaughtException = this.handleUncaughtException.bind(this);
        this.handleUnhandledRejection = this.handleUnhandledRejection.bind(this);
    }

    private handleExceptions() {
        process.addListener("uncaughtException", this.handleUncaughtException);
        process.addListener("unhandledRejection", this.handleUnhandledRejection);
    }

    private async handleUncaughtException(error: Error, origin: NodeJS.UncaughtExceptionOrigin) {
        while (exiting) {
            await wait(1_000);
        }

        exiting = true;
        this.logger.logFatal({ title: name, message: error }, { tags: { event: "uncaughtException" }, extra: { error, origin } });

        await wait(5_000);
        process.exit(10);
    }

    private async handleUnhandledRejection(reason: unknown, promise: Promise<unknown>) {
        while (exiting) {
            await wait(5_000);
        }

        exiting = true;
        this.logger.logFatal({ title: name, message: reason }, { tags: { event: "unhandledRejection" }, extra: { reason, promise } });

        await wait(5_000);
        process.exit(20);
    }

    initiate() {
        this.archiveStatusUpdater.subscribe(this.singleArchiver);
        this.archiveStatusUpdater.subscribe(this.multipleArchiver);

        this.singleArchiver.subscribe(this.archiveProcessor);
        this.multipleArchiver.subscribe(this.archiveProcessor);

        this.archiveProcessor.subscribe(this.archiveInitiator);

        this.archiveInitiator.subscribe(this.scheduler);

        this.logger.logWarning({ title: `${name}@${version}`, message: "App has been started." });
    }
}

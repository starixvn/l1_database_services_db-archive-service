import type { BaseLogger } from "@ldb/base-logger";
import type { Scheduler } from "@ldb/scheduler";
import { name, version } from "./metadata.js";
import type { ArchiveInitiator } from "./modules/archive-initiator.js";
import { ArchiveProcessor } from "./modules/archive-processor.js";
import { ArchiveStatusUpdater } from "./modules/archive-status-updater.js";
import { MultipleArchiver } from "./modules/multiple-archiver.js";
import { SingleArchiver } from "./modules/single-archiver.js";

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
        if (exiting) {
            await wait(2000);
        }

        exiting = true;
        this.logger.logFatal({ title: name, message: error }, { tags: { event: "uncaughtException" }, extra: { error, origin } });

        await wait(1000);
        process.exit(10);
    }

    private async handleUnhandledRejection(reason: unknown, promise: Promise<unknown>) {
        if (exiting) {
            await wait(2000);
        }

        exiting = true;
        this.logger.logFatal({ title: name, message: reason }, { tags: { event: "unhandledRejection" }, extra: { reason, promise } });

        await wait(1000);
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

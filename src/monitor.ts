import { Scheduler } from "@ldb/scheduler";
import { stringify, waitMs } from "@ldb/utils";
import { logger, terminal } from "./loggers";
import { ArchiveInitiator } from "./modules/archive-initiator";
import { ArchiveProcessor } from "./modules/archive-processor";
import { ArchiveStatusUpdater } from "./modules/archive-status-updater";
import { DataArchiver } from "./modules/data-archiver";

export class Monitor {
    constructor(
        private readonly nodeEnv: string,
        private readonly scheduler: Scheduler,
        private readonly archiveInitiator: ArchiveInitiator,
        private readonly archiveProcessor: ArchiveProcessor,
        private readonly dataArchiver: DataArchiver,
        private readonly archiveStatusUpdater: ArchiveStatusUpdater
    ) {
        this.selfBound();
        this.reportUnhandleErrors();
    }

    private get className() {
        return this.constructor.name;
    }

    private selfBound() {
        this.handleUncaughtException = this.handleUncaughtException.bind(this);
        this.handleUnhandledRejection = this.handleUnhandledRejection.bind(this);
    }

    private reportUnhandleErrors() {
        process.addListener("uncaughtException", this.handleUncaughtException);
        process.addListener("unhandledRejection", this.handleUnhandledRejection);
    }
    private async handleUncaughtException(error: Error, origin: NodeJS.UncaughtExceptionOrigin) {
        logger.logError(origin, error);

        await waitMs(5000);
        process.exit(10);
    }
    private async handleUnhandledRejection(reason: unknown, promise: Promise<unknown>) {
        logger.logError("unhandledRejection", reason, { promise });

        await waitMs(5000);
        process.exit(20);
    }

    async run() {
        this.archiveInitiator.subscribe(this.scheduler);
        this.archiveProcessor.subscribe(this.archiveInitiator);
        this.dataArchiver.subscribe(this.archiveProcessor);
        this.archiveStatusUpdater.subscribe(this.dataArchiver);

        if (this.nodeEnv === "DEVELOPMENT") {
            await this.devMode();
        }
        terminal.logInfo("", { title: this.className, subject: "The monitor has run!" });
    }

    private async devMode() {
        this.scheduler.on("RUN_ARCHIVE", this.devEventLogger.bind(this, this.scheduler.constructor.name, "RUN_ARCHIVE"));
        this.scheduler.emit("RUN_ARCHIVE");
    }
    private devEventLogger(title: string, subject: string, ...args: unknown[]) {
        terminal.logDebug(args.map((arg) => stringify(arg)).join("\n"), { title, subject });
    }
}

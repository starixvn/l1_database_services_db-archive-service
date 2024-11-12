import { HealthcheckServer } from "@ldb/healthcheck";
import { Logger, SentryLogger, SkynexLogger, TerminalLogger } from "@ldb/logger";
import type { MongoClient } from "@ldb/mongo";
import { Scheduler } from "@ldb/scheduler";
import { asClass, asValue, type AwilixContainer, createContainer, InjectionMode, ResolveOptions } from "awilix";
import {
    environment,
    schedulerConfig,
    healthcheckPort,
    sentryNodeOptions,
    sentryOptions,
    sentrySeverityLevel,
    skynexOptions,
    skynexSeverityLevel,
    terminalSeverityLevel,
} from "./app-configs.js";
import { App } from "./app.js";
import { name, version } from "./metadata.js";
import { MultipleArchiver } from "./modules/archivers/multiple-archiver.js";
import { SingleArchiver } from "./modules/archivers/single-archiver.js";
import { ArchiveInitiator } from "./modules/initiators/archive-initiator.js";
import { ArchiveProcessor } from "./modules/processors/archive-processor.js";
import { ArchiveStatusUpdater } from "./modules/status-updaters/archive-status-updater.js";
import { namespaces } from "./namespaces.js";

export class Container {
    private readonly container: AwilixContainer;

    constructor() {
        this.container = createContainer({ injectionMode: InjectionMode.CLASSIC });
    }

    register() {
        this.registerLoggers().registerScheduler().registerClasses().registerHealthcheck();
        return this;
    }

    private registerLoggers() {
        this.container.register({
            terminalLogger: asClass(TerminalLogger).singleton(),
            terminalSeverityLevel: asValue(terminalSeverityLevel),
        });
        this.container.register({
            skynexLogger: asClass(SkynexLogger).singleton(),
            skynexOptions: asValue(skynexOptions),
            skynexSeverityLevel: asValue(skynexSeverityLevel),
        });
        this.container.register({
            sentryLogger: asClass(SentryLogger).singleton(),
            sentryNodeOptions: asValue(sentryNodeOptions),
            sentryOptions: asValue(sentryOptions),
            sentrySeverityLevel: asValue(sentrySeverityLevel),
        });
        this.container.register({
            logger: asClass(Logger).singleton(),
            otherLoggers: asValue(null),
            environment: asValue(environment),
        });
        return this;
    }

    private registerScheduler() {
        this.container.register({
            scheduler: asClass(Scheduler).singleton(),
            schedulerConfig: asValue(schedulerConfig),
        });
        return this;
    }

    private registerClasses() {
        this.container.register({
            app: asClass(App).singleton(),
            archiveInitiator: asClass(ArchiveInitiator).singleton(),
            archiveProcessor: asClass(ArchiveProcessor).singleton(),
            singleArchiver: asClass(SingleArchiver).singleton(),
            multipleArchiver: asClass(MultipleArchiver).singleton(),
            archiveStatusUpdater: asClass(ArchiveStatusUpdater).singleton(),
        });
        return this;
    }

    private registerHealthcheck() {
        this.container.register({
            healthcheckServer: asClass(HealthcheckServer).singleton(),
            metadata: asValue({ name, version }),
            healthcheckPort: asValue(healthcheckPort),
        });
        return this;
    }

    registerDatabases(sourceMongo: MongoClient, targetMongo: MongoClient) {
        this.container.register({
            sourceMongo: asValue(sourceMongo),
            targetMongo: asValue(targetMongo),
        });

        for (const [name, { db, coll }] of Object.entries(namespaces)) {
            this.container.register({
                [name]: asValue(sourceMongo.db(db).collection(coll)),
            });
        }

        return this;
    }

    resolve<N extends string>(name: N, resolveOptions?: ResolveOptions) {
        return this.container.resolve(name, resolveOptions);
    }
}

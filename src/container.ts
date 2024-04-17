import { Logger } from "@ldb/logger";
import { Scheduler } from "@ldb/scheduler";
import { SentryLogger } from "@ldb/sentry-logger";
import { SkynexLogger } from "@ldb/skynex-logger";
import { TerminalLogger } from "@ldb/terminal-logger";
import { asClass, asValue, type AwilixContainer, createContainer, InjectionMode, ResolveOptions } from "awilix";
import type { MongoClient } from "mongodb";
import {
    environment,
    eventConfigs,
    healthcheckPort,
    sentryNodeOptions,
    sentryOptions,
    sentrySeverityLevel,
    skynexOptions,
    skynexSeverityLevel,
    terminalSeverityLevel,
} from "./app-configs.js";
import { App } from "./app.js";
import { HealthcheckServer } from "./healthcheck/server.js";
import { ArchiveInitiator } from "./modules/archive-initiator.js";
import { ArchiveProcessor } from "./modules/archive-processor.js";
import { ArchiveStatusUpdater } from "./modules/archive-status-updater.js";
import { MultipleArchiver } from "./modules/multiple-archiver.js";
import { SingleArchiver } from "./modules/single-archiver.js";
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
            eventConfigs: asValue(eventConfigs),
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

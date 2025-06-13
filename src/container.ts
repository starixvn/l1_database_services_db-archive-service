import { asClass, asValue, BaseContainer } from "@ldb/base-container";
import type { MongoClient } from "@ldb/mongo";
import { archiveStatusCollectionName, healthcheckPort, lumiLoggerConfig, schedulerConfig } from "./app-configs.js";
import { App } from "./app.js";
import { metadata } from "./metadata.js";
import { MultipleArchiver } from "./modules/archivers/multiple-archiver.js";
import { SingleArchiver } from "./modules/archivers/single-archiver.js";
import { ArchiveInitiator } from "./modules/initiators/archive-initiator.js";
import { ArchiveProcessor } from "./modules/processors/archive-processor.js";
import { ArchiveStatusUpdater } from "./modules/status-updaters/archive-status-updater.js";
import { namespaces } from "./namespaces.js";

export class Container extends BaseContainer {
    constructor() {
        super();
    }

    register() {
        this.registerLogger(lumiLoggerConfig).registerScheduler(schedulerConfig).registerHealthcheck(metadata, healthcheckPort).registerClasses();
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

    registerDatabases(sourceMongo: MongoClient, targetMongo: MongoClient) {
        this.container.register({
            sourceMongo: asValue(sourceMongo),
            archiveStatusMongo: asValue(sourceMongo),
            targetMongo: asValue(targetMongo),
        });

        for (const [name, { db, coll }] of Object.entries(namespaces)) {
            this.container.register({
                [name]: asValue(sourceMongo.db(db).collection(coll)),
            });
        }

        this.container.register({
            archiveStatusCollectionName: asValue(archiveStatusCollectionName),
        });

        return this;
    }
}

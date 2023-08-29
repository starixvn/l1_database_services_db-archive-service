import { Scheduler, SchedulerConfigs } from "@ldb/scheduler";
import { AwilixContainer, InjectionMode, ResolveOptions, asClass, asValue, createContainer } from "awilix";
import { ChangeStreamNameSpace, MongoClient } from "mongodb";
import { ArchiveInitiator } from "./modules/archive-initiator";
import { ArchiveProcessor } from "./modules/archive-processor";
import { ArchiveStatusUpdater } from "./modules/archive-status-updater";
import { DataArchiver } from "./modules/data-archiver";
import { Monitor } from "./monitor";

export class ContainerRegistry {
    private readonly container: AwilixContainer;

    constructor(defaultInjectionMode: typeof InjectionMode.CLASSIC = InjectionMode.CLASSIC) {
        this.container = createContainer({ injectionMode: defaultInjectionMode });
    }

    register(sourceMongoClient: MongoClient, targetMongoClient: MongoClient) {
        this.container.register({
            sourceMongoClient: asValue(sourceMongoClient),
            targetMongoClient: asValue(targetMongoClient),
        });

        this.registerClasses();
        this.registerEnv();

        return this;
    }

    registerScheduler(eventConfigs: SchedulerConfigs) {
        this.container.register({
            scheduler: asClass(Scheduler).singleton(),
            eventConfigs: asValue(eventConfigs),
        });

        return this;
    }

    registerNamespaces(namespaces: Record<string, ChangeStreamNameSpace>): this {
        const mongoClient: MongoClient = this.container.resolve("sourceMongoClient");

        for (const [name, namespace] of Object.entries(namespaces)) {
            const { db, coll } = namespace;
            this.container.register({
                [name]: asValue(mongoClient.db(db).collection(coll)),
            });
        }

        return this;
    }

    private registerClasses() {
        this.container.register({
            monitor: asClass(Monitor).singleton(),
            archiveInitiator: asClass(ArchiveInitiator).singleton(),
            archiveProcessor: asClass(ArchiveProcessor).singleton(),
            dataArchiver: asClass(DataArchiver).singleton(),
            archiveStatusUpdater: asClass(ArchiveStatusUpdater).singleton(),
        });

        return this;
    }

    private registerEnv() {
        const { NODE_ENV: nodeEnv } = process.env;

        this.container.register({
            nodeEnv: asValue(nodeEnv || "DEVELOPMENT"),
        });

        return this;
    }

    resolve(name: string, resolveOptions?: ResolveOptions) {
        return this.container.resolve(name, resolveOptions);
    }
}

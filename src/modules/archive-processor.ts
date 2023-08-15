import { MaybePromise, TypedEventEmitter } from "@ldb/types";
import { ChangeStreamNameSpace, Document, MongoClient } from "mongodb";
import { logger } from "../loggers";
import { ArchiveConfig, ArchiveStatusConfig } from "../types/archive-config";
import { CopyMultipleCollectionsDataOptions, CopySingleCollectionDataOptions } from "../types/archive-options";
import { ArchiveInitiator } from "./archive-initiator";

type CopyDataEvents = {
    COPY_SINGLE: (
        ...args: [
            number,
            ChangeStreamNameSpace,
            ChangeStreamNameSpace,
            Document,
            CopySingleCollectionDataOptions,
            ArchiveStatusConfig | undefined
        ]
    ) => MaybePromise<void>;
    COPY_MULTIPLE: (
        ...args: [
            number,
            ChangeStreamNameSpace,
            ChangeStreamNameSpace,
            Document,
            CopyMultipleCollectionsDataOptions,
            ArchiveStatusConfig | undefined
        ]
    ) => MaybePromise<void>;
};

export class ArchiveProcessor extends TypedEventEmitter<CopyDataEvents> {
    private emitters: Set<ArchiveInitiator> = new Set();

    constructor(private readonly sourceMongoClient: MongoClient, private readonly targetMongoClient: MongoClient) {
        super();
        this.selfBound();
    }

    get className() {
        return this.constructor.name;
    }

    private selfBound() {
        this.processArchive = this.processArchive.bind(this);
    }

    private async processArchive(archiveConfig: ArchiveConfig) {
        const { childs } = archiveConfig;
        if (!childs.length) {
            this.processSingleCollectionArchive(archiveConfig);
        } else {
            await this.processMultipleCollectionsArchive(archiveConfig);
        }
    }

    private processSingleCollectionArchive(archiveConfig: ArchiveConfig) {
        const {
            id,
            gameConfigs: { name },
            from,
            to,
            alias: { time: timeAlias },
            filter,
            config: { updateOnly },
            log,
        } = archiveConfig;

        const copyDataOptions: CopySingleCollectionDataOptions = { name, updateOnly, timeAlias };

        this.emit("COPY_SINGLE", id, from, to, filter, copyDataOptions, log);
    }

    private async processMultipleCollectionsArchive(archiveConfig: ArchiveConfig) {
        const {
            id,
            gameConfigs,
            from,
            to,
            alias: { time: timeAlias },
            filter,
            config: { localField, updateOnly },
            childs: childArchiveConfigs,
            log,
        } = archiveConfig;

        if (!childArchiveConfigs.length) {
            const error = new TypeError("Childs config must exist in this process!");
            logger.logError(`${this.className}.processDocumentArchive`, error, { gameConfigs });
            return;
        }

        if (!localField) {
            const error = new TypeError("[localField] config must exist in this process!");
            logger.logError(`${this.className}.processDocumentArchive`, error, { gameConfigs });
            return;
        }

        const { name } = gameConfigs;
        const copyDataOptions: CopyMultipleCollectionsDataOptions = { name, updateOnly, timeAlias, localField, childArchiveConfigs };

        this.emit("COPY_MULTIPLE", id, from, to, filter, copyDataOptions, log);
    }

    subscribe(emitter: ArchiveInitiator): boolean {
        if (this.emitters.has(emitter)) {
            logger.logWarning(`${this.className}.subscribe`, "Already subscribed");
            return false;
        }

        this.emitters.add(emitter);
        emitter.addListener("ARCHIVE", this.processArchive);
        return true;
    }

    unsubscribe(emitter: ArchiveInitiator): boolean {
        if (!this.emitters.has(emitter)) {
            logger.logWarning(`${this.className}.unsubscribe`, "Currently unsubscribed");
            return false;
        }

        emitter.removeListener("ARCHIVE", this.processArchive);
        this.emitters.delete(emitter);
        return true;
    }
}

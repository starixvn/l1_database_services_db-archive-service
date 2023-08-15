import { MaybePromise, TypedEventEmitter } from "@ldb/types";
import { AnyBulkWriteOperation, BulkWriteOptions, ChangeStreamNameSpace, Collection, Document, FindOptions, MongoClient, MongoServerError } from "mongodb";
import { logger } from "../loggers";
import { ArchiveStatusConfig } from "../types/archive-config";
import { CopyMultipleCollectionsDataOptions, CopySingleCollectionDataOptions } from "../types/archive-options";
import { getNamespaceString } from "../utils/mongodb-helpers";
import { ArchiveProcessor } from "./archive-processor";

type DataArchiverEvents = {
    UPDATE_ARCHIVE_STATUS: (...args: [ChangeStreamNameSpace, Document, ArchiveStatusConfig]) => MaybePromise<void>;
};

const BULK_WRITE_THRESHOLD = 1_000;

/** Listen for signal from `ArchiveProcess` to execute data archive process */
export class DataArchiver extends TypedEventEmitter<DataArchiverEvents> {
    private readonly emitters: Set<ArchiveProcessor> = new Set();

    private readonly archiveFlag: Map<string, boolean> = new Map();

    constructor(private readonly sourceMongoClient: MongoClient, private readonly targetMongoClient: MongoClient) {
        super();
        this.selfBound();
    }

    get className() {
        return this.constructor.name;
    }

    private selfBound() {
        this.copySingle = this.copySingle.bind(this);
        this.copyMultiple = this.copyMultiple.bind(this);
    }

    private getSourceCollection(namespace: ChangeStreamNameSpace) {
        const { db, coll } = namespace;
        return this.sourceMongoClient.db(db).collection(coll);
    }

    private getTargetCollection(namespace: ChangeStreamNameSpace) {
        const { db, coll } = namespace;
        return this.targetMongoClient.db(db).collection(coll);
    }

    private async copySingle(
        id: number,
        sourceNamespace: ChangeStreamNameSpace,
        targetNamespace: ChangeStreamNameSpace,
        filter: Document,
        dataOptions: CopySingleCollectionDataOptions,
        archiveStatusOptions?: ArchiveStatusConfig
    ) {
        const { db: sourceDb, coll: sourceColl } = sourceNamespace;
        const { db: targetDb, coll: targetColl } = targetNamespace;

        const flagName = `#${id} [${sourceDb}.${sourceColl}] => [${targetDb}.${targetColl}]`;
        const flag = this.archiveFlag.get(flagName);

        if (flag) {
            logger.logWarning(this.className, `Archive process ${flagName} is running!`);
            return;
        }

        try {
            this.archiveFlag.set(flagName, true);
            await this.copySingleCollectionData(sourceNamespace, targetNamespace, filter, dataOptions, archiveStatusOptions);
        } finally {
            this.archiveFlag.set(flagName, false);
        }
    }

    private async copyMultiple(
        id: number,
        sourceNamespace: ChangeStreamNameSpace,
        targetNamespace: ChangeStreamNameSpace,
        filter: Document,
        dataOptions: CopyMultipleCollectionsDataOptions,
        archiveStatusOptions?: ArchiveStatusConfig
    ) {
        const { db: sourceDb, coll: sourceColl } = sourceNamespace;
        const { db: targetDb, coll: targetColl } = targetNamespace;

        const flagName = `#${id} [${sourceDb}.${sourceColl}] => [${targetDb}.${targetColl}]`;
        const flag = this.archiveFlag.get(flagName);

        if (flag) {
            logger.logWarning(this.className, `Archive process ${flagName} is running!`);
            return;
        }

        try {
            this.archiveFlag.set(flagName, true);
            await this.copyMultipleCollectionData(sourceNamespace, targetNamespace, filter, dataOptions, archiveStatusOptions);
        } finally {
            this.archiveFlag.set(flagName, false);
        }
    }

    private async copySingleCollectionData(
        sourceNamespace: ChangeStreamNameSpace,
        targetNamespace: ChangeStreamNameSpace,
        filter: Document,
        dataOptions: CopySingleCollectionDataOptions,
        archiveStatusOptions?: ArchiveStatusConfig
    ) {
        const sourceCollection = this.getSourceCollection(sourceNamespace);
        const targetCollection = this.getTargetCollection(targetNamespace);

        const { name, updateOnly, timeAlias } = dataOptions;

        this.emitUpdateArchiveStatus(targetNamespace, { name }, archiveStatusOptions);

        const cursor = sourceCollection.find(filter, { noCursorTimeout: true });

        let copyDataOperations: AnyBulkWriteOperation[] = [];
        let updateStatusOperations: AnyBulkWriteOperation[] = [];

        for await (const document of cursor) {
            const { _id, ...data } = document;

            let eventtime = new Date(Date.parse(data[timeAlias]));
            eventtime = isNaN(eventtime.valueOf()) ? new Date() : eventtime;

            updateOnly ||
                copyDataOperations.push({
                    updateOne: {
                        filter: { _id },
                        update: { $set: data },
                        upsert: true,
                    },
                });
            updateStatusOperations.push({
                updateOne: {
                    filter: { _id },
                    update: { $set: { "__archive.eventtime": eventtime } },
                },
            });

            if (copyDataOperations.length >= BULK_WRITE_THRESHOLD || updateStatusOperations.length >= BULK_WRITE_THRESHOLD) {
                updateOnly || (await this.executeBulkWrite(targetCollection, copyDataOperations));
                await this.executeBulkWrite(sourceCollection, updateStatusOperations);

                copyDataOperations = [];
                updateStatusOperations = [];
            }
        }
        if (!updateOnly && copyDataOperations.length > 0) {
            await this.executeBulkWrite(targetCollection, copyDataOperations);
        }
        if (updateStatusOperations.length > 0) {
            await this.executeBulkWrite(sourceCollection, updateStatusOperations);
        }

        this.emitUpdateArchiveStatus(targetNamespace, { name }, archiveStatusOptions);
    }

    private async copyMultipleCollectionData(
        sourceNamespace: ChangeStreamNameSpace,
        targetNamespace: ChangeStreamNameSpace,
        parentFilter: Document,
        dataOptions: CopyMultipleCollectionsDataOptions,
        archiveStatusOptions?: ArchiveStatusConfig
    ) {
        const { name, updateOnly, timeAlias, localField, childArchiveConfigs } = dataOptions;

        this.emitUpdateArchiveStatus(targetNamespace, { name }, archiveStatusOptions);

        const copyDataOperations: Map<string, AnyBulkWriteOperation[]> = new Map();
        const updateStatusOperations: Map<string, AnyBulkWriteOperation[]> = new Map();

        for (const { from, to, log: childArchiveStatusOptions } of childArchiveConfigs) {
            this.emitUpdateArchiveStatus(to, { name }, childArchiveStatusOptions);

            copyDataOperations.set(getNamespaceString(to), []);
            updateStatusOperations.set(getNamespaceString(from), []);
        }

        const sourceCollection = this.getSourceCollection(sourceNamespace);
        const targetCollection = this.getTargetCollection(targetNamespace);
        let parentCopyDataOperations: AnyBulkWriteOperation[] = [];
        let parentUpdateStatusOperations: AnyBulkWriteOperation[] = [];

        const findOptions: FindOptions = { noCursorTimeout: true };
        const parentDataCursor = sourceCollection.find(parentFilter, findOptions);

        for await (const parentDocument of parentDataCursor) {
            const { _id, ...data } = parentDocument;

            let eventtime = new Date(Date.parse(data[timeAlias]));
            eventtime = isNaN(eventtime.valueOf()) ? new Date() : eventtime;

            for (const childArchiveConfig of childArchiveConfigs) {
                const {
                    from,
                    to,
                    filter: childFilter,
                    config: { foreignField, updateOnly: childUpdateOnly },
                } = childArchiveConfig;

                const fromNamespace = getNamespaceString(from);
                const toNamespace = getNamespaceString(to);
                const fromCollection = this.getSourceCollection(from);
                const toCollection = this.getTargetCollection(to);

                const filter = { ...childFilter, [foreignField]: data[localField] };
                const childDataCursor = fromCollection.find(filter, findOptions);

                for await (const childDocument of childDataCursor) {
                    const { _id: _idChild, ...dataChild } = childDocument;

                    const childCopyDataOperations = this.ensureMapGet(copyDataOperations, fromNamespace, []);
                    const childUpdateStatusOperations = this.ensureMapGet(updateStatusOperations, toNamespace, []);

                    childUpdateOnly ||
                        childCopyDataOperations.push({
                            updateOne: {
                                filter: { _id: _idChild },
                                update: { $set: dataChild },
                                upsert: true,
                            },
                        });
                    childUpdateStatusOperations.push({
                        updateOne: {
                            filter: { _id: _idChild },
                            update: { $set: { "__archive.eventtime": eventtime } },
                        },
                    });

                    if (childCopyDataOperations.length >= BULK_WRITE_THRESHOLD || childUpdateStatusOperations.length >= BULK_WRITE_THRESHOLD) {
                        childUpdateOnly || (await this.executeBulkWrite(toCollection, childCopyDataOperations));
                        await this.executeBulkWrite(fromCollection, childUpdateStatusOperations);

                        copyDataOperations.set(fromNamespace, []);
                        updateStatusOperations.set(toNamespace, []);
                    }
                }
            }

            updateOnly ||
                parentCopyDataOperations.push({
                    updateOne: {
                        filter: { _id },
                        update: { $set: data },
                        upsert: true,
                    },
                });
            parentUpdateStatusOperations.push({
                updateOne: {
                    filter: { _id },
                    update: { $set: { "__archive.eventtime": eventtime } },
                },
            });

            if (parentCopyDataOperations.length >= BULK_WRITE_THRESHOLD || parentUpdateStatusOperations.length >= BULK_WRITE_THRESHOLD) {
                updateOnly || (await this.executeBulkWrite(targetCollection, parentCopyDataOperations));
                await this.executeBulkWrite(sourceCollection, parentUpdateStatusOperations);

                parentCopyDataOperations = [];
                parentUpdateStatusOperations = [];
            }
        }

        for (const childArchiveConfig of childArchiveConfigs) {
            const {
                from,
                to,
                config: { updateOnly: childUpdateOnly },
                log: childArchiveStatusOptions,
            } = childArchiveConfig;

            const fromCollection = this.getSourceCollection(from);
            const toCollection = this.getTargetCollection(to);

            const childCopyDataOperations = this.ensureMapGet(copyDataOperations, getNamespaceString(to), []);
            const childUpdateStatusOperations = this.ensureMapGet(updateStatusOperations, getNamespaceString(from), []);

            if (!childUpdateOnly && childCopyDataOperations.length > 0) {
                await this.executeBulkWrite(toCollection, childCopyDataOperations);
            }
            if (childUpdateStatusOperations.length > 0) {
                await this.executeBulkWrite(fromCollection, childUpdateStatusOperations);
            }

            this.emitUpdateArchiveStatus(to, { name }, childArchiveStatusOptions);
        }

        if (!updateOnly && parentCopyDataOperations.length > 0) {
            await this.executeBulkWrite(targetCollection, parentCopyDataOperations);
        }
        if (parentUpdateStatusOperations.length > 0) {
            await this.executeBulkWrite(sourceCollection, parentUpdateStatusOperations);
        }

        this.emitUpdateArchiveStatus(targetNamespace, { name }, archiveStatusOptions);
    }

    private ensureMapGet<K, V>(mapObject: Map<K, V>, key: K, defaultValue: V) {
        const returnValue = mapObject.get(key);

        if (returnValue) {
            return returnValue;
        } else {
            mapObject.set(key, defaultValue);
            return defaultValue;
        }
    }

    private emitUpdateArchiveStatus(targetNamespace: ChangeStreamNameSpace, filter: Document, archiveStatusOptions: ArchiveStatusConfig | undefined): void {
        if (archiveStatusOptions) {
            this.emit("UPDATE_ARCHIVE_STATUS", targetNamespace, filter, archiveStatusOptions);
        }
    }

    private async executeBulkWrite(collection: Collection, bulkWriteOperations: AnyBulkWriteOperation[]) {
        try {
            const bulkWriteOptions: BulkWriteOptions = { ordered: false, willRetryWrite: true, retryWrites: true };
            const bulkWriteResult = await collection.bulkWrite(bulkWriteOperations, bulkWriteOptions);
            const { ok, matchedCount, upsertedCount, modifiedCount } = bulkWriteResult;
            logger.logDebug({ ok, matchedCount, upsertedCount, modifiedCount }, { title: `${this.className}.bulkWrite`, subject: collection.namespace });
        } catch (error: unknown) {
            this.handleError(error);
        }
    }

    private handleError(error: unknown): never {
        logger.logError(this.className, error);

        if (error instanceof MongoServerError) {
            return this.handleMongoServerError(error);
        }
        throw error;
    }

    private handleMongoServerError(error: MongoServerError): never {
        throw error;
    }

    subscribe(emitter: ArchiveProcessor): boolean {
        if (this.emitters.has(emitter)) {
            logger.logWarning(`${this.className}.subscribe`, "Already subscribed");
            return false;
        }

        this.emitters.add(emitter);
        emitter.addListener<"COPY_SINGLE">("COPY_SINGLE", this.copySingle);
        emitter.addListener<"COPY_MULTIPLE">("COPY_MULTIPLE", this.copyMultiple);
        return true;
    }

    unsubscribe(emitter: ArchiveProcessor): boolean {
        if (!this.emitters.has(emitter)) {
            logger.logWarning(`${this.className}.unsubscribe`, "Currently unsubscribed");
            return false;
        }

        emitter.removeListener<"COPY_SINGLE">("COPY_SINGLE", this.copySingle);
        emitter.removeListener<"COPY_MULTIPLE">("COPY_MULTIPLE", this.copyMultiple);
        this.emitters.delete(emitter);
        return true;
    }
}

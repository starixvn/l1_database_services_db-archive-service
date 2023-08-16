import { MaybePromise, TypedEventEmitter } from "@ldb/types";
import { BulkWriteOptions, ChangeStreamNameSpace, Document, FindOptions, MongoClient } from "mongodb";
import { logger } from "../loggers";
import { ArchiveStatusConfig } from "../types/archive-config";
import { CopyMultipleCollectionsDataOptions, CopySingleCollectionDataOptions } from "../types/archive-options";
import { getNamespaceString } from "../utils/mongodb-helpers";
import { ensureTime } from "../utils/time-utils";
import { ArchiveProcessor } from "./archive-processor";
import { CollectionBulkWriter } from "./collection-bulk-writer";
import { MapAssert } from "./map-assert";

type DataArchiverEvents = {
    UPDATE_ARCHIVE_STATUS: (...args: [ChangeStreamNameSpace, Document, ArchiveStatusConfig]) => MaybePromise<void>;
};

/** Listen for signal from `ArchiveProcess` to execute data archive process */
export class DataArchiver extends TypedEventEmitter<DataArchiverEvents> {
    private readonly emitters: Set<ArchiveProcessor> = new Set();

    private readonly archiveFlag: Map<string, boolean> = new Map();

    constructor(private readonly sourceMongoClient: MongoClient, private readonly targetMongoClient: MongoClient) {
        super();
        this.selfBound();
    }

    get className() {
        return "DataArchiver";
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

        const bulkWriteOptions: BulkWriteOptions = { ordered: false, willRetryWrite: true, retryWrites: true };
        const copyDataOperations = new CollectionBulkWriter(targetCollection, bulkWriteOptions);
        const updateStatusOperations = new CollectionBulkWriter(sourceCollection, bulkWriteOptions);

        for await (const document of cursor) {
            const { _id, ...data } = document;

            const eventtime = ensureTime(data[timeAlias]);

            copyDataOperations.push({ updateOne: { filter: { _id }, update: { $set: data }, upsert: true } }, updateOnly);
            updateStatusOperations.push({ updateOne: { filter: { _id }, update: { $set: { "__archive.eventtime": eventtime } } } });

            const isThresholdReached = updateStatusOperations.isThresholdReached() || copyDataOperations.isThresholdReached();
            copyDataOperations.write(!updateOnly && isThresholdReached);
            updateStatusOperations.write(isThresholdReached);
        }

        await copyDataOperations.write(!updateOnly, 1);
        await updateStatusOperations.write(true, 1);

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

        const sourceCollection = this.getSourceCollection(sourceNamespace);
        const targetCollection = this.getTargetCollection(targetNamespace);

        const bulkWriteOptions: BulkWriteOptions = { ordered: false, willRetryWrite: true, retryWrites: true };
        const parentCopyDataOperations = new CollectionBulkWriter(targetCollection, bulkWriteOptions);
        const parentUpdateStatusOperations = new CollectionBulkWriter(sourceCollection, bulkWriteOptions);

        const copyDataOperations: MapAssert<string, CollectionBulkWriter> = new MapAssert();
        const updateStatusOperations: MapAssert<string, CollectionBulkWriter> = new MapAssert();

        for (const { from, to, log: childArchiveStatusOptions } of childArchiveConfigs) {
            this.emitUpdateArchiveStatus(to, { name }, childArchiveStatusOptions);

            const fromCollection = this.getSourceCollection(from);
            const toCollection = this.getTargetCollection(to);
            copyDataOperations.set(getNamespaceString(from), new CollectionBulkWriter(toCollection, bulkWriteOptions));
            updateStatusOperations.set(getNamespaceString(to), new CollectionBulkWriter(fromCollection, bulkWriteOptions));
        }

        const findOptions: FindOptions = { noCursorTimeout: true };
        const parentDataCursor = sourceCollection.find(parentFilter, findOptions);

        for await (const parentDocument of parentDataCursor) {
            const { _id, ...data } = parentDocument;

            const eventtime = ensureTime(data[timeAlias]);

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

                const filter = { ...childFilter, [foreignField]: data[localField] };
                const childDataCursor = fromCollection.find(filter, findOptions);

                for await (const childDocument of childDataCursor) {
                    const { _id: _idChild, ...dataChild } = childDocument;

                    const childCopyDataOperations = copyDataOperations.get(fromNamespace, `Failed to get CollectionBulkWriter for ${fromNamespace}`);
                    const childUpdateStatusOperations = updateStatusOperations.get(toNamespace, `Failed to get CollectionBulkWriter for ${toNamespace}`);

                    childCopyDataOperations.push({ updateOne: { filter: { _id: _idChild }, update: { $set: dataChild }, upsert: true } }, childUpdateOnly);
                    childUpdateStatusOperations.push({ updateOne: { filter: { _id: _idChild }, update: { $set: { "__archive.eventtime": eventtime } } } });

                    const isChildThresholdReached = childUpdateStatusOperations.isThresholdReached() || childCopyDataOperations.isThresholdReached();
                    await childCopyDataOperations.write(!childUpdateOnly && isChildThresholdReached);
                    await childUpdateStatusOperations.write(isChildThresholdReached);
                }
            }

            parentCopyDataOperations.push({ updateOne: { filter: { _id }, update: { $set: data }, upsert: true } }, updateOnly);
            parentUpdateStatusOperations.push({ updateOne: { filter: { _id }, update: { $set: { "__archive.eventtime": eventtime } } } });

            const isParentThresholdReached = parentUpdateStatusOperations.isThresholdReached() || parentCopyDataOperations.isThresholdReached();
            parentCopyDataOperations.write(!updateOnly && isParentThresholdReached);
            parentUpdateStatusOperations.write(isParentThresholdReached);
        }

        for (const childArchiveConfig of childArchiveConfigs) {
            const {
                from,
                to,
                config: { updateOnly: childUpdateOnly },
                log: childArchiveStatusOptions,
            } = childArchiveConfig;

            const childCopyDataOperations = copyDataOperations.get(getNamespaceString(from), `Failed to get CollectionBulkWriter for ${getNamespaceString(from)}`);
            const childUpdateStatusOperations = updateStatusOperations.get(getNamespaceString(to), `Failed to get CollectionBulkWriter for ${getNamespaceString(to)}`);

            await childCopyDataOperations.write(!childUpdateOnly, 1);
            await childUpdateStatusOperations.write(true, 1);

            this.emitUpdateArchiveStatus(to, { name }, childArchiveStatusOptions);
        }

        await parentCopyDataOperations.write(!updateOnly, 1);
        await parentUpdateStatusOperations.write(true, 1);

        this.emitUpdateArchiveStatus(targetNamespace, { name }, archiveStatusOptions);
    }

    private emitUpdateArchiveStatus(targetNamespace: ChangeStreamNameSpace, filter: Document, archiveStatusOptions: ArchiveStatusConfig | undefined): void {
        if (archiveStatusOptions) {
            this.emit("UPDATE_ARCHIVE_STATUS", targetNamespace, filter, archiveStatusOptions);
        }
    }

    subscribe(emitter: ArchiveProcessor): boolean {
        if (this.emitters.has(emitter)) {
            logger.logWarning(`${this.className}.subscribe`, "Already subscribed");
            return false;
        }

        this.emitters.add(emitter);
        emitter.addListener("COPY_SINGLE", this.copySingle);
        emitter.addListener("COPY_MULTIPLE", this.copyMultiple);
        return true;
    }

    unsubscribe(emitter: ArchiveProcessor): boolean {
        if (!this.emitters.has(emitter)) {
            logger.logWarning(`${this.className}.unsubscribe`, "Currently unsubscribed");
            return false;
        }

        emitter.removeListener("COPY_SINGLE", this.copySingle);
        emitter.removeListener("COPY_MULTIPLE", this.copyMultiple);
        this.emitters.delete(emitter);
        return true;
    }
}

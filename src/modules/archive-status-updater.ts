import type { BaseLogger } from "@ldb/base-logger";
import type { ChangeStreamNameSpace, Collection, FindOptions, MongoClient, UpdateOptions } from "@ldb/mongo";
import type { ArchiveStatusOptions, CopyMode } from "../types/archive-options.js";
import type { ArchiverEvents, DataArchiver } from "./data-archiver.js";
import { Subscriber } from "./subscriber.js";

const UPDATE_OPTIONS = { upsert: true, willRetryWrite: true, retryWrites: true } as const satisfies UpdateOptions;

export class ArchiveStatusUpdater extends Subscriber<keyof ArchiverEvents, ArchiverEvents, DataArchiver<CopyMode>> {
    constructor(private readonly archiveStatusCollection: Collection, private readonly targetMongo: MongoClient, logger: BaseLogger) {
        super(logger);
        this.selfBound();
    }

    private selfBound() {
        this.updateArchiveStatus = this.updateArchiveStatus.bind(this);
    }

    private getTargetCollection(namespace: ChangeStreamNameSpace) {
        const { db, coll } = namespace;
        return this.targetMongo.db(db).collection(coll);
    }

    private async updateArchiveStatus(archiveStatusOptions: ArchiveStatusOptions) {
        const { target, filter, options } = archiveStatusOptions;
        const { field, value } = options;

        const targetCollection = this.getTargetCollection(target);

        const logValueFindOptions: FindOptions = { projection: { _id: 0, value: `$${value}` }, sort: { [value]: -1 } };
        const logValue = await targetCollection.findOne({}, logValueFindOptions);

        if (!logValue || !logValue.value) {
            this.logger.logDebug({ title: this.className, message: `Skip archive status update on [${targetCollection.namespace}]` }, { extra: { logValue } });
            return;
        }

        const { value: archiveStatusValue } = logValue;
        const { acknowledged, matchedCount, upsertedCount, modifiedCount } = await this.archiveStatusCollection.updateOne(
            filter,
            { $set: { [`lastArcId.${field}`]: archiveStatusValue } },
            UPDATE_OPTIONS
        );

        this.logger.logDebug(
            { title: this.className, message: `${targetCollection.namespace} => ${archiveStatusValue}` },
            { extra: { filter, field, updateResult: `(${acknowledged})  #-${matchedCount}  U-${upsertedCount}  M-${modifiedCount}` } }
        );
    }

    subscribe(publisher: DataArchiver<CopyMode>) {
        return super.subscribe(publisher, "UPDATE_ARCHIVE_STATUS", this.updateArchiveStatus);
    }

    unsubscribe(publisher: DataArchiver<CopyMode>) {
        return super.unsubscribe(publisher, "UPDATE_ARCHIVE_STATUS", this.updateArchiveStatus);
    }
}

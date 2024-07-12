import type { BaseLogger } from "@ldb/base-logger";
import type { ChangeStreamNameSpace, Document, FindOptions, MongoClient } from "@ldb/mongo";
import type { ArchiveStatusConfig } from "../../types/archive-config.js";
import type { ArchiveOptions, ArchiveStatusOptions, CopyMode } from "../../types/archive-options.js";
import { Dispatcher } from "../dispatcher.js";
import type { ArchiveProcessor, ProcessorEvents } from "../processors/archive-processor.js";

export const FIND_OPTIONS = { noCursorTimeout: true } as const satisfies FindOptions;

export type ArchiverEvents = {
    UPDATE_ARCHIVE_STATUS: (c: ArchiveStatusOptions) => Promise<void>;
};

export class DataArchiver<E extends CopyMode> extends Dispatcher<ArchiverEvents, E, ProcessorEvents<E>, ArchiveProcessor> {
    private readonly flags: Map<string, Date> = new Map();

    constructor(private readonly sourceMongo: MongoClient, private readonly targetMongo: MongoClient, logger: BaseLogger) {
        super(logger);
    }

    protected selfBound() {
        this.copyData = this.copyData.bind(this);
    }

    protected getSourceCollection(namespace: ChangeStreamNameSpace) {
        const { db, coll } = namespace;
        return this.sourceMongo.db(db).collection(coll);
    }

    protected getTargetCollection(namespace: ChangeStreamNameSpace) {
        const { db, coll } = namespace;
        return this.targetMongo.db(db).collection(coll);
    }

    protected getFlag(options: ArchiveOptions<E>) {
        const { id, from, to } = options;
        const fromCollection = this.getSourceCollection(from);
        const toCollection = this.getTargetCollection(to);

        return `#${id} [${fromCollection.namespace}] => [${toCollection.namespace}]` as const;
    }

    private async copyData(options: ArchiveOptions<E>) {
        const title = `${this.className}.copyData`;
        const flag = this.getFlag(options);

        const flagValue = this.flags.get(flag);
        if (flagValue) {
            this.logger.logInfo({ title, message: `${flag} is running since ${flagValue.toISOString()}` });
            return;
        }

        try {
            this.flags.set(flag, new Date());
            await this.executeCopy(options);
        } catch (error: unknown) {
            this.logger.logError({ title, message: error }, { extra: { flag, flagValue } });
        } finally {
            this.flags.delete(flag);
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected async executeCopy(options: ArchiveOptions<E>) {}

    protected initUpdateArchiveStatus(target: ChangeStreamNameSpace, filter: Document, options?: ArchiveStatusConfig) {
        if (!options) {
            return;
        }
        this.emit<"UPDATE_ARCHIVE_STATUS">("UPDATE_ARCHIVE_STATUS", { target, filter, options });
    }

    subscribe(publisher: ArchiveProcessor, event: E) {
        return super.subscribe(publisher, event, this.copyData);
    }

    unsubscribe(publisher: ArchiveProcessor, event: E) {
        return super.unsubscribe(publisher, event, this.copyData);
    }
}

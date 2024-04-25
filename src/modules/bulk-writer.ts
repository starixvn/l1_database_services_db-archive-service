import type { BaseLogger } from "@ldb/base-logger";
import type { BulkWriteOptions, Collection, UpdateOneModel } from "@ldb/mongo";

type UpdateOneOperation = { updateOne: UpdateOneModel };

export const BULK_WRITE_OPTIONS = { ordered: false, willRetryWrite: true, retryWrites: true } as const satisfies BulkWriteOptions;

export const BULK_WRITE_THRESHOLD = 1_000 as const;

export class BulkWriter {
    private readonly colls: Map<string, Collection> = new Map();
    private readonly bulks: Map<string, UpdateOneOperation[]> = new Map();

    get className() {
        return this.constructor.name;
    }

    constructor(private readonly logger: BaseLogger) {}

    add(...collections: Collection[]) {
        for (const collection of collections) {
            this.colls.set(collection.namespace, collection);
            this.bulks.set(collection.namespace, []);
        }
    }

    set(collection: Collection, operation: UpdateOneOperation) {
        const bulk = this.bulks.get(collection.namespace);
        if (!bulk) {
            return 0;
        }
        return bulk.push(operation);
    }

    async write(threshold: number = BULK_WRITE_THRESHOLD) {
        let execute = false;

        for (const [, bulk] of this.bulks) {
            if (bulk.length >= threshold) {
                execute = true;
                break;
            }
        }

        if (!execute) {
            return;
        }

        for (const [namespace, bulk] of this.bulks) {
            const colection = this.colls.get(namespace);

            if (!colection || !bulk.length) {
                continue;
            }

            const { ok, matchedCount, insertedCount, modifiedCount, deletedCount, upsertedCount } = await colection.bulkWrite(bulk, BULK_WRITE_OPTIONS);
            this.logger.logDebug({
                title: this.className,
                message: `[${namespace}](${ok})  #-${matchedCount}  I-${insertedCount}  U-${upsertedCount}  M-${modifiedCount}  D-${deletedCount}`,
            });

            this.bulks.set(namespace, []);
        }
    }
}

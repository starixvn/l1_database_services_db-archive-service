import type { BulkWriteOptions, Collection, UpdateOneModel } from "mongodb";

type UpdateOneOperation = { updateOne: UpdateOneModel };

export const BULK_WRITE_OPTIONS = { ordered: false, willRetryWrite: true, retryWrites: true } as const satisfies BulkWriteOptions;

export const BULK_WRITE_THRESHOLD = 10_000 as const;

export class BulkWriter {
    private readonly colls: Map<string, Collection> = new Map();
    private readonly bulks: Map<string, UpdateOneOperation[]> = new Map();

    constructor(...collections: Collection[]) {
        this.add(...collections);
    }

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

            await colection.bulkWrite(bulk, BULK_WRITE_OPTIONS);
            this.bulks.set(namespace, []);
        }
    }
}

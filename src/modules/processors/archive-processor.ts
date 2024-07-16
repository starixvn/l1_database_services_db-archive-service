import type { BaseLogger } from "@ldb/base-logger";
import type { ArchiveConfig } from "../../types/archive-config.js";
import type { ArchiveOptions, CopyDataOptions, CopyMode } from "../../types/archive-options.js";
import { Dispatcher } from "../dispatcher.js";
import type { ArchiveInitiator, InitiatorEvents } from "../initiators/archive-initiator.js";

export type ProcessorEvents<T extends CopyMode> = Record<T, (c: ArchiveOptions<T>) => Promise<void>>;

export class ArchiveProcessor extends Dispatcher<ProcessorEvents<CopyMode>, keyof InitiatorEvents, InitiatorEvents, ArchiveInitiator> {
    constructor(logger: BaseLogger) {
        super(logger);
        this.selfBound();
    }

    private selfBound() {
        this.processArchive = this.processArchive.bind(this);
    }

    private async processArchive(archiveConfig: ArchiveConfig) {
        const { id, gameConfigs, from, to, alias, filterPipeline, config, log, childs } = archiveConfig;
        const { name } = gameConfigs;
        const { time: timeAlias } = alias;
        const { localField, updateOnly } = config;

        if (childs.length === 0) {
            const dataOptions: CopyDataOptions<"SINGLE"> = { name, updateOnly, timeAlias };
            this.emit<"SINGLE">("SINGLE", { id, from, to, filterPipeline, dataOptions, log });
            return;
        }

        if (!localField) {
            const message = new TypeError("[localField] is undefined");
            this.logger.logError({ title: `${this.className}.processArchive`, message }, { extra: { id, gameConfigs, localField } });
            return;
        }

        const dataOptions: CopyDataOptions<"MULTIPLE"> = { name, updateOnly, timeAlias, localField, childs };
        this.emit<"MULTIPLE">("MULTIPLE", { id, from, to, filterPipeline, dataOptions, log });
    }

    subscribe(publisher: ArchiveInitiator) {
        return super.subscribe(publisher, "ARCHIVE", this.processArchive);
    }

    unsubscribe(publisher: ArchiveInitiator) {
        return super.unsubscribe(publisher, "ARCHIVE", this.processArchive);
    }
}

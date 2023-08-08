import { Scheduler } from "@ldb/scheduler";
import { MaybePromise, TypedEventEmitter } from "@ldb/types";
import { EJSON } from "bson";
import { ChangeStreamNameSpace, Collection, Document } from "mongodb";
import { logger } from "../loggers";
import {
    ArchiveConfig,
    ArchiveConfigDetail,
    ChildArchiveConfig,
    ChildArchiveConfigDetail,
    GameConfigInfo,
    SchemaArchiveConfig,
    SchemaChildArchiveConfig,
} from "../types/archive-config";

type ArchiveInitiatorEvents = {
    ARCHIVE: (...args: [ArchiveConfig]) => MaybePromise<void>;
};

export class ArchiveInitiator extends TypedEventEmitter<ArchiveInitiatorEvents> {
    private static getCutoffTime(cutOffsetHours = 0) {
        const hourMs = 3_600_000;
        return new Date(Date.now() + cutOffsetHours * hourMs);
    }

    private static buildFilter(filter?: Document, timeField?: string, cutoffTime?: Date) {
        const parseFilter: Document = { ...filter };

        parseFilter["__archive.eventtime"] = { $exists: false };

        if (timeField && cutoffTime) {
            parseFilter.time = { $lt: cutoffTime };
        }

        return parseFilter;
    }

    protected static parseArchiveConfig(rawConfig: SchemaArchiveConfig): ArchiveConfig {
        const {
            gameConfigs,
            from: { db: fromDb, postfix: fromPostfix },
            to: { db: toDb, postfix: toPostfix },
            alias: alias = { time: "" },
            filter: rawFilter = "{}",
            config: rawConfigDetail = {},
            childs: rawChilds = [],
            ...restConfigs
        } = rawConfig;
        const { name } = gameConfigs;
        const { time } = alias;
        const { cutOffsetHours = 0, localField, updateOnly = false } = rawConfigDetail;

        const from: ChangeStreamNameSpace = { db: fromDb, coll: [name, fromPostfix].filter(Boolean).join("") };
        const to: ChangeStreamNameSpace = { db: toDb, coll: [name, toPostfix].filter(Boolean).join("") };
        const cutoffTime = ArchiveInitiator.getCutoffTime(cutOffsetHours);
        const filter: Document = ArchiveInitiator.buildFilter(EJSON.parse(rawFilter), time, cutoffTime);
        const config: ArchiveConfigDetail = { cutoffTime, localField, updateOnly };
        const childs = ArchiveInitiator.parseChildArchiveConfigs(rawChilds, gameConfigs);

        return { gameConfigs, from, to, alias, filter, config, childs, ...restConfigs };
    }
    protected static parseChildArchiveConfigs(rawChilds: SchemaChildArchiveConfig[], gameConfigs: GameConfigInfo): ChildArchiveConfig[] {
        const { name } = gameConfigs;

        return rawChilds.map((childArchiveConfig): ChildArchiveConfig => {
            const {
                from: { db: fromDb, postfix: fromPostfix },
                to: { db: toDb, postfix: toPostfix },
                filter: rawFilter = "{}",
                config: { foreignField, updateOnly = false },
                ...restConfigs
            } = childArchiveConfig;

            const from: ChangeStreamNameSpace = { db: fromDb, coll: [name, fromPostfix].filter(Boolean).join("") };
            const to: ChangeStreamNameSpace = { db: toDb, coll: [name, toPostfix].filter(Boolean).join("") };
            const filter: Document = ArchiveInitiator.buildFilter(EJSON.parse(rawFilter));
            const config: ChildArchiveConfigDetail = { foreignField, updateOnly };

            return { from, to, filter, config, ...restConfigs };
        });
    }

    protected schedulers: Set<Scheduler> = new Set();

    constructor(private archiveConfigCollection: Collection) {
        super();
        this.archiveConfigCollection = archiveConfigCollection;

        this.selfBound();
    }

    get className(): string {
        return this.constructor.name;
    }

    protected selfBound() {
        this.initialArchiveProcess = this.initialArchiveProcess.bind(this);
    }

    protected getArchiveConfigs() {
        return this.archiveConfigCollection.find<SchemaArchiveConfig>({}, { projection: { _id: 0 } });
    }

    private async initialArchiveProcess() {
        const rawConfigs = this.getArchiveConfigs();

        for await (const rawConfig of rawConfigs) {
            const config = ArchiveInitiator.parseArchiveConfig(rawConfig);
            this.emit("ARCHIVE", config);
        }
    }

    subscribe(scheduler: Scheduler): boolean {
        if (this.schedulers.has(scheduler)) {
            logger.logWarning(`${this.className}.subscribe`, "Already subscribed");
            return false;
        }

        this.schedulers.add(scheduler);
        scheduler.addListener("RUN_ARCHIVE", this.initialArchiveProcess);
        return true;
    }

    unsubscribe(scheduler: Scheduler): boolean {
        if (!this.schedulers.has(scheduler)) {
            logger.logWarning(`${this.className}.unsubscribe`, "Currently unsubscribed");
            return false;
        }

        scheduler.removeListener("RUN_ARCHIVE", this.initialArchiveProcess);
        this.schedulers.delete(scheduler);
        return true;
    }
}

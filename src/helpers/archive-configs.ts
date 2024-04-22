import { EJSON } from "bson";
import type { ChangeStreamNameSpace, Document } from "mongodb";
import type {
    ArchiveConfig,
    ArchiveConfigDetail,
    ChildArchiveConfig,
    ChildArchiveConfigDetail,
    GameConfigInfo,
    SchemaArchiveConfig,
    SchemaChildArchiveConfig,
    SchemaNamespacePostfix,
} from "../types/archive-config.js";

const join = (parts: string[]) => parts.filter(Boolean).join("");

const resolveNamespace = (postfixNamespace: SchemaNamespacePostfix, resolveName: string): ChangeStreamNameSpace => {
    const { db, postfix } = postfixNamespace;
    return { db, coll: join([resolveName, postfix]) };
};

const getCutoffTime = (cutOffsetHours = 0) => {
    const hourMs = 3_600_000;
    return new Date(Date.now() + cutOffsetHours * hourMs);
};

const buildFilter = (filter?: Document, timeField?: string, cutoffTime?: Date) => {
    const parseFilter: Document = { ...filter };

    parseFilter["__archive.eventtime"] = { $exists: false };

    if (timeField && cutoffTime) {
        parseFilter["$expr"] = { $lt: [{ $toDate: `$${timeField}` }, { $literal: cutoffTime }] };
    }

    return parseFilter;
};

export const parseArchiveConfig = (rawConfig: SchemaArchiveConfig): ArchiveConfig => {
    const {
        gameConfigs,
        from: fromPostfix,
        to: toPostfix,
        alias: alias = { time: "" },
        filter: rawFilter = "{}",
        config: rawConfigDetail = {},
        childs: rawChilds = [],
        ...restConfigs
    } = rawConfig;
    const { name } = gameConfigs;
    const { time = "" } = alias;
    const { cutOffsetHours = 0, localField, updateOnly = false } = rawConfigDetail;

    const from = resolveNamespace(fromPostfix, name);
    const to = resolveNamespace(toPostfix, name);
    const cutoffTime = getCutoffTime(cutOffsetHours);
    const filter = buildFilter(EJSON.parse(rawFilter), time, cutoffTime);
    const config: ArchiveConfigDetail = { cutoffTime, localField, updateOnly };
    const childs = parseChildArchiveConfigs(rawChilds, gameConfigs);

    return { gameConfigs, from, to, alias, filter, config, childs, ...restConfigs };
};

const parseChildArchiveConfigs = (rawChilds: SchemaChildArchiveConfig[], gameConfigs: GameConfigInfo): ChildArchiveConfig[] => {
    const { name } = gameConfigs;

    return rawChilds.map((childArchiveConfig): ChildArchiveConfig => {
        const {
            from: fromPostfix,
            to: toPostfix,
            filter: rawFilter = "{}",
            config: { foreignField, updateOnly = false },
            ...restConfigs
        } = childArchiveConfig;

        const from = resolveNamespace(fromPostfix, name);
        const to = resolveNamespace(toPostfix, name);
        const filter = buildFilter(EJSON.parse(rawFilter));
        const config = { foreignField, updateOnly } as const satisfies ChildArchiveConfigDetail;

        return { from, to, filter, config, ...restConfigs };
    });
};

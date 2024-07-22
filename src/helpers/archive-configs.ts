import { EJSON, type ChangeStreamNameSpace } from "@ldb/mongo";
import type {
    ArchiveConfig,
    ArchiveConfigDetail,
    ChildArchiveConfig,
    ChildArchiveConfigDetail,
    ExternalFilter,
    FilterConfigs,
    GameConfigInfo,
    GroupFilter,
    InternalFilter,
    OpsArchiveChildConfig,
    OpsArchiveConfig,
    SchemaNamespacePostfix,
} from "../types/archive-config.js";

const FILTER_LOOKUP_FIELD = "__f" as const;

const join = (parts: string[]) => parts.filter(Boolean).join("");

const resolveNamespace = (postfixNamespace: SchemaNamespacePostfix, resolveName: string): ChangeStreamNameSpace => {
    const { db, postfix } = postfixNamespace;
    return { db, coll: join([resolveName, postfix]) };
};

const getCutoffTime = (cutOffsetHours = 0) => {
    const hourMs = 3_600_000;
    return new Date(Date.now() + cutOffsetHours * hourMs);
};

export const parseArchiveConfig = (rawConfig: OpsArchiveConfig): ArchiveConfig => {
    const {
        gameConfigs,
        from: fromPostfix,
        to: toPostfix,
        alias: alias = { time: "" },
        filterConfigs = { __brand: "none" },
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
    const filterPipeline = buildFilters(filterConfigs, gameConfigs, time, cutoffTime);
    const config: ArchiveConfigDetail = { cutoffTime, localField, updateOnly };
    const childs = parseChildArchiveConfigs(rawChilds, gameConfigs);

    return { gameConfigs, from, to, alias, filterPipeline, config, childs, ...restConfigs };
};

const buildFilters = (filterConfigs: FilterConfigs, gameConfigs: GameConfigInfo, timeField?: string, cutoffTime?: Date) => {
    const { __brand } = filterConfigs;

    const pipeline = [];

    /** Get non-summarized documents */
    pipeline.push({ $match: { "__archive.eventtime": { $exists: false } } });

    /** Cutoff time filter */
    pipeline.push(...filterCutoffTime(timeField, cutoffTime));

    switch (__brand) {
        case "internal":
            pipeline.push(...parseInternalFilter(filterConfigs));
            break;
        case "group":
            pipeline.push(...parseGroupFilter(filterConfigs, gameConfigs));
            break;
        case "external":
            pipeline.push(...parseExternalFilter(filterConfigs));
            break;
    }

    pipeline.push({ $set: { [FILTER_LOOKUP_FIELD]: "$$REMOVE" } });

    return pipeline;
};

const filterCutoffTime = (timeField?: string, cutoffTime?: Date) => {
    if (timeField && cutoffTime) {
        return [{ $match: { $expr: { $lt: [{ $toDate: `$${timeField}` }, { $literal: cutoffTime }] } } }];
    }
    return [];
};
const parseInternalFilter = (filterConfigs: InternalFilter) => {
    const { filterExpr } = filterConfigs;
    return [{ $match: EJSON.parse(filterExpr) }];
};
const parseGroupFilter = (filterConfigs: GroupFilter, gameConfigs: GameConfigInfo) => {
    const { name } = gameConfigs;
    const {
        lookupFrom: { postfix },
        lookupField: { local: localField, foreign: foreignField } = { local: "", foreign: "" },
        let: lookupLet = {},
        pipeline: lookupPipeline,
        filterExpr,
    } = filterConfigs;

    return [
        {
            $lookup: {
                from: name + postfix,
                localField,
                foreignField,
                let: lookupLet,
                pipeline: EJSON.parse(lookupPipeline),
                as: FILTER_LOOKUP_FIELD,
            },
        },
        {
            $unwind: {
                path: `$${FILTER_LOOKUP_FIELD}`,
                preserveNullAndEmptyArrays: true,
            },
        },
        { $match: EJSON.parse(filterExpr) },
    ];
};
const parseExternalFilter = (filterConfigs: ExternalFilter) => {
    const {
        lookupFrom: { coll },
        lookupField: { local: localField, foreign: foreignField } = { local: "", foreign: "" },
        let: lookupLet = {},
        pipeline: lookupPipeline,
        filterExpr,
    } = filterConfigs;

    return [
        {
            $lookup: {
                from: coll,
                localField,
                foreignField,
                let: lookupLet,
                pipeline: EJSON.parse(lookupPipeline),
                as: FILTER_LOOKUP_FIELD,
            },
        },
        {
            $unwind: {
                path: `$${FILTER_LOOKUP_FIELD}`,
                preserveNullAndEmptyArrays: true,
            },
        },
        { $match: EJSON.parse(filterExpr) },
    ];
};

const parseChildArchiveConfigs = (rawChilds: OpsArchiveChildConfig[], gameConfigs: GameConfigInfo): ChildArchiveConfig[] => {
    const { name } = gameConfigs;

    return rawChilds.map((childArchiveConfig): ChildArchiveConfig => {
        const {
            from: fromPostfix,
            to: toPostfix,
            filterConfigs = { __brand: "none" },
            config: { foreignField, updateOnly = false },
            ...restConfigs
        } = childArchiveConfig;

        const from = resolveNamespace(fromPostfix, name);
        const to = resolveNamespace(toPostfix, name);
        const filterPipeline = buildFilters(filterConfigs, gameConfigs);
        const config = { foreignField, updateOnly } as const satisfies ChildArchiveConfigDetail;

        return { from, to, filterPipeline, config, ...restConfigs };
    });
};

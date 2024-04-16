import { MongoClient } from "mongodb";
import { database } from "./app-configs.js";
import type { App } from "./app.js";
import { Container } from "./container.js";

const init = async () => {
    const { sourceUrl, archiveUrl } = database;
    const sourceMongo = new MongoClient(sourceUrl);
    const targetMongo = new MongoClient(archiveUrl);

    const container = new Container().register().registerDatabases(sourceMongo, targetMongo);
    const app: App = container.resolve("app");

    app.initiate();
};
init();

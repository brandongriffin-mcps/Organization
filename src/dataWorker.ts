/**
 * @see https://sqlite.org/wasm/doc/trunk/api-oo1.md
 * @see https://sqlite.org/lang.html
 */

import sqlite3InitModule, { OpfsDatabase } from "@sqlite.org/sqlite-wasm";
import ExcelJS from "exceljs";

// Types for JSDoc links
import type OrgChart from "./components/OrgChart.svelte";
import type { nodeDropped } from "./drag";
import type Find from "./modals/Find.svelte";
import type Open from "./modals/Open.svelte";

declare global {
    /**
     * Expose the database instance for debugging purposes. To access it, change the context in the
     * dev tools console from top to the name of this file.
     */
    var db: OpfsDatabase;
}

/** A message that was sent to the worker by the app. */
export type RequestMessage = 
    | { type: "new"; }
    | { type: "open"; buffer: ArrayBuffer }
    | { type: "search"; category: "positions" | "offices"; query: string; }
    | { type: "move"; dragged: string; target: string; descendants: boolean; }
    | { type: "swap"; dragged: string; target: string; }
    | { type: "getTree" };

/** A message that sends information back to the app. */
export type ResponseMessage =
    | { type: "tree"; tree: Node; }
    | { type: "offices"; results: Office[] }
    | { type: "positions"; results: Position[] }
    | { type: "openError"; message: string; }
    | { type: "openMissingData"; hierarchy: { row: number; data: string[]; }[]; positions: { row: number; data: string[]; }[]};

interface Position {
    title: string;
    fte: number;
    office: string;
    ideaFunded: boolean;
}

interface Node {
    name: string;
    children: Node[];
    positions: Position[];
}

interface Office {
    name: string;
    parent: string;
}

const NAME_INDEX = 1;
const PARENT_INDEX = 2;

const TITLE_INDEX = 1;
const FTE_INDEX = 2;
const OFFICE_INDEX = 3;
const IDEA_FUNDED_INDEX = 4;

const messageHandler: {[Key in RequestMessage["type"]]: (message: RequestMessage) => void} = {
    "new": newTree,
    "open": workbookOpened,
    "move": move,
    "swap": swap,
    "search": search,
    "getTree": getTree
};

let dbReady = false;

/** Stores messages that should be processed once the database is ready. */
let queuedMessages: RequestMessage[] = [];

self.addEventListener("message", async function(e: MessageEvent<RequestMessage>) {
    if (dbReady === false) {
        queuedMessages.push(e.data);
        return;
    }

    const callback = messageHandler[e.data.type];

    if (callback !== undefined) {
        callback(e.data);
    } else {
        console.error(`Invalid message type: ${e.data.type}`);
    }
});

async function start() {
    const sqlite3 = await sqlite3InitModule();

    const db = new sqlite3.oo1.OpfsDb("organization.sqlite3");
    globalThis.db = db;

    // Enforce foreign key constraints
    db.exec(`PRAGMA foreign_keys=ON`);

    setupTables();

    dbReady = true;

    // Now that the database is ready, process the messages that
    // couldn't be processed before
    for (const message of queuedMessages) { 
        const callback = messageHandler[message.type];

        if (callback !== undefined) {
            callback(message);
        } else {
            console.error(`Invalid message type: ${message.type}`);
        }
    }

    queuedMessages = [];
}

start();

/** Type safe `self.postMessage`. */
function postResponseMessage(message: ResponseMessage) {
    self.postMessage(message);
}

function setupTables() {
    // Data tables
    db.exec(`CREATE TABLE IF NOT EXISTS hierarchy (
        node_id INTEGER PRIMARY KEY,
        name TEXT, 
        parent_id INTEGER,
        FOREIGN KEY (parent_id) REFERENCES hierarchy(node_id) ON DELETE CASCADE
    )`);
    db.exec(`CREATE TABLE IF NOT EXISTS position (
        title TEXT, 
        fte NUMERIC, 
        office_id INTEGER, 
        grant INTEGER,
        FOREIGN KEY (office_id) REFERENCES hierarchy(node_id)
    )`);

    // Full text search tables
    // See https://sqlite.org/fts5.html
    db.exec(`CREATE VIRTUAL TABLE IF NOT EXISTS ft_hierarchy USING fts5(
        name, 
        parent_id UNINDEXED, 
        content='hierarchy'
    )`);
    db.exec(`CREATE VIRTUAL TABLE IF NOT EXISTS ft_position USING fts5(
        title, 
        fte UNINDEXED, 
        office_id UNINDEXED, 
        grant UNINDEXED, 
        content='position'
    )`);

    // Update the full text search index for the hierarchy table when it changes
    // See https://sqlite.org/fts5.html#external_content_tables
    db.exec(`CREATE TRIGGER IF NOT EXISTS hierarchy_ai AFTER INSERT ON hierarchy BEGIN
        INSERT INTO ft_hierarchy(rowid, name, parent_id) 
        VALUES (new.rowid, new.name, new.parent_id);
    END`);
    db.exec(`CREATE TRIGGER IF NOT EXISTS hierarchy_ad AFTER DELETE ON hierarchy BEGIN
        INSERT INTO ft_hierarchy(ft_hierarchy, rowid, name, parent_id) 
        VALUES ('delete', old.rowid, old.name, old.parent_id);
    END`);
    db.exec(`CREATE TRIGGER IF NOT EXISTS hierarchy_au AFTER UPDATE ON hierarchy BEGIN
        INSERT INTO ft_hierarchy(ft_hierarchy, rowid, name, parent_id) 
        VALUES ('delete', old.rowid, old.name, old.parent_id);
        INSERT INTO ft_hierarchy(rowid, name, parent_id) 
        VALUES (new.rowid, new.name, new.parent_id);
    END`);

    // Update the full text search index for the position table when it changes
    // See https://sqlite.org/fts5.html#external_content_tables
    db.exec(`CREATE TRIGGER IF NOT EXISTS position_ai AFTER INSERT ON position BEGIN
        INSERT INTO ft_position(rowid, title, fte, office_id, grant) 
        VALUES (new.rowid, new.title, new.fte, new.office_id, new.grant);
    END`);
    db.exec(`CREATE TRIGGER IF NOT EXISTS position_ad AFTER DELETE ON position BEGIN
        INSERT INTO ft_position(ft_position, rowid, title, fte, office_id, grant) 
        VALUES ('delete', old.rowid, old.title, old.fte, old.office_id, old.grant);
    END`);
    db.exec(`CREATE TRIGGER IF NOT EXISTS position_au AFTER UPDATE ON position BEGIN
        INSERT INTO ft_position(ft_position, rowid, title, fte, office_id, grant) 
        VALUES ('delete', old.rowid, old.title, old.fte, old.office_id, old.grant);
        INSERT INTO ft_position(rowid, title, fte, office_id, grant) 
        VALUES (new.rowid, new.title, new.fte, new.office_id, new.grant);
    END`);
}

function newTree(message: RequestMessage) {
    if (message.type !== "new") return;

    db.exec(`DELETE FROM position`);
    db.exec(`DELETE FROM hierarchy`);

    db.transaction(() => {
        db.exec(`INSERT INTO hierarchy(name, parent_id) VALUES ('Division of Specialized Support Services', NULL)`);
    });

    getTree({ type: "getTree" });
}

/**
 * Called when the user opens an Excel workbook.
 * @see {@link Open}
 * @see https://github.com/exceljs/exceljs/blob/master/README.md#contents
 */
async function workbookOpened(message: RequestMessage) {
    if (message.type !== "open") return;

    const workbook = new ExcelJS.Workbook();

    try {
        await workbook.xlsx.load(message.buffer);
    } catch (e) {
        postResponseMessage({ type: "openError", message: "Could not open workbook. Verify that the file is not corrupted by opening it in Excel or Google Sheets." });
        return;
    }

    const hierarchySheet = workbook.getWorksheet("Hierarchy")!;
    const positionsSheet = workbook.getWorksheet("Positions")!;


    if (hierarchySheet === undefined || positionsSheet === undefined) {
        postResponseMessage({ type: "openError", message: "Data could not be found. Make sure that your spreadsheet has a Hierarchy sheet and a Positions sheet." });
        return;
    }

    // Get all the non-header rows
    const hierarchyRows = hierarchySheet.getRows(2, hierarchySheet.rowCount - 1)!;
    const positionRows = positionsSheet.getRows(2, positionsSheet.rowCount - 1)!;

    // Capture rows that have missing cells
    const badHierarchyRows = hierarchyRows.filter((row, idx) => (row.actualCellCount != 2 && idx != 0));
    const badPositionRows = positionRows.filter((row) => row.actualCellCount != 4);

    if (badHierarchyRows.length > 0 || badPositionRows.length > 0) {
        // ExcelJS row objects can't be serialized properly, so we just have to
        // convert them to a more primitive format
        postResponseMessage({ 
            type: "openMissingData", 
            hierarchy: badHierarchyRows.map(r => ({ row: r.number, data: [
                r.getCell(1).toString(),
                r.getCell(2).toString(),
            ] })),
            positions: badPositionRows.map(r => ({ row: r.number, data: [
                r.getCell(1).toString(),
                r.getCell(2).toString(),
                r.getCell(3).toString(),
                r.getCell(4).toString()
            ]}))
        });
        return;
    }

    // Clear out the previous data
    db.transaction(() => {
        db.exec("DELETE FROM position");
        db.exec("DELETE FROM hierarchy");
    });

    // Committing all the insertion queries under one transaction will
    // populate the database more efficiently compared to individual queries
    db.transaction(() => {
        for (const row of hierarchyRows) {
            db.exec([
                "INSERT INTO hierarchy(name, parent_id)",
                "VALUES (?, (SELECT node_id FROM hierarchy WHERE name=?))"
            ].join("\n"), {
                bind: [
                    row.getCell(NAME_INDEX).toString(), 
                    row.getCell(PARENT_INDEX).toString()
                ]
            });
        }

        for (const row of positionRows) {
            db.exec([
                "INSERT INTO position(title, fte, office_id, grant)",
                "VALUES (?, ?, (SELECT node_id FROM hierarchy WHERE name=?), ?)"
            ], {
                bind: [
                    row.getCell(TITLE_INDEX).toString(), 
                    parseFloat(row.getCell(FTE_INDEX).toString()), 
                    row.getCell(OFFICE_INDEX).toString(),
                    row.getCell(IDEA_FUNDED_INDEX).toString() === "true"
                ]
            });
        }
    });

    getTree({ type: "getTree" });
}

/** 
 * When a user moves a node, we need to synchronize the change with the SQLite database.
 * @see {@link nodeDropped}
 */
function move(message: RequestMessage) {
    if (message.type !== "move") return;

    if (message.descendants === false) {
        db.transaction(() => {
            const draggedId = db.selectValue("SELECT node_id FROM hierarchy WHERE name=?", [message.dragged]);
            const targetId = db.selectValue("SELECT node_id FROM hierarchy WHERE name=?", [message.target]);

            db.exec(`UPDATE hierarchy SET parent_id=(SELECT parent_id FROM hierarchy WHERE node_id=?) WHERE parent_id=?`, {
                bind: [draggedId, draggedId]
            });

            db.exec(`UPDATE hierarchy SET parent_id=? WHERE node_id=?`, {
                bind: [targetId, draggedId]
            });
        });
    } else {
        db.transaction(() => {
            db.exec(`UPDATE hierarchy SET parent_id=(SELECT node_id FROM hierarchy WHERE name=?) WHERE name=?`, { bind: [
                message.target,
                message.dragged
            ] });
        });
    }
}

/** 
 * When a user swaps a node, we need to synchronize the change with the SQLite database.
 * @see {@link nodeDropped}
 */
function swap(message: RequestMessage) {
    db.transaction(() => {
        if (message.type !== "swap") return;

        const draggedId = db.selectValue("SELECT node_id FROM hierarchy WHERE name=?", [message.dragged]);
        const targetId = db.selectValue("SELECT node_id FROM hierarchy WHERE name=?", [message.target]);
        db.exec("UPDATE hierarchy SET name=? WHERE node_id=?", { bind: [message.dragged, targetId] });
        db.exec("UPDATE hierarchy SET name=? WHERE node_id=?", { bind: [message.target, draggedId] });
    });
}

/** 
 * Called when a user enters a search query in the Find window.
 * @see {@link Find}
 */
function search(message: RequestMessage) {
    if (message.type !== "search") return;

    const ftQuery = message.query.split(" ").map(s => `"${s}"*`).join(" + ");

    switch (message.category) {
    case "offices": {
        const results = db.selectObjects([
            "SELECT ft_hierarchy.name, hierarchy.name AS parent",
            "FROM ft_hierarchy LEFT JOIN hierarchy",
            "ON hierarchy.node_id=ft_hierarchy.parent_id",
            "WHERE ft_hierarchy MATCH ?"
        ].join("\n"), `${ftQuery}`) as unknown as Office[];

        postResponseMessage({ type: "offices", results });
        
        break;
    }

    case "positions": {
        const results = db.selectObjects([
            "SELECT ft_position.title, ft_position.fte, hierarchy.name AS office, ft_position.grant AS ideaFunded",
            "FROM ft_position LEFT JOIN hierarchy",
            "ON ft_position.office_id=hierarchy.node_id",
            "WHERE ft_position MATCH ?"
        ].join("\n"), `${ftQuery}`) as unknown as Position[];

        postResponseMessage({ type: "positions", results });

        break;
    }
    }
}

/** 
 * Retrieves the entire tree from the SQLite database when the app loads.
 * @see {@link OrgChart}
 */
function getTree(message: RequestMessage) {
    if (message.type !== "getTree") return;
    
    const data = db.selectObjects([
        "SELECT t1.node_id, t1.name, t2.name AS parent",
        "FROM hierarchy AS t1 LEFT JOIN hierarchy AS t2",
        "ON t1.parent_id=t2.node_id"
    ].join("\n")) as { node_id: number; name: string; parent: string; }[];

    if (data.length === 0) {
        newTree({ type: "new" });
        return;
    }

    const tree: Node = { name: data[0].name, children: [], positions: [] };

    const populate = (node: Node) => {
        const dbNode = data.find(d => d.name === node.name);
        const children = data.filter(d => d.parent === node.name);

        const positionResults = db.selectObjects([
            "SELECT p.title, p.fte, h.name AS office, p.grant AS ideaFunded",
            "FROM position AS p JOIN hierarchy AS h",
            "ON h.node_id=p.office_id",
            "WHERE p.office_id=?"
        ].join("\n"), [dbNode?.node_id]) as unknown as Position[];

        positionResults.forEach(p => p.ideaFunded = Boolean(p.ideaFunded));

        node.positions = positionResults;

        for (const child of children) {
            const childNode: Node = {
                name: child.name,
                children: [],
                positions: []
            };
            node.children.push(childNode);
            populate(childNode);
        }
    }

    populate(tree);

    postResponseMessage({ type: "tree", tree });
}
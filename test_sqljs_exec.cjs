const initSqlJs = require('sql.js');

(async () => {
    const SQL = await initSqlJs();
    const db = new SQL.Database();

    db.run("CREATE TABLE test (name TEXT);");
    db.run("INSERT INTO test VALUES ('Omar'), ('A'), ('B');");

    try {
        const res1 = db.exec("SELECT * FROM test", []);
        console.log("Without params:", res1);
    } catch (e) { console.error(e); }

    try {
        const res2 = db.exec("SELECT * FROM test WHERE name = ?", ["Omar"]);
        console.log("With params:", res2);
    } catch (e) {
        console.error("With params Error:", e);
    }
})();

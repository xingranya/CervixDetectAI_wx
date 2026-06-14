const mysql = require("mysql2/promise");
const env = require("./env");

let pool;

function getPool() {
  if (!pool) {
    pool = mysql.createPool(env.database);
  }
  return pool;
}

async function query(sql, params = []) {
  const [rows] = await getPool().query(sql, params);
  return rows;
}

module.exports = {
  getPool,
  query
};


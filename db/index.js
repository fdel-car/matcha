const colors = require('colors');
const { Pool } = require('pg');
const connectionString = 'postgresql://fdel-car:rootroot@localhost:5432/db';

const pool = new Pool({ connectionString });

module.exports = {
  query: async (query, params, silly = false) => {
    if (!query) return null;
    const start = Date.now();
    const res = await pool.query(query, params);
    const duration = Date.now() - start;
    console.log(
      'Query =>',
      (silly || query.length <= 32 ? query : `${query.substring(0, 32)}...`)
        .magenta.bold,
      `executed. ${'Duration'.italic}:`,
      duration > 100 ? `${duration} ms`.red.bold : `${duration} ms`.green.bold,
      `${'Rows'.italic}: ${
        (res.rowCount !== null ? res.rowCount.toString() : 'N/A').bold
      }`
    );
    return res;
  },
  close: async () => {
    await pool.end();
  }
};

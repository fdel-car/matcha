const colors = require('colors');
const { Pool } = require('pg');
const connectionString =
  'postgresql://fdel-car:rootroot@localhost:5432/matcha-db';

const pool = new Pool({ connectionString });
const maxLength = 48;

module.exports = {
  query: async (query, params, silly = false, display = true) => {
    if (!query) return null;
    const start = Date.now();
    const res = await pool.query(query, params);
    const duration = Date.now() - start;
    if (display)
      console.log(
        'Query =>',
        (silly || query.length <= maxLength
          ? query
          : `${query.substring(0, maxLength)}...`
        ).magenta.bold,
        `executed. ${'Duration'.italic}:`,
        duration > 100
          ? `${duration} ms`.red.bold
          : `${duration} ms`.green.bold,
        `${'Rows'.italic}: ${
          (res.rowCount != null ? res.rowCount.toString() : 'N/A').bold
        }`
      );
    return res;
  },
  close: async () => {
    await pool.end();
  }
};

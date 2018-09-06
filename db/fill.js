const db = require('./index');
const fetch = require('isomorphic-fetch');

(async function main() {
  const res = await fetch(
    'https://randomuser.me/api?exc=registered,phone,cell,id&noinfo&results=10'
  );
  const users = await res.json();
  users.results.map(user => {
    console.log(user);
  });
  await db.close();
})();

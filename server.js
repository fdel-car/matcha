const express = require('express');
const fs = require('fs');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const apiEndpoints = require('./api/router');

app
  .prepare()
  .then(() => {
    const server = express();

    server.use('/api', apiEndpoints);

    server.get('/breached', (req, res) => {
      fs.readFile('breached.txt', (err, data) => {
        if (err) throw err;
        res.setHeader('content-type', 'text/plain');
        res.status(200).send(data);
      });
    });

    server.get('*', (req, res) => {
      return handle(req, res);
    });

    server.listen(3000, err => {
      if (err) throw err;
    });
  })
  .catch(ex => {
    console.error(ex.stack);
    process.exit(1);
  });

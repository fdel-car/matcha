const express = require('express');
const bodyParser = require('body-parser');
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
    server.use(bodyParser.json());
    server.use(bodyParser.urlencoded({ extended: true }));

    server.use('/api', apiEndpoints);

    server.get('/breached', (req, res) => {
      fs.readFile('breached.txt', (err, data) => {
        if (err) {
          console.error(err.message);
          res.sendStatus(404);
        }
        res.setHeader('content-type', 'text/plain');
        res.status(200).send(data);
      });
    });

    server.get('*', (req, res) => {
      // Use session based authentification (uuid, express-session...). See how to do that properly with Next.js
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

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

    const imgExtensions = ['.gif', '.png', '.jpg', '.jpeg', '.ico'];
    server.get('/file/:name', function(req, res, next) {
      const fileName = req.params.name;
      const options = {
        root: __dirname + `/public/${imgExtensions.some(ext => fileName.endsWith(ext)) ? 'img/' : 'other/'}`,
        dotfiles: 'deny',
        headers: {
          'x-timestamp': Date.now(),
          'x-sent': true
        }
      };
      res.sendFile(fileName, options, function(err) {
        if (err) {
          next(err);
        }
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

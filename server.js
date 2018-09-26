const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const apiEndpoints = require('./api/router');
const imgExtension = ['gif', 'png', 'jpg', 'jpeg', 'ico'];

app
  .prepare()
  .then(() => {
    const server = express();
    server.use(bodyParser.json());
    server.use(bodyParser.urlencoded({ extended: true }));
    server.use(cookieParser());

    server.use('/api', apiEndpoints);

    server.get('/file/:name', function(req, res, next) {
      const fileName = req.params.name;
      let fileType = fileName.split('.');
      fileType = fileType[fileType.length - 1];
      const options = {
        root:
          __dirname +
          `/public/${imgExtension.indexOf(fileType) >= 0 ? 'img/' : 'other/'}`,
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

    server.get('/user/:id', (req, res) => {
      const queryParams = { id: req.params.id };
      return app.render(req, res, '/user', queryParams);
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

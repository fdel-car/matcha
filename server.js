const app = require('express')();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const server = require('http').Server(app);
const io = require('socket.io')(server);
const next = require('next');
const jwt = require('jsonwebtoken');
const cookie = require('cookie');

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();
const apiEndpoints = require('./api/router');
const imgExtension = ['gif', 'png', 'jpg', 'jpeg', 'ico'];
const db = require('./db/index');

// server.listen(3000);

nextApp
  .prepare()
  .then(() => {
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(cookieParser());
    app.use('/api', apiEndpoints);

    app.get('/file/:name', function(req, res, next) {
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

    app.get('/user/:id', (req, res) => {
      const queryParams = { id: req.params.id };
      return nextApp.render(req, res, '/user', queryParams);
    });

    app.get('*', (req, res) => {
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

io.use(function(socket, next) {
  if (!socket.request.headers.cookie)
    return next(
      new Error(
        'No cookies passed with the request, could not authentify the user.'
      )
    );
  const cookies = cookie.parse(socket.request.headers.cookie);
  const JWToken = cookies.jwt;
  jwt.verify(JWToken, process.env.SECRET, async function(err, decoded) {
    if (err) return next(new Error('Jwt invalid...'));
    socket.decoded = decoded;
    next();
  });
});

io.on('connect', function(socket, next) {
  db.query('UPDATE users SET online = TRUE WHERE id = ($1)', [
    socket.decoded.uid
  ]).catch(err => next(err));
  socket.on('disconnect', function() {
    db.query(
      'UPDATE users SET online = FALSE AND last_online_at = now() WHERE id = ($1)',
      [socket.decoded.uid]
    ).catch(err => next(err));
  });
});

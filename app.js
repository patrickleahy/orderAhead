
/**
 * Module dependencies.
 */
 
var mysql = require('mysql');
var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var app = express();
var credentials = require('./credentials');

// Other dependencies
var passwordHash = require('password-hash');

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

console.log(app.get('env'));
// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

var db = exports.db = mysql.createConnection({credentials.host,port: credentials.port, user: credentials.user, password: credentials.password, database: credentials.database, supportBigNumbers:true, typeCast:true});

app.get('/', routes.index);
app.get('/users', user.list);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

app.post('/login', function(req, res) {
  console.log(JSON.stringify(req.body));
  db.query('SELECT * FROM users WHERE email = ?', req.body.email, function (err, rows, result) {
    if (err) {
      res.send(JSON.stringify({'statusCode': 500, 'message': err}));
    } else {
      if (rows.length > 0) {
        if (passwordHash.verify(req.body.password, rows[0].hashedPassword) === true) {
          getInitialData(rows[0], function(body) {
            res.send(JSON.stringify({'statusCode': 200, 'body': body}));  
          });
        } else {
          res.send(JSON.stringify({'statusCode': 401, 'message': 'Password incorrect'}));  
        }
      } else {
        res.send(JSON.stringify({'statusCode': 404, 'message': 'No user with that email address'}));
      }
    }
  });
});

app.post('/cookieLogin', function(req, res) {
  console.log(JSON.stringify(req.body));
  db.query('SELECT * FROM users WHERE email = ?', req.body.email, function (err, rows, result) {

    getInitialData(rows[0], function(body) {
      res.send(JSON.stringify({'statusCode': 200, 'body': body}));  
    });
  });
});

app.post('/signUp', function(req, res) {
  req.body.hashedPassword = passwordHash.generate(req.body.password);
  delete req.body.password;

  db.query('INSERT INTO users SET ?', req.body, function (err, result) {
    if (err) {
      res.send(JSON.stringify({'statusCode': 500}));
    } else {
      req.body.id = result.insertId;
      getInitialData(req.body, function(body) {
        res.send(JSON.stringify({'statusCode': 200, 'body': body}));  
      });
    }
  });
});

app.post('/statusUpdate', function(req, res) {
  console.log('INSERT INTO news SET ' + JSON.stringify(req.body));
  db.query('INSERT INTO news SET ?', req.body, function (err) {
    if (err) {
      res.send(JSON.stringify({'statusCode': 500}));
    } else {
      res.send(JSON.stringify({'statusCode': 200, 'body': req.body}));
    }
  });
});

app.post('/friendsPage', function(req, res) {
  console.log(req.body);
  db.query('SELECT * FROM news WHERE user_id = ?', req.body.user_id, function (err, news, results) {

    db.query('SELECT * FROM users WHERE id = ?', req.body.user_id, function (err, user, results) {

      delete user[0]['hashedPassword'];
      var body = { 'user': user[0], 'news': news };
      if (err) {
        res.send(JSON.stringify({'statusCode': 500}));
      } else {
        res.send(JSON.stringify({'statusCode': 200, 'body': body}));
      }
    });

  });
});

app.post('/viewNews', function(req, res) {
  db.query('SELECT * FROM news', function (err, news, results) {
    var body = { 'news': news };
    console.log(JSON.stringify(body));
    if (err) {
      res.send(JSON.stringify({'statusCode': 500}));
    } else {
      res.send(JSON.stringify({'statusCode': 200, 'body': body}));
    }
  });
});

app.post('/createFriendship', function(req, res) {
  db.query('SELECT * FROM friendships WHERE friend_one = ? && friend_two = ?', [req.body.friend_one, req.body.friend_two], function (err, firstCombo, results) {
    db.query('SELECT * FROM friendships WHERE friend_two = ? && friend_one = ?', [req.body.friend_one, req.body.friend_two], function (err, secondCombo, results) {
      if (firstCombo.length > 0 || secondCombo.length > 0) {
        res.send(JSON.stringify({'statusCode': 404, 'message': 'Friendship already pending'}));
      } else {
        db.query('INSERT INTO friendships SET ?', req.body, function (err, results) {
          if (err) {
            res.send(JSON.stringify({'statusCode': 500, 'message': 'Internal database error: ' + err}));
          } else {
            res.send(JSON.stringify({'statusCode': 200}));
          }
        });
      }
    });
  });
});

function getInitialData(myData, callback) {
  if (myData !== null) {
    delete myData.hashedPassword;
    db.query('SELECT id, firstName, lastName, email FROM users', function (err, users, result) {
      db.query('SELECT * FROM news', function (err, news, result) {
        if (err) throw err;
        var body = { 'myData': myData, 'users': users, 'news': news };
        callback(body);
      });
    });    
  }
}




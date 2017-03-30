var express      = require('express');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var _            = require('lodash');
var favicon      = require('serve-favicon');
var fs           = require('fs-extra');
var http         = require('http');
var path         = require('path');
var reload       = require('require-reload')(require);
var url          = require('url');
var winston      = require('winston');
var Xray         = require('x-ray');

var config  = require(__dirname + '/lib/config');
var tips    = require(__dirname + '/tips');

winston.add(winston.transports.File, { filename: __dirname + '/logs/access.log', level: 'info' });

var app = express();
app.set('config', config);
app.set('views', __dirname + '/views');
app.set('view engine', 'hbs');
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(__dirname + '/public'));

// set local variables
app.locals.port             = config.app.port;
app.locals.speed            = config.app.speed;
app.locals.hostname         = config.app.hostname;
app.locals.contactnumber    = config.app.contactnumber;
app.locals.tips             = tips.tips;
app.winston                 = winston;

/*
 * Watch for tips.json changes and update config
 */
fs.watchFile('tips.json', function (event, filename) {
    console.log('Tips Updated');
    tips = reload(__dirname + '/tips');
    app.locals.tips = tips.tips;
});

/*
 * GET index
 */
app.get('/', function(req, res, next) {
  var tip = getTip();
  app.winston.info("GET", {ip: req.connection.remoteAddress, tip: tip._id});
  
  var target = "";
  if(req.query.jabber) {
      app.winston.info("GET", {ip: req.connection.remoteAddress, jabber: true});
      target = " target=\"_new\"";
  }
  res.render('index', {
    tip: tip.tip,
    url: tip.url,
    stub: tip.stub,
    speed: app.locals.speed,
    hostname: app.locals.hostname,
    contactnumber: app.locals.contactnumber,
    target: target
  });
});

/*
 * GET status.json
 */
app.get('/status.json', function(req, res, next) {
    var filename = path.join(process.cwd(), "status", "status.json");
    fs.exists(filename, function(exists) {
        if(!exists) {
            console.log("not exists: " + filename);
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.write('404 Not Found\n');
            res.end();
            return
        }else{
            var mimeType = "text/json"
            res.writeHead(200, mimeType);
            var fileStream = fs.createReadStream(filename);
            fileStream.pipe(res);
        }
    }); //end path.exists
});

/*
 * GET status-dev.json
 * This is for testing status.json changes
 */
app.get('/status-dev.json', function(req, res, next) {
    var filename = path.join(process.cwd(), "status", "status-dev.json");
    fs.exists(filename, function(exists) {
        if(!exists) {
            console.log("not exists: " + filename);
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.write('404 Not Found\n');
            res.end();
            return
        }else{
            var mimeType = "text/json"
            res.writeHead(200, mimeType);
            var fileStream = fs.createReadStream(filename);
            fileStream.pipe(res);
        }
    }); //end path.exists
});

/*
 * GET tip
 */
app.get('/tip', function(req, res, next) {
    var tip = getTip()
    app.winston.info("TIP", {ip: req.connection.remoteAddress, tip: tip._id});
    res.setHeader('content-type', 'application/json');
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate"); // HTTP 1.1.
    res.setHeader("Pragma", "no-cache"); // HTTP 1.0.
    res.setHeader("Expires", "0"); // Proxies.
    res.send(tip);
});

/*
 * GET tip
 */
app.get('/:stub', function(req, res, next) {
    var stub = req.params.stub;
    var tip = _.filter(app.locals.tips, ['stub', stub]);
    if (tip[0] !== undefined && tip[0].url !== undefined) {
        app.winston.info("STUB", {ip: req.connection.remoteAddress, tip: tip[0]._id});
        res.redirect(tip[0].url);
    } else {
        res.redirect("/");
    }
    res.end();
});

/*
 * POST tips
 */
app.post('/', function(req, res) {

  var tips = [];
  _.forEach(req.body.tips, function(n, key) {
    var _id  = n._id;
    var name = n.name;
    var tip  = n.tip;
    var url  = n.url;
    var stub = n.stub;
    var enabled = n.enabled
    var category = n.category

    var defaultPage = false;
    if (_id == req.body.default) {
      defaultPage = true;
    }

    tips.push({
      '_id'    : _id,
      'name'   : name,
      'tip'    : tip,
      'url'    : url,
      'stub'   : stub,
      'enabled': enabled,
      'category': category
    });
  });

  // update for session
  res.app.locals.tips = tips;

  // write file with the follow  contents
  fs.writeJsonSync(__dirname + '/tips.json', {
    'tips': tips 
  });

  // redirect to home
  res.redirect('back');
});

/*
 * Get Random, Enabled Tip
 */
function getTip() {
    var tip = app.locals.tips[Math.floor(Math.random()*app.locals.tips.length)];
    if (tip.enabled == false) {
        tip = getTip()
    }
    return tip
}

module.exports = app;

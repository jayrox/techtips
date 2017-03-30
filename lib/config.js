var fs = require('fs-extra');
var _  = require('lodash');

var configFile         = __dirname + '/../config.json';
var configFileTemplate = configFile + '.template';

var config;

/* 
  Current Config Version
  Update this when making changes to the config file.
  This allows for the config auto-migrater to work.
*/
var configVersion = 1;

try {
  config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
} catch (err) {
  if (err.name === 'SyntaxError') {
    throw new Error('Invalid config file, please make sure the file is in JSON format.');
  }

  // config file not found
  if (err.code === 'ENOENT') {
    fs.copySync(configFileTemplate, configFile);
    config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
  }
}

config.app.port           = process.env.APP_PORT            || config.app.port          || 3000;
config.app.speed          = process.env.APP_SPEED           || config.app.speed         || 120; // 2 Minutes
config.app.hostname       = process.env.APP_HOSTNAME        || config.app.hostname      || "localhost";
config.app.contactnumber  = process.env.APP_CONTACTNUMBER   || config.app.contactnumber || "+1 555 555 1234"; 

// Prepare Config file to be saved
function save(port, version, speed) {
  writeSave(null, {
    'app': {
      'port'    : port,
      'version' : version,
      'speed'   : speed,
      'hostname': hostname,
      'contactnumber': contactnumber
    }
  });
}

// Write config to file
// This allows for config backups as well.
function writeSave(name, config) {
  var file = __dirname + '/../config.json';
  if (name !== undefined && name !== null) {
      file = file + name;
  }

  console.log("file: " + file);
  fs.writeJsonSync(file, config, {},
    function (err) {
      console.log(err)
  });
}

module.exports = config;

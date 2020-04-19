
/*
  routes.js: System routes for most requests
*/

const db    = require('../database.js');
const sys   = require('../settings.js');
const mid   = require('../middleware.js');

module.exports = function(app) {

  // for debug, show user session
  app.get('/', mid.isAuth, (req, res) => {
    res.rend('home.html');
  });

}
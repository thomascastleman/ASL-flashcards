
/*
  routes.js: System routes for most requests
*/

const db    = require('./database.js');
const sys   = require('./settings.js');
const mid   = require('./middleware.js');

module.exports = function(app) {

  // for debug, show user session
  app.get('/', (req, res) => {
    res.send(req.user || "There is no session established for this user.");
  });

  /*
    ************************************
    *                                  *
    *   Routes go here...              *
    *                                  *
    *   app.get('/', (req, res) => {   *
    *     ...                          *
    *   });                            *
    *                                  *
    ************************************
  */

}
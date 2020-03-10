
/*
  middleware.js: Middleware
*/

const querystring = require('querystring');

/*  Generate a middleware function to check a generic predicate against a specific user role
    !! Use of this function assumes there is a req.user.local.role field !! */
function checkRole(pred) {
  return (req, res, next) => {
    if (req.isAuthenticated() && req.user.local && pred(req.user.local.role)) {
      return next();
    } else {
      res.err({
        fr: "You are unable to access this resource.", 
        li: "/auth/google?returnTo=" + querystring.escape(req.url),
        ti: "Authenticate as a different user"
      });
    }
  };
}

/*  Generate a middleware function to check for equality with a specific user role
    !! Use of this function assumes there is a req.user.local.role field !! */
function isRole(role) {
  // use checkRole but the predicate is equality
  return checkRole((r) => { return r == role });
}

module.exports = {

  // middleware to check for a URL to return to after authenticating
  checkReturnTo: (req, res, next) => {
    var returnTo = req.query['returnTo'];
    if (returnTo) {
      // if no session, replace with empty object
      if (!req.session) req.session = {};

      // add returnTo address to session
      req.session.returnTo = querystring.unescape(returnTo);
    }
    next();
  },

  // middleware to check if a user is authenticated
  isAuth: (req, res, next) => {
    // if authenticated and has session data from our system
    if (req.isAuthenticated() && req.user.local) {
      return next();
    } else {
      // redirect to auth screen, with returnTo link to this page
      res.redirect('/auth/google?returnTo=' + querystring.escape(req.url));
    }
  }

  /*

    *************************************************************************************
    *                                                                                   *
    *   Write wrappers for isRole or checkRole here to use as middleware for specific   *
    *   role constraints.                                                               *
    *   i.e. if Admin is role 2, then add:                                              *
    *                                                                                   *
    *     isAdmin: isRole(2)                                                            *
    *                                                                                   *
    *   as a middleware for checking if users fit the Admin role.                       *
    *                                                                                   *
    *   To check if a user's role satisfies a given predicate, use checkRole:           *
    *   i.e. allow users that have role 2 or higher:                                    *
    *                                                                                   *
    *     isAtLeastTwo: checkRole((role) => { return role >= 2 });                      *
    *                                                                                   *
    *                                                                                   *
    *************************************************************************************

  */

}
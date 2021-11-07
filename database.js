
/*
  database.js: Database connection & query functions
*/

const creds   = require('./credentials.js');
const sys     = require('./settings.js');
const mysql   = require('mysql2');

// establish database connection
const con = mysql.createPool({
  host: 'localhost',
  user: creds.MYSQL_USERNAME,
  password: creds.MYSQL_PASSWORD,
  database: sys.DB_NAME,
  multipleStatements: true
});

module.exports = {
  connection: con,

  /*  Look up a user account by email.
      Callback on profile, if found. */
  lookUpUser: (email, cb) => {
    const handleProfile = (err, rows) => {
      if (!err && rows !== undefined && rows.length > 0) {
        // callback on retrieved profile
        cb(err, rows[0]);
      } else {
        cb(err || "Failed to find a user with the given email.");
      }
    }

    // retrieve user information associated with this email
    con.query('SELECT * FROM users WHERE email = ?;', [email], handleProfile);
  },

  /*  Add a new system user account, given the user's Google info.
      Callback on profile of created user. */
  addUserFromGoogle: (user, cb) => {
    const receiveProfile = (err, rows) => {
      if (!err && rows !== undefined && rows.length > 1 && rows[1].length > 0) {
        // callback on generated profile
        cb(err, rows[1][0]);
      } else {
        cb(err || "Failed to add a new user from Google account.");
      }
    }

    // make insert and retrieve inserted profile data (assumes default role is 1)
    con.query(
      `INSERT INTO users (name, email, role) VALUES (?, ?, 1); 
      SELECT * FROM users WHERE uid = LAST_INSERT_ID();`, 
      [user.displayName, user._json.email], receiveProfile);
  }
}


/*
  user.js: User-related database queries
*/

const con = require('../database.js').connection;

module.exports = {
  /*  addUser :: (name :: String, email :: String -> 
    { uid :: Number, name :: String, email :: String })
      Adds a new user to the database, returning  their profile */
  addUser: (name, email, cb) => {
    const handle = (err, rows) => {
      if (err) cb(err);

      if (rows.length < 2 || rows[1].length < 1) {
        cb(new Error("Failed to retrieve user row on insert"));
      }

      // send back the profile
      cb(err, rows[1][0]);
    }

    con.query(
      `INSERT INTO users (name, email) VALUES (?, ?); 
      SELECT * FROM users WHERE uid = LAST_INSERT_ID();`,
      [name, email], handle)
  }
}

/*
// Tests

module.exports.addUser('Testing User', 'test@gmail.com', (err, row) => {
  console.log(err);
  console.log(row);
});
*/

/*
  group.js: (Groups of flashcards)-related database queries
*/

const con = require('../database.js').connection;

module.exports = {

  /* GroupRow = { 
    uid :: Number, 
    name :: String, 
    owner_uid :: Number 
  } */

  /*  addGroup :: (name :: String, userUID :: Number -> GroupRow)
      Adds a new group of flashcards to the database, returning the row */
  addGroup: (name, userUID, cb) => {
    const handle = (err, rows) => {
      if (err) cb(err);

      if (rows.length < 2 || rows[1].length < 1) {
        cb(new Error("Failed to retrieve group row on insert"));
      }

      // send back the row
      cb(err, rows[1][0]);
    }

    con.query(
      `INSERT INTO groups (name, owner_uid) VALUES (?, ?);
      SELECT * FROM groups WHERE uid = LAST_INSERT_ID();`,
      [name, userUID], handle);
  },

  /*  editGroup :: (uid :: Number, name :: String -> GroupRow)
      Edits the fields of an existing group of flashcards, returns edited row */
  editGroup: (uid, name, cb) => {
    const handle = (err, rows) => {
      if (err) cb(err);

      if (rows.length < 2 || rows[1].length < 1) {
        cb(new Error("Failed to retrieve group row on update"));
      }

      // send back the row
      cb(err, rows[1][0]);
    }

    con.query(
      `UPDATE groups SET name = ? WHERE uid = ?;
      SELECT * FROM groups WHERE uid = ?;`,
      [name, uid, uid], handle);
  },

  /*  deleteGroup :: (uid :: Number -> )
      Deletes a group from the groups table, by UID */
  deleteGroup: (uid, cb) => {
    con.query('DELETE FROM groups WHERE uid = ?;', [uid], cb);
  }

}

// Tests
/*

module.exports.addGroup("NEW GROUP", 1, (err, row) => {
  console.log(err);
  console.log(row);
});

module.exports.editGroup(3, "New Group Name", (err, row) => {
  console.log(err);
  console.log(row);
});

module.exports.deleteGroup(4, (err, row) => {
  console.log(err);
});

*/

/*
  database/group.js: (Groups of flashcards)-related database queries
*/

const con = require('../database.js').connection;

module.exports = {

  /* GroupRow = { 
    uid :: Number, 
    name :: String, 
    owner_uid :: Number 
  } */

  /*  getGroup :: (uid :: Number -> { uid :: Number, name :: String,
                  owner_uid :: Number, flashcards :: List<FlashcardRow> })
      Get the group (and all its flashcards) associated with a UID */
  getGroup: (uid, cb) => {
    const returnRow = (err, rows) => {
      if (err) return cb(err);

      if (!rows || rows.length < 1) {
        return cb(new Error("Failed to find a group with the given identifier"));
      }

      let group = rows[0];
      
      const addCardsToGroup = (err, rows) => {
        if (err) return cb(err);
        if (!rows) return cb(new Error("Failed to retrieve rows associated with indicated group"));

        // add cards to the group object and return
        group.flashcards = rows;
        cb(err, group);
      }

      // get the flashcards in this group
      con.query(
        `SELECT * FROM 
          in_group i JOIN flashcards f ON i.flashcard_uid = f.uid 
        WHERE i.group_uid = ?;`,
        [group.uid], addCardsToGroup);

    }

    // get the group metadata (and join to include owner's name)
    con.query(
      `SELECT 
        g.*,
        u.name AS owner_name
      FROM 
        groups g JOIN users u ON g.owner_uid = u.uid
      WHERE g.uid = ?;`, 
      [uid], returnRow);
  },

  /*  allGroups :: ( -> List<GroupRow>)
      Get all the groups in the system */
  allGroups: (cb) => {
    con.query(
      `SELECT 
        g.*, 
        u.name AS owner_name 
      FROM groups g JOIN users u ON g.owner_uid = u.uid;`, cb);
  },

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

module.exports.getGroup(5, (err, group) => {
  console.log(err);
  console.log(group);
});

module.exports.allGroups((err, rows) => {
  console.log(err);
  console.log(rows);
});

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
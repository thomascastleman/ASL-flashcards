
/*
  database/group.js: (Groups of flashcards)-related database queries
*/

const con = require('../database.js').connection;
const sys = require('../settings.js');

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
        card_groups g JOIN users u ON g.owner_uid = u.uid
      WHERE g.uid = ?;`, 
      [uid], returnRow);
  },

  /*  allGroups :: ( -> List<GroupRow>)
      Get all the card_groups in the system */
  allGroups: (cb) => {
    con.query(
      `SELECT 
        g.*, 
        u.name AS owner_name 
      FROM card_groups g JOIN users u ON g.owner_uid = u.uid;`, cb);
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
      `INSERT INTO card_groups (name, owner_uid) VALUES (?, ?);
      SELECT * FROM card_groups WHERE uid = LAST_INSERT_ID();`,
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
      `UPDATE card_groups SET name = ? WHERE uid = ?;
      SELECT * FROM card_groups WHERE uid = ?;`,
      [name, uid, uid], handle);
  },

  /*  deleteGroup :: (uid :: Number -> )
      Deletes a group from the card_groups table, by UID */
  deleteGroup: (uid, cb) => {
    con.query('DELETE FROM card_groups WHERE uid = ?;', [uid], cb);
  },

  /*  searchGroups :: (query :: String -> List<GroupRow>)
      Search for card_groups whose names match the query */
  searchGroups: (query, cb) => {
    if (query == "") {
      // return all card_groups
      con.query(`
        SELECT
          g.uid,
          g.name,
          u.name AS owner_name
        FROM 
          card_groups g JOIN users u ON g.owner_uid = u.uid
        ORDER BY g.uid DESC;`,
      cb);

    } else {
      // add wildcard to end of query to expand
      const expandedQuery = query == "" ? query : query + "*";
      const literalQuery = query.toUpperCase();

      /* Run the search query */
      con.query(`
        SELECT 
          g.uid, 
          g.name,
          u.name AS owner_name,
          (CASE
            WHEN UPPER(g.name) = ? THEN 1000
            ELSE MATCH (g.name) AGAINST (? IN BOOLEAN MODE)
          END) AS termScore
        FROM 
          card_groups g JOIN users u ON g.owner_uid = u.uid
        WHERE 
          UPPER(g.name) = ?
          OR MATCH (g.name) AGAINST (? IN BOOLEAN MODE)
        ORDER BY termScore DESC
        LIMIT ?;`,
        [literalQuery, expandedQuery, literalQuery, expandedQuery, sys.SEARCH.GROUP_QUERY_LIMIT], cb);
    }
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

module.exports.searchGroups('AUT', (err, results) => {
  console.log(err);
  console.log(results);
});

*/
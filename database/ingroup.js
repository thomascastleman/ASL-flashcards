
/*
  database/ingroup.js: Queries for updating the relation on groups and flashcards
*/

const con = require('../database.js').connection;

module.exports = {

  /*  addCardToGroup :: (cardUID :: Number, groupUID :: Number -> )
      Adds a new card/group pair to the ingroup relation */
  addCardToGroup: (cardUID, groupUID, cb) => {
    const insertIfNonexistent = (err, existingPairs) => {
      if (err) return cb(err);
      if (existingPairs.length > 0) return cb("Flashcard already in group.");

      // make the insert
      con.query(
        `INSERT INTO in_group (flashcard_uid, group_uid) VALUES (?, ?);`,
        [cardUID, groupUID], cb);
    }

    // first, check if this pair already exists
    con.query(`
      SELECT * FROM in_group 
      WHERE flashcard_uid = ? AND group_uid = ?;`,
      [cardUID, groupUID], insertIfNonexistent);
  },

  /*  removeCardFromGroup :: (cardUID :: Number, groupUID :: Number -> )
      Removes a flashcard from a group of flashcards */
  removeCardFromGroup: (cardUID, groupUID, cb) => {
    con.query(
      `DELETE FROM in_group WHERE flashcard_uid = ? AND group_uid = ?;`,
      [cardUID, groupUID], cb);
  }

}

// Tests
/*

module.exports.addCardToGroup(14, 5, (err) => {
  console.log(err);
});

module.exports.removeCardFromGroup(14, 5, (err) => {
  console.log(err);
});

*/
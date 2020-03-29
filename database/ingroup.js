
/*
  ingroup.js: Queries for updating the relation on groups and flashcards
*/

const con = require('../database.js').connection;

module.exports = {

  /*  addCardToGroup :: (cardUID :: Number, groupUID :: Number -> )
      Adds a new card/group pair to the ingroup relation */
  addCardToGroup: (cardUID, groupUID, cb) => {
    con.query(
      `INSERT INTO in_group (flashcard_uid, group_uid) VALUES (?, ?);`,
      [cardUID, groupUID], cb);
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
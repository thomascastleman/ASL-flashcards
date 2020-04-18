
/*
  database/quiz.js: Quiz-related database queries
*/

const con = require('../database.js').connection;
const sys = require('../settings.js');

module.exports = {

  /*  uidStringFromGroups :: (groupUIDs :: List<Number> -> String)
      Construct a string representing the UID of every flashcard in
      the union of all the groups indicated by the input list */
  uidStringFromGroups: (groupUIDs, cb) => {
    if (groupUIDs.length == 0) return cb(new Error("No group UIDs given."));

    const makeString = (err, cards) => {
      if (err) return cb(err);
      const stringVersion = cards.map(c => c.flashcard_uid).join(',');
      cb(err, stringVersion);
    }

    // get all flashcards that are in the union of the given groups
    con.query(`
      SELECT * FROM 
        in_group ig JOIN flashcards f ON ig.flashcard_uid = f.uid
      WHERE ig.group_uid IN (?)
      GROUP BY ig.flashcard_uid;`,
      [groupUIDs], makeString);
  }

}

// Tests
/*

module.exports.uidStringFromGroups([2], (err, str) => {
  console.log(err);
  console.log(str);
});

*/
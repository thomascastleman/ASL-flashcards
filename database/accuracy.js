
/*
  database/accuracy.js: Accuracy-related database queries
*/

const con = require('../database.js').connection;

module.exports = {

  /*  initializeAccuracies :: (userUID :: Number, flashcardUIDs :: List<Number> -> )
      Creates accuracy measurements for this user for every card 
      in the given list (so we can later update them without 
      questioning their pre-existence) */
  initializeAccuracies: (userUID, initAll, flashcardUIDs, cb) => {
    const handleExistingAcc = (err, rows) => {
      if (err) return cb(err);

      if (!rows) {
        return cb(new Error(`Failed to retrieve existing accuracies 
        for the given user and set of flashcards.`));
      }

      // extract just the flashcard UIDs themselves
      const existingCards = rows.map(r => r.flashcard_uid);

      // which cards do we need to initialize an accuracy for
      const cardsToInit = flashcardUIDs.filter(
          uid => !existingCards.includes(uid)
        );

      if (cardsToInit.length == 0) return cb(); // nothing to initialize

      // pairs of this user UID with each of these card UIDs, for insert
      const insert = cardsToInit.map(cardUID => [userUID, cardUID]);

      con.query(
        `INSERT INTO accuracy (user_uid, flashcard_uid) VALUES ?;`,
        [insert], cb);
    }

    // if initialize accuracy of this user with ALL cards, don't restrict to a subset
    if (initAll) {
      con.query(
        `SELECT flashcard_uid FROM accuracy 
        WHERE user_uid = ?;`,
        [userUID], handleExistingAcc);
    } else {
      con.query(
        `SELECT flashcard_uid FROM accuracy 
        WHERE user_uid = ? AND flashcard_uid IN (?);`,
        [userUID, flashcardUIDs], handleExistingAcc);
    }
  },

  /*  updateAccuracy :: (userUID :: Number, flashcard :: Number,
                        correct :: Boolean -> )
      Update the number of correct/total attempts for this user
      on this card. */
  updateAccuracy: (userUID, flashcardUID, correct, cb) => {
    const delta = correct ? 1 : 0;  // how much should we increment?

    con.query(
      `UPDATE accuracy SET correct = correct + ?, total = total + 1
      WHERE user_uid = ? AND flashcard_uid = ?;`,
      [delta, userUID, flashcardUID], cb);
  }

}

// Tests
/*

module.exports.initializeAccuracies(5, false, [4, 18, 100, 6, 7], (err) => {
  console.log(err);
});

module.exports.updateAccuracy(10, 255, true, (err) => {
  console.log(err);
});

*/
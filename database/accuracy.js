
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
    const handleExistingAcc = (err, rows, pool) => {
      if (err) return cb(err);

      if (!rows) {
        return cb(new Error(`Failed to retrieve existing accuracies 
        for the given user and set of flashcards.`));
      }

      // extract just the flashcard UIDs themselves
      const existingCards = rows.map(r => r.flashcard_uid);

      // which cards do we need to initialize an accuracy for
      const cardsToInit = pool.filter(
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
      // get every card's UID
      con.query(`SELECT uid FROM flashcards;`, (err, flashcards) => {
        if (err) return cb(err);

        const pool = flashcards.map(card => card.uid);  // extract list of UIDs

        con.query(
          `SELECT flashcard_uid FROM accuracy 
          WHERE user_uid = ?;`,
          [userUID], (err, rows) => {
            handleExistingAcc(err, rows, pool)
          });
      });
    } else {
      con.query(
        `SELECT flashcard_uid FROM accuracy 
        WHERE user_uid = ? AND flashcard_uid IN (?);`,
        [userUID, flashcardUIDs], (err, rows) => {
          handleExistingAcc(err, rows, flashcardUIDs);
        });
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
  },

  /*  accuraciesForGroup :: (groupUID :: Number, userUID :: Number ->
                            Map:UID -> Accuracy)
      Get the accuracies for all cards in a given group for a given user. */
  accuraciesForGroup: (groupUID, userUID, cb) => {
    parseAccuracies = (err, accs) => {
      if (err) return cb(err);

      let a, cardUIDToAccuracy = {};

      // make null values 0 and compute percent accuracy for each card
      for (let i = 0; i < accs.length; i++) {
        a = accs[i];

        a.correct = a.correct ? a.correct : 0;
        a.total = a.total ? a.total : 0;
        a.percentage = (a.total ? (a.correct / a.total) * 100 : 0).toFixed(2);  // percent accuracy

        cardUIDToAccuracy[a.flashcard_uid] = a;
      }

      return cb(err, cardUIDToAccuracy);
    }

    con.query(`
      SELECT
        ig.flashcard_uid,
        a.correct,
        a.total
      FROM
        in_group ig LEFT JOIN accuracy a ON 
        ig.flashcard_uid = a.flashcard_uid
        AND a.user_uid = ?
      WHERE ig.group_uid = ?;`,
      [userUID, groupUID], parseAccuracies);
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

module.exports.accuraciesForGroup(35, 21, (err, accs) => {
  console.log(err);
  console.log(accs);
});

*/

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
  },

  /*  getCardsToChooseFrom :: (byGroup :: Boolean, cardPool :: String -> List<Number>)
      If byGroup is true, parse the cardPool string to get the UIDs. Otherwise,
      select all flashcard UIDs from cards table. Returns list of UIDs. */
  getCardsToChooseFrom: (byGroup, cardPool, userUID, cb) => {
    // if selecting from the card pool given
    if (byGroup) {
      const cardPoolSplit = cardPool.split(',');

      // select flashcards (with their accuracies for this user) from the pool
      con.query(`
        SELECT * FROM
          accuracy a JOIN flashcards f ON a.flashcard_uid = f.uid
        WHERE 
          a.user_uid = ?
          AND f.uid IN (?);`,
        [userUID, cardPoolSplit], cb)
    } else {
      // select ALL flashcards (with their accuracies for this user)
      con.query(`
        SELECT * FROM
          accuracy a LEFT JOIN flashcards f ON a.flashcard_uid = f.uid
        WHERE a.user_uid = ?;`,
        [userUID], cb)
    }
  },

  /*  chooseCard :: (accuracyBased :: Boolean, availCards :: List<Flashcard>
                    -> FlashcardRow)
      Select a single card, from the given list, either by using accuracy
      or random selection. */
  chooseCard: (accuracyBased, availCards, cb) => {
    let cardsWithProb;

    // do we even need to pay attention to accuracy
    if (accuracyBased) {
      // find the maximum number of attempts
      let max_attempts;
      for (let i = 0; i < availCards.length; i++) {
        if (!max_attempts || availCards[i].total > max_attempts) {
          max_attempts = availCards[i].total;
        }
      }

      // compute selection prob for every card
      cardsWithProb = availCards.map((c) => {
        // accuracy: # correct / (total attempts + 1)
        let accuracy = (max_attempts == 0 || c.total == 0) ? 0 : c.correct / (c.total + 1);

        // relative frequency of this card showing up in the past
        let attemptFreq = (max_attempts == 0 || c.total == 0) ? 1 : c.total / max_attempts;

        // compute probability that card is kept, given it is selected
        c.probability = (1 - accuracy) * attemptFreq;
        return c;
      });

    } else {
      // uniform probability (I know they don't sum to 1)
      cardsWithProb = availCards.map((c) => {
        c.probability = 1;
        return c;
      })
    }

    // select a card
    module.exports.selectAtWeightedRandom(cardsWithProb, cb);
  },

  /*  selectAtWeightedRandom :: (cards :: List<Flashcard> -> Flashcard)
      Select a card randomly from the list, where each card's probability
      of being selected is given by its 'probability' field. */
  selectAtWeightedRandom: (cards, cb) => {
    let foundCard = false, rand;
    while (!foundCard) {
      // choose a random card
      rand = cards[Math.floor(Math.random() * cards.length)];

      // decide whether or keep/discard this card based on its probability of being kept.
      if (Math.random() < rand.probability) {
        foundCard = true;
        break;
      }
    }

    // return the selected card
    cb(rand);
  }

}

// Tests
/*

module.exports.uidStringFromGroups([2], (err, str) => {
  console.log(err);
  console.log(str);
});

module.exports.getCardsToChooseFrom(true, '21,64,108,112,118,204,248', 21, (err, cards) => {
  console.log(err);
  console.log(cards);
});

*/
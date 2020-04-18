
/*
  database/flashcard.js: Flashcard-related database queries
*/

const con = require('../database.js').connection;
const sys = require('../settings.js');

module.exports = {

  /* FlashcardRow = { 
    uid :: Number, 
    gloss :: String, 
    definition :: String, 
    video :: String 
  } */

  /*  getFlashcard :: (uid :: Number -> FlashcardRow)
      Get the flashcard row associated with a given UID */
  getFlashcard: (uid, cb) => {
    const returnRow = (err, rows) => {
      if (err) return cb(err);

      if (!rows || rows.length < 1) {
        return cb(new Error("Failed to find a flashcard with the given identifier"));
      }

      cb(err, rows[0]);
    }

    con.query(
      `SELECT * FROM flashcards WHERE uid = ?;`, 
      [uid], returnRow);
  },

  /*  allFlashcards :: ( -> List<FlashcardRow>)
      Get all the flashcards in the system */
  allFlashcards: (cb) => {
    con.query('SELECT * FROM flashcards;', cb);
  },

  /*  addFlashcard :: (gloss :: String, definition :: String, video :: String 
                      -> FlashcardRow)
      Adds a new flashcard to the database, returning the row */
  addFlashcard: (gloss, definition, video, cb) => {
    const handle = (err, rows) => {
      if (err) return cb(err);

      if (rows.length < 2 || rows[1].length < 1) {
        return cb(new Error("Failed to retrieve flashcard row on insert"));
      }

      // send back the row
      cb(err, rows[1][0]);
    }

    con.query(
      `INSERT INTO flashcards (gloss, definition, video) VALUES (?, ?, ?); 
      SELECT * FROM flashcards WHERE uid = LAST_INSERT_ID();`,
      [gloss, definition, video], handle);
  },

  /*  editFlashcard :: (uid :: Number, gloss :: String, definition :: String,
                        video :: String -> FlashcardRow) 
      Edits the fields of an existing flashcard */
  editFlashcard: (uid, gloss, definition, video, cb) => {
    const handle = (err, rows) => {
      if (err) return cb(err);

      if (rows.length < 2 || rows[1].length < 1) {
        return cb(new Error("Failed to retrieve flashcard row on update"));
      }

      // send back the row
      cb(err, rows[1][0]);
    }

    con.query(
      `UPDATE flashcards SET 
        gloss = ?, definition = ?, video = ? 
      WHERE uid = ?; 
      SELECT * FROM flashcards WHERE uid = ?;`,
      [gloss, definition, video, uid, uid], handle);
  },

  /*  deleteFlashcard :: (uid :: Number -> )
      Removes a flashcard from the database, by UID */
  deleteFlashcard: (uid, cb) => {
    // just run the query
    con.query('DELETE FROM flashcards WHERE uid = ?;', [uid], cb)
  },

  /*  searchFlashcards :: (query :: String -> List<FlashcardRow>)
      Search for flashcards whose glosses/definitions are related 
      to the given query string */
  searchFlashcards: (query, cb) => {
    // add wildcard to end of query to expand
    let expandedQuery = query == "" ? query : query + "*";

    /* Run the search query (score by match with gloss, but include 
      results that match against definitions as well) */
    con.query(`
      SELECT 
        uid, 
        gloss, 
        definition, 
        MATCH (gloss) AGAINST (? IN BOOLEAN MODE) AS termScore
      FROM flashcards 
      WHERE MATCH (gloss, definition) AGAINST (? IN BOOLEAN MODE) 
      ORDER BY termScore DESC
      LIMIT ?;`,
      [expandedQuery, expandedQuery, sys.SEARCH.CARD_QUERY_LIMIT], cb);
  }
}


// Tests
/*

module.exports.getFlashcard(100, (err, row) => {
  console.log(err);
  console.log(row);
});

module.exports.allFlashcards((err, rows) => {
  console.log(err);
  console.log(rows);
});

module.exports.addFlashcard('GLOSS', 'Test definition', 
'https://www.handspeak.com/word/t/test.mp4', (err, row) => {
  console.log(err);
  console.log(row);
});

module.exports.editFlashcard(1, 'UPDATED GLOSS', 'new definition', 'new video', 
(err, row) => {
  console.log(err);
  console.log(row);
});

module.exports.deleteFlashcard(2, (err) => {
  console.log(err);
});

module.exports.searchFlashcards("est", (err, results) => {
  console.log(err);
  console.log(results);
});

*/

/*
  flashcard.js: Flashcard-related database queries
*/

const con = require('../database.js').connection;

module.exports = {

  /* FlashcardRow = { 
    uid :: Number, 
    gloss :: String, 
    definition :: String, 
    video :: String 
  } */

  /*  addFlashcard :: (gloss :: String, definition :: String, video :: String 
                      -> FlashcardRow)
      Adds a new flashcard to the database, returning the row */
  addFlashcard: (gloss, definition, video, cb) => {
    const handle = (err, rows) => {
      if (err) cb(err);

      if (rows.length < 2 || rows[1].length < 1) {
        cb(new Error("Failed to retrieve flashcard row on insert"));
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
      if (err) cb(err);

      if (rows.length < 2 || rows[1].length < 1) {
        cb(new Error("Failed to retrieve flashcard row on update"));
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
  }
}


// Tests
/*

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

*/
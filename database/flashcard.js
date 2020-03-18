
/*
  flashcard.js: Flashcard-related database queries
*/

const con = require('../database.js').connection;

module.exports = {
  /*  addFlashcard :: (gloss :: String, definition :: String, video :: String -> 
    { uid :: Number, gloss :: String, definition :: String, video :: String })
      Adds a new flashcard to the database, returning the row */
  addFlashcard: (gloss, definition, video, cb) => {
    const handle = (err, rows) => {
      if (err) cb(err);

      if (rows.length < 2 || rows[1].length < 1) {
        cb(new Error("Failed to retrieve flashcard row on insert"));
      }

      // send back the profile
      cb(err, rows[1][0]);
    }

    con.query(
      `INSERT INTO flashcards (gloss, definition, video) VALUES (?, ?, ?); 
      SELECT * FROM flashcards WHERE uid = LAST_INSERT_ID();`,
      [gloss, definition, video], handle)
  }
}


// Tests

module.exports.addFlashcard('GLOSS', 'Test definition', 
'https://www.handspeak.com/word/t/test.mp4', (err, row) => {
  console.log(err);
  console.log(row);
});

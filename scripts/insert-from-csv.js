
/*
  insert-from-csv.js: Automatically insert flashcards into db from a .csv file
*/

const db = require('../database.js');
const con = db.connection;
const parse = require('csv-parse');
const fs = require('fs');

/*
  Note: Assumes .csv file is of the following format:
    0 | <header>
    1 | <gloss-1>,<definition-1>,<video-1>
    2 | <gloss-2>,<definition-2>,<video-2>
    ...
*/

// log an error and exit
function error(msg) {
  console.log(msg);
  process.exit(1);
}

// check CLI args
if (process.argv.length != 3) {
  error(`usage: node insert-from-csv.js <csv-file>`);
}

const outFile = process.argv[2];

// read input .csv file
fs.readFile(outFile, "utf-8", (err, data) => {
  if (err) error(err.message);

  // parse CSV file into rows
  parse(data, {}, (err, rows) => {
    if (err) error(err.message);
    rows.shift(); // lose the headers (first row)

    // insert cards into the db
    con.query('INSERT INTO flashcards (gloss, definition, video) VALUES ?;', [rows], (err) => {
      if (err) error(err.message);
      console.log(`Success! ${rows.length} rows were added.`);
      process.exit(0);
    });
  });
});
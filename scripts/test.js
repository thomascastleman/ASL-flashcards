
/*
  test.js: Automated test data generation
*/

const db = require('../database.js');
const con = db.connection;
const casual = require('casual');

// Please write test data. Okay, okay.

const NUM_USERS = 20;
const NUM_GROUPS = 40;
const NUM_FLASHCARDS = 250;
const MAX_CARD_ATTEMPTS = 100;
const NUM_INGROUPS = 200; // lmao good luck explaining this
const NUM_ACCURACIES = 300;

const USERS_CROSS_CARDS = NUM_USERS * NUM_FLASHCARDS;
const GROUPS_CROSS_FLASHCARDS = NUM_GROUPS * NUM_FLASHCARDS;

// check bounds of our "relative" test data
if (NUM_INGROUPS > GROUPS_CROSS_FLASHCARDS) { 
  throw new Error("Cannot produce more unique group-flashcard pairs than are possible");
}
if (NUM_ACCURACIES > USERS_CROSS_CARDS) { 
  throw new Error("Cannot produce more unique user-flashcard accuracy measurements than are possible");
}

const signVideos = [
  'https://www.handspeak.com/word/l/language.mp4',
  'https://www.handspeak.com/word/a/ability.mp4',
  'https://www.handspeak.com/word/s/sentence.mp4',
  'https://www.handspeak.com/word/d/describe.mp4',
  'https://www.signingsavvy.com/media/mp4-ld/6/6999.mp4',
  'https://www.signingsavvy.com/media/mp4-ld/7/7683.mp4'
];
function randVideo() { return signVideos[Math.floor(Math.random() * signVideos.length)] }

casual.define('user', () => {
  return {
      name: `${casual.first_name} ${casual.last_name}`,
      email: casual.email
  };
});

casual.define('flashcard', () => {
  return {
      gloss: casual.word.toUpperCase(),
      definition: casual.description,
      video: randVideo()
  };
});

casual.define('group', () => {
  return {
      name: casual.title,
      ownerUID: Math.floor(Math.random() * NUM_USERS) + 1
  };
});

casual.define('in_group', () => {
  return {
      groupUID: Math.floor(Math.random() * NUM_GROUPS) + 1,
      flashcardUID: Math.floor(Math.random() * NUM_FLASHCARDS) + 1
  };
});

casual.define('accuracy', () => {
  const total = Math.floor(Math.random() * MAX_CARD_ATTEMPTS) + 1;
  return {
      userUID: Math.floor(Math.random() * NUM_USERS) + 1,
      flashcardUID: Math.floor(Math.random() * NUM_FLASHCARDS) + 1,
      correct: Math.floor(Math.random() * total),
      total: total
  };
});


/*  testUsers :: ( -> )
    Adds many many test users to the database. */
function testUsers(cb) {
  const insert = [];
  let u;

  for (let i = 0; i < NUM_USERS; i++) {
    u = casual.user;
    insert.push([u.name, u.email]);
  }

  // run the insert query
  con.query('INSERT INTO users (name, email) VALUES ?;', [insert], cb);
}

/*  testCards :: ( -> )
    Adds many many test flashcards to the database. */
function testCards(cb) {
  const insert = [];
  let c;

  for (let i = 0; i < NUM_FLASHCARDS; i++) {
    c = casual.flashcard;
    insert.push([c.gloss, c.definition, c.video]);
  }

  // run the insert query
  con.query('INSERT INTO flashcards (gloss, definition, video) VALUES ?;', [insert], cb);
}

/*  testGroups :: ( -> )
    Adds many many test groups to the database. */
function testGroups(cb) {
  const insert = [];
  let g;

  for (let i = 0; i < NUM_GROUPS; i++) {
    g = casual.group;
    insert.push([g.name, g.ownerUID]);
  }

  // run the insert query
  con.query('INSERT INTO groups (name, owner_uid) VALUES ?;', [insert], cb);
}

/*  testInGroupRelation :: ( -> )
    Adds many many test pairs to the "in group" relation in the database. */
function testInGroupRelation(cb) {
  const insert = [];
  let r;

  for (let i = 0; i < NUM_INGROUPS; i++) {
    r = casual.in_group;

    // if a pair identical to this hasn't already been added
    if (insert.filter(other => 
       other[0] == r.groupUID && other[1] == r.flashcardUID 
    ).length == 0) {
      insert.push([r.groupUID, r.flashcardUID]);
    }
  }

  // run the insert query
  con.query('INSERT INTO in_group (group_uid, flashcard_uid) VALUES ?;', [insert], cb);
}

/*  testAccuracies :: ( -> )
    Adds many many test accuracy measurements to the database. */
function testAccuracies(cb) {
  const insert = [];
  let a;

  for (let i = 0; i < NUM_ACCURACIES; i++) {
    a = casual.accuracy;

    // if a pair identical to this hasn't already been added
    if (insert.filter(other => 
        other[0] == a.userUID && other[1] == a.flashcardUID 
    ).length == 0) {
      insert.push([a.userUID, a.flashcardUID, a.correct, a.total]);
    }
  }

  // run the insert query
  con.query('INSERT INTO accuracy (user_uid, flashcard_uid, correct, total) VALUES ?;', [insert], cb);
}

console.log("Generating test data...");
testUsers((err) => {
  if (err) throw err;
  console.log(`Added ${NUM_USERS} users.`);

  testCards((err) => {
    if (err) throw err;
    console.log(`Added ${NUM_FLASHCARDS} flashcards.`);

    testGroups((err) => {
      if (err) throw err;
      console.log(`Added ${NUM_GROUPS} groups.`);

      testInGroupRelation((err) => {
        if (err) throw err;
        console.log(`Added ${NUM_INGROUPS} pairs to the "in group" relation.`);

        testAccuracies((err) => {
          if (err) throw err;
          console.log(`Added ${NUM_ACCURACIES} accuracy measurements.`);

          console.log("Test data complete.");
          process.exit(0);
        });
      });
    });
  });
});
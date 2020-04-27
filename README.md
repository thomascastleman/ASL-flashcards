# ASL-flashcards
Flashcard quizzes using video/text cards for studying American Sign Language vocabulary.

### Concept
This application was designed to give me access to video-based flashcards. Quizlet doesn't seem to do this, or at least not in their free version. With ASL it's particularly hard to study vocabulary/quiz yourself on your own. I find the majority of static picture/drawing-based representation of signs to be confusing and ambiguous. Videos are the natural medium here.

### What the software provides

- ability to make flashcards which pair a video of the sign with the gloss/definition of that sign.
- ability to make groups of flashcards for organized study
- quizzing from video-to-gloss or gloss-to-video

### Quizzing
The user can opt to quiz on every card known to the system, or on a group or set of groups. There are two quiz modes: random and accuracy-based. 

Random mode selects cards from the pool at random to present to the user. 

Accuracy-based mode selects cards from the pool based on your prior accuracy. Cards are selected uniformly at random until a card is "kept" and presented to the user. A card's probability of being kept is based on how often you've gotten it correct and how often it's been presented to you.

### Installation Details
#### Credentials

The file `credentials.js` contains sensitive information and should be formatted as follows:

```javascript
/*
  credentials.js: System credentials
*/

module.exports = {

  // Google OAuth2 credentials for user authentication
  GOOGLE_CLIENT_ID: '',
  GOOGLE_CLIENT_SECRET: '',

  // session encryption secret
  SESSION_SECRET: '',

  // MySQL credentials
  MYSQL_USERNAME: '',
  MYSQL_PASSWORD: '',

}
```

#### Database

Build the database with `SOURCE db.sql;`.

Make sure to `GRANT ALL PRIVILEGES ON asl_cards.* TO '<YOUR DB USER>'@'localhost';` and `FLUSH PRIVILEGES;` before attempting to run the software.

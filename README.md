# ASL-flashcards
An application to provide flashcard quizzes using video/English cards for expansion of American Sign Language vocabulary.

### Credentials

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

### Database

Build the database with `SOURCE db.sql;`.

Make sure to `GRANT ALL PRIVILEGES ON asl_cards.* TO '<YOUR DB USER>'@'localhost';` and `FLUSH PRIVILEGES;` before attempting to run the software.

### Templates

There are three provided templates:

- `error.html`: A generic error page for displaying error messages & redirect links. Fields are
    - `raw` (the raw error, if any)
    - `friendly` (a user-palatable message) 
    - `link` (a redirect link)
    - `linkTitle` (the title of the redirect link).
- `message.html`: A generic page for displaying messages to the user with redirect links. Fields are 
    - `title` (the page's title appearing at browser tab)
    - `header` (the message header)
    - `message` (the actual message content)
    - `link` and `linkTitle` as above.
- `sample.html`: A sample page with navbar & container to act as a starting point for new pages. Please remember to change the `<title>`.

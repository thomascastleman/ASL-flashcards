
DROP DATABASE IF EXISTS asl_cards;
CREATE DATABASE asl_cards;

USE asl_cards;

-- user roles
CREATE TABLE roles (
  uid INT NOT NULL AUTO_INCREMENT,
  title VARCHAR(64),
  PRIMARY KEY (uid)
);

-- role #1 is assumed default
INSERT INTO roles (title) VALUES ("Default");

-- user information
CREATE TABLE users (
  uid INT NOT NULL AUTO_INCREMENT,
  role INT DEFAULT 1,
  name VARCHAR(128),
  email VARCHAR(64),
  FOREIGN KEY (role) REFERENCES roles(uid),
  PRIMARY KEY (uid)
);

-- all ASL flashcard info
CREATE TABLE flashcards (
  uid INT NOT NULL AUTO_INCREMENT,
  gloss VARCHAR(64),
  definition TEXT,
  video VARCHAR(256),
  PRIMARY KEY (uid)
);

-- groups of flashcards
CREATE TABLE groups (
  uid INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(256),
  owner_uid INT NOT NULL,
  PRIMARY KEY (uid),
  FOREIGN KEY (owner_uid) REFERENCES users (uid)
);

-- relation on flashcards and groups: is flashcard f in group g?
CREATE TABLE in_group (
  uid INT NOT NULL AUTO_INCREMENT,
  group_uid INT NOT NULL,
  flashcard_uid INT NOT NULL,
  PRIMARY KEY (uid),
  FOREIGN KEY (group_uid) REFERENCES groups (uid),
  FOREIGN KEY (flashcard_uid) REFERENCES flashcards (uid)
);

CREATE TABLE accuracy (
  uid INT NOT NULL AUTO_INCREMENT,
  user_uid INT NOT NULL,
  flashcard_uid INT NOT NULL,
  correct INT DEFAULT 0,      -- number of correct responses to this card
  total INT DEFAULT 0,        -- number of attempts made
  PRIMARY KEY (uid),
  FOREIGN KEY (user_uid) REFERENCES users (uid),
  FOREIGN KEY (flashcard_uid) REFERENCES flashcards (uid)
);
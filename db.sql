
DROP DATABASE IF EXISTS db;
CREATE DATABASE db;

USE db;

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
  role INT,
  email VARCHAR(64),
  FOREIGN KEY (role) REFERENCES roles(uid),
  PRIMARY KEY (uid)
);
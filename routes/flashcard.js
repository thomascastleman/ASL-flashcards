
/*
  routes/flashcard.js: Routes related to updating flashcards
*/

const mid       = require('../middleware.js');
const cardCtrl  = require('../database/flashcard.js');
const Joi       = require('joi');
const vld       = require('express-joi-validation').createValidator({});

// Validation Schemas

const flashcardFields = Joi.object({
  gloss: Joi.string().required(),
  definition: Joi.string().allow('').optional(),
  video: Joi.string().required()
});

const searchFields = Joi.object({
  query: Joi.string().allow('').optional()
});

const scrapeFields = Joi.object({
  url: Joi.string().required()
});

module.exports = (app) => {

  // allow user to post a URL for card scraping
  app.get('/flashcard/scrape', mid.isAuth, (req, res) => {
    res.rend('flashcard/scrape.html');
  });

  app.post('/flashcard/scrape', mid.isAuth, vld.body(scrapeFields), (req, res) => {
    cardCtrl.scrapeFlashcard(req.body.url, (err, gloss, definition, video) => {
      if (err) return res.err({
        r: err,
        fr: 'Failed to scrape flashcard.',
        li: '/flashcard/create',
        ti: 'Create it from scratch'
      });

      // render the create page with scraped data filled in
      res.rend('flashcard/create.html', {
        gloss,
        definition,
        video
      })
    });
  });

  // renders search interface for flashcards
  app.get('/flashcard/search', mid.isAuth, (req, res) => {
    res.rend('flashcard/search.html');
  });

  // get search results for a query
  app.post('/flashcard/search', mid.isAuth, vld.body(searchFields), (req, res) => {
    const renderSearchPage = (err, flashcards) => {
      if (err) return res.err({
        r: err,
        fr: 'Failed to retrieve flashcard search results'
      });

      res.rend('flashcard/search.html', {
        flashcards,
        hasCardResults: flashcards.length > 0,
        query: req.body.query
      });
    }

    // run search query
    cardCtrl.searchFlashcards(req.body.query, renderSearchPage);
  });

  // interface for creating a new card
  app.get('/flashcard/create', mid.isAuth, (req, res) => {
    res.rend('flashcard/create.html');
  });

  // add a new flashcard
  app.post('/flashcard/create', mid.isAuth, vld.body(flashcardFields), (req, res) => {
    const renderCardPage = (err, cardRow) => {
      if (err) return res.err({ 
        r: err, 
        fr: 'Failed to create your flashcard.', 
        li: '/flashcard/create',
        ti: 'Try creating another flashcard'
      });

      // automatically redirect to the view page for the newly-created card
      res.redirect(`/flashcard/${cardRow.uid}`);
    }

    cardCtrl.addFlashcard(req.body.gloss, req.body.definition, 
      req.body.video, renderCardPage);
  });

  // interface for editing an existing flashcard
  app.get('/flashcard/edit/:uid', mid.isAuth, (req, res) => {
    // get the current fields
    cardCtrl.getFlashcard(req.params.uid, (err, flashcard) => {
      if (err) return res.err({
        r: err, 
        fr: 'Failed to find flashcard.'
      });

      res.rend('flashcard/edit.html', flashcard);
    });
  });

  // edit an existing flashcard
  app.post('/flashcard/edit/:uid', mid.isAuth, vld.body(flashcardFields), (req, res) => {
    const renderCardPage = (err, cardRow) => {
      if (err) return res.err({ 
        r: err, 
        fr: 'Failed to edit your flashcard.', 
        li: `/flashcard/edit/${req.params.uid}`,
        ti: 'Try editing again'
      });

      res.rend('message.html', {
        title: 'Edited flashcard!',
        header: 'Congrats!',
        message: 'Your flashcard was edited!',
        link: `/flashcard/${cardRow.uid}`,
        linkTitle: 'View it here!'
      });
    }

    cardCtrl.editFlashcard(req.params.uid, req.body.gloss,
      req.body.definition, req.body.video, renderCardPage);
  });

  // view a flashcard
  app.get('/flashcard/:uid', mid.isAuth, (req, res) => {
    // get the flashcard's info
    cardCtrl.getFlashcard(req.params.uid, (err, flashcard) => {
      if (err) return res.err({
        r: err, 
        fr: 'Failed to find flashcard.'
      });

      res.rend('flashcard/view.html', flashcard);
    });
  });

  // remove a flashcard from existence
  app.post('/flashcard/delete/:uid', mid.isAuth, (req, res) => {
    cardCtrl.deleteFlashcard(req.params.uid, (err) => {
      if (err) return res.err({
        r: err,
        fr: 'Could not delete your flashcard.'
      });

      res.rend('message.html', {
        title: 'Deleted flashcard!',
        header: 'Congrats!',
        message: 'Your flashcard was deleted!'
      });
    });
  });
}
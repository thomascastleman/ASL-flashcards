
/*
  routes/quiz.js: Routes for quizzing
*/

const mid         = require('../middleware.js');
const cardCtrl    = require('../database/flashcard.js');
const groupCtrl   = require('../database/group.js');
const quizCtrl    = require('../database/quiz.js');
const accCtrl     = require('../database/accuracy.js');
const Joi         = require('joi');
const vld         = require('express-joi-validation').createValidator({});

const setupSchema = Joi.object({
  selection_style: Joi.string().valid('random','accuracy-based').required(),
  prompting: Joi.string().valid('gloss_first', 'sign_first').required(),
  which_to_study: Joi.string().valid('all_cards', 'by_group').required()
}).options({
  allowUnknown: true
});

const inProgressSchema = Joi.object({
  selection_style: Joi.string().valid('random','accuracy-based').required(),
  prompting: Joi.string().valid('gloss_first', 'sign_first').required(),
  which_to_study: Joi.string().valid('all_cards', 'by_group').required(),
  card_pool: Joi.string().allow('').optional()
});

const accuracySchema = Joi.object({
  cardUID: Joi.number().integer().required(),
  correct: Joi.boolean().required()
});

module.exports = (app) => {

  app.get('/quiz', mid.isAuth, (req, res) => {
    const renderWithAllGroups = (err, groups) => {
      if (err) return res.error({
        r: err,
        fr: 'Failed to access groups for quiz parameters'
      });

      res.rend('quiz/params.html', {
        groups,
        hasGroups: groups.length > 0
      });
    };

    // get all groups to allow them to choose which to study
    groupCtrl.allGroups(renderWithAllGroups);
  });

  // parse the parameters for a quiz, send to confirmation page
  app.post('/quiz/setup', mid.isAuth, vld.body(setupSchema), (req, res) => {
    /*
      Here's what an example req.body looks like:
        {
          selection_style: 'random',
          prompting: 'gloss_first',
          which_to_study: 'by_group',
          'include-group-37': 'on',
          'include-group-6': 'on',
          'include-group-38': 'on'
        }
      
      These are the parameters:
        selection_style: 'random' | 'accuracy-based'
          (How are cards selected? At random, or by how accurate the user is?)
        
        prompting: 'gloss_first' | 'sign_first'
          (Which "side" of the card should be shown first in this quiz?)
        
        which_to_study: 'all_cards' | 'by_group'
          (Will the pool of flashcards be every card in the system? Or a subset
            defined by the included groups?)
        
        'include-group-<n>'
            (Indicates group with UID n should be included in this quiz)
    */

    if (req.body.which_to_study == "all_cards") {
      const params = {
        selection_style: req.body.selection_style,
        prompting: req.body.prompting,
        which_to_study: req.body.which_to_study
      };

      // once accuracies have been initialized for all cards, show confirmation
      const accuraciesInitialized = (err) => {
        if (err) return res.error({
          r: err,
          fr: 'Failed to initialize accuracies'
        });
  
        res.rend('quiz/confirmation.html', { params });
      }

      accCtrl.initializeAccuracies(
        req.user.local.uid, 
        true,
        [],
        accuraciesInitialized);

    } else if (req.body.which_to_study == "by_group") {
      // need to parse which groups are being included
      const keys = Object.keys(req.body);

      // filter out anything that's not related to including a group
      const onlyGroupIDs = keys.filter(k => k.includes("include-group-"));

      // parse the UID integers from each string
      const END_PREFIX = 14; // index where the "include-group-" prefix ends
      const UIDsExtracted = onlyGroupIDs.map(str => parseInt(str.substring(14, str.length), 10));

      // if there were no groups in the request
      if (UIDsExtracted.length == 0) return res.err({
        fr: 'No groups were chosen to be studied.'
      });

      const sendToConfirmationPage = (err, uidString) => {
        if (err) return res.error({
          r: err,
          fr: 'Failed to gather UIDs of all groups included in quiz'
        });

        const params = {
          selection_style: req.body.selection_style,
          prompting: req.body.prompting,
          which_to_study: req.body.which_to_study,
          card_pool: uidString
        };

        // once accuracies have been initialized for all cards, show confirmation
        const accuraciesInitialized = (err) => {
          if (err) return res.error({
            r: err,
            fr: 'Failed to initialize accuracies'
          });
    
          res.rend('quiz/confirmation.html', { params });
        }

        // initialize accuracies just for these cards
        accCtrl.initializeAccuracies(
          req.user.local.uid, 
          false,
          uidString.split(',').map(s => parseInt(s, 10)),
          accuraciesInitialized);
      }

      // get the UID string for cards in this group union
      quizCtrl.uidStringFromGroups(UIDsExtracted, sendToConfirmationPage);
    } else {
      res.error({
        fr: 'Invalid study mode: must study by group or all cards'
      });
    }
  });

  // given quiz parameters, select a card to show the user
  app.post('/quiz/inprogress', mid.isAuth, vld.body(inProgressSchema), (req, res) => {
    /*
        {
          selection_style: 'random' | 'accuracy-based',
          prompting: 'gloss_first' | 'sign_first',
          which_to_study: 'by_group' | 'all_cards',
          card_pool: '<potentially a very long string>' | ''
        }

        Here's how this gonna work:
          Get the list of cards (with accuracies) to choose from (quizCtrl.getCardsToChooseFrom)
          Choose a card, either randomly or accuracy-based (quizCtrl.chooseCard)

          Render 'quiz/inprogress.html' with {
            params: req.body,
            card: the card we chose
            showGloss: prompting == 'gloss_first' (just make this a boolean for mustache)
          }
    */
    const selectCard = (err, cards) => {
      if (err) return res.error({
        r: err,
        fr: 'Failed to get all flashcards in the study group'
      });

      // render the quiz page with the chosen cards
      const render = (chosenCard) => {

        console.log(chosenCard);

        res.rend('quiz/inprogress.html', {
          params: req.body,
          card: chosenCard,
          showGloss: req.body.prompting == 'gloss_first'  // boolean for mustache
        });
      }

      // choose a card at random (or by accuracy)
      quizCtrl.chooseCard(
        req.body.selection_style == 'accuracy-based',
        cards,
        render);
    }

    // get all flashcard rows from the pool (and their accuracy info)
    quizCtrl.getCardsToChooseFrom(
      req.body.which_to_study == 'by_group',
      req.body.card_pool,
      req.user.local.uid,
      selectCard);
  });

  // API for updating a user's accuracy with a given card
  app.post('/quiz/updateAccuracy', mid.isAuth, vld.body(accuracySchema), (req, res) => {

    // ------------ WRITE THIS 


    res.send({
      err: null
    })
  });

}

/*
  routes/quiz.js: Routes for quizzing
*/

const mid         = require('../middleware.js');
const cardCtrl    = require('../database/flashcard.js');
const groupCtrl   = require('../database/group.js');
const quizCtrl    = require('../database/quiz.js');
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

      res.rend('quiz/confirmation.html', { params });

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

        res.rend('quiz/confirmation.html', { params });
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
    res.send(req.body);
  });

}
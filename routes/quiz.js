
/*
  routes/quiz.js: Routes for quizzing
*/

const mid         = require('../middleware.js');
const cardCtrl    = require('../database/flashcard.js');
const groupCtrl   = require('../database/group.js');
const Joi         = require('joi');
const vld         = require('express-joi-validation').createValidator({});

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

  app.post('/quiz/start', mid.isAuth, (req, res) => {
    console.log(req.body);

    /*
        The state of the quiz is this:
          My selection_style: random or accuracy-based
          Pool: by group or all cards
          [1, 2, 3, 4, ... all my flashcard UIDs in the pool im picking from ... ] (only if NOT all cards)
    */

    if (req.body.which_to_study == "all_cards") {
      console.log("all of them");




    } else if (req.body.which_to_study == "by_group") {
      // need to parse which groups are being included
      const keys = Object.keys(req.body);

      // filter out anything that's not related to including a group
      const onlyGroupIDs = keys.filter(k => k.includes("include-group-"));

      const END_PREFIX = 14; // index where the "include-group-" prefix ends
      const UIDsExtracted = onlyGroupIDs.map(str => parseInt(str.substring(14, str.length), 10));

      if (UIDsExtracted.length == 0) return res.err({
        fr: 'No groups were chosen to be studied.'
      });

      // construct state string here


    } else {

    }
  });

}
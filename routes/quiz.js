
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
  });

}
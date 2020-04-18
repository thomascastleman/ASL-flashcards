
/*
  routes/group.js: Routes related to updating groups of cards
*/

const mid         = require('../middleware.js');
const groupCtrl   = require('../database/group.js');
const inGroupCtrl = require('../database/ingroup.js');
const cardCtrl    = require('../database/flashcard.js');
const Joi         = require('joi');
const vld         = require('express-joi-validation').createValidator({});

// Validation Schemas

const groupFields = Joi.object({
  name: Joi.string().required()
});

const searchFields = Joi.object({
  query: Joi.string()
});

const addRemoveCard = Joi.object({
  cardUID: Joi.number().integer(),
  groupUID: Joi.number().integer()
});

module.exports = (app) => {

  // renders search interface for groups
  app.get('/group/search', mid.isAuth, (req, res) => {
    const renderWithAllGroups = (err, groups) => {
      if (err) return res.error({
        r: err,
        fr: 'Failed to retrieve group search results'
      });

      res.rend('group/search.html', {
        groups,
        hasGroupResults: groups.length > 0
      })
    }

    // default to showing all groups
    groupCtrl.allGroups(renderWithAllGroups);
  });

  // get search results for a query
  app.post('/group/search', mid.isAuth, vld.body(searchFields), (req, res) => {
    const renderSearchPage = (err, groups) => {
      if (err) return res.error({
        r: err,
        fr: 'Failed to retrieve group search results'
      });

      res.rend('group/search.html', {
        groups,
        hasGroupResults: groups.length > 0
      });
    }

    // run search query
    groupCtrl.searchGroups(req.body.query, renderSearchPage);
  });

  // interface for creating a new group
  app.get('/group/create', mid.isAuth, (req, res) => {
    res.rend('group/create.html');
  });

  // add a new group
  app.post('/group/create', mid.isAuth, vld.body(groupFields), (req, res) => {
    const renderGroupPage = (err, groupRow) => {
      if (err) return res.err({ 
        r: err, 
        fr: 'Failed to create your group.', 
        li: '/group/create',
        ti: 'Try creating another group'
      });

      res.rend('message.html', {
        title: 'Created group!',
        header: 'Congrats!',
        message: 'Your group was created!',
        link: `/group/${groupRow.uid}`,
        linkTitle: 'View it here!'
      });
    }

    groupCtrl.addGroup(req.body.name, req.user.local.uid, renderGroupPage);
  });

  // interface for editing an existing group (just editing the name)
  app.get('/group/edit/:uid', mid.isAuth, (req, res) => {
    // get the current fields
    groupCtrl.getGroup(req.params.uid, (err, group) => {
      if (err) return res.err({
        r: err, 
        fr: 'Failed to find group.'
      });

      // check permissions
      if (req.user.local.uid != group.owner_uid) return res.err({
        fr: 'You are unable to edit this group (you do not own it)',
        li: `/group/${group.uid}`,
        ti: 'Back to group page'
      });

      res.rend('group/edit.html', {
        group,
        hasCardsInGroup: group.flashcards.length > 0
      });
    });
  });

  // search for flashcards while editing a group
  app.post('/group/edit/:uid/search', mid.isAuth, vld.body(searchFields), (req, res) => {
    // get the current fields
    groupCtrl.getGroup(req.params.uid, (err, group) => {
      if (err) return res.err({
        r: err, 
        fr: 'Failed to find group.'
      });

      // check permissions
      if (req.user.local.uid != group.owner_uid) return res.err({
        fr: 'You are unable to edit this group (you do not own it)',
        li: `/group/${group.uid}`,
        ti: 'Back to group page'
      });

      const renderWithSearchResults = (err, flashcards) => {
        if (err) return res.err({
          r: err,
          fr: 'Failed to search for flashcards to add to this group'
        });

        // render group edit page, but with flashcard search results
        res.rend('group/edit.html', {
          group,
          hasCardsInGroup: group.flashcards.length > 0,
          query: req.body.query,
          searchResults: flashcards,
          hasSearchResults: flashcards.length > 0
        });
      }

      // search for flashcards based on their query
      cardCtrl.searchFlashcards(req.body.query, renderWithSearchResults);
    });
  });

  // edit an existing group
  app.post('/group/edit/updateName/:uid', mid.isAuth, vld.body(groupFields), (req, res) => {
    const renderGroupPage = (err, groupRow) => {
      if (err) return res.err({ 
        r: err, 
        fr: 'Failed to update your group name.', 
        li: `/group/edit/${req.params.uid}`,
        ti: 'Try editing again'
      });

      res.rend('message.html', {
        title: 'Updated group name!',
        header: 'Congrats!',
        message: 'Your group name was edited!',
        link: `/group/${groupRow.uid}`,
        linkTitle: 'View it here!'
      });
    }

    // first, determine that this user can edit this group
    const checkPermissions = (err, group) => {
      if (err) return res.err({
        r: err,
        fr: 'Failed to determine edit permissions for this group.',
        li: `/group/${req.params.uid}`,
        ti: 'Back to group page'
      });

      // check permission
      if (req.user.local.uid != group.owner_uid) return res.err({
        fr: 'You do not have permission to edit this group',
        li: `/group/${req.params.uid}`,
        ti: 'Back to group page'
      });

      // allow the edit
      groupCtrl.editGroup(req.params.uid, req.body.name, renderGroupPage);
    }

    // start by getting the group info to check edit permission
    groupCtrl.getGroup(req.params.uid, checkPermissions)
  });

  // view a group
  app.get('/group/:uid', mid.isAuth, (req, res) => {
    // get the group's info
    groupCtrl.getGroup(req.params.uid, (err, group) => {
      if (err) return res.err({
        r: err, 
        fr: 'Failed to find group.'
      });

      // register if the group is owned by the viewing user (for edit link)
      group.isOwner = req.user.local.uid == group.owner_uid;

      // register if the group has any flashcards in it
      group.hasCards = group.flashcards.length > 0;

      res.rend('group/view.html', group);
    });
  });

  // remove a group from existence
  app.post('/group/delete/:uid', mid.isAuth, (req, res) => {
    groupCtrl.deleteGroup(req.params.uid, (err) => {
      if (err) return res.err({
        r: err,
        fr: 'Could not delete your group.'
      });

      res.rend('message.html', {
        title: 'Deleted group!',
        header: 'Congrats!',
        message: 'Your group was deleted!'
      });
    });
  });






  // ------------------- CHECK PERMISSIONS ON THESE -------------------------------

  // add a flashcard to a group
  app.post('/group/addCard', mid.isAuth, vld.body(addRemoveCard), (req, res) => {
    const handle = (err) => {
      res.send({ err });
    }

    // add card to group in DB
    inGroupCtrl.addCardToGroup(req.body.cardUID, req.body.groupUID, handle);
  });

  // remove a flashcard from a group
  app.post('/group/removeCard', mid.isAuth, vld.body(addRemoveCard), (req, res) => {
    const handle = (err) => {
      res.send({ err });
    }

    // remove card from group in DB
    inGroupCtrl.removeCardFromGroup(req.body.cardUID, req.body.groupUID, handle);
  });
}
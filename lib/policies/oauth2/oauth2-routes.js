'use strict';

const session = require('express-session');
const express = require('express');
const passport = require('passport');
const site = require('./site');
const oauth2Server = require('./oauth2-server');
const logger = require('../../logger').policy;
const path = require('path');

module.exports = function (app, config) {
  app.set('view engine', 'ejs');
  if (config.systemConfig.session.storeProvider) {
    try {
      const ProviderStore = require(config.systemConfig.session.storeProvider)(session);
      config.systemConfig.session.store = new ProviderStore(config.systemConfig.session.storeOptions);
      delete config.systemConfig.session.storeProvider;
      delete config.systemConfig.session.storeOptions;
    } catch (error) {
      logger.error(`Failed to initialize custom express-session store, please ensure you have ${config.systemConfig.session.storeProvider} npm package installed`);
      throw error;
    }
  }

  const middlewares = [
    express.urlencoded({ extended: true }),
    express.json(),
    session(config.systemConfig.session),
    passport.initialize(),
    passport.session()
  ];
  app.use('/api', express.static(path.join(__dirname, 'public')));
  app.get('/api/oauth2/login', site.loginForm);
  app.post('/api/oauth2/login', middlewares, site.login);
  app.get('/api/logout', site.logout);

  app.use('/api/oauth2', middlewares);
  app.get('/api/oauth2/authorize', oauth2Server.authorization);
  app.post('/api/oauth2/authorize/decision', oauth2Server.decision);
  app.post('/api/oauth2/token', oauth2Server.token);

  return app;
};

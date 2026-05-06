const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const { env } = require('./config/env');
const routes = require('./routes');
const { notFound } = require('./middlewares/notFound');
const { errorHandler } = require('./middlewares/errorHandler');

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  if (env.nodeEnv !== 'test') {
    app.use(morgan('dev'));
  }

  app.use('/', routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };

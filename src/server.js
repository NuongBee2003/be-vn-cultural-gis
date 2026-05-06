const { env } = require('./config/env');
const { createApp } = require('./app');

const app = createApp();

app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://localhost:${env.port} (${env.nodeEnv})`);
});

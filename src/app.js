import 'dotenv/config';
import createServer from './Infrastructures/http/createServer.js';
import container from './Infrastructures/container.js';
import config from './Commons/config.js';

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

const start = async () => {
  try {
    const app = await createServer(container);
    const { host, port } = config.app;

    app.listen(port, host, () => {
      console.log(`server start at http://${host}:${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();

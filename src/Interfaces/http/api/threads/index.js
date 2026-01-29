import ThreadsHandler from './handler.js';
import createThreadsRouter from './routes.js';
import authenticationMiddleware from '../../../../Infrastructures/http/middlewares/authentication.js';

export default (container) => {
  const threadsHandler = new ThreadsHandler(container);
  const authenticate = authenticationMiddleware(container);
  return createThreadsRouter(threadsHandler, authenticate);
};

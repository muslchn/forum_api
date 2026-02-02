import ThreadsHandler from './handler-threads.js';
import CommentsHandler from './handler-comments.js';
import createThreadsRouter from './routes.js';
import authenticationMiddleware from '../../../../Infrastructures/http/middlewares/authentication.js';

export default (container) => {
  const threadsHandler = new ThreadsHandler(container);
  const commentsHandler = new CommentsHandler(container);
  const authenticate = authenticationMiddleware(container);
  return createThreadsRouter(threadsHandler, commentsHandler, authenticate);
};

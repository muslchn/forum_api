import express from 'express';

const createThreadsRouter = (threadsHandler, commentsHandler, authenticationMiddleware) => {
  const router = express.Router();

  router.post('/', authenticationMiddleware, threadsHandler.postThreadHandler);
  router.post('/:threadId/comments', authenticationMiddleware, commentsHandler.postCommentHandler);
  router.delete('/:threadId/comments/:commentId', authenticationMiddleware, commentsHandler.deleteCommentHandler);
  router.get('/:threadId', threadsHandler.getThreadHandler);

  return router;
};

export default createThreadsRouter;

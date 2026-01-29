import express from 'express';

const createThreadsRouter = (handler, authenticationMiddleware) => {
  const router = express.Router();

  router.post('/', authenticationMiddleware, handler.postThreadHandler);
  router.post('/:threadId/comments', authenticationMiddleware, handler.postCommentHandler);
  router.delete('/:threadId/comments/:commentId', authenticationMiddleware, handler.deleteCommentHandler);
  router.get('/:threadId', handler.getThreadHandler);

  return router;
};

export default createThreadsRouter;

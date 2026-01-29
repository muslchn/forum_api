import AddThreadUseCase from '../../../../Applications/use_case/AddThreadUseCase.js';
import AddCommentUseCase from '../../../../Applications/use_case/AddCommentUseCase.js';
import DeleteCommentUseCase from '../../../../Applications/use_case/DeleteCommentUseCase.js';
import GetThreadUseCase from '../../../../Applications/use_case/GetThreadUseCase.js';

class ThreadsHandler {
  constructor(container) {
    this._container = container;

    this.postThreadHandler = this.postThreadHandler.bind(this);
    this.postCommentHandler = this.postCommentHandler.bind(this);
    this.deleteCommentHandler = this.deleteCommentHandler.bind(this);
    this.getThreadHandler = this.getThreadHandler.bind(this);
  }

  async postThreadHandler(req, res, next) {
    try {
      const addThreadUseCase = this._container.getInstance(AddThreadUseCase.name);
      const { id: owner } = req.auth.credentials;
      const addedThread = await addThreadUseCase.execute({
        ...req.body,
        owner,
      });

      res.status(201).json({
        status: 'success',
        data: {
          addedThread,
        },
      });
    } catch (error) {
      console.error('Thread POST error:', error);
      next(error);
    }
  }

  async postCommentHandler(req, res, next) {
    try {
      const addCommentUseCase = this._container.getInstance(AddCommentUseCase.name);
      const { id: owner } = req.auth.credentials;
      const { threadId } = req.params;

      const addedComment = await addCommentUseCase.execute({
        threadId,
        owner,
        content: req.body.content,
      });

      res.status(201).json({
        status: 'success',
        data: {
          addedComment,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteCommentHandler(req, res, next) {
    try {
      const deleteCommentUseCase = this._container.getInstance(DeleteCommentUseCase.name);
      const { id: owner } = req.auth.credentials;
      const { threadId, commentId } = req.params;

      await deleteCommentUseCase.execute({
        threadId,
        commentId,
        owner,
      });

      res.json({
        status: 'success',
      });
    } catch (error) {
      next(error);
    }
  }

  async getThreadHandler(req, res, next) {
    try {
      const getThreadUseCase = this._container.getInstance(GetThreadUseCase.name);
      const { threadId } = req.params;
      const thread = await getThreadUseCase.execute(threadId);

      res.json({
        status: 'success',
        data: {
          thread,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default ThreadsHandler;

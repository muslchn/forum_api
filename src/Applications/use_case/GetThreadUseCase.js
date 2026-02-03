import ThreadDetail from '../../Domains/threads/entities/ThreadDetail.js';
import CommentDetail from '../../Domains/comments/entities/CommentDetail.js';

class GetThreadUseCase {
  constructor({ threadRepository, commentRepository }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
  }

  async execute(threadId) {
    const thread = await this._threadRepository.getThreadById(threadId);
    const comments = await this._commentRepository.getCommentsByThreadId(threadId);

    const mappedComments = comments.map((comment) => {
      const commentDetail = new CommentDetail({
        id: comment.id,
        content: comment.content,
        date: comment.date instanceof Date ? comment.date.toISOString() : comment.date,
        username: comment.username,
        isDelete: comment.is_delete,
      });

      return {
        id: commentDetail.id,
        username: commentDetail.username,
        date: commentDetail.date,
        content: commentDetail.content,
      };
    });

    const threadDetail = new ThreadDetail({
      ...thread,
      date: thread.date instanceof Date ? thread.date.toISOString() : thread.date,
      comments: mappedComments,
    });

    return threadDetail;
  }
}

export default GetThreadUseCase;

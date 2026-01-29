import ThreadDetail from '../../Domains/threads/entities/ThreadDetail.js';

class GetThreadUseCase {
  constructor({ threadRepository, commentRepository }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
  }

  async execute(threadId) {
    const thread = await this._threadRepository.getThreadById(threadId);
    const comments = await this._commentRepository.getCommentsByThreadId(threadId);

    const mappedComments = comments.map((comment) => ({
      id: comment.id,
      username: comment.username,
      date: comment.date instanceof Date ? comment.date.toISOString() : comment.date,
      content: comment.is_delete ? '**komentar telah dihapus**' : comment.content,
    }));

    const threadDetail = new ThreadDetail({
      ...thread,
      date: thread.date instanceof Date ? thread.date.toISOString() : thread.date,
      comments: mappedComments,
    });

    return threadDetail;
  }
}

export default GetThreadUseCase;

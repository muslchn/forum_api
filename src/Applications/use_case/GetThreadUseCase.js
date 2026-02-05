import ThreadDetail from '../../Domains/threads/entities/ThreadDetail.js';
import CommentDetail from '../../Domains/comments/entities/CommentDetail.js';
import ReplyDetail from '../../Domains/replies/entities/ReplyDetail.js';

class GetThreadUseCase {
  constructor({ threadRepository, commentRepository, replyRepository }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
    this._replyRepository = replyRepository;
  }

  async execute(threadId) {
    const thread = await this._threadRepository.getThreadById(threadId);
    const comments = await this._commentRepository.getCommentsByThreadId(threadId);
    const commentIds = comments.map((comment) => comment.id);
    const replies = await this._replyRepository.getRepliesByCommentIds(commentIds);

    const repliesByCommentId = replies.reduce((acc, reply) => {
      if (!acc[reply.comment_id]) {
        acc[reply.comment_id] = [];
      }
      acc[reply.comment_id].push(reply);
      return acc;
    }, {});

    const mappedComments = comments.map((comment) => {
      const commentReplies = repliesByCommentId[comment.id] || [];
      const mappedReplies = commentReplies.map((reply) => {
        const replyDetail = new ReplyDetail({
          id: reply.id,
          content: reply.content,
          date: reply.date instanceof Date ? reply.date.toISOString() : reply.date,
          username: reply.username,
          isDelete: reply.is_delete,
        });

        return {
          id: replyDetail.id,
          content: replyDetail.content,
          date: replyDetail.date,
          username: replyDetail.username,
        };
      });

      const commentDetail = new CommentDetail({
        id: comment.id,
        content: comment.content,
        date: comment.date instanceof Date ? comment.date.toISOString() : comment.date,
        username: comment.username,
        isDelete: comment.is_delete,
        likeCount: Number(comment.like_count ?? 0),
      });

      return {
        id: commentDetail.id,
        username: commentDetail.username,
        date: commentDetail.date,
        content: commentDetail.content,
        likeCount: commentDetail.likeCount,
        replies: mappedReplies,
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

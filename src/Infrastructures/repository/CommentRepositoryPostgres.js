import CommentRepository from '../../Domains/comments/CommentRepository.js';
import AddedComment from '../../Domains/comments/entities/AddedComment.js';
import AuthorizationError from '../../Commons/exceptions/AuthorizationError.js';
import NotFoundError from '../../Commons/exceptions/NotFoundError.js';

class CommentRepositoryPostgres extends CommentRepository {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
  }

  async addComment(newComment) {
    const { content, threadId, owner } = newComment;
    const id = `comment-${this._idGenerator()}`;
    const date = new Date().toISOString();

    const query = {
      text: `INSERT INTO comments (id, thread_id, content, date, owner, is_delete, like_count)
        VALUES($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, content, owner`,
      values: [id, threadId, content, date, owner, false, 0],
    };

    const result = await this._pool.query(query);

    return new AddedComment(result.rows[0]);
  }

  async verifyCommentExists(commentId, threadId) {
    const query = {
      text: 'SELECT id FROM comments WHERE id = $1 AND thread_id = $2',
      values: [commentId, threadId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('comment tidak ditemukan');
    }
  }

  async verifyCommentOwner(commentId, owner) {
    const query = {
      text: 'SELECT owner FROM comments WHERE id = $1',
      values: [commentId],
    };

    const result = await this._pool.query(query);

    if (result.rows[0].owner !== owner) {
      throw new AuthorizationError('anda tidak berhak mengakses komentar ini');
    }
  }

  async deleteCommentById(commentId) {
    const query = {
      text: 'UPDATE comments SET is_delete = TRUE WHERE id = $1',
      values: [commentId],
    };

    await this._pool.query(query);
  }

  async getCommentsByThreadId(threadId) {
    const query = {
      text: `SELECT comments.id, comments.content, comments.date, comments.is_delete, users.username, COALESCE(comments.like_count, 0) as like_count
        FROM comments
        LEFT JOIN users ON users.id = comments.owner
        WHERE comments.thread_id = $1
        ORDER BY comments.date ASC`,
      values: [threadId],
    };

    const result = await this._pool.query(query);
    return result.rows;
  }

  async addCommentLike(commentId, userId) {
    const id = `like-${this._idGenerator()}`;
    const createdAt = new Date().toISOString();

    const query = {
      text: `INSERT INTO comment_likes (id, comment_id, user_id, created_at) 
             VALUES($1, $2, $3, $4) 
             ON CONFLICT (comment_id, user_id) DO NOTHING
             RETURNING id`,
      values: [id, commentId, userId, createdAt],
    };

    const result = await this._pool.query(query);

    if (result.rowCount > 0) {
      // New like was added, increment like_count
      await this._pool.query({
        text: 'UPDATE comments SET like_count = like_count + 1 WHERE id = $1',
        values: [commentId],
      });
    }

    return result.rowCount > 0;
  }

  async removeCommentLike(commentId, userId) {
    const query = {
      text: 'DELETE FROM comment_likes WHERE comment_id = $1 AND user_id = $2',
      values: [commentId, userId],
    };

    const result = await this._pool.query(query);

    if (result.rowCount > 0) {
      // Like was removed, decrement like_count
      await this._pool.query({
        text: 'UPDATE comments SET like_count = GREATEST(like_count - 1, 0) WHERE id = $1',
        values: [commentId],
      });
    }

    return result.rowCount > 0;
  }

  async getCommentLikeByCommentIdAndUserId(commentId, userId) {
    const query = {
      text: 'SELECT id FROM comment_likes WHERE comment_id = $1 AND user_id = $2',
      values: [commentId, userId],
    };

    const result = await this._pool.query(query);
    return result.rowCount > 0;
  }

  async getCommentLikeCountByCommentId(commentId) {
    const query = {
      text: 'SELECT COALESCE(like_count, 0) as like_count FROM comments WHERE id = $1',
      values: [commentId],
    };

    const result = await this._pool.query(query);
    return result.rows[0]?.like_count || 0;
  }

}

export default CommentRepositoryPostgres;

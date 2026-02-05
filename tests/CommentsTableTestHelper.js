/* istanbul ignore file */
import pool from '../src/Infrastructures/database/postgres/pool.js';

const CommentsTableTestHelper = {
  async addComment({
    id = 'comment-123',
    threadId = 'thread-123',
    content = 'comment content',
    date = new Date().toISOString(),
    owner = 'user-123',
    isDelete = false,
    likeCount = 0,
  }) {
    const query = {
      text: `INSERT INTO comments (id, thread_id, content, date, owner, is_delete, like_count)
        VALUES($1, $2, $3, $4, $5, $6, $7)`,
      values: [id, threadId, content, date, owner, isDelete, likeCount],
    };

    await pool.query(query);
  },

  async findCommentsById(id) {
    const query = {
      text: 'SELECT * FROM comments WHERE id = $1',
      values: [id],
    };

    const result = await pool.query(query);
    return result.rows;
  },

  async cleanTable() {
    await pool.query('DELETE FROM comments WHERE 1=1');
  },
};

export default CommentsTableTestHelper;

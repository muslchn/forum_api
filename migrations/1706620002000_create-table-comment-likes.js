/* eslint-disable camelcase */
export const up = (pgm) => {
  // Add like_count column to comments table
  pgm.addColumn('comments', {
    like_count: {
      type: 'INTEGER',
      notNull: true,
      defaultValue: 0,
    },
  });

  // Create comment_likes table
  pgm.createTable('comment_likes', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    comment_id: {
      type: 'VARCHAR(50)',
      notNull: true,
      references: 'comments',
      onDelete: 'CASCADE',
    },
    user_id: {
      type: 'VARCHAR(50)',
      notNull: true,
      references: 'users',
      onDelete: 'CASCADE',
    },
    created_at: {
      type: 'TIMESTAMP',
      notNull: true,
      defaultValue: pgm.func('CURRENT_TIMESTAMP'),
    },
  });

  // Add unique constraint to prevent duplicate likes
  pgm.addConstraint('comment_likes', 'unique_comment_user_like', {
    unique: ['comment_id', 'user_id'],
  });

  // Create index for faster lookups
  pgm.createIndex('comment_likes', ['comment_id', 'user_id']);
};
/* eslint-enable camelcase */

export const down = (pgm) => {
  pgm.dropIndex('comment_likes', ['comment_id', 'user_id']);
  pgm.dropConstraint('comment_likes', 'unique_comment_user_like');
  pgm.dropTable('comment_likes');
  pgm.dropColumn('comments', 'like_count');
};

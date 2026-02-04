/* eslint-disable camelcase */
export const up = (pgm) => {
  pgm.createTable('comments', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    thread_id: {
      type: 'VARCHAR(50)',
      notNull: true,
      references: 'threads',
      onDelete: 'CASCADE',
    },
    content: {
      type: 'TEXT',
      notNull: true,
    },
    date: {
      type: 'TIMESTAMP',
      notNull: true,
    },
    owner: {
      type: 'VARCHAR(50)',
      notNull: true,
      references: 'users',
      onDelete: 'CASCADE',
    },
    is_delete: {
      type: 'BOOLEAN',
      notNull: true,
      defaultValue: false,
    },
  });
};
/* eslint-enable camelcase */

export const down = (pgm) => {
  pgm.dropTable('comments');
};

/* eslint-disable camelcase */
export const up = (pgm) => {
  pgm.addColumn('comments', {
    like_count: {
      type: 'INTEGER',
      notNull: true,
      defaultValue: 0,
    },
  });
};
/* eslint-enable camelcase */

export const down = (pgm) => {
  pgm.dropColumn('comments', 'like_count');
};

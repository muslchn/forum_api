class CommentLike {
  constructor(payload) {
    this._verifyPayload(payload);

    const { id, commentId, userId, createdAt } = payload;

    this.id = id;
    this.commentId = commentId;
    this.userId = userId;
    this.createdAt = createdAt;
  }

  _verifyPayload({ id, commentId, userId }) {
    if (!id || !commentId || !userId) {
      throw new Error('COMMENT_LIKE.NOT_CONTAIN_NEEDED_PROPERTY');
    }

    if (
      typeof id !== 'string'
      || typeof commentId !== 'string'
      || typeof userId !== 'string'
    ) {
      throw new Error('COMMENT_LIKE.NOT_MEET_DATA_TYPE_SPECIFICATION');
    }
  }
}

export default CommentLike;

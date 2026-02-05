class CommentDetail {
  constructor(payload) {
    this._verifyPayload(payload);

    const {
      id, content, date, username, isDelete, likeCount = 0,
    } = payload;

    this.id = id;
    this.content = isDelete ? '**komentar telah dihapus**' : content;
    this.date = date;
    this.username = username;
    this.likeCount = likeCount;
  }

  _verifyPayload({
    id, date, username, isDelete, likeCount = 0,
  }) {
    if (!id || !date || !username || isDelete === undefined) {
      throw new Error('COMMENT_DETAIL.NOT_CONTAIN_NEEDED_PROPERTY');
    }

    if (typeof id !== 'string' || typeof username !== 'string') {
      throw new Error('COMMENT_DETAIL.NOT_MEET_DATA_TYPE_SPECIFICATION');
    }

    if (typeof likeCount !== 'number') {
      throw new Error('COMMENT_DETAIL.NOT_MEET_DATA_TYPE_SPECIFICATION');
    }
  }
}

export default CommentDetail;

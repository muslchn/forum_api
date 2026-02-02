import CommentDetail from '../CommentDetail.js';

describe('CommentDetail entities', () => {
  it('should throw error when payload not contain needed property', () => {
    const payload = {
      id: 'comment-123',
      content: 'comment content',
      date: '2021-08-08T07:22:33.555Z',
    };

    expect(() => new CommentDetail(payload)).toThrowError('COMMENT_DETAIL.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload not meet data type specification', () => {
    const payload = {
      id: 123,
      content: 'comment content',
      date: '2021-08-08T07:22:33.555Z',
      username: 'dicoding',
      isDelete: false,
    };

    expect(() => new CommentDetail(payload)).toThrowError('COMMENT_DETAIL.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should create CommentDetail object correctly when comment not deleted', () => {
    const payload = {
      id: 'comment-123',
      content: 'comment content',
      date: '2021-08-08T07:22:33.555Z',
      username: 'dicoding',
      isDelete: false,
    };

    const commentDetail = new CommentDetail(payload);

    expect(commentDetail.id).toEqual(payload.id);
    expect(commentDetail.content).toEqual(payload.content);
    expect(commentDetail.date).toEqual(payload.date);
    expect(commentDetail.username).toEqual(payload.username);
  });

  it('should create CommentDetail object correctly when comment is deleted', () => {
    const payload = {
      id: 'comment-123',
      content: 'comment content',
      date: '2021-08-08T07:22:33.555Z',
      username: 'dicoding',
      isDelete: true,
    };

    const commentDetail = new CommentDetail(payload);

    expect(commentDetail.id).toEqual(payload.id);
    expect(commentDetail.content).toEqual('**komentar telah dihapus**');
    expect(commentDetail.date).toEqual(payload.date);
    expect(commentDetail.username).toEqual(payload.username);
  });
});

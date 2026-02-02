import ThreadDetail from '../ThreadDetail.js';

describe('ThreadDetail entities', () => {
  it('should throw error when payload not contain needed property', () => {
    const payload = {
      id: 'thread-123',
      title: 'thread title',
      body: 'thread body',
      date: '2021-08-08T07:19:09.775Z',
      username: 'dicoding',
    };

    expect(() => new ThreadDetail(payload)).toThrowError('THREAD_DETAIL.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload not meet data type specification', () => {
    const payload = {
      id: 'thread-123',
      title: 'thread title',
      body: 'thread body',
      date: 123,
      username: 'dicoding',
      comments: [],
    };

    expect(() => new ThreadDetail(payload)).toThrowError('THREAD_DETAIL.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should throw error when comment payload not meet data type specification', () => {
    const payload = {
      id: 'thread-123',
      title: 'thread title',
      body: 'thread body',
      date: '2021-08-08T07:19:09.775Z',
      username: 'dicoding',
      comments: [
        {
          id: 'comment-123',
          username: 'dicoding',
          date: '2021-08-08T07:22:33.555Z',
          content: 123,
        },
      ],
    };

    expect(() => new ThreadDetail(payload)).toThrowError('THREAD_DETAIL.COMMENT_NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should throw error when comment not contain needed property', () => {
    const payload = {
      id: 'thread-123',
      title: 'thread title',
      body: 'thread body',
      date: '2021-08-08T07:19:09.775Z',
      username: 'dicoding',
      comments: [
        {
          id: 'comment-123',
          username: 'dicoding',
          date: '2021-08-08T07:22:33.555Z',
        },
      ],
    };

    expect(() => new ThreadDetail(payload)).toThrowError('THREAD_DETAIL.COMMENT_NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should create ThreadDetail object correctly', () => {
    const payload = {
      id: 'thread-123',
      title: 'thread title',
      body: 'thread body',
      date: '2021-08-08T07:19:09.775Z',
      username: 'dicoding',
      comments: [
        {
          id: 'comment-123',
          username: 'dicoding',
          date: '2021-08-08T07:22:33.555Z',
          content: 'comment content',
        },
      ],
    };

    const threadDetail = new ThreadDetail(payload);

    expect(threadDetail.id).toEqual(payload.id);
    expect(threadDetail.title).toEqual(payload.title);
    expect(threadDetail.body).toEqual(payload.body);
    expect(threadDetail.date).toEqual(payload.date);
    expect(threadDetail.username).toEqual(payload.username);
    expect(threadDetail.comments).toEqual(payload.comments);
  });
});

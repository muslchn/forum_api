import NewComment from '../NewComment.js';

describe('NewComment entities', () => {
  it('should throw error when payload not contain needed property', () => {
    const payload = {
      content: 'comment content',
      owner: 'user-123',
    };

    expect(() => new NewComment(payload)).toThrowError('NEW_COMMENT.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload not meet data type specification', () => {
    const payload = {
      content: true,
      threadId: 'thread-123',
      owner: 'user-123',
    };

    expect(() => new NewComment(payload)).toThrowError('NEW_COMMENT.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should create NewComment object correctly', () => {
    const payload = {
      content: 'comment content',
      threadId: 'thread-123',
      owner: 'user-123',
    };

    const { content, threadId, owner } = new NewComment(payload);

    expect(content).toEqual(payload.content);
    expect(threadId).toEqual(payload.threadId);
    expect(owner).toEqual(payload.owner);
  });
});

import NewThread from '../NewThread.js';

describe('NewThread entities', () => {
  it('should throw error when payload not contain needed property', () => {
    const payload = {
      title: 'thread title',
    };

    expect(() => new NewThread(payload)).toThrowError('NEW_THREAD.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload not meet data type specification', () => {
    const payload = {
      title: 'thread title',
      body: true,
      owner: 123,
    };

    expect(() => new NewThread(payload)).toThrowError('NEW_THREAD.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should create NewThread object correctly', () => {
    const payload = {
      title: 'thread title',
      body: 'thread body',
      owner: 'user-123',
    };

    const { title, body, owner } = new NewThread(payload);

    expect(title).toEqual(payload.title);
    expect(body).toEqual(payload.body);
    expect(owner).toEqual(payload.owner);
  });
});

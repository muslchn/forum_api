import UsersTableTestHelper from '../../../../tests/UsersTableTestHelper.js';
import ThreadsTableTestHelper from '../../../../tests/ThreadsTableTestHelper.js';
import NotFoundError from '../../../Commons/exceptions/NotFoundError.js';
import NewThread from '../../../Domains/threads/entities/NewThread.js';
import AddedThread from '../../../Domains/threads/entities/AddedThread.js';
import pool from '../../database/postgres/pool.js';
import ThreadRepositoryPostgres from '../ThreadRepositoryPostgres.js';

describe('ThreadRepositoryPostgres', () => {
  beforeEach(async () => {
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterEach(async () => {
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('addThread function', () => {
    it('should persist new thread correctly', async () => {
      // Setup: Create user with unique ID
      const userId = 'add-thread-user-1';
      const username = 'add_thread_user_1';
      const threadId = 'thread-add-1';
      const fakeIdGenerator = () => 'add-1';

      // Verify user doesn't exist yet
      let existingUsers = await UsersTableTestHelper.findUsersById(userId);
      expect(existingUsers).toHaveLength(0);

      // Add user
      await UsersTableTestHelper.addUser({ id: userId, username });

      // Verify user was actually created
      existingUsers = await UsersTableTestHelper.findUsersById(userId);
      expect(existingUsers).toHaveLength(1);

      const newThread = new NewThread({
        title: 'thread title',
        body: 'thread body',
        owner: userId,
      });

      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator);

      // Act
      const addedThread = await threadRepositoryPostgres.addThread(newThread);

      // Assert: Verify return value
      expect(addedThread.id).toBeDefined();
      expect(addedThread.id).toEqual(threadId);

      // Assert: Verify database persistence
      const threads = await ThreadsTableTestHelper.findThreadsById(threadId);
      expect(threads).toHaveLength(1);
      expect(threads[0].title).toEqual('thread title');
      expect(threads[0].owner).toEqual(userId);
    });

    it('should return added thread correctly', async () => {
      // Setup: Create user with unique ID
      const userId = 'add-thread-user-2';
      const username = 'add_thread_user_2';
      const threadId = 'thread-add-2';
      const fakeIdGenerator = () => 'add-2';

      await UsersTableTestHelper.addUser({ id: userId, username });

      // Verify user was actually created
      const existingUsers = await UsersTableTestHelper.findUsersById(userId);
      expect(existingUsers).toHaveLength(1);

      const newThread = new NewThread({
        title: 'thread title',
        body: 'thread body',
        owner: userId,
      });

      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator);

      // Act
      const addedThread = await threadRepositoryPostgres.addThread(newThread);

      // Assert
      expect(addedThread).toStrictEqual(new AddedThread({
        id: threadId,
        title: 'thread title',
        owner: userId,
      }));

      // Defensive: Verify thread persisted
      const threads = await ThreadsTableTestHelper.findThreadsById(threadId);
      expect(threads).toHaveLength(1);
    });
  });

  describe('getThreadById function', () => {
    it('should throw NotFoundError when thread not found', async () => {
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      await expect(threadRepositoryPostgres.getThreadById('thread-123'))
        .rejects.toThrow(NotFoundError);
    });

    it('should return thread detail correctly', async () => {
      await UsersTableTestHelper.addUser({ id: 'thread-getdetail-user', username: 'thread_dicoding' });
      await ThreadsTableTestHelper.addThread({
        id: 'thread-getdetail',
        title: 'thread title',
        body: 'thread body',
        owner: 'thread-getdetail-user',
        date: '2021-08-08T07:19:09.775Z',
      });

      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      const thread = await threadRepositoryPostgres.getThreadById('thread-getdetail');

      expect(thread.id).toEqual('thread-getdetail');
      expect(thread.title).toEqual('thread title');
      expect(thread.body).toEqual('thread body');
      expect(thread.username).toEqual('thread_dicoding');
    });
  });

  describe('verifyThreadExists function', () => {
    it('should throw NotFoundError when thread not found', async () => {
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      await expect(threadRepositoryPostgres.verifyThreadExists('thread-123'))
        .rejects.toThrow(NotFoundError);
    });

    it('should not throw NotFoundError when thread exists', async () => {
      await UsersTableTestHelper.addUser({ id: 'thread-verify-user', username: 'thread_verify_user' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-verify', owner: 'thread-verify-user' });

      // Verify thread was actually inserted
      const threads = await ThreadsTableTestHelper.findThreadsById('thread-verify');
      expect(threads).toHaveLength(1);

      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      await expect(threadRepositoryPostgres.verifyThreadExists('thread-verify'))
        .resolves.not.toThrow(NotFoundError);
    });
  });
});

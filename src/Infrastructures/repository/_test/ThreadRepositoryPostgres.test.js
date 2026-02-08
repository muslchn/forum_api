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
      await UsersTableTestHelper.addUser({ id: 'thread-user-1', username: 'thread_user_1' });
      const newThread = new NewThread({
        title: 'thread title',
        body: 'thread body',
        owner: 'thread-user-1',
      });
      const fakeIdGenerator = () => '123';
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator);

      const addedThread = await threadRepositoryPostgres.addThread(newThread);

      // Verify thread was actually added to database
      expect(addedThread.id).toBeDefined();
      const threads = await ThreadsTableTestHelper.findThreadsById('thread-123');
      expect(threads).toHaveLength(1);
    });

    it('should return added thread correctly', async () => {
      await UsersTableTestHelper.addUser({ id: 'thread-user-2', username: 'thread_user_2' });
      const newThread = new NewThread({
        title: 'thread title',
        body: 'thread body',
        owner: 'thread-user-2',
      });
      const fakeIdGenerator = () => '123';
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator);

      const addedThread = await threadRepositoryPostgres.addThread(newThread);

      expect(addedThread).toStrictEqual(new AddedThread({
        id: 'thread-123',
        title: 'thread title',
        owner: 'thread-user-2',
      }));
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

import UsersTableTestHelper from '../../../../tests/UsersTableTestHelper.js';
import ThreadsTableTestHelper from '../../../../tests/ThreadsTableTestHelper.js';
import CommentsTableTestHelper from '../../../../tests/CommentsTableTestHelper.js';
import AuthorizationError from '../../../Commons/exceptions/AuthorizationError.js';
import NotFoundError from '../../../Commons/exceptions/NotFoundError.js';
import NewComment from '../../../Domains/comments/entities/NewComment.js';
import AddedComment from '../../../Domains/comments/entities/AddedComment.js';
import pool from '../../database/postgres/pool.js';
import CommentRepositoryPostgres from '../CommentRepositoryPostgres.js';

describe('CommentRepositoryPostgres', () => {
  beforeEach(async () => {
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterEach(async () => {
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('addComment function', () => {
    it('should persist new comment correctly', async () => {
      await UsersTableTestHelper.addUser({ id: 'comment-user-1', username: 'comment_user_1' });
      await ThreadsTableTestHelper.addThread({ id: 'comment-thread-1', owner: 'comment-user-1' });

      const newComment = new NewComment({
        content: 'comment content',
        threadId: 'comment-thread-1',
        owner: 'comment-user-1',
      });
      const fakeIdGenerator = () => '123';
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, fakeIdGenerator);

      await commentRepositoryPostgres.addComment(newComment);

      const comments = await CommentsTableTestHelper.findCommentsById('comment-123');
      expect(comments).toHaveLength(1);
    });

    it('should return added comment correctly', async () => {
      await UsersTableTestHelper.addUser({ id: 'comment-user-2', username: 'comment_user_2' });
      await ThreadsTableTestHelper.addThread({ id: 'comment-thread-2', owner: 'comment-user-2' });

      const newComment = new NewComment({
        content: 'comment content',
        threadId: 'comment-thread-2',
        owner: 'comment-user-2',
      });
      const fakeIdGenerator = () => '123';
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, fakeIdGenerator);

      const addedComment = await commentRepositoryPostgres.addComment(newComment);

      expect(addedComment).toStrictEqual(new AddedComment({
        id: 'comment-123',
        content: 'comment content',
        owner: 'comment-user-2',
      }));
    });
  });

  describe('verifyCommentExists function', () => {
    it('should throw NotFoundError when comment not found', async () => {
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await expect(commentRepositoryPostgres.verifyCommentExists('comment-123', 'thread-123'))
        .rejects.toThrow(NotFoundError);
    });

    it('should not throw NotFoundError when comment exists', async () => {
      await UsersTableTestHelper.addUser({ id: 'comment-verify-user', username: 'comment_verify_user' });
      await ThreadsTableTestHelper.addThread({ id: 'comment-verify-thread', owner: 'comment-verify-user' });
      await CommentsTableTestHelper.addComment({
        id: 'comment-verify',
        threadId: 'comment-verify-thread',
        owner: 'comment-verify-user',
      });

      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await expect(commentRepositoryPostgres.verifyCommentExists('comment-verify', 'comment-verify-thread'))
        .resolves.not.toThrow(NotFoundError);
    });
  });

  describe('verifyCommentOwner function', () => {
    it('should throw AuthorizationError when owner not match', async () => {
      await UsersTableTestHelper.addUser({ id: 'comment-auth-user', username: 'comment_auth_user' });
      await ThreadsTableTestHelper.addThread({ id: 'comment-auth-thread', owner: 'comment-auth-user' });
      await CommentsTableTestHelper.addComment({
        id: 'comment-auth',
        threadId: 'comment-auth-thread',
        owner: 'comment-auth-user',
      });

      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await expect(commentRepositoryPostgres.verifyCommentOwner('comment-auth', 'user-321'))
        .rejects.toThrow(AuthorizationError);
    });

    it('should not throw AuthorizationError when owner match', async () => {
      await UsersTableTestHelper.addUser({ id: 'comment-owner-user', username: 'comment_owner_user' });
      await ThreadsTableTestHelper.addThread({ id: 'comment-owner-thread', owner: 'comment-owner-user' });
      await CommentsTableTestHelper.addComment({
        id: 'comment-owner',
        threadId: 'comment-owner-thread',
        owner: 'comment-owner-user',
      });

      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await expect(commentRepositoryPostgres.verifyCommentOwner('comment-owner', 'comment-owner-user'))
        .resolves.not.toThrow(AuthorizationError);
    });
  });

  describe('deleteCommentById function', () => {
    it('should update comment is_delete to true', async () => {
      await UsersTableTestHelper.addUser({ id: 'comment-delete-user', username: 'comment_delete_user' });
      await ThreadsTableTestHelper.addThread({ id: 'comment-delete-thread', owner: 'comment-delete-user' });
      await CommentsTableTestHelper.addComment({
        id: 'comment-delete',
        threadId: 'comment-delete-thread',
        owner: 'comment-delete-user',
      });

      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await commentRepositoryPostgres.deleteCommentById('comment-delete');

      const comments = await CommentsTableTestHelper.findCommentsById('comment-delete');
      expect(comments[0].is_delete).toEqual(true);
    });
  });

  describe('getCommentsByThreadId function', () => {
    it('should return comments ordered by date', async () => {
      await UsersTableTestHelper.addUser({ id: 'comment-order-user1', username: 'comment_dicoding' });
      await UsersTableTestHelper.addUser({ id: 'comment-order-user2', username: 'comment_johndoe' });
      await ThreadsTableTestHelper.addThread({ id: 'comment-order-thread', owner: 'comment-order-user1' });
      await CommentsTableTestHelper.addComment({
        id: 'comment-order-1',
        threadId: 'comment-order-thread',
        content: 'first comment',
        date: '2021-08-08T07:22:33.555Z',
        owner: 'comment-order-user1',
      });
      await CommentsTableTestHelper.addComment({
        id: 'comment-order-2',
        threadId: 'comment-order-thread',
        content: 'second comment',
        date: '2021-08-08T07:26:21.338Z',
        owner: 'comment-order-user2',
      });

      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});
      const comments = await commentRepositoryPostgres.getCommentsByThreadId('comment-order-thread');

      expect(comments).toHaveLength(2);
      expect(comments[0].id).toEqual('comment-order-1');
      expect(comments[0].username).toEqual('comment_dicoding');
      expect(comments[0].content).toEqual('first comment');
      expect(comments[0].date).toBeDefined();
      expect(comments[0].is_delete).toEqual(false);
      expect(comments[1].id).toEqual('comment-order-2');
      expect(comments[1].username).toEqual('comment_johndoe');
      expect(comments[1].content).toEqual('second comment');
      expect(comments[1].date).toBeDefined();
      expect(comments[1].is_delete).toEqual(false);
    });
  });
});

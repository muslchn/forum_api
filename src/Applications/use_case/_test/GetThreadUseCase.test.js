import { vi } from 'vitest';
import ThreadRepository from '../../../Domains/threads/ThreadRepository.js';
import CommentRepository from '../../../Domains/comments/CommentRepository.js';
import ReplyRepository from '../../../Domains/replies/ReplyRepository.js';
import ThreadDetail from '../../../Domains/threads/entities/ThreadDetail.js';
import GetThreadUseCase from '../GetThreadUseCase.js';

describe('GetThreadUseCase', () => {
  it('should orchestrating the get thread action correctly', async () => {
    const thread = {
      id: 'thread-123',
      title: 'thread title',
      body: 'thread body',
      date: '2021-08-08T07:19:09.775Z',
      username: 'dicoding',
    };

    /* eslint-disable camelcase */
    const comments = [
      {
        id: 'comment-123',
        username: 'dicoding',
        date: '2021-08-08T07:22:33.555Z',
        content: 'comment content',
        is_delete: false,
        like_count: 2,
      },
      {
        id: 'comment-456',
        username: 'johndoe',
        date: '2021-08-08T07:26:21.338Z',
        content: 'comment deleted',
        is_delete: true,
        like_count: 0,
      },
    ];
    /* eslint-enable camelcase */

    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();
    const mockReplyRepository = new ReplyRepository();

    const replies = [
      {
        id: 'reply-123',
        comment_id: 'comment-123',
        content: 'reply content',
        date: '2021-08-08T07:30:00.000Z',
        is_delete: false,
        username: 'johndoe',
      },
    ];

    mockThreadRepository.getThreadById = vi.fn()
      .mockImplementation(() => Promise.resolve(thread));
    mockCommentRepository.getCommentsByThreadId = vi.fn()
      .mockImplementation(() => Promise.resolve(comments));
    mockReplyRepository.getRepliesByCommentIds = vi.fn()
      .mockImplementation(() => Promise.resolve(replies));

    const getThreadUseCase = new GetThreadUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
      replyRepository: mockReplyRepository,
    });

    const detailThread = await getThreadUseCase.execute('thread-123');

    expect(detailThread).toStrictEqual(new ThreadDetail({
      ...thread,
      comments: [
        {
          id: 'comment-123',
          username: 'dicoding',
          date: '2021-08-08T07:22:33.555Z',
          content: 'comment content',
          likeCount: 2,
          replies: [
            {
              id: 'reply-123',
              content: 'reply content',
              date: '2021-08-08T07:30:00.000Z',
              username: 'johndoe',
            },
          ],
        },
        {
          id: 'comment-456',
          username: 'johndoe',
          date: '2021-08-08T07:26:21.338Z',
          content: '**komentar telah dihapus**',
          likeCount: 0,
          replies: [],
        },
      ],
    }));

    expect(mockThreadRepository.getThreadById).toBeCalledWith('thread-123');
    expect(mockCommentRepository.getCommentsByThreadId).toBeCalledWith('thread-123');
    expect(mockReplyRepository.getRepliesByCommentIds).toBeCalledWith(['comment-123', 'comment-456']);
  });
});

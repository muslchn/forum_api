import ToggleCommentLikeUseCase from '../ToggleCommentLikeUseCase.js';

describe('ToggleCommentLikeUseCase', () => {
  it('should toggle comment like properly', async () => {
    // Arrange
    const mockCommentRepository = {
      verifyCommentExists: vi.fn(),
      getCommentLikeByCommentIdAndUserId: vi.fn(),
      addCommentLike: vi.fn(),
      removeCommentLike: vi.fn(),
    };

    const toggleCommentLikeUseCase = new ToggleCommentLikeUseCase({
      commentRepository: mockCommentRepository,
    });

    const useCasePayload = {
      commentId: 'comment-123',
      threadId: 'thread-123',
      userId: 'user-123',
    };

    mockCommentRepository.verifyCommentExists.mockResolvedValue(undefined);
    mockCommentRepository.getCommentLikeByCommentIdAndUserId.mockResolvedValue(false);
    mockCommentRepository.addCommentLike.mockResolvedValue(true);

    // Act
    const result = await toggleCommentLikeUseCase.execute(useCasePayload);

    // Assert
    expect(result.status).toEqual('success');
    expect(mockCommentRepository.verifyCommentExists).toHaveBeenCalledWith(
      'comment-123',
      'thread-123',
    );
    expect(mockCommentRepository.getCommentLikeByCommentIdAndUserId).toHaveBeenCalledWith(
      'comment-123',
      'user-123',
    );
    expect(mockCommentRepository.addCommentLike).toHaveBeenCalledWith('comment-123', 'user-123');
  });

  it('should remove like when user already liked the comment', async () => {
    // Arrange
    const mockCommentRepository = {
      verifyCommentExists: vi.fn(),
      getCommentLikeByCommentIdAndUserId: vi.fn(),
      removeCommentLike: vi.fn(),
    };

    const toggleCommentLikeUseCase = new ToggleCommentLikeUseCase({
      commentRepository: mockCommentRepository,
    });

    const useCasePayload = {
      commentId: 'comment-123',
      threadId: 'thread-123',
      userId: 'user-123',
    };

    mockCommentRepository.verifyCommentExists.mockResolvedValue(undefined);
    mockCommentRepository.getCommentLikeByCommentIdAndUserId.mockResolvedValue(true);
    mockCommentRepository.removeCommentLike.mockResolvedValue(true);

    // Act
    const result = await toggleCommentLikeUseCase.execute(useCasePayload);

    // Assert
    expect(result.status).toEqual('success');
    expect(mockCommentRepository.removeCommentLike).toHaveBeenCalledWith('comment-123', 'user-123');
  });
});

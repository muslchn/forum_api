import AddCommentLike from '../../Domains/comments/entities/AddCommentLike.js';

class ToggleCommentLikeUseCase {
  constructor({ commentRepository }) {
    this._commentRepository = commentRepository;
  }

  async execute(useCasePayload) {
    const { commentId, threadId, userId } = useCasePayload;

    // Verify comment exists and belongs to the thread
    await this._commentRepository.verifyCommentExists(commentId, threadId);

    // Check if user has already liked this comment
    const hasLiked = await this._commentRepository.getCommentLikeByCommentIdAndUserId(
      commentId,
      userId,
    );

    const addCommentLike = new AddCommentLike({
      commentId,
      userId,
    });

    if (hasLiked) {
      // Remove like
      await this._commentRepository.removeCommentLike(commentId, userId);
    } else {
      // Add like
      await this._commentRepository.addCommentLike(commentId, userId);
    }

    return {
      status: 'success',
    };
  }
}

export default ToggleCommentLikeUseCase;

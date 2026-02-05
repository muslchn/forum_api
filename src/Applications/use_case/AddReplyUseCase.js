import NewReply from '../../Domains/replies/entities/NewReply.js';

class AddReplyUseCase {
  constructor({ threadRepository, commentRepository, replyRepository }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
    this._replyRepository = replyRepository;
  }

  async execute(useCasePayload) {
    const newReply = new NewReply(useCasePayload);
    await this._threadRepository.verifyThreadExists(newReply.threadId);
    await this._commentRepository.verifyCommentExists(newReply.commentId, newReply.threadId);
    return this._replyRepository.addReply(newReply);
  }
}

export default AddReplyUseCase;

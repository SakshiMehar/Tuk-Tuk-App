/**
 * Gift Queue Service
 * Processes high-priority gifts sequentially so animations don't choke JS thread or freeze UI.
 */
class GiftQueueService {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.animationDuration = 3500;
  }

  enqueue(gift, onPlayAnimation) {
    this.queue.push({ gift, onPlayAnimation });
    if (!this.isProcessing) {
      this._processNext();
    }
  }

  _processNext() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const { gift, onPlayAnimation } = this.queue.shift();

    try {
      onPlayAnimation(gift);
    } catch (err) {
      // ignore animation error
    }

    setTimeout(() => {
      this._processNext();
    }, this.animationDuration);
  }

  clear() {
    this.queue = [];
    this.isProcessing = false;
  }
}

export const giftQueueService = new GiftQueueService();
export default giftQueueService;

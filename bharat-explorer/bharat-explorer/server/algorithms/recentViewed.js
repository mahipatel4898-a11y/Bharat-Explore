/**
 * FIFO Queue - Recently Viewed Places (max 10 items)
 */
class RecentViewedQueue {
  constructor(maxSize = 10) {
    this.queue = [];
    this.maxSize = maxSize;
  }

  enqueue(item) {
    // Remove if already exists (move to front)
    this.queue = this.queue.filter(i => i.toString() !== item.toString());
    this.queue.unshift(item);
    if (this.queue.length > this.maxSize) {
      this.queue.pop(); // FIFO: remove oldest
    }
    return this.queue;
  }

  getAll() { return this.queue; }
  size() { return this.queue.length; }
  clear() { this.queue = []; }
}

module.exports = { RecentViewedQueue };

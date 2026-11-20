/**
 * LIFO Stack - Search History / Back Navigation (max 20 items)
 */
class SearchHistoryStack {
  constructor(maxSize = 20) {
    this.stack = [];
    this.maxSize = maxSize;
  }

  push(query) {
    // Remove duplicates
    this.stack = this.stack.filter(q => q !== query);
    this.stack.push(query);
    if (this.stack.length > this.maxSize) {
      this.stack.shift(); // Remove oldest
    }
    return this.stack;
  }

  pop() {
    return this.stack.pop();
  }

  peek() {
    return this.stack[this.stack.length - 1];
  }

  getAll() { return [...this.stack].reverse(); } // Most recent first (LIFO)
  clear() { this.stack = []; }
  size() { return this.stack.length; }
}

module.exports = { SearchHistoryStack };

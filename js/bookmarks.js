// Bookmarks Management

const Bookmarks = {
    init() {
        if (!localStorage.getItem('bookmarks')) {
            localStorage.setItem('bookmarks', JSON.stringify([]));
        }
    },

    getBookmarks() {
        const bookmarks = localStorage.getItem('bookmarks');
        return bookmarks ? JSON.parse(bookmarks) : [];
    },

    saveBookmarks(bookmarks) {
        localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
    },

    addBookmark(menuId) {
        const bookmarks = this.getBookmarks();
        if (!bookmarks.includes(menuId)) {
            bookmarks.push(menuId);
            this.saveBookmarks(bookmarks);
            return true;
        }
        return false;
    },

    removeBookmark(menuId) {
        const bookmarks = this.getBookmarks();
        const filtered = bookmarks.filter(id => id !== menuId);
        this.saveBookmarks(filtered);
    },

    isBookmarked(menuId) {
        const bookmarks = this.getBookmarks();
        return bookmarks.includes(menuId);
    },

    toggleBookmark(menuId) {
        if (this.isBookmarked(menuId)) {
            this.removeBookmark(menuId);
            return false;
        } else {
            this.addBookmark(menuId);
            return true;
        }
    }
};

// Initialize on load
if (typeof window !== 'undefined') {
    Bookmarks.init();
}


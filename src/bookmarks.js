class BookmarkManager {
  constructor(pdfViewer) {
    this.pdfViewer = pdfViewer;
    this.bookmarks = [];
    this.currentPdfName = null;

    this.bookmarkBtn = document.getElementById("bookmarkBtn");
    this.bookmarksSection = document.getElementById("bookmarksSection");
    this.bookmarksList = document.getElementById("bookmarksList");
    this.exportBookmarksBtn = document.getElementById("exportBookmarks");
    this.importBookmarksInput = document.getElementById("importBookmarks");
    this.pdfControls = document.querySelector(".pdf-controls");

    this.initEventListeners();
  }

  initEventListeners() {
    if (this.bookmarkBtn) {
      this.bookmarkBtn.addEventListener("click", () => this.toggleBookmark());
    }
    if (this.exportBookmarksBtn) {
      this.exportBookmarksBtn.addEventListener("click", () =>
        this.exportBookmarks()
      );
    }
    if (this.importBookmarksInput) {
      this.importBookmarksInput.addEventListener("change", (e) =>
        this.importBookmarks(e)
      );
    }
  }

  setPdfName(name) {
    this.currentPdfName = name;
    this.bookmarks = this.loadBookmarks();
  }

  loadBookmarks() {
    if (!this.currentPdfName) return [];
    const stored = localStorage.getItem(`bookmarks_${this.currentPdfName}`);
    return stored ? JSON.parse(stored) : [];
  }

  saveBookmarks() {
    if (!this.currentPdfName) return;
    localStorage.setItem(
      `bookmarks_${this.currentPdfName}`,
      JSON.stringify(this.bookmarks)
    );
  }

  isPageBookmarked(pageNum) {
    return this.bookmarks.includes(pageNum);
  }

  toggleBookmark() {
    const currentPage = this.pdfViewer.getCurrentPage();

    if (this.isPageBookmarked(currentPage)) {
      this.bookmarks = this.bookmarks.filter((p) => p !== currentPage);
    } else {
      this.bookmarks.push(currentPage);
      this.bookmarks.sort((a, b) => a - b);
    }

    this.saveBookmarks();
    this.updateBookmarkButton();
    this.renderBookmarksList();
  }

  updateBookmarkButton() {
    const currentPage = this.pdfViewer.getCurrentPage();

    if (this.isPageBookmarked(currentPage)) {
      this.bookmarkBtn.textContent = "Remove Bookmark";
      this.bookmarkBtn.classList.add("bookmarked");
      this.pdfControls.classList.add("has-bookmark");
    } else {
      this.bookmarkBtn.textContent = "Bookmark Page";
      this.bookmarkBtn.classList.remove("bookmarked");
      this.pdfControls.classList.remove("has-bookmark");
    }
  }

  renderBookmarksList() {
    this.bookmarksList.innerHTML = "";
    this.bookmarksSection.style.display = "block";

    if (this.bookmarks.length === 0) {
      const emptyMsg = document.createElement("div");
      emptyMsg.className = "bookmarks-empty";
      emptyMsg.textContent =
        "No bookmarks yet. Click 'Bookmark Page' to add one or import bookmarks.";
      this.bookmarksList.appendChild(emptyMsg);
      this.exportBookmarksBtn.disabled = true;
      return;
    }

    this.exportBookmarksBtn.disabled = false;

    this.bookmarks.forEach((pageNum) => {
      const item = document.createElement("div");
      item.className = "bookmark-item";

      const pageSpan = document.createElement("span");
      pageSpan.className = "bookmark-page";
      pageSpan.textContent = `Page ${pageNum}`;

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "bookmark-delete";
      deleteBtn.textContent = "Delete";
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        this.bookmarks = this.bookmarks.filter((p) => p !== pageNum);
        this.saveBookmarks();
        this.renderBookmarksList();
        this.updateBookmarkButton();
      };

      item.appendChild(pageSpan);
      item.appendChild(deleteBtn);

      item.onclick = () => {
        this.pdfViewer.goToPage(pageNum);
      };

      this.bookmarksList.appendChild(item);
    });
  }

  exportBookmarks() {
    if (this.bookmarks.length === 0) {
      alert("No bookmarks to export.");
      return;
    }

    const exportData = {
      pdfName: this.currentPdfName,
      bookmarks: this.bookmarks,
      exportDate: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `bookmarks_${this.currentPdfName.replace(".pdf", "")}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  importBookmarks(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target.result);

        if (!importData.bookmarks || !Array.isArray(importData.bookmarks)) {
          alert("Invalid bookmark file format.");
          return;
        }

        if (importData.pdfName !== this.currentPdfName) {
          const confirm = window.confirm(
            `This bookmark file is for "${importData.pdfName}". Current PDF is "${this.currentPdfName}". Import anyway?`
          );
          if (!confirm) {
            this.importBookmarksInput.value = "";
            return;
          }
        }

        const validBookmarks = importData.bookmarks.filter(
          (page) =>
            typeof page === "number" &&
            page >= 1 &&
            page <= this.pdfViewer.getTotalPages()
        );

        if (validBookmarks.length === 0) {
          alert("No valid bookmarks found in file.");
          this.importBookmarksInput.value = "";
          return;
        }

        this.bookmarks = [
          ...new Set([...this.bookmarks, ...validBookmarks]),
        ].sort((a, b) => a - b);
        this.saveBookmarks();
        this.updateBookmarkButton();
        this.renderBookmarksList();

        alert(`Successfully imported ${validBookmarks.length} bookmark(s).`);
      } catch (error) {
        console.error("Error importing bookmarks:", error);
        alert("Failed to import bookmarks. Please check the file format.");
      }

      this.importBookmarksInput.value = "";
    };

    reader.readAsText(file);
  }
}

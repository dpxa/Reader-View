(function () {
  // Initialize bookmark manager and PDF viewer
  const bookmarkManager = new BookmarkManager(null);
  const pdfViewer = new PDFViewer(bookmarkManager);
  bookmarkManager.pdfViewer = pdfViewer;
})();

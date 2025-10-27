(function () {
  const toggle = document.getElementById("themeToggle");
  if (!toggle) return;

  const themeKey = "readerview_theme";
  const applyTheme = (mode) => {
    if (mode === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
      toggle.textContent = "Light";
    } else {
      document.documentElement.removeAttribute("data-theme");
      toggle.textContent = "Dark";
    }
  };

  const saved = localStorage.getItem(themeKey);
  applyTheme(saved === "dark" ? "dark" : "light");

  toggle.addEventListener("click", () => {
    const isDark =
      document.documentElement.getAttribute("data-theme") === "dark";
    const next = isDark ? "light" : "dark";
    applyTheme(next);
    localStorage.setItem(themeKey, next);
  });

  // PDF Viewer functionality
  let pdfDoc = null;
  let currentPage = 1;
  const scale = 2.0;
  let currentPdfName = null;
  let bookmarks = [];

  const pdfInput = document.getElementById("pdfInput");
  const loadPdfBtn = document.getElementById("loadPdf");
  const pdfViewer = document.getElementById("pdfViewer");
  const canvas = document.getElementById("pdfCanvas");
  const ctx = canvas.getContext("2d");
  const prevBtn = document.getElementById("prevPage");
  const nextBtn = document.getElementById("nextPage");
  const pageInfo = document.getElementById("pageInfo");
  const bookmarkBtn = document.getElementById("bookmarkBtn");
  const bookmarksSection = document.getElementById("bookmarksSection");
  const bookmarksList = document.getElementById("bookmarksList");

  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

  // Bookmark functions
  function loadBookmarks() {
    if (!currentPdfName) return [];
    const stored = localStorage.getItem(`bookmarks_${currentPdfName}`);
    return stored ? JSON.parse(stored) : [];
  }

  function saveBookmarks() {
    if (!currentPdfName) return;
    localStorage.setItem(
      `bookmarks_${currentPdfName}`,
      JSON.stringify(bookmarks)
    );
  }

  function isPageBookmarked(pageNum) {
    return bookmarks.includes(pageNum);
  }

  function toggleBookmark() {
    if (isPageBookmarked(currentPage)) {
      bookmarks = bookmarks.filter((p) => p !== currentPage);
    } else {
      bookmarks.push(currentPage);
      bookmarks.sort((a, b) => a - b);
    }
    saveBookmarks();
    updateBookmarkButton();
    renderBookmarksList();
  }

  function updateBookmarkButton() {
    if (isPageBookmarked(currentPage)) {
      bookmarkBtn.textContent = "Remove Bookmark";
      bookmarkBtn.classList.add("bookmarked");
    } else {
      bookmarkBtn.textContent = "Bookmark Page";
      bookmarkBtn.classList.remove("bookmarked");
    }
  }

  function renderBookmarksList() {
    bookmarksList.innerHTML = "";

    if (bookmarks.length === 0) {
      bookmarksSection.style.display = "none";
      return;
    }

    bookmarksSection.style.display = "block";

    bookmarks.forEach((pageNum) => {
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
        bookmarks = bookmarks.filter((p) => p !== pageNum);
        saveBookmarks();
        renderBookmarksList();
        updateBookmarkButton();
      };

      item.appendChild(pageSpan);
      item.appendChild(deleteBtn);

      item.onclick = () => {
        currentPage = pageNum;
        renderPage(currentPage);
        updatePageInfo();
        updateBookmarkButton();
      };

      bookmarksList.appendChild(item);
    });
  }

  loadPdfBtn.addEventListener("click", () => {
    const file = pdfInput.files[0];
    if (!file) {
      alert("Please select a PDF file first.");
      return;
    }

    currentPdfName = file.name;
    loadPdfBtn.textContent = "Loading...";
    loadPdfBtn.disabled = true;

    const fileReader = new FileReader();
    fileReader.onload = function () {
      const typedarray = new Uint8Array(this.result);

      pdfjsLib
        .getDocument(typedarray)
        .promise.then((pdf) => {
          pdfDoc = pdf;
          currentPage = 1;
          bookmarks = loadBookmarks();
          pdfViewer.style.display = "block";
          renderPage(currentPage);
          updatePageInfo();
          updateBookmarkButton();
          renderBookmarksList();
          loadPdfBtn.textContent = "Load PDF";
          loadPdfBtn.disabled = false;
        })
        .catch((error) => {
          console.error("Error loading PDF:", error);
          alert("Failed to load PDF. Please try again.");
          loadPdfBtn.textContent = "Load PDF";
          loadPdfBtn.disabled = false;
        });
    };
    fileReader.readAsArrayBuffer(file);
  });

  function renderPage(num) {
    pdfDoc.getPage(num).then((page) => {
      const viewport = page.getViewport({ scale: scale });

      const container = document.querySelector(".container");
      const containerWidth = container.offsetWidth - 56;
      const scaleFactor = containerWidth / viewport.width;
      const finalScale = Math.min(scale, scaleFactor * scale);

      const finalViewport = page.getViewport({ scale: finalScale });

      canvas.height = finalViewport.height;
      canvas.width = finalViewport.width;

      const renderContext = {
        canvasContext: ctx,
        viewport: finalViewport,
      };
      page.render(renderContext);
    });
  }

  function updatePageInfo() {
    pageInfo.textContent = `Page ${currentPage} of ${pdfDoc.numPages}`;
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= pdfDoc.numPages;
    updateBookmarkButton();
  }

  prevBtn.addEventListener("click", () => {
    if (currentPage <= 1) return;
    currentPage--;
    renderPage(currentPage);
    updatePageInfo();
  });

  nextBtn.addEventListener("click", () => {
    if (currentPage >= pdfDoc.numPages) return;
    currentPage++;
    renderPage(currentPage);
    updatePageInfo();
  });

  bookmarkBtn.addEventListener("click", toggleBookmark);
})();

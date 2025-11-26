class PDFViewer {
  constructor(bookmarkManager) {
    this.pdfDoc = null;
    this.currentPage = 1;
    this.scale = 2.0;
    this.bookmarkManager = bookmarkManager;

    this.pdfInput = document.getElementById("pdfInput");
    this.loadPdfBtn = document.getElementById("loadPdf");
    this.pdfViewer = document.getElementById("pdfViewer");
    this.canvas = document.getElementById("pdfCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.prevBtn = document.getElementById("prevPage");
    this.nextBtn = document.getElementById("nextPage");
    this.pageInfo = document.getElementById("pageInfo");
    this.pageInput = document.getElementById("pageInput");
    this.goToPageBtn = document.getElementById("goToPage");
    this.prevBtnBottom = document.getElementById("prevPageBottom");
    this.nextBtnBottom = document.getElementById("nextPageBottom");
    this.pageInfoBottom = document.getElementById("pageInfoBottom");

    if (!this.loadPdfBtn) {
      console.error("Load PDF button not found");
      return;
    }

    if (typeof pdfjsLib === "undefined") {
      console.error("PDF.js library not loaded");
      return;
    }

    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

    this.initEventListeners();
  }

  initEventListeners() {
    this.loadPdfBtn.addEventListener("click", () => this.loadPdf());
    this.prevBtn.addEventListener("click", () => this.previousPage());
    this.nextBtn.addEventListener("click", () => this.nextPage());
    this.goToPageBtn.addEventListener("click", () => this.jumpToPage());
    this.pageInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        this.jumpToPage();
      }
    });
    this.prevBtnBottom.addEventListener("click", () => this.previousPage());
    this.nextBtnBottom.addEventListener("click", () => this.nextPage());
    document.addEventListener("keydown", (e) => {
      if (this.pdfViewer.style.display !== "none") {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          this.previousPage();
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          this.nextPage();
        }
      }
    });
  }

  loadPdf() {
    const file = this.pdfInput.files[0];
    if (!file) {
      alert("Please select a PDF file first.");
      return;
    }

    const currentPdfName = file.name;
    this.loadPdfBtn.textContent = "Loading...";
    this.loadPdfBtn.disabled = true;

    const fileReader = new FileReader();
    fileReader.onload = () => {
      const typedarray = new Uint8Array(fileReader.result);

      pdfjsLib
        .getDocument(typedarray)
        .promise.then((pdf) => {
          this.pdfDoc = pdf;
          this.currentPage = 1;
          this.bookmarkManager.setPdfName(currentPdfName);
          this.pdfViewer.style.display = "block";
          this.renderPage(this.currentPage);
          this.updatePageInfo();
          this.bookmarkManager.updateBookmarkButton();
          this.bookmarkManager.renderBookmarksList();
          this.loadPdfBtn.textContent = "Load PDF";
          this.loadPdfBtn.disabled = false;
        })
        .catch((error) => {
          console.error("Error loading PDF:", error);
          alert("Failed to load PDF. Please try again.");
          this.loadPdfBtn.textContent = "Load PDF";
          this.loadPdfBtn.disabled = false;
        });
    };
    fileReader.readAsArrayBuffer(file);
  }

  renderPage(num) {
    this.pdfDoc.getPage(num).then((page) => {
      const viewport = page.getViewport({ scale: this.scale });

      const container = document.querySelector(".container");
      const containerWidth = container.offsetWidth - 56;
      const scaleFactor = containerWidth / viewport.width;
      const finalScale = Math.min(this.scale, scaleFactor * this.scale);

      const finalViewport = page.getViewport({ scale: finalScale });

      this.canvas.height = finalViewport.height;
      this.canvas.width = finalViewport.width;

      const renderContext = {
        canvasContext: this.ctx,
        viewport: finalViewport,
      };
      page.render(renderContext);
    });
  }

  updatePageInfo() {
    this.pageInfo.textContent = `Page ${this.currentPage} of ${this.pdfDoc.numPages}`;
    this.pageInfoBottom.textContent = `Page ${this.currentPage} of ${this.pdfDoc.numPages}`;
    this.pageInput.value = this.currentPage;
    this.pageInput.max = this.pdfDoc.numPages;
    this.prevBtn.disabled = this.currentPage <= 1;
    this.nextBtn.disabled = this.currentPage >= this.pdfDoc.numPages;
    this.prevBtnBottom.disabled = this.currentPage <= 1;
    this.nextBtnBottom.disabled = this.currentPage >= this.pdfDoc.numPages;
    this.bookmarkManager.updateBookmarkButton();
  }

  previousPage() {
    if (this.currentPage <= 1) return;
    this.currentPage--;
    this.renderPage(this.currentPage);
    this.updatePageInfo();
  }

  nextPage() {
    if (this.currentPage >= this.pdfDoc.numPages) return;
    this.currentPage++;
    this.renderPage(this.currentPage);
    this.updatePageInfo();
  }

  jumpToPage() {
    const pageNum = parseInt(this.pageInput.value, 10);
    if (isNaN(pageNum) || pageNum < 1 || pageNum > this.pdfDoc.numPages) {
      alert(
        `Please enter a valid page number between 1 and ${this.pdfDoc.numPages}.`
      );
      this.pageInput.value = this.currentPage;
      return;
    }
    this.goToPage(pageNum);
  }

  goToPage(pageNum) {
    this.currentPage = pageNum;
    this.renderPage(this.currentPage);
    this.updatePageInfo();
  }

  getCurrentPage() {
    return this.currentPage;
  }

  getTotalPages() {
    return this.pdfDoc ? this.pdfDoc.numPages : 0;
  }
}

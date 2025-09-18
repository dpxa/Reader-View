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

  const pdfInput = document.getElementById("pdfInput");
  const loadPdfBtn = document.getElementById("loadPdf");
  const pdfViewer = document.getElementById("pdfViewer");
  const canvas = document.getElementById("pdfCanvas");
  const ctx = canvas.getContext("2d");
  const prevBtn = document.getElementById("prevPage");
  const nextBtn = document.getElementById("nextPage");
  const pageInfo = document.getElementById("pageInfo");

  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

  loadPdfBtn.addEventListener("click", () => {
    const file = pdfInput.files[0];
    if (!file) {
      alert("Please select a PDF file first.");
      return;
    }

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
          pdfViewer.style.display = "block";
          renderPage(currentPage);
          updatePageInfo();
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
})();

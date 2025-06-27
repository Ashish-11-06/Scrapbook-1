"use client"

const React = window.React
const ReactDOM = window.ReactDOM

function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = React.useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      return initialValue
    }
  })

  const setValue = (value) => {
    try {
      setStoredValue(value)
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error("Error saving to localStorage:", error)
    }
  }

  return [storedValue, setValue]
}

function FloatingDecorations() {
  const decorations = ["🌈", "⭐", "🎈"]

  return decorations.map((decoration, index) =>
    React.createElement(
      "div",
      {
        key: index,
        className: "floating-decoration",
        style: {
          animationDelay: `${index * 0.5}s`,
        },
      },
      decoration,
    ),
  )
}

function Homepage({ onCreateBook, onOpenBook, books, onDeleteBook }) {
  const [bookName, setBookName] = React.useState("")
  const [isCreating, setIsCreating] = React.useState(false)
  const [showSuccess, setShowSuccess] = React.useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (bookName.trim()) {
      setIsCreating(true)

      setTimeout(() => {
        onCreateBook(bookName.trim())
        setBookName("")
        setIsCreating(false)
        setShowSuccess(true)

        setTimeout(() => setShowSuccess(false), 2000)
      }, 500)
    }
  }

  return React.createElement(
    "div",
    { className: "homepage" },
    React.createElement(FloatingDecorations),

    React.createElement("h1", { className: "homepage-title" }, "📚 THE MEMORY CHAPTER 📚"),
    React.createElement("p", { className: "homepage-subtitle" }, "Create  memories with photos!"),

    React.createElement(
      "form",
      { className: "create-book-form", onSubmit: handleSubmit },
      React.createElement(
        "div",
        { className: "form-group" },
        React.createElement(
          "label",
          { className: "form-label", htmlFor: "bookName" },
          "✨ Give your scrapbook a special name ✨",
        ),
        React.createElement("input", {
          id: "bookName",
          type: "text",
          className: "form-input",
          value: bookName,
          onChange: (e) => setBookName(e.target.value),
          placeholder: "A Journey to remember...",
          maxLength: 50,
          required: true,
        }),
      ),
      React.createElement(
        "button",
        {
          type: "submit",
          className: "create-button",
          disabled: isCreating || !bookName.trim(),
        },
        isCreating
          ? React.createElement("span", null, React.createElement("span", { className: "loading" }), " Creating...")
          : "🎨 Create a new Chapter 🎨",
      ),
    ),

    showSuccess &&
      React.createElement("div", { className: "success-message" }, "🎉 Meomry created successfully! 🎉"),

    books.length > 0 &&
      React.createElement(
        "div",
        { className: "books-list" },
        React.createElement("h2", { className: "books-title" }, "📖 My Memory 📖"),
        books.map((book) =>
          React.createElement(
            "div",
            {
              key: book.id,
              className: "book-item",
              onClick: () => onOpenBook(book.id),
            },
            React.createElement(
              "div",
              null,
              React.createElement("div", { className: "book-name" }, book.name),
              React.createElement(
                "div",
                { className: "book-pages-count" },
                `${book.pages.length} page${book.pages.length !== 1 ? "s" : ""}`,
              ),
            ),
            React.createElement(
              "button",
              {
                className: "delete-book-button",
                onClick: (e) => {
                  e.stopPropagation()
                  if (window.confirm(`Are you sure you want to delete "${book.name}"?`)) {
                    onDeleteBook(book.id)
                  }
                },
              },
              "🗑️",
            ),
          ),
        ),
      ),
  )
}

function DraggableSticker({ sticker, onUpdate, onDelete, pageRect }) {
  const [isDragging, setIsDragging] = React.useState(false)
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 })

  const handleStart = (e) => {
    if (e.target.closest(".sticker-controls")) return

    e.preventDefault()
    setIsDragging(true)

    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY

    setDragStart({
      x: clientX - (sticker.x * pageRect.width) / 100,
      y: clientY - (sticker.y * pageRect.height) / 100,
    })
  }

  const handleMove = (e) => {
    if (!isDragging || !pageRect) return

    e.preventDefault()

    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY

    const newX = ((clientX - dragStart.x) / pageRect.width) * 100
    const newY = ((clientY - dragStart.y) / pageRect.height) * 100

    const boundedX = Math.max(5, Math.min(90, newX))
    const boundedY = Math.max(5, Math.min(90, newY))

    onUpdate(sticker.id, { x: boundedX, y: boundedY })
  }

  const handleEnd = () => {
    setIsDragging(false)
  }

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMove)
      document.addEventListener("mouseup", handleEnd)
      document.addEventListener("touchmove", handleMove, { passive: false })
      document.addEventListener("touchend", handleEnd)

      return () => {
        document.removeEventListener("mousemove", handleMove)
        document.removeEventListener("mouseup", handleEnd)
        document.removeEventListener("touchmove", handleMove)
        document.removeEventListener("touchend", handleEnd)
      }
    }
  }, [isDragging])

  return React.createElement(
    "div",
    {
      className: `draggable-sticker ${isDragging ? "dragging" : ""}`,
      style: {
        left: `${sticker.x}%`,
        top: `${sticker.y}%`,
        transform: "translate(-50%, -50%)",
      },
      onMouseDown: handleStart,
      onTouchStart: handleStart,
    },
    React.createElement("span", null, sticker.emoji),
    React.createElement(
      "div",
      { className: "sticker-controls" },
      React.createElement(
        "button",
        {
          className: "sticker-delete-btn",
          onClick: (e) => {
            e.stopPropagation()
            onDelete(sticker.id)
          },
        },
        "×",
      ),
    ),
  )
}

function StickerPalette({ onAddSticker }) {
  const stickerCategories = {
    "💖 Hearts": ["💖", "💕", "💗", "💓", "💝", "❤️", "🧡", "💛", "💚", "💙", "💜"],
    "🐾 Animals": ["🐱", "🐶", "🐰", "🦄", "🐸", "🐻", "🐼", "🐨", "🦊"],
    "🍕 Food": ["🍕", "🎂", "🍦", "🍪", "🍎", "🍌", "🍓", "🍒", "🍩"],
    "🌈 Nature": ["🌈", "⭐", "🌸", "🌻", "🌺", "🦋", "🌙", "☀️"],
    "😊 Faces": ["😊", "😍", "😎", "😂", "🤗", "😘", "🥰", "🤩"],
    "🎉 Party": ["🎉", "🎈", "🎁", "🎊", "🎀", "🎵", "🎶"],
  }

  const [activeCategory, setActiveCategory] = React.useState("💖 Hearts")

  return React.createElement(
    "div",
    { className: "sticker-palette" },
    React.createElement("h3", { className: "palette-title" }, "🎨 Add Stickers 🎨"),
    React.createElement(
      "div",
      { className: "category-tabs" },
      Object.keys(stickerCategories).map((category) =>
        React.createElement(
          "button",
          {
            key: category,
            className: `category-tab ${activeCategory === category ? "active" : ""}`,
            onClick: () => setActiveCategory(category),
          },
          category.split(" ")[0],
        ),
      ),
    ),
    React.createElement(
      "div",
      { className: "sticker-grid" },
      stickerCategories[activeCategory].map((emoji) =>
        React.createElement(
          "button",
          {
            key: emoji,
            className: "sticker-btn",
            onClick: () => onAddSticker(emoji),
          },
          emoji,
        ),
      ),
    ),
  )
}

function FramePalette({ currentFrame, onSelectFrame }) {
  const frames = [
    { id: "none", name: "No Frame", emoji: "⬜" },
    { id: "heart", name: "Heart", emoji: "💖" },
    { id: "star", name: "Star", emoji: "⭐" },
    { id: "rainbow", name: "Rainbow", emoji: "🌈" },
    { id: "flower", name: "Flower", emoji: "🌸" },
    { id: "party", name: "Party", emoji: "🎉" },
  ]

  return React.createElement(
    "div",
    { className: "frame-palette" },
    React.createElement("h3", { className: "frame-title" }, "🖼️ Photo Frames 🖼️"),
    React.createElement("p", { className: "frame-subtitle" }, "Choose a frame for your photo!"),
    React.createElement(
      "div",
      { className: "frame-grid" },
      frames.map((frame) =>
        React.createElement(
          "button",
          {
            key: frame.id,
            className: `frame-btn ${currentFrame === frame.id ? "active" : ""}`,
            onClick: () => onSelectFrame(frame.id),
          },
          React.createElement("div", { className: "frame-emoji" }, frame.emoji),
          React.createElement("div", { className: "frame-name" }, frame.name),
        ),
      ),
    ),
  )
}

function ScrapbookViewer({ book, onBack, onUpdateBook }) {
  const [currentPageIndex, setCurrentPageIndex] = React.useState(0)
  const [dragOver, setDragOver] = React.useState(false)
  const [pageRect, setPageRect] = React.useState(null)
  const fileInputRef = React.useRef(null)
  const pageRef = React.useRef(null)

  const currentPage = book.pages[currentPageIndex]

  React.useEffect(() => {
    if (pageRef.current) {
      const rect = pageRef.current.getBoundingClientRect()
      setPageRect(rect)
    }
  }, [currentPageIndex])

  React.useEffect(() => {
    const updatePageRect = () => {
      if (pageRef.current) {
        const rect = pageRef.current.getBoundingClientRect()
        setPageRect(rect)
      }
    }

    window.addEventListener("resize", updatePageRect)
    return () => window.removeEventListener("resize", updatePageRect)
  }, [])

  const handleImageUpload = (file) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const updatedBook = { ...book }
        updatedBook.pages[currentPageIndex] = {
          ...currentPage,
          image: e.target.result,
          hasImage: true,
        }
        onUpdateBook(updatedBook)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    handleImageUpload(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    handleImageUpload(file)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setDragOver(false)
  }

  const goToPage = (newIndex) => {
    if (newIndex >= 0 && newIndex < book.pages.length && newIndex !== currentPageIndex) {
      playPageSound()
      setCurrentPageIndex(newIndex)
    }
  }

  const addNewPage = () => {
    const updatedBook = { ...book }
    updatedBook.pages.push({
      id: Date.now(),
      image: null,
      hasImage: false,
      stickers: [],
    })
    onUpdateBook(updatedBook)
    goToPage(updatedBook.pages.length - 1)
  }

  const handlePageClick = (e) => {
    if (
      e.target.closest(".upload-area") ||
      e.target.closest(".page-image") ||
      e.target.closest("input") ||
      e.target.closest(".draggable-sticker") ||
      e.target.closest(".sticker-palette") ||
      e.target.closest(".frame-palette")
    ) {
      return
    }

    const pageElement = e.currentTarget
    const rect = pageElement.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const pageWidth = rect.width

    if (clickX < pageWidth / 2) {
      if (currentPageIndex > 0) {
        goToPage(currentPageIndex - 1)
      }
    } else {
      if (currentPageIndex < book.pages.length - 1) {
        goToPage(currentPageIndex + 1)
      } else {
        addNewPage()
      }
    }
  }

  const addSticker = (emoji) => {
    const updatedBook = { ...book }
    const newSticker = {
      id: Date.now() + Math.random(),
      emoji: emoji,
      x: 20 + Math.random() * 60,
      y: 20 + Math.random() * 60,
    }

    if (!updatedBook.pages[currentPageIndex].stickers) {
      updatedBook.pages[currentPageIndex].stickers = []
    }

    updatedBook.pages[currentPageIndex].stickers.push(newSticker)
    onUpdateBook(updatedBook)
  }

  const updateSticker = (stickerId, updates) => {
    const updatedBook = { ...book }
    const stickerIndex = updatedBook.pages[currentPageIndex].stickers.findIndex((s) => s.id === stickerId)

    if (stickerIndex !== -1) {
      updatedBook.pages[currentPageIndex].stickers[stickerIndex] = {
        ...updatedBook.pages[currentPageIndex].stickers[stickerIndex],
        ...updates,
      }
      onUpdateBook(updatedBook)
    }
  }

  const deleteSticker = (stickerId) => {
    const updatedBook = { ...book }
    updatedBook.pages[currentPageIndex].stickers = updatedBook.pages[currentPageIndex].stickers.filter(
      (s) => s.id !== stickerId,
    )
    onUpdateBook(updatedBook)
  }

  const selectFrame = (frameType) => {
    const updatedBook = { ...book }
    updatedBook.pages[currentPageIndex].frame = frameType
    onUpdateBook(updatedBook)
  }

  return React.createElement(
    "div",
    { className: "scrapbook-viewer" },
    React.createElement(FloatingDecorations),

    React.createElement(
      "div",
      { className: "scrapbook-header" },
      React.createElement(
        "button",
        {
          className: "back-button",
          onClick: onBack,
        },
        "← Back to Home",
      ),
      React.createElement("h1", { className: "scrapbook-title" }, book.name),
    ),

    React.createElement(
      "div",
      { className: "page-container" },
      React.createElement(
        "div",
        {
          ref: pageRef,
          className: "page",
          onClick: handlePageClick,
        },

        currentPageIndex > 0 && React.createElement("div", { className: "page-nav-hint left" }, "←"),

        React.createElement(
          "div",
          {
            className: "page-nav-hint right",
          },
          currentPageIndex < book.pages.length - 1 ? "→" : "+",
        ),

        React.createElement("div", { className: "page-number" }, `Page ${currentPageIndex + 1}`),

        React.createElement(
          "div",
          { className: "page-content" },
          currentPage.hasImage
            ? React.createElement("img", {
                src: currentPage.image,
                alt: `Page ${currentPageIndex + 1}`,
                className: `page-image frame-${currentPage.frame || "none"}`,
                onClick: (e) => {
                  e.stopPropagation()
                  fileInputRef.current?.click()
                },
              })
            : React.createElement(
                "div",
                {
                  className: `upload-area ${dragOver ? "dragover" : ""}`,
                  onClick: (e) => {
                    e.stopPropagation()
                    fileInputRef.current?.click()
                  },
                  onDrop: handleDrop,
                  onDragOver: handleDragOver,
                  onDragLeave: handleDragLeave,
                },
                React.createElement("div", { className: "upload-icon" }, "📷"),
                React.createElement("div", { className: "upload-text" }, "Add Your Photo Here!"),
                React.createElement("div", { className: "upload-subtext" }, "Click or drag & drop an image"),
              ),
        ),

        currentPage.stickers &&
          currentPage.stickers.map((sticker) =>
            React.createElement(DraggableSticker, {
              key: sticker.id,
              sticker: sticker,
              onUpdate: updateSticker,
              onDelete: deleteSticker,
              pageRect: pageRect,
            }),
          ),

        React.createElement("input", {
          ref: fileInputRef,
          type: "file",
          accept: "image/*",
          onChange: handleFileSelect,
          className: "hidden-input",
        }),
      ),
    ),

    React.createElement(StickerPalette, {
      onAddSticker: addSticker,
    }),

    React.createElement(FramePalette, {
      currentFrame: currentPage.frame || "none",
      onSelectFrame: selectFrame,
    }),

    React.createElement(
      "div",
      { className: "navigation" },
      React.createElement(
        "button",
        {
          className: "nav-button",
          onClick: () => goToPage(currentPageIndex - 1),
          disabled: currentPageIndex === 0,
        },
        "← Previous Page",
      ),

      React.createElement(
        "div",
        { className: "page-info" },
        React.createElement("div", null, `Page ${currentPageIndex + 1} of ${book.pages.length}`),
        React.createElement(
          "button",
          {
            className: "add-page-button",
            onClick: addNewPage,
          },
          "+ Add New Page",
        ),
      ),

      React.createElement(
        "button",
        {
          className: "nav-button",
          onClick: () => goToPage(currentPageIndex + 1),
          disabled: currentPageIndex === book.pages.length - 1,
        },
        "Next Page →",
      ),
    ),
  )
}

function App() {
  const [books, setBooks] = useLocalStorage("scrapbooks", [])
  const [currentBookId, setCurrentBookId] = React.useState(null)

  const createBook = (name) => {
    const newBook = {
      id: Date.now(),
      name: name,
      createdAt: new Date().toISOString(),
      pages: [
        {
          id: Date.now(),
          image: null,
          hasImage: false,
          stickers: [],
        },
      ],
    }
    setBooks([...books, newBook])
  }

  const openBook = (bookId) => {
    setCurrentBookId(bookId)
  }

  const closeBook = () => {
    setCurrentBookId(null)
  }

  const updateBook = (updatedBook) => {
    const updatedBooks = books.map((book) => (book.id === updatedBook.id ? updatedBook : book))
    setBooks(updatedBooks)
  }

  const deleteBook = (bookId) => {
    const updatedBooks = books.filter((book) => book.id !== bookId)
    setBooks(updatedBooks)
    if (currentBookId === bookId) {
      setCurrentBookId(null)
    }
  }

  const currentBook = books.find((book) => book.id === currentBookId)

  return React.createElement(
    "div",
    { className: "app" },
    currentBook
      ? React.createElement(ScrapbookViewer, {
          book: currentBook,
          onBack: closeBook,
          onUpdateBook: updateBook,
        })
      : React.createElement(Homepage, {
          onCreateBook: createBook,
          onOpenBook: openBook,
          books: books,
          onDeleteBook: deleteBook,
        }),
  )
}

ReactDOM.render(React.createElement(App), document.getElementById("root"))

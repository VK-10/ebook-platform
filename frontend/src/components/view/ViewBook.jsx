import { useState } from 'react';
import { ChevronLeft, Menu } from 'lucide-react';
import ViewChapterSidebar from './ViewChapterSidebar';

const ViewBook = ({ book }) => {
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fontSize, setFontSize] = useState(18);

  const selectedChapter = book?.chapters?.[selectedChapterIndex];

  const formatContent = (content) => {
    return content
      .split('\n\n')
      .filter((p) => p.trim())
      .map((paragraph) => {
        paragraph = paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        paragraph = paragraph.replace(
          /(?<!\*)\*(?!\*)(.*?)\*(?!\*)/g,
          '<em>$1</em>'
        );
        return `<p>${paragraph}</p>`;
      })
      .join('');
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-white text-gray-900">
      <ViewChapterSidebar
        book={book}
        selectedChapterIndex={selectedChapterIndex}
        onSelectChapter={setSelectedChapterIndex}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-gray-100">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="font-semibold text-base md:text-lg truncate">
              <h1>{book.title}</h1>
              <p className="text-sm text-gray-500">by {book.author}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 mr-4">
              <button
                onClick={() => setFontSize(Math.max(14, fontSize - 2))}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-sm font-bold"
              >
                A-
              </button>

              <span className="text-sm text-gray-500">{fontSize}px</span>

              <button
                onClick={() => setFontSize(Math.min(36, fontSize + 2))}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-lg font-bold"
              >
                A+
              </button>
            </div>
          </div>
        </header>

        {/* Reading Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-12">
            <h1 className="text-xl md:text-3xl font-bold mb-8 leading-tight">
              {selectedChapter?.title}
            </h1>

            <div
              className="reading-content"
              style={{
                fontSize: `${fontSize}px`,
                lineHeight: '1.65',
                fontFamily: 'Charter, Georgia, "Times New Roman", serif',
              }}
              dangerouslySetInnerHTML={{
                __html: formatContent(selectedChapter?.content || ''),
              }}
            />

            {/* Navigation */}
            <div className="flex justify-between items-center mt-16 pt-8 border-t border-gray-200">
              <button
                onClick={() =>
                  setSelectedChapterIndex((prev) => Math.max(0, prev - 1))
                }
                disabled={selectedChapterIndex === 0}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous Chapter
              </button>

              <span className="text-sm text-gray-500">
                {selectedChapterIndex + 1} / {book.chapters.length}
              </span>

              <button
                onClick={() =>
                  setSelectedChapterIndex(
                    Math.min(book.chapters.length - 1, selectedChapterIndex + 1)
                  )
                }
                disabled={selectedChapterIndex === book.chapters.length - 1}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next Chapter
                <ChevronLeft className="w-4 h-4 rotate-180" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ViewBook;

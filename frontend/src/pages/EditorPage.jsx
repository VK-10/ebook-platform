// src/pages/EditorPage.jsx
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import {
  Sparkles,
  FileDown,
  Save,
  Menu,
  X,
  Edit,
  NotebookText,
  ChevronDown,
  FileText,
} from "lucide-react";

// Fixed import: use arrayMove from @dnd-kit/sortable
import { arrayMove } from "@dnd-kit/sortable";

import axiosInstance from "../utils/axiosInstance";

import { API_PATHS } from "../utils/apiPaths";
import Dropdown, { DropdownItem } from "../components/ui/Dropdown";
import InputField from "../components/ui/InputField";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import SelectField from "../components/ui/SelectField";
import ChapterSidebar from "../components/editor/ChapterSidebar";
import ChapterEditorTab from "../components/editor/ChapterEditorTab";
import BookDetailsTab from "../components/editor/BookDetailsTab";

const EditorPage = () => {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("editor");
  const fileInputRef = useRef(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // AI Modal State
  const [isOutlineModalOpen, setIsOutlineModalOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiStyle, setAiStyle] = useState("Informative");
  // isGenerating holds either null (not generating) or the index being generated
  const [isGenerating, setIsGenerating] = useState(null); // null | number

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const response = await axiosInstance.get(
          `${API_PATHS.BOOKS.GET_BOOKS_BY_ID}/${bookId}`
        );
        setBook(response.data);
      } catch (error) {
        toast.error("Failed to load book details.");
        navigate("/dashboard");
      } finally {
        setIsLoading(false);
      }
    };
    fetchBook();
  }, [bookId, navigate]);

  // Keep selectedChapterIndex within bounds whenever chapters length changes
  useEffect(() => {
    if (!book?.chapters?.length) return;
    setSelectedChapterIndex((idx) => Math.min(idx, book.chapters.length - 1));
  }, [book?.chapters?.length]);

  const handleBookChange = (e) => {
    const { name, value } = e.target;
    setBook((prev) => ({ ...prev, [name]: value }));
  };

  const handleChapterChange = (e) => {
    const { name, value } = e.target;
    const updatedChapters = [...(book?.chapters || [])];
    updatedChapters[selectedChapterIndex] = {
      ...updatedChapters[selectedChapterIndex],
      [name]: value,
    };
    setBook((prev) => ({ ...prev, chapters: updatedChapters }));
  };

  const handleAddChapter = () => {
    const newChapter = {
      title: `Chapter ${book?.chapters?.length + 1 || 1}`,
      content: "",
    };

    const updatedChapters = [...(book?.chapters || []), newChapter];
    setBook((prev) => ({ ...prev, chapters: updatedChapters }));
    setSelectedChapterIndex(updatedChapters.length - 1);
  };

  const handleDeleteChapter = (index) => {
    if ((book?.chapters?.length || 0) <= 1) {
      toast.error("A book must have at least one chapter.");
      return;
    }
    const updatedChapters = (book?.chapters || []).filter((_, i) => i !== index);
    setBook((prev) => ({ ...prev, chapters: updatedChapters }));
    setSelectedChapterIndex((prevIndex) =>
      prevIndex >= index ? Math.max(0, prevIndex - 1) : prevIndex
    );
  };

  const handleReorderChapters = (oldIndex, newIndex) => {
    if (!book?.chapters) return;
    setBook((prev) => ({
      ...prev,
      chapters: arrayMove(prev.chapters, oldIndex, newIndex),
    }));
    setSelectedChapterIndex(newIndex);
  };

  const handleSaveChanges = async (bookToSave = book, showToast = true) => {
    if (!bookToSave) return;

    setIsSaving(true);
    try {
      await axiosInstance.put(
        `${API_PATHS.BOOKS.UPDATE_BOOK}/${bookId}`,
        bookToSave
      );
      if (showToast) {
        toast.success("Changes saved successfully");
      }
    } catch (error) {
      console.error("Error", error);
      toast.error("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCoverImageUpload = async (e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("coverImage", file);
    setIsUploading(true);

    try {
      // include bookId in URL (many backends expect it)
      const response = await axiosInstance.put(
        `${API_PATHS.BOOKS.UPDATE_COVER}/${bookId}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setBook(response.data);
      toast.success("Cover image updated");
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload cover image.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateChapterContent = async (index) => {
    const chapter = book?.chapters?.[index];
    if (!chapter || !chapter.title) {
      toast.error("Chapter title is required to generate content.");
      return;
    }

    setIsGenerating(index);
    try {
      const response = await axiosInstance.post(API_PATHS.AI.GENERATE_CHAPTER_CONTENT, {
        chapterTitle: chapter.title,
        chapterDescription: chapter.description || "",
        style: aiStyle,
      });

      const updatedChapters = [...book.chapters];
      updatedChapters[index] = {
        ...updatedChapters[index],
        content: response.data.content,
      };

      const updatedBook = { ...book, chapters: updatedChapters };
      setBook(updatedBook);
      toast.success(`Content for "${chapter.title}" generated!`);

      await handleSaveChanges(updatedBook, false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate chapter content");
    } finally {
      setIsGenerating(null);
    }
  };

  const handleExportPDF = async () => {
    const toastId = toast.loading("Generating PDF...");
    try {
      const response = await axiosInstance.get(`${API_PATHS.EXPORT.PDF}/${bookId}/pdf`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${book?.title || "book"}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.dismiss(toastId);
      toast.success("PDF export started!");
    } catch (error) {
      console.error(error);
      toast.dismiss(toastId);
      toast.error("Failed to export PDF.");
    }
  };

  const handleExportDoc = async () => {
    const toastId = toast.loading("Generating Document...");
    try {
      // Use dedicated DOC path if available, otherwise fall back to PDF/doc endpoint
      const docEndpoint = API_PATHS.EXPORT.DOC ? `${API_PATHS.EXPORT.DOC}/${bookId}` : `${API_PATHS.EXPORT.PDF}/${bookId}/doc`;
      const response = await axiosInstance.get(docEndpoint, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${book?.title || "book"}.docx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.dismiss(toastId);
      toast.success("Document export started!");
    } catch (error) {
      console.error(error);
      toast.dismiss(toastId);
      toast.error("Failed to export Document.");
    }
  };

  if (isLoading || !book) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p> Loading Editor...</p>
      </div>
    );
  }

  return (
      
      <div className="flex bg-slate-50 font-sans relative min-h-screen">
        {/* Mobile Sidebar */}
        {isSidebarOpen && (
          <div className="fixed inset-0 z-40 flex md:hidden" role="dialog" aria-modal="true">
            <div
              className="fixed inset-0 bg-black/20 bg-opacity-75"
              aria-hidden="true"
              onClick={() => setIsSidebarOpen(false)}
            ></div>

            <div className="relative flex-1 flex flex-col max-w-xs w-full">
              <div className="bg-white absolute top-0 right-0 -mr-12 pt-2">
                <button
                  type="button"
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <span className="sr-only">Close sidebar</span>
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>

              <ChapterSidebar
                book={book}
                selectedChapterIndex={selectedChapterIndex}
                onSelectChapter={(index) => {
                  setSelectedChapterIndex(index);
                  setIsSidebarOpen(false);
                }}
                onAddChapter={handleAddChapter}
                onDeleteChapter={handleDeleteChapter}
                onGenerateChapterContent={handleGenerateChapterContent}
                isGenerating={isGenerating}
                onReorderChapters={handleReorderChapters}
              />
            </div>

            <div className="flex-shrink-0 w-14" aria-hidden="true"></div>
          </div>
        )}

        {/* Desktop Sidebar */}
        <div className="hidden md:flex md:flex-shrink-0 sticky top-0 h-screen">
          <ChapterSidebar
            book={book}
            selectedChapterIndex={selectedChapterIndex}
            onSelectChapter={(index) => {
              setSelectedChapterIndex(index);
              setIsSidebarOpen(false);
            }}
            onAddChapter={handleAddChapter}
            onDeleteChapter={handleDeleteChapter}
            onGenerateChapterContent={handleGenerateChapterContent}
            isGenerating={isGenerating}
            onReorderChapters={handleReorderChapters}
          />
        </div>

        <main className="flex-1 h-full flex flex-col">
          <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-slate-200 p-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
              {/* fixed button markup: className belongs on the button */}
              <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 text-slate-500 hover:text-slate-800">
                <Menu className="w-6 h-6" />
              </button>

              <div className="hidden sm:flex space-x-1 bg-slate-100 p-1 rounded-lg" />

              <button
                onClick={() => setActiveTab("editor")}
                className={`flex items-center justify-center flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors duration-200 ${
                  activeTab === "editor" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </button>

              <button
                onClick={() => setActiveTab("details")}
                className={`flex items-center justify-center flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors duration-200 whitespace-nowrap ${
                  activeTab === "details" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <NotebookText className="w-4 h-4 mr-2" />
                Book Details
              </button>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <Dropdown
                trigger={
                  <Button variant="secondary" icon={FileDown}>
                    Export
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </Button>
                }
              >
                <DropdownItem onClick={handleExportPDF}>
                  <FileText className="w-4 h-4 mr-2 text-slate-500" />
                  Export as PDF
                </DropdownItem>
                <DropdownItem onClick={handleExportDoc}>
                  <FileText className="w-4 h-4 mr-2 text-slate-500" />
                  Export as Document
                </DropdownItem>
              </Dropdown>

              <Button onClick={() => handleSaveChanges()} isLoading={isSaving} icon={Save}>
                Save Changes
              </Button>
            </div>
          </header>

          <div className="w-full">
            {activeTab === "editor" ? (
              <ChapterEditorTab
                book={book}
                selectedChapterIndex={selectedChapterIndex}
                // fixed: pass chapter change handler (not add)
                onChapterChange={handleChapterChange}
                onGenerateChapterContent={handleGenerateChapterContent}
                isGenerating={isGenerating}
              />
            ) : (
              <BookDetailsTab
                book={book}
                onBookChange={handleBookChange}
                onCoverUpload={handleCoverImageUpload}
                isUploading={isUploading}
                fileInputRef={fileInputRef}
              />
            )}
          </div>
        </main>
      </div>

  );
};

export default EditorPage;

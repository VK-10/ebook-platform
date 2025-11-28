import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, Trash2, Plus, GripVertical } from "lucide-react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";

import Button from "../ui/Button";

// Helper SortableItem
const SortableItem = ({
  chapter,
  index,
  selectedChapterIndex,
  onSelectChapter,
  onDeleteChapter,
  onGenerateChapterContent,
  isGenerating,
}) => {
  // useSortable returns attributes, listeners, setNodeRef, transform, transition
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: chapter._id || `new-${index}`,
    });

  // Build transform style safely
  const style = {
    transform: transform
      ? `translate3d(${Math.round(transform.x || 0)}px, ${Math.round(
          transform.y || 0
        )}px, 0)`
      : undefined,
    transition,
    cursor: "grab",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`flex items-center justify-between p-2 rounded hover:bg-slate-50 ${
        selectedChapterIndex === index ? "bg-slate-100" : ""
      }`}
    >
      <div className="flex items-center gap-2">
        <div {...listeners} className="cursor-grab">
          <GripVertical />
        </div>
        <div
          className="flex-1 cursor-pointer"
          onClick={() => onSelectChapter(index)}
        >
          <div className="font-medium">{chapter.title || `Untitled ${index + 1}`}</div>
          <div className="text-sm text-slate-500">{chapter.summary || ""}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          onClick={() => onGenerateChapterContent(index)}
          disabled={isGenerating}
        >
          <Sparkles />
        </Button>

        <Button variant="danger" onClick={() => onDeleteChapter(index)}>
          <Trash2 />
        </Button>
      </div>
    </div>
  );
};

const ChapterSidebar = ({
  chapters = [],
  selectedChapterIndex = 0,
  onSelectChapter = () => {},
  onAddChapter = () => {},
  onDeleteChapter = () => {},
  onGenerateChapterContent = () => {},
  isGenerating = false,
  onBack = () => {},
}) => {
  return (
    <aside className="w-80 border-r">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft />
          </Button>
          <h4 className="text-lg font-semibold">Chapters</h4>
        </div>
        <div>{/* additional controls if any */}</div>
      </div>

      <div className="p-2">
        <DndContext collisionDetection={closestCenter}>
          <SortableContext items={chapters.map((c, idx) => c._id || `new-${idx}`)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {chapters.map((chapter, idx) => (
                <SortableItem
                  key={chapter._id || `new-${idx}`}
                  chapter={chapter}
                  index={idx}
                  selectedChapterIndex={selectedChapterIndex}
                  onSelectChapter={onSelectChapter}
                  onDeleteChapter={onDeleteChapter}
                  onGenerateChapterContent={onGenerateChapterContent}
                  isGenerating={isGenerating}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <div className="p-4 border-t border-slate-200">
        <Button variant="secondary" onClick={onAddChapter} className="w-full" icon={Plus}>
          New Chapter
        </Button>
      </div>
    </aside>
  );
};

export default ChapterSidebar;
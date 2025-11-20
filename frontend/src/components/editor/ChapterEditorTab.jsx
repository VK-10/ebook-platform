import React from 'react'
import {useMemo, useState } from "react";
import {Sparkles, Type, Eye, Maximize2, SpellCheck } from "lucide-react";
import InputField from "../ui/Button";
import SimpleMEditor from "./SimpleEditor";

const ChapterEditorTab = ({
    book = {
        title: "Untitled",
        chapters: [
            {
                title: "Chapter 1",
                content: "-"
            }
        ]
    },
    selectedChapterIndex = 0,
    onChapterChange = ()=> {},
    onGenerateChapterContent = () => {},
    isGenerating,
}) => {

    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    //simple markdown parser
    const formatMarkdown = (content) => {
    return content
        // Headers
        .replace(/^### (.*$)/gm, '<h3 class="text-xl font-bold mb-4 mt-6">$1</h3>')
        .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-bold mb-4 mt-8">$1</h2>')
        .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold mb-6 mt-8">$1</h1>')

        // Bold and Italic
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')

        // Blockquotes
        .replace(
        /^> (.*$)/gm,
        '<blockquote class="border-l-4 border-violet-500 pl-4 italic text-gray-700 my-4">$1</blockquote>'
        )

        // Unordered lists
        .replace(/^- (.*$)/gm, '<li class="ml-4 mb-1">• $1</li>')
        .replace(/(<li.*<\/li>)/gs, '<ul class="my-4">$1</ul>')

        // Ordered lists
        .replace(/^\d+\. (.*$)/gm, '<li class="ml-4 mb-1 list-decimal">$1</li>')
        .replace(
        /(<li class="ml-4 mb-1 list-decimal">.*<\/li>)/gs,
        '<ol class="my-4 ml-4">$1</ol>'
        )

        // Paragraphs
        .split('\n\n')
        .map((paragraph) => {
        paragraph = paragraph.trim();
        if (!paragraph) return '';
        // Skip if already wrapped in HTML tags
        if (paragraph.startsWith('<')) return paragraph;
        return `<p class="mb-4 text-justify">${paragraph}</p>`;
        })
        .join('');
    };


    const mdeOptions = useMemo(() => {
        return {
            autofocus: true,
            spellChecker: false,
            toolbar: [
                "bold", "italic", "heading", "|",
                "qoute", "unordered-list", "ordered-list", "|",
                "link", "image", "|",
                "preview", "side-by-side", "fullscreen",
            ],
        };
    },[])

    if(selectedChapterIndex === null || !book.chapters[selectedChapterIndex]) {
        return (
            <div className='flex-1 flex items-center justify-center'>
                <div className='text-center'>
                    <div className='w-16 h-16 bg-gray-100 rounded-full flex flex items-center justify-center mx-auto mb-4'>
                        <Type className='w-8 h-8 text-gray-40'/>
                    </div>
                    <p className='text-gray-500 text-lg'> Select a chapter to start editing</p>
                    <p className='text-gray-400 text-sm mt-1'>Choose from the sidebar to begin writing</p>
                </div>
            </div>
        )
    } 

    const currentChapter = book.chapters[selectedChapterIndex];

    return <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'flex-1'} flex flex-col`}> 
        {/*Header*/}
        <div className=''>
            <div className=''>
                <div className=''>
                    <div>
                        <h1 className=''> Chapter Editor</h1>
                        <p className=''>
                            Editing : {currentChapter.title || `Chapter ${selectedChapterIndex + 1}`}
                        </p>
                    </div>
                    <div className=''>
                        {/*Editor Controls*/}
                        <div className=''>
                            <button onClick={() => setIsPreviewMode(false)}
                                className = {`px-3 py-2 text-sm font-medium transtion-colors ${
                                    !isPreviewMode
                                    ? 'bg-violet-50 text-violet-700 border-r border-violet-200'
                                    : ' text-gray-600 hover:bg-gray-50'
                                }`} >
                                    Edit
                                </button>
                                
                                <button onClick={() => setIsPreviewMode(true)}
                                className = {`px-3 py-2 text-sm font-medium transtion-colors ${
                                    isPreviewMode
                                    ? 'bg-violet-50 text-violet-700 '
                                    : ' text-gray-600 hover:bg-gray-50'
                                }`} >
                                    Preview
                                </button>

                                <button onClick={() => setIsFullscreen(!isFullscreen)}
                                    className=''
                                    title="Toggle Fullscreen"
                                >
                                    <Maximize2 className=''/>
                                </button>

                                <Button onClick={() => onGenerateChapterContent(selectedChapterIndex)}
                                    isLoading = {isGenerating === selectedChapterIndex}
                                    icon = {Sparkles}
                                    size ="sm"
                                >
                                    Generate with AI
                                </Button>
                        </div>
                    </div>
                </div>
            </div>


            {/*Content Area*/}
            
        </div>
    </div>
};

export default ChapterEditorTab
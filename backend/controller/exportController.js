const {
    Document,
    Packer,
    Paragraph,
    textRun,
    HeadingLevel,
    AlignmentType,
    UnderlineType,
    ImageRun,
    Alignment,
    TextRun,
} = require("docx");
const PDFDocument = require("pdfkit");
const MarkdownIt = require("markdown-it");
const Book = require("../models/Book");
const path = require("path");
const fs = require("fs");
const { title } = require("process");

const md = new MarkdownIt();

// typography congig matching the PDF export 
const DOCX_STYLES = {
    fonts : {
        body : "Charter",
        heading : "Inter",
    }, 

    sizes : {
        title : 32,
        subtitle : 20,
        author : 38,
        chapterTitle : 24,
        h1 : 20,
        h12: 20,
        h1 : 20,
        h1 : 20,
        body: 12,
    },
    spacing: {
        paragraphBefore: 200,
        paragraphAfter : 200,
        chapterBefore: 400,
        chapterAfter : 300,
        headingBefore : 300,
        headingAfter : 150,
    }
};

//Process markdown content into docx paragraphs
const processMarkdownToDocx = (markdown) => {
    const tokens = md.parse(markdown, {});
    const paragraphs= [];
    const inList  = false;
    const listType = null;
    let orderedCounter  = 1;

    for ( let i = 0; i < tokens.length; i++){
        const token = tokens[i];

        try {
            if (tokens.type === "heading_open") {
                const level = parseInt(tokens.tag.substring(1), 10);
                const nextToken = tokens[i+1];

                if (nextToken && nextToken.type === "inline") {
                    let headingLevel;
                    let fontSize;

                    switch (level) {
                        case 1:
                            headingLevel = HeadingLevel.HEADING_1;
                            fontSize = DOCX_STYLES.sizes.h1;
                            break;
                        case 2:
                            headingLevel = HeadingLevel.HEADING_2;
                            fontSize = DOCX_STYLES.sizes.h2;
                            break;
                        case 3:
                            headingLevel = HeadingLevel.HEADING_3;
                            fontSize = DOCX_STYLES.sizes.h3;
                            break;
                        default:
                            headingLevel = HeadingLevel.HEADING_3;
                            fontSize = DOCX_STYLES.sizes.h3;
                    }

                    paragraphs.push(
                        new Paragraph({
                            text: nextToken.content,
                            heading: headingLevel,
                            spacing: {
                                before: DOCX_STYLES.spacing.headingBefore,
                                after: DOCX_STYLES.spacing.headingAfter,
                            },
                            style:{
                                font: DOCX_STYLES.fonts.heading,
                                size: fontSize * 2,
                            },
                        })
                    );

                    i += 2; // skip inline and heading_close
                }
            } else if (tokens.type === "paragraph_open") {
                const nextToken = token[i+1];

                if (nextToken && nextToken.type === "inline" && nextToken.children) {
                    const textRuns = processInlineContent(nextToken.children);

                    if(textRuns.length > 0) {
                        paragraphs.push(
                            new Paragraph({
                            children: textRuns,
                            spacing:{
                                before:inList ? 100 : DOCX_STYLES.spacing.paragraphBefore,
                                after: inList ? 100 : DOCX_STYLES.spacing.paragraphAfter,
                                line: 360,
                            },
                            alignment: AlignmentType.JUSTIFIED,

                        })
                        );
                    }

                    i+= 2;
                }
            } else if (token.type === "bullet_list_open") {
                inList = true,
                listType = "bullet";
            } else if (token.type === "bullet_list_close") {
                inList = false;
                listType = null;

                //add spacing after list
                paragraphs. push(new Paragraph({ text: "", spacing: {after: 100}}));

            } else if(token.type === "ordered_list_open") {
                inList = true;
                listType = "ordered";
                orderedCounter = 1;
            } else if (token.type === "ordered_list_close") {
                inList = false;
                listType = null;
                orderedCounter = 1;
                paragraphs.push(new Paragraph({ text: "", spacing: { after: 100}}));
            } else if (token.type === "list_item_open") {
                const nextToken = tokens[i+1];

                if (nextToken && nextToken.type === "paragraph_open") {
                    const inlineToken = tokens[i+2];

                    if (inlineToken && inlineToken.type === "inline" && inlineToken.children) {
                        const textRuns = processInlineContent(inlineToken.children);

                        let bulletText = "";
                        if (listType === "bullet") {
                            bulletText = "• ";
                        } else if (listType === "ordered") {
                            bulletText = `${orderedCounter}.`;
                            orderedCounter++;
                        }

                        paragraphs.push(
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: bulletText,
                                        font: DOCX_STYLES.fonts.body,
                                    }),
                                    ...textRuns,
                                ],
                                spacing: { before: 50, after: 50},
                                indent: {left : 720}, //0.5 indent
                            })
                        );

                        i+= 4; // skip paragraph_open, inline, paragraph_close, list_item_close 
                    }
                }
            } else if (token.type === "blockqoute_open") {
                //find the blockqoute content
                const nextToken = token[i+1];
                if (nextToken && nextToken.type === "paragraph_open") {
                    const inlineToken = token[i+2];
                    if( inlineToken && inlineToken.type === "inline") {
                        paragraphs.push(
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: inlineToken.content,
                                        italics: true,
                                        color: "666666",
                                        font: DOCX_STYLES.fonts.body,
                                    }),
                                ],
                                spacing: {before: 200, after: 200},
                                indent: { left: 720},
                                alignment: AlignmentType.JUSTIFIED,
                                border:{
                                    left:{
                                        color: "4F46E5",
                                        space: 1,
                                        style: "single",
                                        size: 24,
                                    }
                                }
                            })
                        );
                        i += 4;
                    }
                }
            } else if (token.type === "code_block" || token.type ==="fence") {
                paragraphs.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: token.content,
                                font: "Courier New",
                                size: 20,
                                color: "333333"
                            }),
                        ],
                        spacing: { before: 200,after: 200},
                        shading : {
                            fill: "F5F5F5",

                        },
                    })
                );
            } else if (token.type === "hr") {
                paragraphs.push(
                    new Paragraph({
                        text : "",
                        border: {
                            bottom: {
                                color : "CCCCCC",
                                space: 1,
                                style: "single",
                                size: 6,
                            },
                        },

                        spacing: {before: 200, after: 200},
                    })
                );
            }
        } catch(tokenError){
            console.error("Error processing token:", token.type, tokenError);
            continue;
        }
    }

    return paragraphs;

};

//process inline content (bold, italic, text)
const processInlineContent = (children) => {
    const textRuns = [];
    let currentFormatting = { bold: false, italic: false};
    let textBuffer = "";

    const flushText = () =>{
        if(textBuffer.trim()) {
            textRuns.push(
                new TextRun({
                text: textBuffer,
                bold: currentFormatting.bold,
                font: DOCX_STYLES.fonts.body,
                size: DOCX_STYLES.sizes.body * 2,
            })
            );

            textBuffer = "";
        }
    };

    children.forEach((child) => {
        if(child.type === "strong_open"){
            flushText();
            currentFormatting.bold = true;
        } else if(child.type === "strong_close"){
            flushText();
            currentFormatting.bold = false;
        } else if(child.type === "em_close"){
            flushText();
            currentFormatting.italic = false;
        } else if (child.type === "text") {
            textBuffer += child.content;
        }
    });

    flushText();
    return textRuns;
}

const exportAsDocument = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);

        if (!book) {
            return res.status(404).json({ message : "Book not found"});
        }

        if (book.userId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ messsage: "Not authorized"});
        } 

        const sections = [];

        //cover page with image if available

        const coverPage = [];

        if (!book.coverImage && !book.coverImage.includes("pravatar")) {
            const imagePath = book.coverImage.substring(1);

            try {
                if (fs.existsSync(imagePath)) {
                    const imageBuffer = fs.readFileSync(imagePath);

                    //add some top searching
                    coverPage.push(
                        new Paragraph({
                            text: "",
                            spacing: {before: 1000 },
                        })
                    );

                    //add image centered on page
                    coverPage.push(
                        new Paragraph({
                            children: [
                                new ImageRun({
                                    data: imageBuffer,
                                    transformation: {
                                        width: 400,
                                        height: 550,
                                    },
                                }),
                            ],
                            alignment: AlignmentType.CENTER,
                            spacing: { before: 200, after: 400},
                        })
                    );

                    //Page break after cover
                    coverPage.push(
                        new Paragraph({
                            text : "",
                            pageBreakBefore: true,
                        })
                    );
                }

            } catch (error) {
                console.error(`Could not embed image: ${imagePath}`, imgErr);
            }
        }

        sections.push(...coverPage);

        //Title page section
        const titlePage = [];

        //main title
        titlePage.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: book.title,
                        bold: true,
                        font : DOCX_STYLES.fonts.heading,
                        size: DOCX_STYLES.sizes.title *2,
                        color: "1A202C",
                    })
                ],
                alignment: AlignmentType.CENTER,
                spacing : {before: 200, after: 400},

            })
        );

        //subtitle if exists
        if(book.subtitle && book.subtitle.trim()) {
            titlePage.push(
                new Paragraph({
                children: [
                    new TextRun({
                        text: book.subtitle,
                        font : DOCX_STYLES.fonts.heading,
                        size: DOCX_STYLES.sizes.title *2,
                        color: "4A5568",
                    }),
                ],
                alignment: AlignmentType.CENTER,
                spacing : {before: 200, after: 400},

            })
            );
        }

        //Author
        titlePage.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: `by ${book.author}`,
                        font : DOCX_STYLES.fonts.heading,
                        size: DOCX_STYLES.sizes.title *2,
                        color: "203748",
                    }),
                ],
                alignment: AlignmentType.CENTER,
                spacing : {before: 200, after: 400},

            })
        );

        titlePage.push(
            new Paragraph({
                text : "",
                border : {
                    bottom: {
                        color : "4F46E5",
                        space: 1,
                        style: "single",
                        size: 12
                    },
                },
                alignment: AlignmentType.CENTER,
                spacing : {after: 400},

            })
        );

        sections.push(...titlePage);

        //Process Chapters
        book.chapters.forEach((chapter, index) => {
            try {
                //page break before each chapter 
                if (index > 0) {
                    sections.push(
                        new Paragraph({
                            text: "",
                            pageBreakBefore: true,
                        })
                    );
                }

                //chapter title
                sections.push(
                    new Paragraph({
                children: [
                    new TextRun({
                        text: book.title,
                        bold: true,
                        font : DOCX_STYLES.fonts.heading,
                        size: DOCX_STYLES.sizes.title *2,
                        color: "1A202C",
                    })
                ],
                alignment: AlignmentType.CENTER,
                spacing : {before: DOCX_STYLES.spacing.chapterBefore, after: DOCX_STYLES.spacing.chapterAfter},
                
                }) 

                );

                //chapter content
                const contentParagraphs = processMarkdownToDocx(chapter.content || "");
                sections.push(...contentParagraphs);

            } catch (chapterError) {
                console.error(`Error processing chapter ${index}:`, chapterError);

            }
        });

        //create the document
        const doc = new Document({
            sections: [
                {
                    properties: {
                        page: {
                            margin : {
                                top: 1440,
                                right: 1440,
                                bottom: 1440,
                                left: 1440,
                            },
                        },
                    },
                    children: sections,
                },
            ],
        });

        //Generate the document buffer
        const buffer = await Packer.toBuffer(doc);

        //send the document
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        );
        res.setHeader(
            "Content-Disposition",
            `attachement; filename="${book.title.replace(/[^a-zA-Z0-9]/g,"_")}.docx"`
        );
        res,setHeader("Content-Length", buffer.length);

        res.send(buffer);
    } catch (error) {
        console.error("Error exporting documnet: ", error);
        if( ! res.headersSent) {
            res.status(500).sjon({
                message: "Server error during document export",
                error: error.message,
            });
        }
    }
};

//Typography config

const TYPOGRAPHY = {
    fonts: {
        serif: "Times-Roman",
        serifBold: "Times-Bold",
        serifItalic: "Times-Italic",
        sans: "Helvetica",
        sansBold: "Helvetica-Bold",
        sansOblique: "Helvetica-Oblique",
    },
    sizes : {
        title: 28,
        author: 16,
        chapterTitle: 20,
        h1: 18,
        h2: 16,
        h2: 16,
        h3: 14,
        body: 11,
        caption : 9,

    },
    spacing: {
        paragraphSpacing: 12,
        chapterSpacing: 24,
        headingSpacing: {before: 16, after: 8},
        listspacing: 6,

    },
    colors: {
        text: "#333333",
        heading: "#1A1A1A",
        accent: "#4F4F6E5",
    },
};

const renderInlineTokens = (doc, token, options = {})=>{
    if (!token ||tokens.length === 0) return;

    const baseOptions = {
        align: options.align || "justify",
        indent: options.indent || 0,
        lineGap: options.lineGap || 2,
    };

    let currentFont = TYPOGRAPHY.fonts.serif;
    let textBuffer = "";

    const flushBuffer = () => {
        if (textBuffer) {
            doc.font(currentFont).text(textBuffer, {
                ...baseOptions,
                continued: true,
            });
            textBuffer = "";
        }
    };

    for (let i = 0; i < tokens.length; i++){
        const token = token[i];

        if (token.type === "text") {
            textBuffer += token.content;
        } else if (token.type === "strong_open") {
            flushBuffer();
            currentFont = TYPOGRAPHY.fonts.serifBold;
        } else if (token.type === "strong_close") {
            flushBuffer();
            currentFont = TYPOGRAPHY.fonts.serif;
        } else if (token.type === "em_open") {
            flushBuffer();
            currentFont = TYPOGRAPHY.fonts.serifItalic;
        } else if (token.type === "em_close") {
            flushBuffer();
            currentFont = TYPOGRAPHY.fonts.serif;
        } else if (token.type === "code_inline") {
            flushBuffer();
            doc.font("Courier").text(token.content, {
                ...baseOptions,
                continued: true,
            });
            doc.font(currentFont);
        }
    }

    if (textBuffer) {
        doc.font(currentFont).text(textBuffer, {
            ...baseOptions,
            continued: false,
        });
    } else {
        doc.text("", { continued: false });
    }
};

const renderMarkdown = (doc, markdown) => {
    if (!markdown || markdown.trim() === "") return;

    const tokens = md.parse(markdown, {});
    let inList   = false;
    let listType = null;
    let orderedListCounter = 1;

    for ( let i = 0; i < tokens.length; i++){
        const token = tokens[i];

        try {
            if (token.type === "heading_open") {
                const level = parseInt(token.tag.substring(1), 10);
                let fontSize;

                switch (level) {
                    case 1:
                        fontSize = TYPOGRAPHY.sizes.h1;
                        break;
                    case 2:
                        fontSize = TYPOGRAPHY.sizes.h2;
                        break;
                    case 3:
                        fontSize = TYPOGRAPHY.sizes.h3;
                        break;
                    default:
                        fontSize = TYPOGRAPHY.sizes.h3;
                    
                }

                doc.moveDown(
                    TYPOGRAPHY.spacing.headingSpacing.before / TYPOGRAPHY.sizes.body
                );

                doc
                    .font(TYPOGRAPHY.fonts.sansBold)
                    .fontSize(fontSize)
                    .fillColor(TYPOGRAPHY.colors.heading);
                
                if (i + 1 < tokens.length && tokens[i+1].type === "inline") {
                    renderInlineTokens(doc, tokens[i+1].children, {
                        align: "left",
                        lineGap: 0,
                    });
                    i++;
                }

                doc.moveDown(
                    TYPOGRAPHY.spacing.headingSpacing.after / TYPOGRAPHY.sizes.body

                );

                if ( i+ 1 < tokens.length && tokens[i+1].type === " heading_close") {
                    i++;
                }
            } else if (token.type === "paragraph_open") {
                doc
                    .font(TYPOGRAPHY.fonts.serif)
                    .fontsize(TYPOGRAPHY.sizes.body)
                    .fillColor(TYPOGRAPHY.colors.text);
                
                if ( i+ 1 < tokens.length && tokens[i + 1].type === "inline") {
                    renderInlineTokens(doc, tokens[i+1].children, {
                        align: "justify",
                        lineGap: 2,
                    });
                    i++;
                }

                if(!inList) {
                    doc.moveDown(
                        TYPOGRAPHY.spacing.paragraphSpacing / TYPOGRAPHY.sizes.body
                    );
                }

                if (i + 1 < tokens.length && tokens[i+1].type === "paragraph_close") {
                    i++;

                }
            } else if (token.type === "bullet_list_open") {
                inList = true;
                listType = "bullet";
                doc.moveDown(TYPOGRAPHY.spacing.listspacing / TYPOGRAPHY.sizes.body);
            } else if (token.type === "bullet_list_close") {
                inList = false;
                listType = null;
                doc.moveDown(TYPOGRAPHY.spacing.paragraphSpacing / TYPOGRAPHY.sizes.body);
            } else if (token.type === "ordered_list_open") {
                inList = true;
                listType = "ordered";
                orderedListCounter = 1;
                doc.moveDown(TYPOGRAPHY.spacing.listspacing / TYPOGRAPHY.sizes.body);
            } else if (token.type === "bullet_list_close") {
                inList = false;
                listType = null;
                orderedListCounter = 1;
                doc.moveDown(TYPOGRAPHY.spacing.paragraphSpacing / TYPOGRAPHY.sizes.body);
            } else if (token.type === "list_item_open") {
                let bullet = "";
                if (listType === "bullet") {
                    bullet = "• ";
                }else if (listType === "ordered") {
                    bullet = `${orderedListCounter}.`;
                    orderedListCounter++;
                }

                doc
                    .font(TYPOGRAPHY.fonts.serif)
                    .fontsize(TYPOGRAPHY.sizes.body)
                    .fillColor(TYPOGRAPHY.colors.text);

                doc.text(bullet, { indent: 20, continued: true});

                for (let j = i + 1; j < tokens.length; j++){
                    if (tokens[j].type === "inline" && tokens[j].children) {
                        renderInlineTokens(doc, tokens[j].children, {
                            align: "left",
                            lineGap : 2,
                        });

                        break;
                    } else if (tokens[j].type === "list_item_close") {
                        break;
                    }
                }

                doc.moveDown(TYPOGRAPHY.spacing.listspacing / TYPOGRAPHY.sizes.body);

            } else if (token.type === "code_block" || token.type === "fence") {
                doc.moveDown(
                    TYPOGRAPHY.spacing.paragraphSpacing / TYPOGRAPHY.sizes.body
                );

                doc
                    .font("Courier")
                    .fontsize(9)
                    .fillColor(TYPOGRAPHY.colors.text)
                    .text(token.content, {
                        indent : 20,
                        align: "left",
                    });
                doc.moveDown(TYPOGRAPHY.fonts.serif),fontSize(TYPOGRAPHY.sizes.body);
            } else if (token.type === "hr") {
                doc.moveDown();
                const y = doc.y;

                doc
                    .moveTo(doc.page.margins.left, y)
                    .lineTo(doc.pagewidth - doc.page.margins.right, y)
                    .stroke();
                doc.moveDown();
            }

        } catch (tokenError){
            console.error("Error processing token:", token.type, tokenError);
            continue;
        }
    }

}

const exportAsPDF = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    if (book.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorised" });
    }

    const doc = new PDFDocument({
      margins: { top: 72, bottom: 72, left: 72, right: 72 },
      bufferPages: true,
      autoFirstPage: true,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${book.title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf"`
    );

    doc.pipe(res);

    if (book.coverImage && !book.coverImage.includes("pravatar")) {
      const imagePath = book.coverImage.substring(1);

      try {
        if (fs.existsSync(imagePath)) {
          const pageWidth =
            doc.page.width - doc.page.margins.left - doc.page.margins.right;
          const pageHeight =
            doc.page.height - doc.page.margins.top - doc.page.margins.bottom;

          doc.image(imagePath, doc.page.margins.left, doc.page.margins.top, {
            fit: [pageWidth * 0.8, pageHeight * 0.8],
            align: "center",
            valign: "center",
          });
          doc.addPage();
        }
      } catch (imgError) {
        console.error(`Could not embed image: ${imagePath}`, imgError);
      }
    }

    doc
      .font(TYPOGRAPHY.fonts.sansBold)
      .fontSize(TYPOGRAPHY.sizes.title)
      .fillColor(TYPOGRAPHY.colors.heading)
      .text(book.title, { align: "center" });

    doc.moveDown(2);

    if (book.subtitle && book.subtitle.trim()) {
      doc
        .font(TYPOGRAPHY.fonts.sans)
        .fontSize(TYPOGRAPHY.sizes.h2)
        .fillColor(TYPOGRAPHY.colors.text)
        .text(book.subtitle, { align: "center" });
    }

    doc
      .font(TYPOGRAPHY.fonts.sans)
      .fontSize(TYPOGRAPHY.sizes.author)
      .fillColor(TYPOGRAPHY.colors.text)
      .text(`by ${book.author}`, { align: "center" });

    if (book.chapters && book.chapters.length > 0) {
      book.chapters.forEach((chapter, index) => {
        try {
          doc.addPage();

          doc
            .font(TYPOGRAPHY.fonts.sansBold)
            .fontSize(TYPOGRAPHY.sizes.chapterTitle)
            .fillColor(TYPOGRAPHY.colors.heading)
            .text(chapter.title || `Chapter ${index + 1}`, {
              align: "left",
            });

          doc.moveDown(
            TYPOGRAPHY.spacing.chapterSpacing / TYPOGRAPHY.sizes.body
          );

          if (chapter.content && chapter.content.trim()) {
            renderMarkdown(doc, chapter.content);
          }
        } catch (chapterError) {
          console.error(`Error processing chapter ${index}: `, chapterError);
        }
      });
    }

    doc.end();
  } catch (error) {
    console.error("Error exporting PDF:", error);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error during PDF export",
        error,
      });
    }
  }
};


module.exports = {exportAsPDF ,exportAsDocument};
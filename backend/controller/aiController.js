const { GoogleGenAI } = require("@google/genai");
const PDFDocument = require("pdfkit"); // <- correct import

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// helper: get text from GenAI response safely
function extractResponseText(response) {
  if (!response) return "";
  if (typeof response === "string") return response;
  if (response.text) return response.text;
  if (response.outputText) return response.outputText;
  if (Array.isArray(response.output) && response.output.length) {
    const first = response.output[0];
    if (first?.content && Array.isArray(first.content) && first.content.length) {
      const textBlock = first.content.find((c) => typeof c?.text === "string");
      if (textBlock) return textBlock.text;
    }
    if (first?.content?.[0]?.text) return first.content[0].text;
  }
  try {
    return JSON.stringify(response);
  } catch {
    return "";
  }
}

// Utility to stream a PDF from text (title + array of sections or plain text)
function streamPdfFromOutline(res, { filename = "document.pdf", title, outline, bodyText }) {
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  doc.pipe(res);

  if (title) {
    doc.fontSize(20).text(title, { align: "center" });
    doc.moveDown(1);
  }

  if (Array.isArray(outline)) {
    outline.forEach((ch, idx) => {
      doc.fontSize(14).text(`${idx + 1}. ${ch.title}`);
      doc.moveDown(0.25);
      doc.fontSize(11).text(ch.description, { paragraphGap: 8 });
      doc.moveDown(0.8);
    });
  }

  if (bodyText) {
    doc.addPage();
    doc.fontSize(16).text("Chapter Content", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).text(bodyText, { align: "left" });
  }

  doc.end();
}

//@desc Generate a book outline
//@route POST /api/ai/generate-outline
//@access Private
const generateOutline = async (req, res) => {
  try {
    const { topic, style = "neutral", numChapters = 5, description } = req.body;
    // support returnPdf from either body or query (query can be 'true' string)
    const returnPdf = req.body?.returnPdf ?? (req.query?.returnPdf === "true");

    if (!topic) {
      return res.status(400).json({ message: "Please provide a topic" });
    }

    const prompt = `You are an expert book outline generator. Create a comprehensive book outline based on the following requirements:

Topic: "${topic}"
${description ? `Description: ${description}` : ""}
Writing Style: ${style}
Number of Chapters: ${numChapters}

Requirements:
1. Generate exactly ${numChapters} chapters
2. Each chapter title should be clear, engaging, and follow a logical progression
3. Each chapter description should be 2-3 sentences explaining what the chapter covers
4. Ensure chapters build upon each other coherently
5. Match the "${style}" writing style in your titles and descriptions

Output Format:
Return ONLY a valid JSON array with no additional text, markdown, or formatting. Each object must have exactly two keys: "title" and "description".`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
    });

    const text = extractResponseText(response);

    const startIndex = text.indexOf("[");
    const endIndex = text.lastIndexOf("]");

    if (startIndex === -1 || endIndex === -1) {
      console.error("Could not find JSON array in AI response:", text);
      return res.status(500).json({ message: "Failed to parse AI response, no JSON array found." });
    }

    const jsonString = text.substring(startIndex, endIndex + 1);

    let outline;
    try {
      outline = JSON.parse(jsonString);
    } catch (err) {
      console.error("Failed to parse AI JSON array:", jsonString, err);
      return res.status(500).json({
        message: "Failed to generate a valid outline. The AI response was not valid JSON.",
      });
    }

    if (returnPdf) {
      // stream and return immediately
      return streamPdfFromOutline(res, {
        filename: `${topic.replace(/\s+/g, "_")}_outline.pdf`,
        title: `Outline: ${topic}`,
        outline,
      });
    }

    return res.status(200).json({ outline });
  } catch (error) {
    console.error("Error generating outline", error);
    return res.status(500).json({
      message: "Server error during AI outline generation",
    });
  }
};

//@desc Generate content for a chapter
//@route POST /api/ai/generate-chapter-content
//@access Private
const generateChapterContent = async (req, res) => {
  try {
    const { chapterTitle, chapterDescription, style = "neutral" } = req.body;
    const returnPdf = req.body?.returnPdf ?? (req.query?.returnPdf === "true");

    if (!chapterTitle) {
      return res.status(400).json({ message: "Please provide a chapter title" });
    }

    const prompt = `You are an expert writer specializing in ${style} content. Write a complete chapter for a book using the following specifications:

Chapter Title: "${chapterTitle}"
${chapterDescription ? `Chapter Description: ${chapterDescription}` : ""}
Writing Style: ${style}
Target Length: Comprehensive and detailed (aim for 1500–2500 words)
...

Begin the content writing now`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
    });

    const text = extractResponseText(response);

    if (returnPdf) {
      return streamPdfFromOutline(res, {
        filename: `${chapterTitle.replace(/\s+/g, "_")}.pdf`,
        title: chapterTitle,
        bodyText: text,
      });
    }

    return res.status(200).json({ content: text });
  } catch (error) {
    console.error("Error generating chapter content", error);
    return res.status(500).json({
      message: "Server error during AI chapter content generation",
    });
  }
};

module.exports = {
  generateOutline,
  generateChapterContent,
};

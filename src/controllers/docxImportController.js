// ===================================
// DOCX Import Controller
// ===================================
// Accepts a multipart .docx upload and converts it to clean HTML using
// mammoth. Returns HTML + auto-detected title + reading-time estimate.
//
// Pure formatting only — no AI, no rewriting. Mammoth maps Word's native
// heading styles to <h1>/<h2>/<h3>, paragraphs, lists, tables, blockquotes.
//
// Custom style map handles:
//   - "Heading 1" → <h1>
//   - "Heading 2" → <h2>
//   - "Heading 3" → <h3>
//   - "Quote" / "Intense Quote" → <blockquote>
//   - Strong/Emphasis preserved
//   - List structure preserved (ul / ol / nested)

const mammoth = require('mammoth');
const { asyncHandler, ApiResponse } = require('../utils');
const { inferHeadingsInHtml } = require('../utils/headingInference');

const STYLE_MAP = [
  "p[style-name='Title'] => h1:fresh",
  "p[style-name='Heading 1'] => h1:fresh",
  "p[style-name='Heading 2'] => h2:fresh",
  "p[style-name='Heading 3'] => h3:fresh",
  "p[style-name='Heading 4'] => h4:fresh",
  "p[style-name='Quote'] => blockquote:fresh > p:fresh",
  "p[style-name='Intense Quote'] => blockquote:fresh > p:fresh",
  "r[style-name='Strong'] => strong",
  "r[style-name='Emphasis'] => em",
].join('\n');

const importDocx = asyncHandler(async (req, res) => {
  if (!req.file) {
    return ApiResponse.error(res, 'No file uploaded (expected field name: file)', 400);
  }
  const mime = req.file.mimetype || '';
  const name = (req.file.originalname || '').toLowerCase();
  const isDocx = mime.includes('officedocument.wordprocessingml.document') || name.endsWith('.docx');
  if (!isDocx) {
    return ApiResponse.error(res, 'Only .docx files are supported', 415);
  }

  let result;
  try {
    result = await mammoth.convertToHtml(
      { buffer: req.file.buffer },
      {
        styleMap: STYLE_MAP,
        includeDefaultStyleMap: true,
      },
    );
  } catch (err) {
    return ApiResponse.error(res, `DOCX parse failed: ${err.message}`, 422);
  }

  let html = (result.value || '').trim();

  // Heading inference — promote visual-bold "headings" (paragraphs that
  // only contain <strong>/<b> and look like section titles) into real
  // <h2>/<h3> tags. Mammoth handles documents that use Word's "Heading X"
  // styles correctly; this pass catches the common case where the author
  // applied direct formatting instead.
  const headingPass = inferHeadingsInHtml(html);
  html = headingPass.html;

  // Auto-detect title — first H1, else first H2, else first paragraph (truncated)
  let detectedTitle = '';
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const h2Match = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
  if (h1Match)      detectedTitle = stripTags(h1Match[1]).trim();
  else if (h2Match) detectedTitle = stripTags(h2Match[1]).trim();
  else {
    const pMatch = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
    if (pMatch) detectedTitle = stripTags(pMatch[1]).slice(0, 120).trim();
  }

  // Strip the title H1 from body so it isn't duplicated when caller assigns it
  // to the title field. Optional — only if the first node is exactly the H1.
  let body = html;
  if (h1Match && body.indexOf(h1Match[0]) < 200) {
    body = body.replace(h1Match[0], '').trim();
  }

  // Reading-time estimate (~200 wpm)
  const plain = stripTags(body);
  const wordCount = (plain.match(/\b[\w'-]+\b/g) || []).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  // Structure intelligence summary — counts on the final body so the
  // editor can surface "Detected N H2 headings" feedback.
  const h1Count = (body.match(/<h1\b/gi) || []).length;
  const h2Count = (body.match(/<h2\b/gi) || []).length;
  const h3Count = (body.match(/<h3\b/gi) || []).length;
  const ulCount = (body.match(/<ul\b/gi) || []).length;
  const olCount = (body.match(/<ol\b/gi) || []).length;

  return ApiResponse.success(res, {
    html: body,
    detectedTitle,
    wordCount,
    readingTime,
    structure: {
      h1: h1Count,
      h2: h2Count,
      h3: h3Count,
      lists: ulCount + olCount,
      promoted: headingPass.stats, // {promotedH1, promotedH2, promotedH3, scanned}
    },
    warnings: result.messages?.slice(0, 10) || [],
    filename: req.file.originalname,
  }, 'DOCX imported');
});

function stripTags(s) {
  return String(s || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim();
}

module.exports = { importDocx };

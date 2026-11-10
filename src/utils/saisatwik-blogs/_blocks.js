/**
 * toBlocks(html) - wrap plain semantic HTML in Gutenberg block comments.
 *
 * Lets a data module be written as clean HTML (one top-level element per
 * paragraph-separated chunk) while WordPress still receives proper blocks,
 * identical to the hand-written block markup used by earlier posts.
 *
 * Supported top-level elements: h2, h3, p, ul, ol, table (a leading
 * <caption> becomes the block figcaption). Anything else is passed through
 * as a Custom HTML block.
 *
 * Files starting with "_" are helpers, never publishable slugs.
 */

function listBlock(tag, inner) {
  const ordered = tag === 'ol';
  const items = inner
    .trim()
    .split(/(?=<li>)/)
    .filter((s) => s.trim())
    .map((li) => `<!-- wp:list-item -->\n${li.trim()}\n<!-- /wp:list-item -->`)
    .join('\n');
  return (
    `<!-- wp:list${ordered ? ' {"ordered":true}' : ''} -->\n` +
    `<${tag} class="wp-block-list">\n${items}\n</${tag}>\n` +
    '<!-- /wp:list -->'
  );
}

function tableBlock(inner) {
  let caption = '';
  const body = inner.replace(/<caption>([\s\S]*?)<\/caption>/, (_, c) => {
    caption = c.trim();
    return '';
  });
  return (
    '<!-- wp:table -->\n' +
    `<figure class="wp-block-table"><table>${body.trim()}</table>` +
    (caption ? `<figcaption class="wp-element-caption">${caption}</figcaption>` : '') +
    '</figure>\n<!-- /wp:table -->'
  );
}

function toBlocks(html) {
  return html
    .trim()
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const m = chunk.match(/^<(h2|h3|p|ul|ol|table)>([\s\S]*)<\/\1>$/);
      if (!m) return `<!-- wp:html -->\n${chunk}\n<!-- /wp:html -->`;
      const [, tag, inner] = m;
      if (tag === 'h2') {
        return `<!-- wp:heading -->\n<h2 class="wp-block-heading">${inner}</h2>\n<!-- /wp:heading -->`;
      }
      if (tag === 'h3') {
        return `<!-- wp:heading {"level":3} -->\n<h3 class="wp-block-heading">${inner}</h3>\n<!-- /wp:heading -->`;
      }
      if (tag === 'p') return `<!-- wp:paragraph -->\n<p>${inner}</p>\n<!-- /wp:paragraph -->`;
      if (tag === 'table') return tableBlock(inner);
      return listBlock(tag, inner);
    })
    .join('\n\n');
}

module.exports = { toBlocks };

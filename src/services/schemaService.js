/**
 * JSON-LD Structured Data Service
 *
 * Generates Schema.org structured data for:
 * - Blog articles (BlogPosting)
 * - Organization
 * - Website (WebSite)
 * - BreadcrumbList
 */

/**
 * Generate BlogPosting JSON-LD for a blog post
 * @param {Object} blog - Blog document (populated with targetWebsite and author)
 * @param {Object} website - Website document
 * @returns {Object} JSON-LD structured data
 */
const generateBlogSchema = (blog, website) => {
  const baseUrl = `https://${website.domain}`;
  const blogUrl = `${baseUrl}/blog/${blog.slug}`;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: blog.title,
    description: blog.seoDescription || blog.excerpt || '',
    url: blogUrl,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': blogUrl,
    },
    datePublished: blog.publishedAt ? new Date(blog.publishedAt).toISOString() : undefined,
    dateModified: blog.updatedAt ? new Date(blog.updatedAt).toISOString() : undefined,
    author: {
      '@type': 'Person',
      name: blog.author?.name || 'Mavro Team',
    },
    publisher: {
      '@type': 'Organization',
      name: website.name,
      url: baseUrl,
    },
    isPartOf: {
      '@type': 'WebSite',
      name: website.name,
      url: baseUrl,
    },
  };

  // Add optional fields
  if (blog.featuredImage) {
    schema.image = {
      '@type': 'ImageObject',
      url: blog.featuredImage,
    };
    schema.publisher.logo = {
      '@type': 'ImageObject',
      url: website.logo || blog.featuredImage,
    };
  }

  if (blog.category) {
    schema.articleSection = blog.category;
  }

  if (blog.keywords && blog.keywords.length > 0) {
    schema.keywords = blog.keywords.join(', ');
  }

  if (blog.tags && blog.tags.length > 0) {
    schema.about = blog.tags.map((tag) => ({
      '@type': 'Thing',
      name: tag,
    }));
  }

  if (blog.readingTime) {
    schema.timeRequired = `PT${blog.readingTime}M`;
  }

  if (blog.contentPlainText) {
    schema.wordCount = blog.contentPlainText.split(/\s+/).length;
  }

  return schema;
};

/**
 * Generate Organization JSON-LD
 * @param {Object} website - Website document
 * @returns {Object} JSON-LD
 */
const generateOrganizationSchema = (website) => {
  const baseUrl = `https://${website.domain}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: website.name,
    url: baseUrl,
    logo: website.logo || undefined,
    description: website.description || undefined,
    sameAs: [],
  };
};

/**
 * Generate WebSite JSON-LD with SearchAction
 * @param {Object} website - Website document
 * @returns {Object} JSON-LD
 */
const generateWebsiteSchema = (website) => {
  const baseUrl = `https://${website.domain}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: website.name,
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${baseUrl}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
};

/**
 * Generate BreadcrumbList JSON-LD
 * @param {Object[]} items - Array of { name, url }
 * @returns {Object} JSON-LD
 */
const generateBreadcrumbSchema = (items) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
};

/**
 * Generate FAQ schema from Q&A pairs
 * @param {Object[]} faqs - Array of { question, answer }
 * @returns {Object} JSON-LD
 */
const generateFAQSchema = (faqs) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
};

/**
 * Generate complete structured data bundle for a blog page
 * Returns all relevant schemas for embedding in the page <head>
 */
const generateBlogPageSchemas = (blog, website) => {
  const baseUrl = `https://${website.domain}`;

  return {
    blogPosting: generateBlogSchema(blog, website),
    breadcrumb: generateBreadcrumbSchema([
      { name: 'Home', url: baseUrl },
      { name: 'Blog', url: `${baseUrl}/blog` },
      { name: blog.title, url: `${baseUrl}/blog/${blog.slug}` },
    ]),
    organization: generateOrganizationSchema(website),
  };
};

module.exports = {
  generateBlogSchema,
  generateOrganizationSchema,
  generateWebsiteSchema,
  generateBreadcrumbSchema,
  generateFAQSchema,
  generateBlogPageSchemas,
};

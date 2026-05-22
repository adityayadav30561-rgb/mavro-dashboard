// Centralized SEO constants + structured-data builders for the Tickets site.

export const TICKETS_SITE = {
  slug: 'mavro-ticket-management',
  name: 'Mavro Ticket Management',
  tagline: 'Intelligent Operational Support Infrastructure',
  description:
    'Mavro Ticket Management centralizes IT support operations into one intelligent system where every request becomes a tracked, prioritised, assigned ticket with defined ownership, SLA visibility, and operational accountability.',
  url: 'https://tickets.mavro.com',
  logo: 'https://tickets.mavro.com/logo.png',
  twitter: '@mavrotickets',
  keywords: [
    'ticket management system',
    'IT support software',
    'SLA management',
    'incident management',
    'helpdesk software',
    'ITSM',
    'operations workflow',
    'escalation management',
    'service desk',
    'enterprise IT operations',
  ],
};

export function organizationLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Mavro',
    url: TICKETS_SITE.url,
    logo: TICKETS_SITE.logo,
    sameAs: ['https://www.linkedin.com'],
    description: TICKETS_SITE.description,
  };
}

export function softwareApplicationLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: TICKETS_SITE.name,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web, iOS, Android',
    description: TICKETS_SITE.description,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      ratingCount: '86',
    },
  };
}

export function faqLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((it) => ({
      '@type': 'Question',
      name: it.q,
      acceptedAnswer: { '@type': 'Answer', text: it.a },
    })),
  };
}

export function breadcrumbLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

export function blogPostingLd(blog, url) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: blog.seoTitle || blog.title,
    description: blog.seoDescription || blog.excerpt,
    image: blog.ogImage || blog.featuredImage,
    datePublished: blog.publishedAt,
    dateModified: blog.updatedAt || blog.publishedAt,
    author: blog.author?.name
      ? { '@type': 'Person', name: blog.author.name }
      : { '@type': 'Organization', name: TICKETS_SITE.name },
    publisher: {
      '@type': 'Organization',
      name: TICKETS_SITE.name,
      logo: { '@type': 'ImageObject', url: TICKETS_SITE.logo },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  };
}

export function blogListLd(blogs, baseUrl) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: blogs.map((b, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${baseUrl}/${b.slug}`,
      name: b.title,
    })),
  };
}

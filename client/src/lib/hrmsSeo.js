// Centralized SEO constants + structured-data builders for the HRMS site.

export const HRMS_SITE = {
  name: 'Mavro HRMS',
  tagline: 'Intelligent Workforce Operations Platform',
  description:
    'Mavro HRMS unifies attendance, payroll, employee lifecycle, leave, compliance, performance, and workforce analytics into one operational command center built for modern organizations.',
  url: 'https://hrms.mavro.com',
  logo: 'https://hrms.mavro.com/logo.png',
  twitter: '@mavrohrms',
  keywords: [
    'HRMS',
    'Human Resource Management System',
    'workforce operations',
    'employee management',
    'attendance tracking',
    'payroll management',
    'leave management',
    'HR automation',
    'workforce analytics',
    'enterprise HR software',
  ],
};

export function organizationLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Mavro',
    url: HRMS_SITE.url,
    logo: HRMS_SITE.logo,
    sameAs: ['https://www.linkedin.com'],
    description: HRMS_SITE.description,
  };
}

export function softwareApplicationLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: HRMS_SITE.name,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web, iOS, Android',
    description: HRMS_SITE.description,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '124',
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
      : { '@type': 'Organization', name: HRMS_SITE.name },
    publisher: {
      '@type': 'Organization',
      name: HRMS_SITE.name,
      logo: { '@type': 'ImageObject', url: HRMS_SITE.logo },
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

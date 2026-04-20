import Head from 'next/head';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    section?: string;
    tags?: string[];
  };
  noindex?: boolean;
  canonical?: string;
}

// SEO elements that can be used in _document.tsx (returns JSX without Head wrapper)
export function SEOElements({
  title = "The Training Hub - Professional Skills Training & Certification",
  description = "Transform your career with expert-led training courses. Earn certifications, track progress, and join a community of learners. Expert instructors, flexible learning, and career support.",
  image = "/og-image.png",
  url,
  type = 'website',
  noindex = false,
  canonical,
}: SEOProps) {
  const fullTitle = title.includes('Training Hub') ? title : `${title} | The Training Hub`;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://training-hub.com';
  const fullUrl = url ? `${siteUrl}${url}` : siteUrl;
  const fullImage = image.startsWith('http') ? image : `${siteUrl}${image}`;

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="icon" href="/favicon.ico" />
      
      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}
      
      {/* Robots */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      )}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="The Training Hub" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />
      <meta name="twitter:site" content="@traininghub" />
      <meta name="twitter:creator" content="@traininghub" />

      {/* Additional Meta */}
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      <meta name="theme-color" content="#0f172a" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="format-detection" content="telephone=no" />
    </>
  );
}

// SEO component for use in pages/_app.tsx or individual pages (uses next/head)
export function SEO({
  title = "The Training Hub - Professional Skills Training & Certification",
  description = "Transform your career with expert-led training courses. Earn certifications, track progress, and join a community of learners. Expert instructors, flexible learning, and career support.",
  image = "/og-image.png",
  url,
  type = 'website',
  article,
  noindex = false,
  canonical,
}: SEOProps) {
  const fullTitle = title.includes('Training Hub') ? title : `${title} | The Training Hub`;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://training-hub.com';
  const fullUrl = url ? `${siteUrl}${url}` : siteUrl;
  const fullImage = image.startsWith('http') ? image : `${siteUrl}${image}`;

  // Generate JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': type === 'article' ? 'Article' : 'WebSite',
    name: fullTitle,
    description: description,
    url: fullUrl,
    image: fullImage,
    publisher: {
      '@type': 'Organization',
      name: 'The Training Hub',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/favicon.ico`,
      },
    },
    ...(article && {
      datePublished: article.publishedTime,
      dateModified: article.modifiedTime,
      author: {
        '@type': 'Person',
        name: article.author,
      },
      articleSection: article.section,
      keywords: article.tags?.join(', '),
    }),
  };

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="icon" href="/favicon.ico" />
      
      {canonical && <link rel="canonical" href={canonical} />}
      
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      )}

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="The Training Hub" />
      <meta property="og:locale" content="en_US" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />
      <meta name="twitter:site" content="@traininghub" />

      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </Head>
  );
}

// Course-specific SEO component
export function CourseSEO({
  courseName,
  description,
  price,
  instructor,
  rating,
  reviewCount,
  image,
}: {
  courseName: string;
  description: string;
  price?: number;
  instructor?: string;
  rating?: number;
  reviewCount?: number;
  image?: string;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://training-hub.com';
  
  const courseJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: courseName,
    description: description,
    provider: {
      '@type': 'Organization',
      name: 'The Training Hub',
      sameAs: siteUrl,
    },
    ...(instructor && {
      instructor: {
        '@type': 'Person',
        name: instructor,
      },
    }),
    ...(price && {
      offers: {
        '@type': 'Offer',
        price: price,
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
      },
    }),
    ...(rating && reviewCount && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: rating,
        reviewCount: reviewCount,
        bestRating: 5,
        worstRating: 1,
      },
    }),
    ...(image && { image: `${siteUrl}${image}` }),
  };

  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }}
      />
    </Head>
  );
}

// Organization JSON-LD for homepage
export function OrganizationSEO() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://training-hub.com';
  
  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'The Training Hub',
    url: siteUrl,
    logo: `${siteUrl}/favicon.ico`,
    description: 'Professional training and certification courses for career advancement',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'US',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      email: 'support@training-hub.com',
    },
    sameAs: [
      'https://facebook.com/traininghub',
      'https://twitter.com/traininghub',
      'https://linkedin.com/company/traininghub',
    ],
  };

  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
    </Head>
  );
}
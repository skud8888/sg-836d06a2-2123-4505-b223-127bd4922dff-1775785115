import Head from "next/head";

export interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "profile";
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  tags?: string[];
}

export function SEO({
  title = "The Training Hub - Professional Training Management",
  description = "Modern training center management platform with CRM, document management, AI insights, and online bookings.",
  image = "/og-image.png",
  url = "https://thetraininghub.com.au",
  type = "website",
  publishedTime,
  modifiedTime,
  author,
  tags = []
}: SEOProps) {
  const fullTitle = title.includes("Training Hub") ? title : `${title} | The Training Hub`;
  const fullUrl = url.startsWith("http") ? url : `https://thetraininghub.com.au${url}`;
  const fullImage = image.startsWith("http") ? image : `https://thetraininghub.com.au${image}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "The Training Hub",
    "url": "https://thetraininghub.com.au",
    "logo": "https://thetraininghub.com.au/og-image.png",
    "description": description,
    "address": {
      "@type": "PostalAddress",
      "addressRegion": "QLD",
      "addressCountry": "AU"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "email": "info@thetraininghub.com.au",
      "contactType": "customer support"
    },
    "sameAs": [
      "https://facebook.com/thetraininghub",
      "https://linkedin.com/company/thetraininghub"
    ]
  };

  return (
    <Head>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      <meta name="theme-color" content="#0f172a" />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:site_name" content="The Training Hub" />
      <meta property="og:locale" content="en_AU" />
      
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      {author && <meta property="article:author" content={author} />}
      {tags.length > 0 && tags.map(tag => (
        <meta key={tag} property="article:tag" content={tag} />
      ))}

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={fullUrl} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={fullImage} />

      {/* Favicon */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" href="/og-image.png" />
      
      {/* Manifest */}
      <link rel="manifest" href="/manifest.json" />

      {/* Canonical URL */}
      <link rel="canonical" href={fullUrl} />

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </Head>
  );
}

// Elements version for _document.tsx (no Head wrapper)
export function SEOElements({
  title = "The Training Hub - Professional Training Management",
  description = "Modern training center management platform with CRM, document management, AI insights, and online bookings.",
  image = "/og-image.png",
}: SEOProps) {
  const fullTitle = title.includes("Training Hub") ? title : `${title} | The Training Hub`;
  const fullImage = image.startsWith("http") ? image : `https://thetraininghub.com.au${image}`;

  return (
    <>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      <meta name="theme-color" content="#0f172a" />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={fullImage} />
      <link rel="icon" href="/favicon.ico" />
      <link rel="manifest" href="/manifest.json" />
    </>
  );
}
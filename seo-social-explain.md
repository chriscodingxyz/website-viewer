# Website Viewer - Technical Documentation

This document provides comprehensive documentation of the SEO extraction, social preview logic, and technical metadata extraction systems. Formatted for LLM consumption.

---

## Table of Contents

1. [SEO Metadata Extraction](#1-seo-metadata-extraction)
2. [Open Graph Extraction](#2-open-graph-extraction)
3. [Twitter Card Extraction](#3-twitter-card-extraction)
4. [Social Preview UI (7 Platforms)](#4-social-preview-ui-7-platforms)
5. [Technical Metadata Extraction](#5-technical-metadata-extraction)
6. [Zod Validation Schemas](#6-zod-validation-schemas)
7. [API Implementation](#7-api-implementation)

---

## 1. SEO Metadata Extraction

**Source**: `app/api/metadata/route.ts:404-417`

### Cheerio Selectors

```javascript
const seo = {
  title: $('title').first().text().trim() || undefined,
  description: $('meta[name="description"]').attr('content') || undefined,
  keywords: $('meta[name="keywords"]').attr('content') || undefined,
  canonical: $('link[rel="canonical"]').attr('href') || undefined,
  language:
    $('html').attr('lang') ||
    $('meta[http-equiv="content-language"]').attr('content') ||
    undefined,
  viewport: $('meta[name="viewport"]').attr('content') || undefined,
  robots: $('meta[name="robots"]').attr('content') || undefined,
  author: $('meta[name="author"]').attr('content') || undefined
}
```

### SEO Fields Extracted

| Field | Selector | Fallback |
|-------|----------|----------|
| `title` | `$('title').first().text()` | None |
| `description` | `$('meta[name="description"]').attr('content')` | None |
| `keywords` | `$('meta[name="keywords"]').attr('content')` | None |
| `canonical` | `$('link[rel="canonical"]').attr('href')` | None |
| `language` | `$('html').attr('lang')` | `$('meta[http-equiv="content-language"]').attr('content')` |
| `viewport` | `$('meta[name="viewport"]').attr('content')` | None |
| `robots` | `$('meta[name="robots"]').attr('content')` | None |
| `author` | `$('meta[name="author"]').attr('content')` | None |

### Character Validation Logic

**Source**: `components/metadata/SEOSection.tsx:87-96`

```javascript
const getSEOScore = () => {
  let score = 0
  const maxScore = 5
  if (seo.title && seo.title.length >= 30 && seo.title.length <= 60) score += 1
  if (seo.description && seo.description.length >= 120 && seo.description.length <= 160) score += 1
  if (seo.canonical) score += 1
  if (seo.language) score += 1
  if (seo.viewport) score += 1
  return { score, maxScore, percentage: Math.round((score / maxScore) * 100) }
}
```

### SEO Scoring Methodology (5-Point System)

| Check | Criteria | Points |
|-------|----------|--------|
| Title Length | 30-60 characters | +1 |
| Description Length | 120-160 characters | +1 |
| Canonical URL | Present | +1 |
| Language | Present (`lang` attribute or meta tag) | +1 |
| Viewport | Present | +1 |

**Score Thresholds**:
- `>= 80%`: Green (good) - `bg-green-500`
- `>= 60%`: Orange (warning) - `bg-orange-500`
- `< 60%`: Red (error) - `bg-red-500`

---

## 2. Open Graph Extraction

**Source**: `app/api/metadata/route.ts:419-434`

### Cheerio Selectors

```javascript
const openGraph = {
  title: $('meta[property="og:title"]').attr('content') || undefined,
  description: $('meta[property="og:description"]').attr('content') || undefined,
  image: $('meta[property="og:image"]').attr('content') || undefined,
  imageAlt: $('meta[property="og:image:alt"]').attr('content') || undefined,
  imageWidth: $('meta[property="og:image:width"]').attr('content') || undefined,
  imageHeight: $('meta[property="og:image:height"]').attr('content') || undefined,
  url: $('meta[property="og:url"]').attr('content') || undefined,
  type: $('meta[property="og:type"]').attr('content') || undefined,
  siteName: $('meta[property="og:site_name"]').attr('content') || undefined,
  locale: $('meta[property="og:locale"]').attr('content') || undefined
}
```

### Open Graph Properties (10 Properties)

| Property | Meta Tag | Purpose |
|----------|----------|---------|
| `title` | `og:title` | Title for social sharing |
| `description` | `og:description` | Description for social cards |
| `image` | `og:image` | Primary share image URL |
| `imageAlt` | `og:image:alt` | Alt text for share image |
| `imageWidth` | `og:image:width` | Image width in pixels |
| `imageHeight` | `og:image:height` | Image height in pixels |
| `url` | `og:url` | Canonical URL for the page |
| `type` | `og:type` | Content type (website, article, etc.) |
| `siteName` | `og:site_name` | Name of the website |
| `locale` | `og:locale` | Language/locale (e.g., en_US) |

### Fallback Logic

**Source**: `components/metadata/SocialPreview.tsx:179-188`

When Open Graph tags are missing, the social preview uses this fallback chain:

```javascript
const title = openGraph.title || twitterCard.title || seo.title || 'No Title'
const description = openGraph.description || twitterCard.description || seo.description || 'No Description'
const image = openGraph.image || twitterCard.image
const siteName = openGraph.siteName || new URL(metadata.url).hostname
```

---

## 3. Twitter Card Extraction

**Source**: `app/api/metadata/route.ts:436-447`

### Cheerio Selectors

```javascript
const twitterCard = {
  card: $('meta[name="twitter:card"]').attr('content') || undefined,
  title: $('meta[name="twitter:title"]').attr('content') || undefined,
  description: $('meta[name="twitter:description"]').attr('content') || undefined,
  image: $('meta[name="twitter:image"]').attr('content') || undefined,
  imageAlt: $('meta[name="twitter:image:alt"]').attr('content') || undefined,
  site: $('meta[name="twitter:site"]').attr('content') || undefined,
  creator: $('meta[name="twitter:creator"]').attr('content') || undefined
}
```

### Twitter Card Properties (7 Properties)

| Property | Meta Tag | Purpose |
|----------|----------|---------|
| `card` | `twitter:card` | Card type (summary, summary_large_image) |
| `title` | `twitter:title` | Tweet card title |
| `description` | `twitter:description` | Tweet card description |
| `image` | `twitter:image` | Tweet card image URL |
| `imageAlt` | `twitter:image:alt` | Alt text for tweet image |
| `site` | `twitter:site` | @username of website |
| `creator` | `twitter:creator` | @username of content creator |

### Card Type Detection

Card types are inferred from the `twitter:card` meta tag:
- `summary` - Small card with square image
- `summary_large_image` - Large card with rectangular image

### Inheritance from OG Tags

**Source**: `components/metadata/SocialPreview.tsx:843-879`

Twitter tags inherit from Open Graph when Twitter-specific tags are missing:

```javascript
// Status determination for Twitter fields
status={
  twitterCard.title
    ? 'present'
    : openGraph.title || seo.title
    ? 'inherited'
    : 'missing'
}
```

Status indicators:
- `present` (green checkmark): Dedicated Twitter tag exists
- `inherited` (orange warning): Using OG/SEO fallback
- `missing` (red X): No value available

---

## 4. Social Preview UI (7 Platforms)

**Source**: `components/metadata/SocialPreview.tsx:167-746`

### Social Scoring System

**Source**: `components/metadata/SocialPreview.tsx:146-163`

```javascript
const getSocialScore = () => {
  let score = 0
  const maxScore = 8 // OpenGraph (4) + Twitter (4)

  // OpenGraph scoring (proper social media tags)
  if (openGraph.title) score += 1
  if (openGraph.description) score += 1
  if (openGraph.image) score += 1
  if (openGraph.type) score += 1

  // Twitter Card scoring (dedicated Twitter tags, not inherited)
  if (twitterCard.card) score += 1
  if (twitterCard.title) score += 1
  if (twitterCard.description) score += 1
  if (twitterCard.image) score += 1

  return { score, maxScore, percentage: Math.round((score / maxScore) * 100) }
}
```

**Score Display Colors**:
- `>= 75%`: `text-emerald-600`
- `>= 50%`: `text-amber-600`
- `< 50%`: `text-red-600`

---

### 4.1 Google Search Preview

**Source**: `components/metadata/SocialPreview.tsx:249-305`

**Container Structure**:
```jsx
<div className='space-y-4'>
  {/* Platform Badge */}
  <div className='inline-flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1.5 mb-0'>
    {/* Google SVG Logo */}
    <span className='text-sm font-medium text-gray-700'>Google</span>
  </div>

  {/* Search Result Card */}
  <div className='bg-white p-3'>
    {/* Favicon + URL row */}
    <div className='flex items-center gap-2 mb-2'>
      <div className='w-4 h-4 rounded-sm overflow-hidden'>
        {/* Favicon Image */}
      </div>
      <div className='text-sm text-green-700 truncate font-normal'>
        {url}
      </div>
    </div>

    {/* Title */}
    <h3 className='text-blue-600 text-xl mb-1 line-clamp-1 hover:underline cursor-pointer font-normal'>
      {title}
    </h3>

    {/* Description */}
    <p className='text-gray-600 text-sm line-clamp-2 leading-relaxed'>
      {description}
    </p>
  </div>
</div>
```

**Styling Details**:
- **Favicon container**: `w-4 h-4 rounded-sm overflow-hidden`
- **URL text**: `text-sm text-green-700 truncate font-normal`
- **Title**: `text-blue-600 text-xl mb-1 line-clamp-1 hover:underline cursor-pointer font-normal`
- **Description**: `text-gray-600 text-sm line-clamp-2 leading-relaxed`
- **Text truncation**: Title `line-clamp-1`, Description `line-clamp-2`

---

### 4.2 Facebook Post Preview

**Source**: `components/metadata/SocialPreview.tsx:569-667`

**Container Structure**:
```jsx
<div className='space-y-4'>
  {/* Platform Badge */}
  <div className='inline-flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1.5 mb-0'>
    <FacebookLogo className='w-4 h-4 text-blue-600' weight='fill' />
    <span className='text-sm font-medium text-gray-700'>Facebook</span>
  </div>

  {/* Post Card */}
  <div className='bg-white border border-gray-200 rounded-lg p-4'>
    {/* User Header */}
    <div className='flex items-start gap-3 mb-3'>
      <Image src='/markzuck.png' className='w-10 h-10 object-cover rounded-full' />
      <div className='flex-1'>
        <div className='flex items-center gap-2 mb-1'>
          <h3 className='font-semibold text-gray-900'>Mark Zuckerberg</h3>
          {/* Verified Badge SVG */}
        </div>
        <div className='flex items-center gap-1 text-xs text-gray-500'>
          <span>Just Now</span>
          <span>•</span>
          {/* Globe/Public Icon */}
        </div>
      </div>
    </div>

    {/* Post Text */}
    <div className='text-gray-900 text-sm mb-3 leading-relaxed'>
      {/* Dynamic text based on image presence */}
    </div>

    {/* Link URL */}
    <div className='text-blue-600 text-sm mb-3 hover:underline cursor-pointer'>
      {url}
    </div>

    {/* Link Preview Card */}
    <div className='border border-gray-200 rounded-lg overflow-hidden'>
      {image && (
        <div className='aspect-[1.91/1] bg-gray-100'>
          <Image className='w-full h-full object-cover' />
        </div>
      )}
      <div className='p-4 bg-gray-50'>
        <div className='text-gray-500 text-xs mb-1 uppercase'>
          {hostname}
        </div>
        <h4 className='font-semibold text-gray-900 text-base mb-2 line-clamp-2'>
          {title}
        </h4>
        <p className='text-gray-600 text-sm line-clamp-2'>
          {description}
        </p>
      </div>
    </div>
  </div>
</div>
```

**Styling Details**:
- **Post card**: `bg-white border border-gray-200 rounded-lg p-4`
- **Avatar**: `w-10 h-10 object-cover rounded-full`
- **Verified badge**: `w-4 h-4 text-blue-500`
- **Image aspect ratio**: `aspect-[1.91/1]` (standard Facebook ratio)
- **Link preview footer**: `p-4 bg-gray-50`
- **Hostname**: `text-gray-500 text-xs mb-1 uppercase`
- **Text truncation**: Title `line-clamp-2`, Description `line-clamp-2`

---

### 4.3 Twitter/X Post Preview

**Source**: `components/metadata/SocialPreview.tsx:669-742`

**Container Structure**:
```jsx
<div className='space-y-4'>
  {/* Platform Badge */}
  <div className='inline-flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1.5 mb-0'>
    <XLogo className='w-4 h-4 text-gray-900' weight='fill' />
    <span className='text-sm font-medium text-gray-700'>Twitter/X</span>
  </div>

  {/* Tweet Card - Dark Theme */}
  <div className='bg-black text-white rounded-2xl p-4 max-w-lg'>
    {/* User Header */}
    <div className='flex items-start gap-3 mb-3'>
      <div className='w-10 h-10 bg-gray-600 rounded-full overflow-hidden'>
        <Image src='/NATKmh45_400x400.jpg' />
      </div>
      <div className='flex-1'>
        <div className='flex items-center gap-2 mb-1'>
          <h3 className='font-bold text-white'>Elon Musk</h3>
          {/* Verified Badge */}
          <div className='w-5 h-5 text-blue-400'>
            {/* SVG */}
          </div>
          <span className='text-gray-500'>@elonmusk</span>
          <span className='text-gray-500'>•</span>
          <span className='text-gray-500'>3h</span>
        </div>
      </div>
    </div>

    {/* Tweet Text */}
    <div className='text-white text-base mb-3'>
      {/* Dynamic commentary based on twitter:image, og:image, or neither */}
    </div>

    {/* Link Preview Card */}
    <div className='border border-gray-700 rounded-2xl overflow-hidden'>
      {image && (
        <div className='aspect-[1.91/1] bg-gray-800'>
          <Image className='w-full h-full object-cover' />
        </div>
      )}
      <div className='p-4'>
        <div className='text-gray-400 text-sm mb-1'>
          From {hostname}
        </div>
        <h4 className='font-normal text-white text-base mb-2 line-clamp-2'>
          {title}
        </h4>
        <p className='text-gray-400 text-sm line-clamp-2'>
          {description}
        </p>
      </div>
    </div>
  </div>
</div>
```

**Styling Details**:
- **Tweet card**: `bg-black text-white rounded-2xl p-4 max-w-lg`
- **Avatar**: `w-10 h-10 bg-gray-600 rounded-full overflow-hidden`
- **Verified badge**: `w-5 h-5 text-blue-400`
- **Username**: `text-gray-500`
- **Link preview border**: `border border-gray-700 rounded-2xl`
- **Image aspect ratio**: `aspect-[1.91/1]`
- **Text truncation**: Title `line-clamp-2`, Description `line-clamp-2`

---

### 4.4 Discord Rich Embed Preview

**Source**: `components/metadata/SocialPreview.tsx:308-376`

**Container Structure**:
```jsx
<div className='space-y-4'>
  {/* Platform Badge */}
  <div className='inline-flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1.5 mb-0'>
    <DiscordLogo className='w-4 h-4 text-indigo-500' weight='fill' />
    <span className='text-sm font-medium text-gray-700'>Discord</span>
  </div>

  {/* Discord Message */}
  <div className='bg-gray-800 text-white p-4 rounded-lg'>
    {/* User Info */}
    <div className='flex items-center gap-3 mb-4'>
      <Image src='/v1punk.png' className='w-10 h-10 bg-purple-600 rounded-full' />
      <div>
        <div className='flex items-center gap-2'>
          <span className='text-white font-medium'>cryptopunk420</span>
          <div className='w-3 h-3 bg-green-500 rounded-full'></div>
          <span className='text-xs text-gray-400'>Today at 3:14 PM</span>
        </div>
      </div>
    </div>

    {/* Message Content */}
    <div className='ml-13'>
      <a href={url} className='text-blue-400 hover:underline text-sm'>
        {url}
      </a>

      {/* Rich Embed */}
      <div className='border-l-4 border-blue-500 bg-gray-700 p-4 rounded-r mt-2 max-w-lg'>
        <div className='text-blue-400 text-sm mb-1'>{siteName}</div>
        <h4 className='text-blue-300 text-base font-medium mb-2 line-clamp-2'>
          {title}
        </h4>
        <p className='text-gray-300 text-sm line-clamp-2 leading-relaxed mb-3'>
          {description}
        </p>
        {image && (
          <div className='w-full max-w-sm h-48 bg-gray-600 rounded overflow-hidden'>
            <Image className='w-full h-full object-cover' />
          </div>
        )}
      </div>

      {/* Reactions */}
      <div className='flex items-center gap-4 mt-2'>
        <div className='flex items-center gap-1'>
          <span className='text-lg'>❤️</span>
          <span className='text-gray-400 text-sm'>4</span>
        </div>
        <div className='flex items-center gap-1'>
          <span className='text-lg'>⚡</span>
          <span className='text-gray-400 text-sm'>7</span>
        </div>
      </div>
    </div>
  </div>
</div>
```

**Styling Details**:
- **Message container**: `bg-gray-800 text-white p-4 rounded-lg`
- **Avatar**: `w-10 h-10 bg-purple-600 rounded-full`
- **Online indicator**: `w-3 h-3 bg-green-500 rounded-full`
- **Rich embed sidebar**: `border-l-4 border-blue-500`
- **Embed container**: `bg-gray-700 p-4 rounded-r mt-2 max-w-lg`
- **Site name**: `text-blue-400 text-sm`
- **Title**: `text-blue-300 text-base font-medium line-clamp-2`
- **Description**: `text-gray-300 text-sm line-clamp-2`
- **Image container**: `w-full max-w-sm h-48 bg-gray-600 rounded`

---

### 4.5 WhatsApp Link Preview

**Source**: `components/metadata/SocialPreview.tsx:378-444`

**Container Structure**:
```jsx
<div className='space-y-4'>
  {/* Platform Badge */}
  <div className='inline-flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1.5 mb-0'>
    <WhatsappLogo className='w-4 h-4 text-green-500' weight='fill' />
    <span className='text-sm font-medium text-gray-700'>WhatsApp</span>
  </div>

  {/* Message Bubble (Right-aligned - sent message) */}
  <div className='flex justify-end'>
    <div className='max-w-xs bg-green-200 rounded-2xl p-2 relative'>
      {/* Image Preview */}
      {image && (
        <div className='w-full h-32 bg-gray-800 rounded-t-lg overflow-hidden mb-0'>
          <Image className='w-full h-full object-cover' />
        </div>
      )}

      {/* Text Content */}
      <div className='bg-green-200 rounded-b-lg p-2'>
        <h4 className='text-gray-800 text-sm font-medium mb-1 line-clamp-1'>
          {title}
        </h4>
        <p className='text-gray-600 text-xs line-clamp-2 mb-2'>
          {description}
        </p>

        {/* Footer with URL and checkmarks */}
        <div className='flex items-center justify-between'>
          <div className='text-sm text-green-600 underline'>
            {url}
          </div>
          <div className='flex items-center gap-1'>
            <span className='text-xs text-gray-400' style={{ fontSize: '10px' }}>
              4:20 PM
            </span>
            {/* Double blue checkmarks */}
            <div className='flex text-blue-600'>
              <svg className='w-3 h-3' fill='currentColor' viewBox='0 0 24 24'>
                <path d='M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z' />
              </svg>
              <svg className='w-3 h-3 -ml-1' fill='currentColor' viewBox='0 0 24 24'>
                <path d='M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z' />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

**Styling Details**:
- **Message bubble**: `max-w-xs bg-green-200 rounded-2xl p-2`
- **Image container**: `w-full h-32 bg-gray-800 rounded-t-lg overflow-hidden`
- **Title**: `text-gray-800 text-sm font-medium line-clamp-1`
- **Description**: `text-gray-600 text-xs line-clamp-2`
- **URL**: `text-sm text-green-600 underline`
- **Timestamp**: `text-xs text-gray-400` with `fontSize: '10px'`
- **Read checkmarks**: `text-blue-600` with overlapping SVGs (`-ml-1`)

---

### 4.6 LinkedIn Post Preview

**Source**: `components/metadata/SocialPreview.tsx:446-521`

**Container Structure**:
```jsx
<div className='space-y-4'>
  {/* Platform Badge */}
  <div className='inline-flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1.5 mb-0'>
    <LinkedinLogo className='w-4 h-4 text-blue-700' weight='fill' />
    <span className='text-sm font-medium text-gray-700'>Linkedin</span>
  </div>

  {/* Post Card */}
  <div className='bg-white border border-gray-200 rounded-lg p-4'>
    {/* User Header */}
    <div className='flex items-start gap-3 mb-3'>
      <div className='w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center'>
        <span className='text-white font-medium text-lg'>JD</span>
      </div>
      <div className='flex-1'>
        <div className='flex items-center gap-2 mb-1'>
          <h3 className='font-semibold text-gray-900'>John Doe</h3>
          <span className='text-gray-500'>• You</span>
        </div>
        <p className='text-sm text-gray-600 mb-1'>VP of a Big Company</p>
        <div className='flex items-center gap-1 text-xs text-gray-500'>
          <span>3w</span>
          <span>•</span>
          {/* Globe icon */}
        </div>
      </div>
      {/* More options button */}
    </div>

    {/* Post Text */}
    <p className='text-gray-900 text-sm mb-4 leading-relaxed'>
      {/* Dynamic text based on image presence */}
    </p>

    {/* Link Preview Card */}
    <div className='border border-gray-200 rounded-lg overflow-hidden'>
      <div className='flex'>
        {image && (
          <div className='w-24 h-16 bg-gray-100 flex-shrink-0'>
            <Image className='w-full h-full object-cover' />
          </div>
        )}
        <div className='flex-1 p-3 min-w-0'>
          <h4 className='text-gray-900 text-sm font-medium mb-1 line-clamp-1'>
            {title}
          </h4>
          <p className='text-gray-600 text-xs mb-1'>
            {hostname}
          </p>
        </div>
      </div>
    </div>
  </div>
</div>
```

**Styling Details**:
- **Post card**: `bg-white border border-gray-200 rounded-lg p-4`
- **Avatar (initials)**: `w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center`
- **Name**: `font-semibold text-gray-900`
- **Job title**: `text-sm text-gray-600`
- **Link preview image**: `w-24 h-16 bg-gray-100 flex-shrink-0`
- **Text truncation**: Title `line-clamp-1`

---

### 4.7 Telegram Instant View Preview

**Source**: `components/metadata/SocialPreview.tsx:523-566`

**Container Structure**:
```jsx
<div className='space-y-4'>
  {/* Platform Badge */}
  <div className='inline-flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1.5 mb-0'>
    <TelegramLogo className='w-4 h-4 text-blue-500' weight='fill' />
    <span className='text-sm font-medium text-gray-700'>Telegram</span>
  </div>

  {/* Message Bubble (Right-aligned - sent message) */}
  <div className='flex justify-end'>
    <div className='max-w-xs bg-blue-500 rounded-2xl p-3'>
      {/* URL */}
      <div className='text-white text-xs underline mb-2'>{url}</div>

      {/* Instant View Card */}
      <div className='bg-blue-400 rounded-lg p-3 mb-2'>
        <div className='text-white text-sm mb-1'>
          {hostname}
        </div>
        <h4 className='text-white text-base font-medium mb-2 line-clamp-2'>
          {title}
        </h4>
        <p className='text-blue-100 text-sm line-clamp-3 mb-3'>
          {description}
        </p>
        {image && (
          <div className='w-full h-48 bg-gray-600 rounded-lg overflow-hidden'>
            <Image className='w-full h-full object-cover' />
          </div>
        )}
      </div>

      {/* Timestamp */}
      <div className='flex items-center justify-end'>
        <span className='text-xs text-white'>4:20 PM</span>
      </div>
    </div>
  </div>
</div>
```

**Styling Details**:
- **Message bubble**: `max-w-xs bg-blue-500 rounded-2xl p-3`
- **URL**: `text-white text-xs underline`
- **Instant view card**: `bg-blue-400 rounded-lg p-3`
- **Hostname**: `text-white text-sm`
- **Title**: `text-white text-base font-medium line-clamp-2`
- **Description**: `text-blue-100 text-sm line-clamp-3`
- **Image container**: `w-full h-48 bg-gray-600 rounded-lg overflow-hidden`
- **Timestamp**: `text-xs text-white`

---

## 5. Technical Metadata Extraction

### 5.1 Response Headers Extraction

**Source**: `app/api/metadata/route.ts:525-538`

```javascript
const headers = {
  server: response.headers['server'] || undefined,
  contentType: response.headers['content-type'] || undefined,
  contentEncoding: response.headers['content-encoding'] || undefined,
  cacheControl: response.headers['cache-control'] || undefined,
  lastModified: response.headers['last-modified'] || undefined,
  etag: response.headers['etag'] || undefined,
  xFrameOptions: response.headers['x-frame-options'] || undefined,
  contentSecurityPolicy: response.headers['content-security-policy'] || undefined,
  strictTransportSecurity: response.headers['strict-transport-security'] || undefined,
  xContentTypeOptions: response.headers['x-content-type-options'] || undefined
}
```

### Headers Captured (10 Core Headers)

| Header | Purpose | Security Impact |
|--------|---------|-----------------|
| `server` | Server identification | Low (info disclosure) |
| `content-type` | MIME type declaration | Medium |
| `content-encoding` | Compression (gzip, br) | Performance |
| `cache-control` | Caching directives | Performance |
| `last-modified` | Content freshness | Caching |
| `etag` | Resource versioning | Caching |
| `x-frame-options` | Clickjacking protection | High |
| `content-security-policy` | XSS/injection protection | High |
| `strict-transport-security` | HTTPS enforcement | High |
| `x-content-type-options` | MIME sniffing prevention | Medium |

### Extended Headers in Schema

**Source**: `types/metadata.ts:109-126`

Additional headers defined in the Zod schema:
- `xXssProtection`
- `referrerPolicy`
- `permissionsPolicy`
- `crossOriginEmbedderPolicy`
- `crossOriginOpenerPolicy`
- `crossOriginResourcePolicy`

### 5.2 Analytics Detection

**Source**: `app/api/metadata/route.ts:197-357`

#### Google Analytics Detection

```javascript
// GA4 and gtag detection
const gtagMatches = html.match(/gtag\(['"]config['"],\s*['"]([^'"]+)['"]/g)
// Tracking ID format detection
if (trackingId.startsWith('GA-') || trackingId.startsWith('G-')) {
  analyticsInfo.googleAnalytics.ga4 = true
} else if (trackingId.startsWith('UA-')) {
  analyticsInfo.googleAnalytics.universalAnalytics = true
}

// Universal Analytics (legacy ga function)
const gaMatches = html.match(/ga\(['"]create['"],\s*['"]([^'"]+)['"]/g)

// Script tag detection
$('script[src*="googletagmanager.com/gtag"], script[src*="google-analytics.com/ga.js"], script[src*="google-analytics.com/analytics.js"]')
```

#### Google Tag Manager Detection

```javascript
// Container ID pattern
const gtmMatches = html.match(/GTM-[A-Z0-9]+/g)

// Script tag detection
$('script[src*="googletagmanager.com/gtm.js"]')
```

#### Other Analytics Tools Detection

| Tool | HTML Patterns | Script Sources |
|------|---------------|----------------|
| Facebook Pixel | `/fbevents\.js/`, `/fbq\(/` | `connect.facebook.net/en_US/fbevents.js` |
| Adobe Analytics | `/s_code\.js/`, `/omniture/`, `/Adobe\.Analytics/` | `metrics.adobe.com`, `omtrdc.net` |
| Hotjar | `/hotjar/`, `/hj\(/` | `static.hotjar.com` |
| Mixpanel | `/mixpanel/`, `/mp_lib/` | `cdn.mxpnl.com` |
| Segment | `/analytics\.js/`, `/analytics\.track/` | `cdn.segment.com` |
| Heap Analytics | `/heap\.load/`, `/heapanalytics/` | `heapanalytics.com` |
| Amplitude | `/amplitude/`, `/amplitude\.init/` | `amplitude.com` |
| Plausible | `/plausible/` | `plausible.io` |
| Fathom Analytics | `/fathom/` | `cdn.usefathom.com` |

### 5.3 Sitemap & Robots.txt Discovery

**Source**: `app/api/metadata/route.ts:47-194`

#### Standard Sitemap Locations Checked

```javascript
const standardLocations = [
  '/sitemap.xml',
  '/sitemap_index.xml',
  '/sitemaps.xml',
  '/sitemap1.xml'
]
```

#### Robots.txt Detection

Checks both `/robots.txt` and `/robots.js` formats:

```javascript
const robotsFiles = ['/robots.txt', '/robots.js']

// Validation for valid robots file content
const isValidRobotsFile =
  robotsContent.toLowerCase().includes('user-agent') ||
  robotsContent.toLowerCase().includes('disallow') ||
  robotsContent.toLowerCase().includes('allow') ||
  robotsContent.toLowerCase().includes('sitemap') ||
  robotsContent.toLowerCase().includes('crawl-delay') ||
  (robotsContent.length > 0 &&
    robotsContent.length < 10000 &&
    !robotsContent.includes('<!DOCTYPE html>'))
```

#### Sitemap extraction from robots.txt

```javascript
const sitemapMatches = robotsContent.match(/^Sitemap:\s*(.+)$/gim)
```

### 5.4 Structured Data (JSON-LD) Parsing

**Source**: `app/api/metadata/route.ts:500-514`

```javascript
const structuredData: Array<{ type: string; data: Record<string, unknown> }> = []
$('script[type="application/ld+json"]').each((_, element) => {
  try {
    const data = JSON.parse($(element).html() || '{}') as Record<string, unknown>
    if (data['@type'] && typeof data['@type'] === 'string') {
      structuredData.push({
        type: data['@type'],
        data
      })
    }
  } catch (e) {
    // Ignore invalid JSON-LD
  }
})
```

### 5.5 Icon Extraction

**Source**: `app/api/metadata/route.ts:449-471`

```javascript
// Selector for all icon types
$('link[rel*="icon"], link[rel="apple-touch-icon"], link[rel="mask-icon"]').each((_, element) => {
  const href = $(element).attr('href')
  const rel = $(element).attr('rel')
  if (href && rel) {
    icons.push({
      href: new URL(href, targetUrl).toString(),  // Resolve relative URLs
      sizes: $(element).attr('sizes') || undefined,
      type: $(element).attr('type') || undefined,
      rel
    })
  }
})
```

### 5.6 Technical Metadata Extraction

**Source**: `app/api/metadata/route.ts:474-498`

```javascript
const technical = {
  charset:
    $('meta[charset]').attr('charset') ||
    $('meta[http-equiv="content-type"]')
      .attr('content')
      ?.match(/charset=([^;]+)/)?.[1] ||
    undefined,
  themeColor: $('meta[name="theme-color"]').attr('content') || undefined,
  manifestUrl: $('link[rel="manifest"]').attr('href')
    ? new URL($('link[rel="manifest"]').attr('href')!, targetUrl).toString()
    : undefined,
  generator: $('meta[name="generator"]').attr('content') || undefined,
  referrer: $('meta[name="referrer"]').attr('content') || undefined,
  appleTouchIcon: $('link[rel="apple-touch-icon"]').attr('href')
    ? new URL($('link[rel="apple-touch-icon"]').attr('href')!, targetUrl).toString()
    : undefined,
  appleItunes: $('meta[name="apple-itunes-app"]').attr('content') || undefined,
  msapplicationConfig: $('meta[name="msapplication-config"]').attr('content') || undefined,
  doctype: html.match(/<!DOCTYPE\s+[^>]+>/i)?.[0] || undefined
}
```

---

## 6. Zod Validation Schemas

**Source**: `types/metadata.ts`

### SEOMetadataSchema

```typescript
export const SEOMetadataSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  keywords: z.string().optional(),
  canonical: z.string().optional(),
  language: z.string().optional(),
  viewport: z.string().optional(),
  robots: z.string().optional(),
  author: z.string().optional(),
})
```

### OpenGraphSchema

```typescript
export const OpenGraphSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  imageAlt: z.string().optional(),
  imageWidth: z.string().optional(),
  imageHeight: z.string().optional(),
  url: z.string().optional(),
  type: z.string().optional(),
  siteName: z.string().optional(),
  locale: z.string().optional(),
})
```

### TwitterCardSchema

```typescript
export const TwitterCardSchema = z.object({
  card: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  imageAlt: z.string().optional(),
  site: z.string().optional(),
  creator: z.string().optional(),
})
```

### IconSchema

```typescript
export const IconSchema = z.object({
  href: z.string(),           // Required
  sizes: z.string().optional(),
  type: z.string().optional(),
  rel: z.string(),            // Required
})
```

### TechnicalMetadataSchema

```typescript
export const TechnicalMetadataSchema = z.object({
  charset: z.string().optional(),
  themeColor: z.string().optional(),
  manifestUrl: z.string().optional(),
  generator: z.string().optional(),
  referrer: z.string().optional(),
  appleTouchIcon: z.string().optional(),
  appleItunes: z.string().optional(),
  msapplicationConfig: z.string().optional(),
  doctype: z.string().optional(),
})
```

### SitemapInfoSchema

```typescript
export const SitemapInfoSchema = z.object({
  sitemaps: z.array(z.object({
    url: z.string(),
    accessible: z.boolean(),
    size: z.number().optional(),
    lastModified: z.string().optional(),
    source: z.enum(['link_tag', 'robots_txt', 'standard_location']),
  })),
  robotsTxt: z.object({
    accessible: z.boolean(),
    url: z.string(),
    content: z.string().optional(),
    hasMetaRobots: z.boolean().optional(),
    metaContent: z.string().optional(),
  }).optional(),
})
```

### AnalyticsInfoSchema

```typescript
export const AnalyticsInfoSchema = z.object({
  googleAnalytics: z.object({
    present: z.boolean(),
    trackingIds: z.array(z.string()),
    gtag: z.boolean(),
    universalAnalytics: z.boolean(),
    ga4: z.boolean(),
  }),
  googleTagManager: z.object({
    present: z.boolean(),
    containerIds: z.array(z.string()),
  }),
  otherAnalytics: z.array(z.object({
    name: z.string(),
    detected: z.boolean(),
    details: z.string().optional(),
  })),
})
```

### PerformanceMetricsSchema

```typescript
export const PerformanceMetricsSchema = z.object({
  loadTime: z.number().optional(),
  responseTime: z.number().optional(),
  contentLength: z.number().optional(),
  statusCode: z.number().optional(),
})
```

### ResponseHeadersSchema

```typescript
export const ResponseHeadersSchema = z.object({
  server: z.string().optional(),
  contentType: z.string().optional(),
  contentEncoding: z.string().optional(),
  cacheControl: z.string().optional(),
  lastModified: z.string().optional(),
  etag: z.string().optional(),
  xFrameOptions: z.string().optional(),
  contentSecurityPolicy: z.string().optional(),
  strictTransportSecurity: z.string().optional(),
  xContentTypeOptions: z.string().optional(),
  xXssProtection: z.string().optional(),
  referrerPolicy: z.string().optional(),
  permissionsPolicy: z.string().optional(),
  crossOriginEmbedderPolicy: z.string().optional(),
  crossOriginOpenerPolicy: z.string().optional(),
  crossOriginResourcePolicy: z.string().optional(),
})
```

### StructuredDataSchema

```typescript
export const StructuredDataSchema = z.object({
  type: z.string(),
  data: z.record(z.unknown()),
})
```

### WebsiteMetadataSchema (Complete)

```typescript
export const WebsiteMetadataSchema = z.object({
  url: z.string(),
  seo: SEOMetadataSchema,
  openGraph: OpenGraphSchema,
  twitterCard: TwitterCardSchema,
  icons: z.array(IconSchema),
  technical: TechnicalMetadataSchema,
  performance: PerformanceMetricsSchema.optional(),
  headers: ResponseHeadersSchema.optional(),
  structuredData: z.array(StructuredDataSchema),
  sitemap: SitemapInfoSchema.optional(),
  analytics: AnalyticsInfoSchema.optional(),
  extractedAt: z.string(),
  error: z.string().optional(),
})
```

### MetadataAPIResponseSchema

```typescript
export const MetadataAPIResponseSchema = z.object({
  success: z.boolean(),
  data: WebsiteMetadataSchema.optional(),
  error: z.string().optional(),
  status: z.number().optional(),
})
```

---

## 7. API Implementation

**Source**: `app/api/metadata/route.ts`

### Axios Configuration

```javascript
const response = await axios.get(targetUrl.toString(), {
  timeout: 8000, // 8 seconds (below Vercel's 10s limit)
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    Accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate',
    Connection: 'keep-alive'
  },
  // Handle SSL certificate issues gracefully
  httpsAgent: new (require('https').Agent)({
    rejectUnauthorized: false, // Accept self-signed certificates
    requestCert: false,
    agent: false
  }),
  maxRedirects: 5,
  validateStatus: function (status) {
    return status >= 200 && status < 400; // Accept 2xx and 3xx status codes
  }
})
```

### Cheerio Parsing Setup

```javascript
const html = response.data
const $ = cheerio.load(html)
```

### Error Handling Patterns

```javascript
try {
  // ... extraction logic
} catch (error) {
  console.error('Metadata extraction error:', error)

  // Check if this is a 401 authentication error
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as any
    if (axiosError.response?.status === 401) {
      const apiResponse: MetadataAPIResponse = {
        success: false,
        error: 'Authentication required',
        status: 401
      }
      return NextResponse.json(apiResponse, { status: 200 }) // Return 200 so frontend can handle it
    }
  }

  const errorMessage =
    error instanceof Error ? error.message : 'Unknown error occurred'

  const apiResponse: MetadataAPIResponse = {
    success: false,
    error: `Failed to extract metadata: ${errorMessage}`
  }

  return NextResponse.json(apiResponse, { status: 500 })
}
```

### Response Structure

**Success Response**:
```typescript
{
  success: true,
  data: {
    url: string,
    seo: SEOMetadata,
    openGraph: OpenGraph,
    twitterCard: TwitterCard,
    icons: Icon[],
    technical: TechnicalMetadata,
    performance: PerformanceMetrics,
    headers: ResponseHeaders,
    structuredData: StructuredData[],
    sitemap: SitemapInfo,
    analytics: AnalyticsInfo,
    extractedAt: string  // ISO 8601 timestamp
  }
}
```

**Error Response**:
```typescript
{
  success: false,
  error: string,
  status?: number  // HTTP status code for specific errors like 401
}
```

### Performance Metrics Capture

```javascript
const startTime = Date.now()
const response = await axios.get(...)
const loadTime = Date.now() - startTime

const performance = {
  loadTime,
  responseTime: loadTime,
  contentLength: Buffer.byteLength(html, 'utf8'),
  statusCode: response.status
}
```

### CORS Configuration

```javascript
export async function OPTIONS () {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
}
```

---

## Technical Score Calculation

**Source**: `components/metadata/TechnicalSection.tsx:98-117`

```javascript
const getTechnicalScore = () => {
  let score = 0
  const maxScore = 8

  // Security checks
  if (metadata.url.startsWith('https://')) score += 1
  if (safeHeaders.contentSecurityPolicy) score += 1
  if (safeHeaders.xFrameOptions) score += 1
  if (safeHeaders.strictTransportSecurity) score += 1

  // Performance checks
  if (safeHeaders.contentEncoding) score += 1
  if (safeHeaders.cacheControl) score += 1

  // Configuration checks
  if (metadata.seo.viewport) score += 1
  if (technical?.charset) score += 1

  return { score, maxScore, percentage: Math.round((score / maxScore) * 100) }
}
```

### Technical Score Breakdown (8-Point System)

| Category | Check | Points |
|----------|-------|--------|
| Security | HTTPS | +1 |
| Security | Content-Security-Policy header | +1 |
| Security | X-Frame-Options header | +1 |
| Security | Strict-Transport-Security header | +1 |
| Performance | Content-Encoding (compression) | +1 |
| Performance | Cache-Control header | +1 |
| Configuration | Viewport meta tag | +1 |
| Configuration | Charset declaration | +1 |

---

## Summary

This documentation covers the complete implementation of the Website Viewer's metadata extraction and social preview system:

1. **SEO Extraction**: 8 meta tags with character validation and 5-point scoring
2. **Open Graph**: 10 properties including image dimensions
3. **Twitter Cards**: 7 properties with OG inheritance
4. **Social Previews**: 7 platform-specific UI implementations with accurate styling
5. **Technical Metadata**: Headers, analytics detection, sitemaps, structured data
6. **Zod Schemas**: Complete type-safe validation
7. **API**: Axios + Cheerio with error handling and CORS support

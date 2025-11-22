// SEO utilities for dynamic meta tags

export function updatePageTitle(title: string) {
  document.title = `${title} | Verses & Reflections`;
}

export function updateMetaDescription(description: string) {
  let metaDescription = document.querySelector('meta[name="description"]');
  if (!metaDescription) {
    metaDescription = document.createElement('meta');
    metaDescription.setAttribute('name', 'description');
    document.head.appendChild(metaDescription);
  }
  metaDescription.setAttribute('content', description);
}

export function updateOGTags(title: string, description: string) {
  // Update OG title
  let ogTitle = document.querySelector('meta[property="og:title"]');
  if (!ogTitle) {
    ogTitle = document.createElement('meta');
    ogTitle.setAttribute('property', 'og:title');
    document.head.appendChild(ogTitle);
  }
  ogTitle.setAttribute('content', title);

  // Update OG description
  let ogDescription = document.querySelector('meta[property="og:description"]');
  if (!ogDescription) {
    ogDescription = document.createElement('meta');
    ogDescription.setAttribute('property', 'og:description');
    document.head.appendChild(ogDescription);
  }
  ogDescription.setAttribute('content', description);
}

export function setPageSEO(title: string, description: string) {
  updatePageTitle(title);
  updateMetaDescription(description);
  updateOGTags(title, description);
}

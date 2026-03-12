import { getCollection, type CollectionEntry } from 'astro:content';

type BlogPost = CollectionEntry<'blog'>;
type BlogPostData = BlogPost['data'];

function padDatePart(value: number) {
  return value.toString().padStart(2, '0');
}

function getCalendarDateKey(date: Date) {
  return [
    date.getFullYear(),
    padDatePart(date.getMonth() + 1),
    padDatePart(date.getDate()),
  ].join('-');
}

function getPublishDateKey(publishDate: Date) {
  return [
    publishDate.getUTCFullYear(),
    padDatePart(publishDate.getUTCMonth() + 1),
    padDatePart(publishDate.getUTCDate()),
  ].join('-');
}

export function isPublishedBlogPost(
  data: Pick<BlogPostData, 'draft' | 'publishDate'>,
  now = new Date(),
) {
  return !data.draft && getPublishDateKey(data.publishDate) <= getCalendarDateKey(now);
}

export function sortBlogPostsByPublishDateDesc(left: BlogPost, right: BlogPost) {
  return right.data.publishDate.valueOf() - left.data.publishDate.valueOf();
}

export function formatBlogPublishDate(publishDate: Date) {
  return publishDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export async function getPublishedBlogPosts(now = new Date()) {
  const posts = await getCollection('blog', ({ data }) =>
    isPublishedBlogPost(data, now),
  );

  return posts.sort(sortBlogPostsByPublishDateDesc);
}

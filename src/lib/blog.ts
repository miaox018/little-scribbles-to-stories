
export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  publishDate: string;
  author: string;
  tags: string[];
  image: string;
  content: string;
}

export interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  publishDate: string;
  author: string;
  tags: string[];
  image: string;
}

import { blogPosts } from '@/data/blogPosts';

export function getAllBlogPosts(): BlogPostMeta[] {
  return blogPosts
    .map(post => ({
      slug: post.slug,
      title: post.title,
      description: post.description,
      publishDate: post.publishDate,
      author: post.author,
      tags: post.tags,
      image: post.image,
    }))
    .sort((a, b) => {
      return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
    });
}

export function getBlogPostBySlug(slug: string): BlogPost | null {
  const post = blogPosts.find(p => p.slug === slug);
  return post || null;
}

export function getBlogPostSlugs(): string[] {
  return blogPosts.map(post => post.slug);
}

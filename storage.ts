export interface Post {
  id: string;
  content: string;
  image?: string;
  date: string; // ISO string
  platforms: string[];
  status: 'scheduled' | 'published' | 'failed';
}

const STORAGE_KEY = 'social-scheduler-posts';

export const getPosts = (): Post[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Failed to parse posts', e);
    return [];
  }
};

export const savePost = (post: Omit<Post, 'id' | 'status'>) => {
  const posts = getPosts();
  const newPost: Post = {
    ...post,
    id: Math.random().toString(36).substring(7),
    status: 'scheduled',
  };
  const updatedPosts = [...posts, newPost];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPosts));
  return newPost;
};

export const deletePost = (id: string) => {
  const posts = getPosts();
  const updatedPosts = posts.filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPosts));
};

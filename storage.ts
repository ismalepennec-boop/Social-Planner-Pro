import { createClient } from "@supabase/supabase-js";
import { type User, type InsertUser, type Post, type InsertPost } from "@shared/schema";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getPosts(): Promise<Post[]>;
  getPost(id: number): Promise<Post | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: number, updates: Partial<InsertPost>): Promise<Post | undefined>;
  deletePost(id: number): Promise<void>;
}

export class SupabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error || !data) return undefined;
    return data as User;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .single();
    
    if (error || !data) return undefined;
    return data as User;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const { data, error } = await supabase
      .from("users")
      .insert(insertUser)
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data as User;
  }

  async getPosts(): Promise<Post[]> {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("date", { ascending: false });
    
    if (error) throw new Error(error.message);
    return (data || []).map(post => ({
      ...post,
      date: new Date(post.date),
      createdAt: new Date(post.created_at),
    })) as Post[];
  }

  async getPost(id: number): Promise<Post | undefined> {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error || !data) return undefined;
    return {
      ...data,
      date: new Date(data.date),
      createdAt: new Date(data.created_at),
    } as Post;
  }

  async createPost(insertPost: InsertPost): Promise<Post> {
    const { data, error } = await supabase
      .from("posts")
      .insert({
        content: insertPost.content,
        image: insertPost.image || null,
        video: insertPost.video || null,
        type: insertPost.type || "text",
        date: insertPost.date instanceof Date ? insertPost.date.toISOString() : insertPost.date,
        platforms: insertPost.platforms,
        status: insertPost.status || "scheduled",
      })
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return {
      ...data,
      date: new Date(data.date),
      createdAt: new Date(data.created_at),
    } as Post;
  }

  async updatePost(id: number, updates: Partial<InsertPost>): Promise<Post | undefined> {
    const updateData: any = { ...updates };
    if (updates.date instanceof Date) {
      updateData.date = updates.date.toISOString();
    }
    
    const { data, error } = await supabase
      .from("posts")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();
    
    if (error || !data) return undefined;
    return {
      ...data,
      date: new Date(data.date),
      createdAt: new Date(data.created_at),
    } as Post;
  }

  async deletePost(id: number): Promise<void> {
    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", id);
    
    if (error) throw new Error(error.message);
  }
}

export const storage = new SupabaseStorage();

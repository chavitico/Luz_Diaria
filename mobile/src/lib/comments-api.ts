import { fetchWithTimeout } from './fetch';

const BACKEND_URL = process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL || 'http://localhost:3000';

export interface CommentUser {
  id: string;
  nickname: string;
  avatarId: string;
  frameId: string | null;
}

export interface DevotionalComment {
  id: string;
  text: string;
  createdAt: string;
  likeCount: number;
  likedByMe: boolean;
  user: CommentUser;
}

export async function getComments(date: string, userId?: string): Promise<DevotionalComment[]> {
  const res = await fetchWithTimeout(`${BACKEND_URL}/api/comments/${date}`, {
    headers: userId ? { 'X-User-Id': userId } : {},
  });
  if (!res.ok) return [];
  const data = await res.json() as { comments: DevotionalComment[] };
  return data.comments ?? [];
}

export async function postComment(date: string, text: string, userId: string): Promise<DevotionalComment | null> {
  const res = await fetchWithTimeout(`${BACKEND_URL}/api/comments/${date}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) return null;
  const data = await res.json() as { comment: DevotionalComment };
  return data.comment ?? null;
}

export async function likeComment(commentId: string, userId: string): Promise<{ liked: boolean; likeCount: number } | null> {
  const res = await fetchWithTimeout(`${BACKEND_URL}/api/comments/${commentId}/like`, {
    method: 'POST',
    headers: { 'X-User-Id': userId },
  });
  if (!res.ok) return null;
  return res.json() as Promise<{ liked: boolean; likeCount: number }>;
}

export async function deleteComment(commentId: string, userId: string): Promise<boolean> {
  const res = await fetchWithTimeout(`${BACKEND_URL}/api/comments/${commentId}`, {
    method: 'DELETE',
    headers: { 'X-User-Id': userId },
  });
  return res.ok;
}

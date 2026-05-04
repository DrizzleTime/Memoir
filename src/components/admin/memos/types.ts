"use client";

export interface MemoItem {
  id: number;
  content: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MemoFormValues {
  content: string;
  isPublished: boolean;
}

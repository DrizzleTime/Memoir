import { revalidatePath } from "next/cache";

export function revalidateArticle(articleId: number) {
  revalidatePath("/");
  revalidatePath("/feed");
  revalidatePath("/sitemap.xml");
  revalidatePath(`/article/${articleId}`);
}

export function revalidateMemos() {
  revalidatePath("/");
  revalidatePath("/now");
  revalidatePath("/sitemap.xml");
}

export function revalidateLinks() {
  revalidatePath("/links");
  revalidatePath("/sitemap.xml");
}

export function revalidateAlbums(albumId?: number) {
  revalidatePath("/");
  revalidatePath("/albums");
  revalidatePath("/sitemap.xml");
  if (albumId) {
    revalidatePath(`/albums/${albumId}`);
  }
}

export function revalidateComments(articleId: number) {
  revalidatePath("/");
  revalidatePath(`/article/${articleId}`);
}

export function revalidateCommentTarget(target: {
  articleId?: number | null;
  memoId?: number | null;
}) {
  if (target.articleId) {
    revalidateComments(target.articleId);
  }

  if (target.memoId) {
    revalidatePath("/now");
  }
}

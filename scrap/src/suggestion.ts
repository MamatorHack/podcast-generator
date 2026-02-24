export async function getTopComment(context: any, postId: string) {
  const comments = await context.reddit.apiClient.comment.list({
    parent_id: postId,
    limit: 100,
  });

  let topComment: any = null;
  for (const c of comments) {
    if (!topComment || c.score > topComment.score) {
      topComment = c;
    }
  }
  return topComment;
}

export async function closeThread(context: any, postId: string) {
  await context.reddit.apiClient.post.update({
    post_id: postId,
    locked: true,
  });
}

export async function openThread(context: any, postId: string) {
  await context.reddit.apiClient.post.update({
    post_id: postId,
    locked: false,
  });
}
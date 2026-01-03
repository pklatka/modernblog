import { createFileRoute } from '@tanstack/react-router';
import PostEditor from '../../components/PostEditor';

export const Route = createFileRoute('/admin/edit/$slug')({
  component: EditPostPage,
});

function EditPostPage() {
  const { slug } = Route.useParams();
  return <PostEditor slug={slug} />;
}

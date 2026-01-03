import { createFileRoute } from '@tanstack/react-router';
import PostEditor from '../../components/PostEditor';

export const Route = createFileRoute('/admin/new')({
  component: PostEditor,
});

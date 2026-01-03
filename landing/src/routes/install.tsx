import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/install')({
    beforeLoad: () => {
        throw redirect({
            href: 'https://github.com/pklatka/modernblog/raw/main/scripts/install.sh',
        });
    },
});

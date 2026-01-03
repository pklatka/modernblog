import { createFileRoute } from '@tanstack/react-router';
import { Hero } from '../components/Hero';
import { Features } from '../components/Features';

export const Route = createFileRoute('/')({
    component: HomePage,
});

function HomePage() {
    return (
        <>
            <Hero />
            <Features />
        </>
    );
}

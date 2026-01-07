import { Link } from '@tanstack/react-router';
import { CopyCommand } from './CopyCommand';
import { ChevronDownIcon } from './Icons';

export function Hero() {
    const installCommand = 'curl -LsSf https://modernblog.klatka.it/install.sh | sh';

    const scrollToFeatures = () => {
        document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20">
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-950/80 pointer-events-none" />

            <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm font-medium animate-fade-in">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                    Lightweight & Open Source
                </div>

                {/* Title */}
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold leading-tight animate-slide-up">
                    <span className="bg-gradient-to-r from-white via-violet-200 to-purple-300 bg-clip-text text-transparent">
                        Modern
                    </span>
                    <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                        Blog
                    </span>
                </h1>

                {/* Subtitle */}
                <p className="text-lg md:text-xl lg:text-2xl text-slate-400 max-w-2xl mx-auto leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    A beautiful, self-hosted blogging platform with{' '}
                    <span className="text-white font-medium">Markdown editor</span>,{' '}
                    <span className="text-white font-medium">comments</span>, and{' '}
                    <span className="text-white font-medium">email subscriptions</span>.
                </p>

                {/* Install command */}
                <div className="pt-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                    <p className="text-sm text-slate-500 mb-4">Install with a single command:</p>
                    <CopyCommand command={installCommand} />
                </div>

                {/* CTA buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                    <a
                        href="https://github.com/pklatka/modernblog"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 rounded-xl font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-violet-500/25 hover:-translate-y-0.5"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                        </svg>
                        View on GitHub
                    </a>
                    <Link
                        to="/docs"
                        className="px-6 py-3 border border-slate-700 hover:border-slate-600 rounded-xl font-semibold text-slate-300 hover:text-white transition-all duration-200 hover:-translate-y-0.5"
                    >
                        Read Documentation
                    </Link>
                </div>
            </div>

            {/* Scroll indicator */}
            <button
                onClick={scrollToFeatures}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 text-slate-500 hover:text-white transition-colors animate-bounce"
                aria-label="Scroll to features"
            >
                <ChevronDownIcon className="w-8 h-8" />
            </button>
        </section>
    );
}

import { GitHubIcon, HeartIcon } from './Icons';

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="relative py-12 px-4 border-t border-slate-800">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    {/* Logo and copyright */}
                    <div className="flex flex-col items-center md:items-start gap-2">
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                                ModernBlog
                            </span>
                        </div>
                        <p className="text-sm text-slate-500">
                            © {currentYear} ModernBlog. MIT License.
                        </p>
                    </div>

                    {/* Links */}
                    <div className="flex items-center gap-6">
                        <a
                            href="https://github.com/pklatka/modernblog"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                        >
                            <GitHubIcon className="w-5 h-5" />
                            <span className="text-sm">GitHub</span>
                        </a>
                        <a
                            href="https://github.com/sponsors/pklatka"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-slate-400 hover:text-pink-400 transition-colors"
                        >
                            <HeartIcon className="w-5 h-5" />
                            <span className="text-sm">Sponsor</span>
                        </a>
                    </div>

                    {/* Author */}
                    <div className="text-sm text-slate-500">
                        Created by{' '}
                        <a
                            href="https://klatka.it"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-white transition-colors"
                        >
                            Patryk Klatka
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}

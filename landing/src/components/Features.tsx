import {
    MarkdownIcon,
    CommentIcon,
    PaletteIcon,
    MailIcon,
    MoonIcon,
    SearchIcon,
    DeviceIcon,
    ServerIcon,
} from './Icons';

const features = [
    {
        icon: MarkdownIcon,
        title: 'Markdown Editor',
        description: 'Write posts in Markdown with live preview. Supports syntax highlighting, images, and more.',
        color: 'from-emerald-500 to-teal-500',
    },
    {
        icon: CommentIcon,
        title: 'Nested Comments',
        description: 'Multi-level threaded discussions with moderation tools and anti-spam protection.',
        color: 'from-blue-500 to-cyan-500',
    },
    {
        icon: PaletteIcon,
        title: 'Theme Customization',
        description: 'Multiple built-in color themes. Choose from Modern, Ocean, Forest, Rose, and more.',
        color: 'from-violet-500 to-purple-500',
    },
    {
        icon: MailIcon,
        title: 'Email Subscriptions',
        description: 'Newsletter support with SMTP or mailing lists. Notify readers about new posts.',
        color: 'from-pink-500 to-rose-500',
    },
    {
        icon: MoonIcon,
        title: 'Dark/Light Mode',
        description: 'Automatic system detection with manual toggle. Your readers choose their preference.',
        color: 'from-indigo-500 to-violet-500',
    },
    {
        icon: SearchIcon,
        title: 'Full-text Search',
        description: 'Fast, built-in search across all your posts. No external services required.',
        color: 'from-amber-500 to-orange-500',
    },
    {
        icon: DeviceIcon,
        title: 'Responsive Design',
        description: 'Optimized for all devices. Your blog looks great on desktop, tablet, and mobile.',
        color: 'from-cyan-500 to-blue-500',
    },
    {
        icon: ServerIcon,
        title: 'Self-Hosted',
        description: 'Own your data. Run on your own server with SQLite. No external dependencies.',
        color: 'from-slate-500 to-zinc-500',
    },
];

export function Features() {
    return (
        <section id="features" className="relative py-24 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Section header */}
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                        Everything you need to{' '}
                        <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                            start blogging
                        </span>
                    </h2>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                        ModernBlog comes packed with features out of the box. No plugins, no configuration headaches.
                    </p>
                </div>

                {/* Features grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((feature, index) => (
                        <div
                            key={feature.title}
                            className="group relative p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all duration-300 hover:-translate-y-1"
                            style={{ animationDelay: `${index * 0.05}s` }}
                        >
                            {/* Gradient glow on hover */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                            <div className="relative">
                                {/* Icon */}
                                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.color} mb-4`}>
                                    <feature.icon className="w-6 h-6 text-white" />
                                </div>

                                {/* Content */}
                                <h3 className="text-lg font-semibold text-white mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-sm text-slate-400 leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

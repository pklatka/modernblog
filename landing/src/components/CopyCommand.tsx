import { useState } from 'react';
import { CheckIcon, ClipboardIcon } from './Icons';

interface CopyCommandProps {
    command: string;
}

export function CopyCommand({ command }: CopyCommandProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(command);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <div className="relative group max-w-2xl w-full mx-auto">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-500"></div>
            <div className="relative flex items-center bg-slate-900/90 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="flex-1 px-4 py-4 md:px-6 md:py-5 overflow-x-auto">
                    <code className="text-sm md:text-base text-slate-300 whitespace-nowrap font-mono">
                        <span className="text-emerald-400">$</span> {command}
                    </code>
                </div>
                <button
                    onClick={handleCopy}
                    className="flex-shrink-0 px-4 py-4 md:px-5 md:py-5 bg-slate-800/50 hover:bg-slate-700/50 border-l border-slate-700/50 transition-colors duration-200 group/btn"
                    aria-label={copied ? 'Copied!' : 'Copy to clipboard'}
                >
                    {copied ? (
                        <CheckIcon className="w-5 h-5 text-emerald-400" />
                    ) : (
                        <ClipboardIcon className="w-5 h-5 text-slate-400 group-hover/btn:text-white transition-colors" />
                    )}
                </button>
            </div>
            {copied && (
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-sm text-emerald-400 animate-fade-in">
                    Copied to clipboard!
                </div>
            )}
        </div>
    );
}

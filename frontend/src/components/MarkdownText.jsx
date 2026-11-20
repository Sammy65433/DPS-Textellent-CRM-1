import { Fragment } from "react";

// Minimal markdown renderer: supports **bold**, *italic*, and "- " bullet lines.
export default function MarkdownText({ text, className }) {
    if (!text) return null;
    const lines = String(text).split("\n");
    const blocks = [];
    let bullets = [];

    const flushBullets = (key) => {
        if (bullets.length === 0) return;
        blocks.push(
            <ul key={`ul-${key}`} className="markdown-list">
                {bullets.map((b, i) => (
                    <li key={i}>{renderInline(b)}</li>
                ))}
            </ul>
        );
        bullets = [];
    };

    const renderInline = (str) => {
        const parts = str.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith("**") && part.endsWith("**")) {
                return <strong key={i}>{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith("*") && part.endsWith("*")) {
                return <em key={i}>{part.slice(1, -1)}</em>;
            }
            return <Fragment key={i}>{part}</Fragment>;
        });
    };

    lines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
            bullets.push(trimmed.slice(2));
        } else {
            flushBullets(idx);
            if (trimmed === "") {
                blocks.push(<div key={`sp-${idx}`} className="markdown-spacer" />);
            } else {
                blocks.push(
                    <p key={`p-${idx}`} className="markdown-para">
                        {renderInline(trimmed)}
                    </p>
                );
            }
        }
    });
    flushBullets(lines.length);

    return <div className={className}>{blocks}</div>;
}

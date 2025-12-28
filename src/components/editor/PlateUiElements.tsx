import React from 'react';
import type { PlateEditor } from 'platejs/react';
import { Path } from 'slate';

// --- Image Element ---
type ImageElementProps = {
    attributes: React.HTMLAttributes<HTMLDivElement>;
    children: React.ReactNode;
    element: {
        url?: string;
        alt?: string;
    };
};

export const ImageElement = ({ attributes, children, element }: ImageElementProps) => (
    <div {...attributes}>
        <div contentEditable={false} className="my-3 rounded-lg border border-white/10 bg-black/40 p-2">
            {element?.url ? (
                <img
                    src={element.url}
                    alt={element.alt || 'content image'}
                    className="max-w-full rounded-md"
                />
            ) : (
                <div className="text-xs text-default-500">Image not available</div>
            )}
        </div>
        {children}
    </div>
);

// --- Code Block Element ---
type CodeBlockElementProps = {
    attributes: React.HTMLAttributes<HTMLPreElement>;
    children: React.ReactNode;
};

export const CodeBlockElement = ({ attributes, children }: CodeBlockElementProps) => (
    <pre
        {...attributes}
        className="my-3 overflow-x-auto rounded-lg border border-white/10 bg-black/70 p-4 text-xs leading-relaxed text-white"
    >
        <code className="font-mono">{children}</code>
    </pre>
);

// --- Callout Element ---
type CalloutElementProps = {
    attributes: React.HTMLAttributes<HTMLDivElement>;
    children: React.ReactNode;
};

export const CalloutElement = ({ attributes, children }: CalloutElementProps) => (
    <div
        {...attributes}
        className="my-3 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white"
    >
        {children}
    </div>
);

// --- Divider/Hr Element ---
type HrElementProps = {
    attributes: React.HTMLAttributes<HTMLDivElement>;
    children: React.ReactNode;
};

export const HrElement = ({ attributes, children }: HrElementProps) => (
    <div {...attributes} className="my-4">
        <hr className="border-white/10" contentEditable={false} />
        {children}
    </div>
);

// --- Table Elements ---
type TableElementProps = {
    attributes: React.HTMLAttributes<HTMLTableElement>;
    children: React.ReactNode;
};

export const TableElement = ({ attributes, children }: TableElementProps) => (
    <table
        {...attributes}
        className="my-4 w-full border-collapse text-sm text-white/90"
    >
        <tbody>{children}</tbody>
    </table>
);

type TableRowElementProps = {
    attributes: React.HTMLAttributes<HTMLTableRowElement>;
    children: React.ReactNode;
};

export const TableRowElement = ({ attributes, children }: TableRowElementProps) => (
    <tr
        {...attributes}
        className="border-b border-white/10 last:border-b-0"
    >
        {children}
    </tr>
);

type TableCellElementProps = {
    attributes: React.HTMLAttributes<HTMLTableCellElement>;
    children: React.ReactNode;
};

export const TableCellElement = ({ attributes, children }: TableCellElementProps) => (
    <td
        {...attributes}
        className="border border-white/10 px-3 py-2 align-top"
    >
        {children}
    </td>
);

export const TableHeaderCellElement = ({ attributes, children }: TableCellElementProps) => (
    <th
        {...attributes}
        className="border border-white/10 bg-white/5 px-3 py-2 text-left font-semibold"
    >
        {children}
    </th>
);

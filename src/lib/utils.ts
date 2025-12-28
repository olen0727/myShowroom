
export const normalizeHexColor = (value: string) => {
    const trimmed = value.trim();
    if (/^#([0-9a-f]{3}){1,2}$/i.test(trimmed)) {
        if (trimmed.length === 4) {
            const r = trimmed[1];
            const g = trimmed[2];
            const b = trimmed[3];
            return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
        }
        return trimmed.toLowerCase();
    }
    return '';
};

export const getContrastColor = (hex: string) => {
    const normalized = normalizeHexColor(hex);
    if (!normalized) return '#ffffff';
    const r = parseInt(normalized.slice(1, 3), 16);
    const g = parseInt(normalized.slice(3, 5), 16);
    const b = parseInt(normalized.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6 ? '#111827' : '#ffffff';
};

export const hashTag = (value: string) => {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
        hash = (hash * 31 + value.charCodeAt(i)) % 997;
    }
    return hash;
};

export const dataUrlToBlob = (dataUrl: string) => {
    const [meta, base64] = dataUrl.split(',');
    const mimeMatch = /data:(.*?);base64/.exec(meta || '');
    const mime = mimeMatch?.[1] || 'image/png';
    const binary = atob(base64 || '');
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
    }

    return { blob: new Blob([bytes], { type: mime }), mime };
};

export const preventMouseDown = (event: React.MouseEvent) => {
    event.preventDefault();
};

export const parseMarkdownTable = (text: string) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return null;

    // Check if it looks like a markdown table
    // Row 1: | col | col |
    // Row 2: | --- | --- |
    const headerLine = lines[0].trim();
    const separatorLine = lines[1].trim();

    if (!headerLine.startsWith('|') || !headerLine.endsWith('|')) return null;
    if (!separatorLine.startsWith('|') || !separatorLine.endsWith('|')) return null;
    if (!separatorLine.includes('---')) return null;

    const rows: { children: { text: string }[][] }[] = [];

    // Process header
    const headers = headerLine.slice(1, -1).split('|').map(c => c.trim());
    rows.push({ children: headers.map(text => [{ text }]) });

    // Process body (skip separator)
    for (let i = 2; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line.startsWith('|') || !line.endsWith('|')) continue;
        const cells = line.slice(1, -1).split('|').map(c => c.trim());
        rows.push({ children: cells.map(text => [{ text }]) });
    }

    return rows;
};

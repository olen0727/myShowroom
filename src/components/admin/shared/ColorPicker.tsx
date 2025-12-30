import React, { useState, useRef } from 'react';
import { Button, Tooltip } from "@nextui-org/react";
import { Plus, Check, X } from 'lucide-react';
import { normalizeHexColor } from '@/lib/utils';

interface ColorPickerProps {
    color?: string;
    onChange: (color: string) => void;
    label?: string;
    customColors?: string[];
    onCustomColorAdd?: (color: string) => void;
    onCustomColorDelete?: (color: string) => void;
    className?: string;
}

const DEFAULT_COLORS = [
    // Row 1: Grayscale
    '#000000', '#434343', '#666666', '#999999', '#B7B7B7', '#CCCCCC', '#D9D9D9', '#EFEFEF', '#F3F3F3', '#FFFFFF',
    // Row 2: Reds/Oranges
    '#980000', '#FF0000', '#FF9900', '#FFFF00', '#00FF00', '#00FFFF', '#4A86E8', '#0000FF', '#9900FF', '#FF00FF',
    // Row 3: Pastels
    '#E6B8AF', '#F4CCCC', '#FCE5CD', '#FFF2CC', '#D9EAD3', '#D0E0E3', '#C9DAF8', '#CFE2F3', '#D9D2E9', '#EAD1DC',
    // Row 4: Warm tones
    '#DD7E6B', '#EA9999', '#F9CB9C', '#FFE599', '#B6D7A8', '#A2C4C9', '#A4C2F4', '#9FC5E8', '#B4A7D6', '#D5A6BD',
    // Row 5: Medium tones
    '#CC4125', '#E06666', '#F6B26B', '#FFD966', '#93C47D', '#76A5AF', '#6D9EEB', '#6FA8DC', '#8E7CC3', '#C27BA0',
    // Row 6: Dark tones
    '#A61C00', '#CC0000', '#E69138', '#F1C232', '#6AA84F', '#45818E', '#3C78D8', '#3D85C6', '#674EA7', '#A64D79',
    // Row 7: Very Dark tones
    '#85200C', '#990000', '#B45F06', '#BF9000', '#38761D', '#134F5C', '#1155CC', '#0B5394', '#351C75', '#741B47',
    // Row 8: Deepest tones
    '#5B0F00', '#660000', '#783F04', '#7F6000', '#274E13', '#0C343D', '#1C4587', '#073763', '#20124D', '#4C1130',
];

export const ColorPicker: React.FC<ColorPickerProps> = ({
    color,
    onChange,
    label,
    customColors = [],
    onCustomColorAdd,
    onCustomColorDelete,
    className
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const selectedColor = normalizeHexColor(color || '');
    const [pendingColor, setPendingColor] = useState<string>('');

    // Handle color input change (but don't add to custom list yet)
    const handleColorInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newColor = e.target.value;
        setPendingColor(newColor);
        onChange(newColor); // Still update text color immediately for preview
    };

    // Confirm adding the pending color to custom list
    const handleConfirmAdd = () => {
        if (pendingColor && onCustomColorAdd) {
            onCustomColorAdd(pendingColor);
            setPendingColor(''); // Clear pending after add
        }
    };

    return (
        <div className={['p-3 w-64 bg-content1 rounded-lg shadow-sm', className].filter(Boolean).join(' ')}>
            {label && <div className="text-xs font-semibold text-default-500 mb-2">{label}</div>}

            {/* Custom Colors Section */}
            <div className="mb-3">
                <div className="text-xs text-default-400 mb-1 flex justify-between items-center">
                    <span>Custom Colors</span>
                    {/* Add Button Section */}
                    <div className="flex items-center gap-1">
                        <div
                            className="w-5 h-5 rounded-full border border-default-300"
                            style={{ backgroundColor: pendingColor || '#000000' }}
                        />
                        <button
                            className="w-6 h-6 rounded-md bg-primary/10 text-primary hover:bg-primary/20 flex items-center justify-center transition-colors"
                            onClick={() => inputRef.current?.click()}
                            title="Pick Color"
                        >
                            <Plus size={14} />
                        </button>
                        {pendingColor && (
                            <button
                                className="w-6 h-6 rounded-md bg-success/10 text-success hover:bg-success/20 flex items-center justify-center transition-colors"
                                onClick={handleConfirmAdd}
                                title="Confirm Add"
                            >
                                <Check size={14} />
                            </button>
                        )}
                        <input
                            ref={inputRef}
                            type="color"
                            className="hidden"
                            onChange={handleColorInputChange}
                            value={pendingColor || selectedColor}
                        />
                    </div>
                </div>

                <div className="flex flex-wrap gap-1 mt-2 min-h-[1.5rem]">
                    {customColors.map((c, i) => (
                        <div key={`${c}-${i}`} className="group relative">
                            <Tooltip content={c}>
                                <button
                                    className={`w-6 h-6 rounded-full border border-default-200 transition-transform hover:scale-110 flex items-center justify-center`}
                                    style={{ backgroundColor: c }}
                                    onClick={() => onChange(c)}
                                >
                                    {selectedColor === normalizeHexColor(c) && <Check size={12} className="text-white drop-shadow-md" />}
                                </button>
                            </Tooltip>
                            {onCustomColorDelete && (
                                <button
                                    className="absolute -top-1 -right-1 w-3 h-3 bg-danger rounded-full text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onCustomColorDelete(c);
                                    }}
                                >
                                    <X size={8} />
                                </button>
                            )}
                        </div>
                    ))}
                    {customColors.length === 0 && <span className="text-xs text-default-300 italic">No custom colors</span>}
                </div>
            </div>

            {/* Default Colors Section */}
            <div>
                <div className="text-xs text-default-400 mb-1">Default Colors</div>
                <div className="grid grid-cols-10 gap-1">
                    {DEFAULT_COLORS.map((c) => (
                        <Tooltip key={c} content={c} delay={500}>
                            <button
                                className="w-5 h-5 rounded-full border border-transparent hover:border-default-400 hover:scale-110 transition-all flex items-center justify-center relative"
                                style={{ backgroundColor: c }}
                                onClick={() => onChange(c)}
                            >
                                {selectedColor === normalizeHexColor(c) && <Check size={10} className="text-white drop-shadow-md" />}
                            </button>
                        </Tooltip>
                    ))}
                </div>
            </div>
        </div>
    );
};

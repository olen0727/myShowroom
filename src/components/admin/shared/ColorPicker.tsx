import React, { useState, useRef } from 'react';
import { Button, Tooltip } from "@nextui-org/react";
import { Plus, Check } from 'lucide-react';
import { normalizeHexColor } from '@/lib/utils';

interface ColorPickerProps {
    color?: string;
    onChange: (color: string) => void;
    label?: string;
    customColors?: string[];
    onCustomColorAdd?: (color: string) => void;
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
    onCustomColorAdd
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const selectedColor = normalizeHexColor(color || '');

    const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newColor = e.target.value;
        onChange(newColor);
        onCustomColorAdd?.(newColor);
    };

    return (
        <div className="p-3 w-64 bg-content1 rounded-lg shadow-sm">
            {label && <div className="text-xs font-semibold text-default-500 mb-2">{label}</div>}

            {/* Custom Colors Section */}
            <div className="mb-3">
                <div className="text-xs text-default-400 mb-1">Custom Colors</div>
                <div className="flex flex-wrap gap-1">
                    {customColors.map((c, i) => (
                        <Tooltip key={`${c}-${i}`} content={c}>
                            <button
                                className={`w-6 h-6 rounded-full border border-default-200 transition-transform hover:scale-110 relative flex items-center justify-center`}
                                style={{ backgroundColor: c }}
                                onClick={() => onChange(c)}
                            >
                                {selectedColor === normalizeHexColor(c) && <Check size={12} className="text-white drop-shadow-md" />}
                            </button>
                        </Tooltip>
                    ))}
                    <Tooltip content="Add custom color">
                        <button
                            className="w-6 h-6 rounded-full border border-default-200 bg-content2 flex items-center justify-center hover:bg-content3 transition-colors"
                            onClick={() => inputRef.current?.click()}
                        >
                            <Plus size={14} className="text-default-500" />
                        </button>
                    </Tooltip>
                    <input
                        ref={inputRef}
                        type="color"
                        className="hidden"
                        onChange={handleCustomColorChange}
                    />
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

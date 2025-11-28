'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Input,
    Button,
    Card,
    CardBody,
    CardHeader,
    Chip,
    Divider,
    Spacer,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
    Tooltip,
    Popover,
    PopoverTrigger,
    PopoverContent
} from "@nextui-org/react";
import {
    Plus, X, Code2, Database, Terminal, Layers, Settings, Trash2, ArrowUp, ArrowDown, Edit2,
    Server, Smartphone, Globe, Cpu, Cloud, GitBranch, Box, Users, CheckCircle, Search,
    Lock, Wifi, Monitor, PenTool, Activity, Command, Hash, Link as LinkIcon
} from 'lucide-react';

// Icon Map for dynamic rendering in Admin
const ICON_MAP: Record<string, any> = {
    Code2, Database, Terminal, Layers, Layout: Monitor, Server, Smartphone, Globe, Cpu, Cloud,
    GitBranch, Box, Users, CheckCircle, Search, Lock, Wifi, Monitor, PenTool, Activity,
    Command, Hash, Link: LinkIcon
};

const AVAILABLE_ICONS = Object.keys(ICON_MAP);

interface Skill {
    id: string;
    name: string;
    category: string;
    display_order?: number;
}

interface Category {
    name: string;
    icon: string;
}

const DEFAULT_CATEGORIES: Category[] = [
    { name: '前端開發', icon: 'Layout' },
    { name: '後端開發', icon: 'Database' },
    { name: '工具與維運', icon: 'Terminal' },
    { name: '其他技能', icon: 'Code2' }
];

export default function SkillsTab() {
    const [skills, setSkills] = useState<Skill[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newSkill, setNewSkill] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');

    // Category Management
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [editingCatIndex, setEditingCatIndex] = useState<number | null>(null);
    const [editCatName, setEditCatName] = useState('');
    const [editCatIcon, setEditCatIcon] = useState('Code2');
    const [isAddingNew, setIsAddingNew] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const [skillsRes, profileRes] = await Promise.all([
                supabase.from('skills').select('*').order('category'),
                supabase.from('profile').select('skill_categories').eq('id', user.id).single()
            ]);

            if (skillsRes.error) throw skillsRes.error;
            setSkills(skillsRes.data || []);

            if (profileRes.data?.skill_categories && Array.isArray(profileRes.data.skill_categories)) {
                setCategories(profileRes.data.skill_categories);
                if (profileRes.data.skill_categories.length > 0) {
                    setSelectedCategory(profileRes.data.skill_categories[0].name);
                }
            } else {
                setCategories(DEFAULT_CATEGORIES);
                setSelectedCategory(DEFAULT_CATEGORIES[0].name);
            }

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddSkill = () => {
        if (!newSkill.trim() || !selectedCategory) return;

        const skill: Skill = {
            id: Math.random().toString(36).substr(2, 9),
            name: newSkill.trim(),
            category: selectedCategory
        };

        setSkills([...skills, skill]);
        setNewSkill('');
    };

    const handleRemoveSkill = (id: string) => {
        setSkills(skills.filter(s => s.id !== id));
    };

    // --- Category Management ---
    const startEditCategory = (index: number) => {
        setEditingCatIndex(index);
        setEditCatName(categories[index].name);
        setEditCatIcon(categories[index].icon || 'Code2');
        setIsAddingNew(false);
    };

    const startAddCategory = () => {
        setEditingCatIndex(null);
        setEditCatName('');
        setEditCatIcon('Code2');
        setIsAddingNew(true);
    };

    const saveCategoryEdit = async () => {
        if (!editCatName.trim()) return;

        const newCats = [...categories];

        if (isAddingNew) {
            // Add New
            if (categories.some(c => c.name === editCatName.trim())) {
                alert('Category name already exists');
                return;
            }
            newCats.push({ name: editCatName.trim(), icon: editCatIcon });
        } else if (editingCatIndex !== null) {
            // Edit Existing
            const oldName = categories[editingCatIndex].name;
            const newName = editCatName.trim();

            // Update local category list
            newCats[editingCatIndex] = { name: newName, icon: editCatIcon };

            // Update local skills list to reflect category name change
            if (oldName !== newName) {
                const updatedSkills = skills.map(s =>
                    s.category === oldName ? { ...s, category: newName } : s
                );
                setSkills(updatedSkills);

                // Also update selected category if needed
                if (selectedCategory === oldName) setSelectedCategory(newName);
            }
        }

        setCategories(newCats);
        setEditingCatIndex(null);
        setIsAddingNew(false);
    };

    const handleRemoveCategory = (name: string) => {
        if (confirm(`Delete category "${name}"? Skills in this category will be hidden until reassigned.`)) {
            setCategories(categories.filter(c => c.name !== name));
            if (selectedCategory === name) {
                setSelectedCategory(categories[0]?.name || '');
            }
        }
    };

    const moveCategory = (index: number, direction: 'up' | 'down') => {
        const newCats = [...categories];
        if (direction === 'up' && index > 0) {
            [newCats[index], newCats[index - 1]] = [newCats[index - 1], newCats[index]];
        } else if (direction === 'down' && index < newCats.length - 1) {
            [newCats[index], newCats[index + 1]] = [newCats[index + 1], newCats[index]];
        }
        setCategories(newCats);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user logged in');

            // 1. Save Categories to Profile
            const { error: profileError } = await supabase
                .from('profile')
                .update({ skill_categories: categories })
                .eq('id', user.id);

            if (profileError) {
                console.warn('Failed to save categories to profile.', profileError);
                alert(`Warning: Could not save categories. Error: ${profileError.message}`);
            }

            // 2. Save Skills (This will also save the updated category names for skills)
            const { error: deleteError } = await supabase
                .from('skills')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000');

            if (deleteError) throw deleteError;

            const skillsToInsert = skills.map(({ id, ...rest }) => rest);
            if (skillsToInsert.length > 0) {
                const { error: insertError } = await supabase
                    .from('skills')
                    .insert(skillsToInsert);

                if (insertError) throw insertError;
            }

            await fetchData();
            alert('Skills and Categories updated successfully');
        } catch (error: any) {
            console.error('Error saving:', error);
            alert(`Failed to save changes: ${error.message || 'Unknown error'}`);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center sticky top-4 z-50 bg-black/50 backdrop-blur-md p-4 rounded-xl border border-white/10">
                <Button
                    variant="flat"
                    color="secondary"
                    startContent={<Settings size={18} />}
                    onPress={onOpen}
                >
                    Manage Categories
                </Button>
                <Button
                    color="primary"
                    startContent={<Plus size={18} />}
                    isLoading={saving}
                    onPress={handleSave}
                    className="shadow-lg"
                >
                    Save Changes
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Add New Skill */}
                <div className="space-y-6">
                    <Card className="bg-white/5 border border-white/10 sticky top-24">
                        <CardHeader>
                            <h4 className="text-lg font-bold text-primary">Add New Skill</h4>
                        </CardHeader>
                        <Divider className="bg-white/10" />
                        <CardBody className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm text-default-500">Select Category</label>
                                <div className="flex flex-wrap gap-2">
                                    {categories.map(cat => (
                                        <Button
                                            key={cat.name}
                                            size="sm"
                                            variant={selectedCategory === cat.name ? "solid" : "bordered"}
                                            color={selectedCategory === cat.name ? "primary" : "default"}
                                            onPress={() => setSelectedCategory(cat.name)}
                                            className="justify-start"
                                        >
                                            {cat.name}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <Input
                                label="Skill Name"
                                placeholder="e.g. React, Python"
                                value={newSkill}
                                onValueChange={setNewSkill}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
                                variant="bordered"
                                endContent={
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        color="primary"
                                        onPress={handleAddSkill}
                                        isDisabled={!newSkill.trim() || !selectedCategory}
                                    >
                                        <Plus size={16} />
                                    </Button>
                                }
                            />
                        </CardBody>
                    </Card>
                </div>

                {/* Right Column: Skills List */}
                <div className="lg:col-span-2 space-y-6">
                    {categories.map(category => {
                        const categorySkills = skills.filter(s => s.category === category.name);
                        const Icon = ICON_MAP[category.icon] || Code2;

                        return (
                            <Card key={category.name} className="bg-white/5 border border-white/10">
                                <CardHeader className="flex gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                        <Icon size={20} />
                                    </div>
                                    <h4 className="text-lg font-bold text-white">{category.name}</h4>
                                </CardHeader>
                                <Divider className="bg-white/10" />
                                <CardBody>
                                    <div className="flex flex-wrap gap-3">
                                        {categorySkills.map(skill => (
                                            <Chip
                                                key={skill.id}
                                                onClose={() => handleRemoveSkill(skill.id)}
                                                variant="flat"
                                                color="default"
                                                classNames={{
                                                    base: "bg-white/10 hover:bg-white/20 transition-colors border border-white/5",
                                                    content: "text-white font-medium"
                                                }}
                                            >
                                                {skill.name}
                                            </Chip>
                                        ))}
                                        {categorySkills.length === 0 && (
                                            <p className="text-default-400 text-sm italic">No skills in this category yet.</p>
                                        )}
                                    </div>
                                </CardBody>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Category Management Modal */}
            <Modal
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                backdrop="blur"
                size="2xl"
                scrollBehavior="inside"
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">Manage Categories</ModalHeader>
                            <ModalBody>
                                {(editingCatIndex !== null || isAddingNew) ? (
                                    <div className="space-y-4 p-4 bg-default-50 rounded-xl border border-default-200">
                                        <h4 className="font-bold text-small uppercase text-default-500">
                                            {isAddingNew ? 'New Category' : 'Edit Category'}
                                        </h4>
                                        <div className="flex gap-4">
                                            <div className="flex-1">
                                                <Input
                                                    label="Name"
                                                    placeholder="Category Name"
                                                    value={editCatName}
                                                    onValueChange={setEditCatName}
                                                />
                                            </div>
                                            <div>
                                                <Popover placement="bottom" showArrow offset={10}>
                                                    <PopoverTrigger>
                                                        <Button
                                                            className="h-14 w-14"
                                                            variant="bordered"
                                                        >
                                                            {ICON_MAP[editCatIcon] ? (
                                                                (() => {
                                                                    const Icon = ICON_MAP[editCatIcon];
                                                                    return <Icon size={24} />;
                                                                })()
                                                            ) : <Code2 size={24} />}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-[300px] p-4">
                                                        <div className="grid grid-cols-5 gap-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                                                            {AVAILABLE_ICONS.map(iconName => {
                                                                const Icon = ICON_MAP[iconName];
                                                                return (
                                                                    <Button
                                                                        key={iconName}
                                                                        isIconOnly
                                                                        variant={editCatIcon === iconName ? "solid" : "light"}
                                                                        color={editCatIcon === iconName ? "primary" : "default"}
                                                                        onPress={() => setEditCatIcon(iconName)}
                                                                        title={iconName}
                                                                    >
                                                                        <Icon size={20} />
                                                                    </Button>
                                                                );
                                                            })}
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <Button size="sm" variant="light" onPress={() => {
                                                setEditingCatIndex(null);
                                                setIsAddingNew(false);
                                            }}>Cancel</Button>
                                            <Button size="sm" color="primary" onPress={saveCategoryEdit}>
                                                {isAddingNew ? 'Add' : 'Update'}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <Button
                                        color="primary"
                                        variant="flat"
                                        startContent={<Plus size={16} />}
                                        onPress={startAddCategory}
                                        className="mb-4"
                                    >
                                        Add New Category
                                    </Button>
                                )}

                                <div className="space-y-2">
                                    {categories.map((cat, idx) => {
                                        const Icon = ICON_MAP[cat.icon] || Code2;
                                        return (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-default-100 rounded-lg group hover:bg-default-200 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-white rounded-md shadow-sm text-default-500">
                                                        <Icon size={18} />
                                                    </div>
                                                    <span className="font-medium">{cat.name}</span>
                                                </div>
                                                <div className="flex gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                                                    <Button isIconOnly size="sm" variant="light" onPress={() => startEditCategory(idx)}>
                                                        <Edit2 size={16} />
                                                    </Button>
                                                    <Button isIconOnly size="sm" variant="light" onPress={() => moveCategory(idx, 'up')} isDisabled={idx === 0}>
                                                        <ArrowUp size={16} />
                                                    </Button>
                                                    <Button isIconOnly size="sm" variant="light" onPress={() => moveCategory(idx, 'down')} isDisabled={idx === categories.length - 1}>
                                                        <ArrowDown size={16} />
                                                    </Button>
                                                    <Button isIconOnly size="sm" color="danger" variant="light" onPress={() => handleRemoveCategory(cat.name)}>
                                                        <Trash2 size={16} />
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </ModalBody>
                            <ModalFooter>
                                <Button color="primary" onPress={onClose}>
                                    Done
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
}

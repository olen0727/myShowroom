'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Input,
    Button,
    Card,
    CardBody,
    CardHeader,
    Textarea,
    Divider,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
    Chip
} from "@nextui-org/react";
import { Plus, Trash2, Edit2, Briefcase, Calendar, Building } from 'lucide-react';

interface Experience {
    id: string;
    position: string;
    company: string;
    period: string;
    description: string;
    skills?: string[];
    display_order?: number;
}

export default function ExperienceTab() {
    const [experiences, setExperiences] = useState<Experience[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Modal State
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [currentExp, setCurrentExp] = useState<Partial<Experience>>({});

    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        fetchExperiences();
    }, []);

    const fetchExperiences = async () => {
        try {
            setErrorMsg(null);
            console.log('Fetching experiences...');
            const { data, error } = await supabase
                .from('experience')
                .select('*')
                .order('display_order', { ascending: true });

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }

            console.log('Experiences data:', data);
            setExperiences(data || []);
        } catch (error: any) {
            console.error('Error fetching experiences:', error);
            setErrorMsg(error.message || 'Failed to load experiences');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (exp: Experience) => {
        setCurrentExp(exp);
        onOpen();
    };

    const handleCreate = () => {
        setCurrentExp({});
        onOpen();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this experience?')) return;

        try {
            const { error } = await supabase
                .from('experience')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setExperiences(experiences.filter(e => e.id !== id));
        } catch (error) {
            console.error('Error deleting experience:', error);
            alert('Failed to delete experience');
        }
    };

    const handleSave = async (onClose: () => void) => {
        setSaving(true);
        try {
            // Convert comma-separated string to array if it's a string, or use as is
            let skillsArray: string[] = [];
            if (typeof currentExp.skills === 'string') {
                skillsArray = (currentExp.skills as string).split(',').map((s: string) => s.trim()).filter(Boolean);
            } else if (Array.isArray(currentExp.skills)) {
                skillsArray = currentExp.skills;
            }

            const expData = {
                position: currentExp.position,
                company: currentExp.company,
                period: currentExp.period,
                description: currentExp.description,
                skills: skillsArray
            };

            if (currentExp.id) {
                // Update
                const { error } = await supabase
                    .from('experience')
                    .update(expData)
                    .eq('id', currentExp.id);
                if (error) throw error;
            } else {
                // Insert
                const { error } = await supabase
                    .from('experience')
                    .insert([expData]);
                if (error) throw error;
            }

            await fetchExperiences();
            onClose();
        } catch (error: any) {
            console.error('Error saving experience:', error);
            alert(`Failed to save: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex justify-end sticky top-4 z-50">
                <Button
                    color="primary"
                    startContent={<Plus size={18} />}
                    onPress={handleCreate}
                    className="shadow-lg"
                >
                    Add Experience
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {errorMsg && (
                    <div className="p-4 bg-danger-50 text-danger border border-danger-200 rounded-xl">
                        Error: {errorMsg}
                        <br />
                        <span className="text-sm opacity-80">Please ensure the 'experience' table exists in your Supabase database.</span>
                    </div>
                )}
                {experiences.map((exp) => (
                    <Card key={exp.id} className="bg-white/5 border border-white/10">
                        <CardHeader className="flex justify-between items-start gap-4">
                            <div className="flex gap-4">
                                <div className="p-3 bg-primary/10 rounded-xl text-primary h-fit">
                                    <Briefcase size={24} />
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-white">{exp.position}</h4>
                                    <div className="flex items-center gap-2 text-default-400 mt-1">
                                        <Building size={14} />
                                        <span>{exp.company}</span>
                                        <span className="text-default-300">•</span>
                                        <Calendar size={14} />
                                        <span>{exp.period}</span>
                                    </div>
                                    {exp.skills && exp.skills.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {exp.skills.map((skill, idx) => (
                                                <Chip key={idx} size="sm" variant="flat" className="bg-white/10 text-default-300">
                                                    {skill}
                                                </Chip>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button isIconOnly variant="light" onPress={() => handleEdit(exp)}>
                                    <Edit2 size={18} />
                                </Button>
                                <Button isIconOnly color="danger" variant="light" onPress={() => handleDelete(exp.id)}>
                                    <Trash2 size={18} />
                                </Button>
                            </div>
                        </CardHeader>
                        <Divider className="bg-white/10" />
                        <CardBody>
                            <p className="text-default-300 whitespace-pre-line leading-relaxed">
                                {exp.description}
                            </p>
                        </CardBody>
                    </Card>
                ))}

                {experiences.length === 0 && (
                    <div className="text-center py-12 text-default-500 bg-white/5 rounded-xl border border-white/10 border-dashed">
                        <Briefcase size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No experience records found.</p>
                        <Button variant="light" color="primary" onPress={handleCreate} className="mt-2">
                            Add your first experience
                        </Button>
                    </div>
                )}
            </div>

            {/* Edit/Create Modal */}
            <Modal
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                backdrop="blur"
                size="2xl"
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader>{currentExp.id ? 'Edit Experience' : 'New Experience'}</ModalHeader>
                            <ModalBody>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Position"
                                        placeholder="e.g. Senior Frontend Engineer"
                                        value={currentExp.position || ''}
                                        onValueChange={val => setCurrentExp({ ...currentExp, position: val })}
                                        variant="bordered"
                                        startContent={<Briefcase size={16} className="text-default-400" />}
                                    />
                                    <Input
                                        label="Company"
                                        placeholder="e.g. Google"
                                        value={currentExp.company || ''}
                                        onValueChange={val => setCurrentExp({ ...currentExp, company: val })}
                                        variant="bordered"
                                        startContent={<Building size={16} className="text-default-400" />}
                                    />
                                </div>
                                <Input
                                    label="Period"
                                    placeholder="e.g. 2020 - Present"
                                    value={currentExp.period || ''}
                                    onValueChange={val => setCurrentExp({ ...currentExp, period: val })}
                                    variant="bordered"
                                    startContent={<Calendar size={16} className="text-default-400" />}
                                />
                                <Input
                                    label="Skills"
                                    placeholder="e.g. React, Node.js, Leadership (comma separated)"
                                    value={Array.isArray(currentExp.skills) ? currentExp.skills.join(', ') : (currentExp.skills || '')}
                                    onValueChange={val => setCurrentExp({ ...currentExp, skills: val as any })}
                                    variant="bordered"
                                    description="Separate skills with commas"
                                />
                                <Textarea
                                    label="Description"
                                    placeholder="Describe your responsibilities and achievements..."
                                    value={currentExp.description || ''}
                                    onValueChange={val => setCurrentExp({ ...currentExp, description: val })}
                                    variant="bordered"
                                    minRows={5}
                                />
                            </ModalBody>
                            <ModalFooter>
                                <Button variant="flat" color="danger" onPress={onClose}>
                                    Cancel
                                </Button>
                                <Button
                                    color="primary"
                                    onPress={() => handleSave(onClose)}
                                    isLoading={saving}
                                >
                                    Save
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
}

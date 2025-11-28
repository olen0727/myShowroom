'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Input,
    Button,
    Card,
    CardBody,
    CardHeader,
    Divider,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
    Popover,
    PopoverTrigger,
    PopoverContent
} from "@nextui-org/react";
import {
    Plus, Trash2, Edit2, Link as LinkIcon, Github, Linkedin, Twitter, Facebook, Instagram, Youtube, Mail, Globe
} from 'lucide-react';

// Icon Map
const ICON_MAP: Record<string, any> = {
    Github, Linkedin, Twitter, Facebook, Instagram, Youtube, Mail, Globe, Link: LinkIcon
};
const AVAILABLE_ICONS = Object.keys(ICON_MAP);

interface SocialLink {
    id: string;
    platform: string;
    url: string;
    icon: string;
    display_order?: number;
}

export default function SocialsTab() {
    const [socials, setSocials] = useState<SocialLink[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Modal State
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [currentSocial, setCurrentSocial] = useState<Partial<SocialLink>>({});

    useEffect(() => {
        fetchSocials();
    }, []);

    const fetchSocials = async () => {
        try {
            const { data, error } = await supabase
                .from('social_links')
                .select('*')
                .order('display_order', { ascending: true });

            if (error) throw error;
            setSocials(data || []);
        } catch (error) {
            console.error('Error fetching socials:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (social: SocialLink) => {
        setCurrentSocial(social);
        onOpen();
    };

    const handleCreate = () => {
        setCurrentSocial({ icon: 'Link' }); // Default icon
        onOpen();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this link?')) return;

        try {
            const { error } = await supabase
                .from('social_links')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setSocials(socials.filter(s => s.id !== id));
        } catch (error) {
            console.error('Error deleting social link:', error);
            alert('Failed to delete link');
        }
    };

    const handleSave = async (onClose: () => void) => {
        setSaving(true);
        try {
            const socialData = {
                platform: currentSocial.platform,
                url: currentSocial.url,
                icon: currentSocial.icon,
            };

            if (currentSocial.id) {
                // Update
                const { error } = await supabase
                    .from('social_links')
                    .update(socialData)
                    .eq('id', currentSocial.id);
                if (error) throw error;
            } else {
                // Insert
                const { error } = await supabase
                    .from('social_links')
                    .insert([socialData]);
                if (error) throw error;
            }

            await fetchSocials();
            onClose();
        } catch (error: any) {
            console.error('Error saving social link:', error);
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
                    Add Social Link
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {socials.map((social) => {
                    const Icon = ICON_MAP[social.icon] || LinkIcon;
                    return (
                        <Card key={social.id} className="bg-white/5 border border-white/10">
                            <CardBody className="flex flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-4 overflow-hidden">
                                    <div className="p-3 bg-white/10 rounded-full text-white shrink-0">
                                        <Icon size={24} />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-lg font-bold text-white truncate">{social.platform}</h4>
                                        <a
                                            href={social.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-primary truncate block hover:underline"
                                        >
                                            {social.url}
                                        </a>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1 shrink-0">
                                    <Button isIconOnly size="sm" variant="light" onPress={() => handleEdit(social)}>
                                        <Edit2 size={16} />
                                    </Button>
                                    <Button isIconOnly size="sm" color="danger" variant="light" onPress={() => handleDelete(social.id)}>
                                        <Trash2 size={16} />
                                    </Button>
                                </div>
                            </CardBody>
                        </Card>
                    );
                })}

                {socials.length === 0 && (
                    <div className="col-span-full text-center py-12 text-default-500 bg-white/5 rounded-xl border border-white/10 border-dashed">
                        <LinkIcon size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No social links added yet.</p>
                        <Button variant="light" color="primary" onPress={handleCreate} className="mt-2">
                            Add your first link
                        </Button>
                    </div>
                )}
            </div>

            {/* Edit/Create Modal */}
            <Modal
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                backdrop="blur"
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader>{currentSocial.id ? 'Edit Link' : 'New Link'}</ModalHeader>
                            <ModalBody>
                                <div className="flex gap-4">
                                    <div className="shrink-0">
                                        <label className="block text-small font-medium text-default-500 mb-2">Icon</label>
                                        <Popover placement="bottom" showArrow offset={10}>
                                            <PopoverTrigger>
                                                <Button
                                                    className="h-14 w-14"
                                                    variant="bordered"
                                                >
                                                    {ICON_MAP[currentSocial.icon || 'Link'] ? (
                                                        (() => {
                                                            const Icon = ICON_MAP[currentSocial.icon || 'Link'];
                                                            return <Icon size={24} />;
                                                        })()
                                                    ) : <LinkIcon size={24} />}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[260px] p-4">
                                                <div className="grid grid-cols-4 gap-2">
                                                    {AVAILABLE_ICONS.map(iconName => {
                                                        const Icon = ICON_MAP[iconName];
                                                        return (
                                                            <Button
                                                                key={iconName}
                                                                isIconOnly
                                                                variant={currentSocial.icon === iconName ? "solid" : "light"}
                                                                color={currentSocial.icon === iconName ? "primary" : "default"}
                                                                onPress={() => setCurrentSocial({ ...currentSocial, icon: iconName })}
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
                                    <div className="flex-1 space-y-4">
                                        <Input
                                            label="Platform"
                                            placeholder="e.g. GitHub"
                                            value={currentSocial.platform || ''}
                                            onValueChange={val => setCurrentSocial({ ...currentSocial, platform: val })}
                                            variant="bordered"
                                        />
                                        <Input
                                            label="URL"
                                            placeholder="https://..."
                                            value={currentSocial.url || ''}
                                            onValueChange={val => setCurrentSocial({ ...currentSocial, url: val })}
                                            variant="bordered"
                                        />
                                    </div>
                                </div>
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

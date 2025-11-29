'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Input,
    Textarea,
    Button,
    Card,
    CardBody,
    CardHeader,
    Avatar,
    Chip,
    Divider,
    Spacer
} from "@nextui-org/react";
import { Save, Plus, X, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface Profile {
    id: string;
    full_name: string;
    email: string;
    location: string;
    avatar_url: string;
    resume_url: string;
    bio: string;
    // Hero Section
    hero_title: string;
    hero_subtitle_prefix: string;
    hero_subtitle_suffix: string;
    hero_roles: string[];
}

export default function ProfileTab() {
    const [profile, setProfile] = useState<Partial<Profile>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [roleInput, setRoleInput] = useState("");
    const [roleColor, setRoleColor] = useState("#3b82f6");

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('profile')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            if (data) setProfile(data);
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user logged in');

            const { error } = await supabase
                .from('profile')
                .upsert({
                    id: user.id,
                    ...profile,
                    updated_at: new Date().toISOString(),
                });

            if (error) throw error;
            toast.success('Profile updated successfully');
        } catch (error: any) {
            console.error('Error saving profile:', error);
            toast.error(`Failed to save profile: ${error.message || error.details || 'Unknown error'}`);
        } finally {
            setSaving(false);
        }
    };

    const handleAddRole = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && roleInput.trim()) {
            e.preventDefault();
            const newRoles = [...(profile.hero_roles || []), `${roleInput.trim()}|${roleColor}`];
            setProfile({ ...profile, hero_roles: newRoles });
            setRoleInput("");
        }
    };

    const removeRole = (roleToRemove: string) => {
        const newRoles = profile.hero_roles?.filter(r => r !== roleToRemove);
        setProfile({ ...profile, hero_roles: newRoles });
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex justify-end sticky top-4 z-50">
                <Button
                    color="primary"
                    startContent={<Save size={18} />}
                    isLoading={saving}
                    onPress={handleSave}
                    className="shadow-lg"
                >
                    Save Changes
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Basic Info */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="bg-white/5 border border-white/10">
                        <CardHeader className="pb-0 pt-6 px-4 flex-col items-center">
                            <div className="relative">
                                <Avatar
                                    src={profile.avatar_url}
                                    className="w-32 h-32 text-large"
                                    isBordered
                                    color="primary"
                                />
                                {/* In a real app, add file upload here */}
                            </div>
                            <Spacer y={2} />
                            <p className="text-tiny text-default-500">Profile Picture</p>
                        </CardHeader>
                        <CardBody className="space-y-4">
                            <Input
                                label="Avatar URL"
                                placeholder="https://..."
                                value={profile.avatar_url || ''}
                                onValueChange={val => setProfile({ ...profile, avatar_url: val })}
                                variant="bordered"
                                size="sm"
                            />
                            <Input
                                label="Full Name"
                                value={profile.full_name || ''}
                                onValueChange={val => setProfile({ ...profile, full_name: val })}
                                variant="bordered"
                            />
                            <Input
                                label="Email"
                                value={profile.email || ''}
                                onValueChange={val => setProfile({ ...profile, email: val })}
                                variant="bordered"
                            />
                            <Input
                                label="Location"
                                value={profile.location || ''}
                                onValueChange={val => setProfile({ ...profile, location: val })}
                                variant="bordered"
                            />
                            <Input
                                label="Resume URL"
                                placeholder="Link to PDF"
                                value={profile.resume_url || ''}
                                onValueChange={val => setProfile({ ...profile, resume_url: val })}
                                variant="bordered"
                                startContent={<Upload size={16} className="text-default-400" />}
                            />
                        </CardBody>
                    </Card>
                </div>

                {/* Right Column: Hero & Bio */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-white/5 border border-white/10">
                        <CardHeader>
                            <h4 className="text-lg font-bold text-primary">Hero Section Configuration</h4>
                        </CardHeader>
                        <Divider className="bg-white/10" />
                        <CardBody className="space-y-6">
                            <Textarea
                                label="Hero Title (HTML supported)"
                                placeholder="e.g. Building <br/> Digital Experiences"
                                value={profile.hero_title || ''}
                                onValueChange={val => setProfile({ ...profile, hero_title: val })}
                                variant="bordered"
                                description="Use <br/> for line breaks."
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Subtitle Prefix"
                                    placeholder="I am a"
                                    value={profile.hero_subtitle_prefix || ''}
                                    onValueChange={val => setProfile({ ...profile, hero_subtitle_prefix: val })}
                                    variant="bordered"
                                />
                                <Input
                                    label="Subtitle Suffix"
                                    placeholder=", passionate about..."
                                    value={profile.hero_subtitle_suffix || ''}
                                    onValueChange={val => setProfile({ ...profile, hero_subtitle_suffix: val })}
                                    variant="bordered"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <Input
                                        label="Rotating Roles"
                                        placeholder="Type and press Enter (e.g. Frontend Dev)"
                                        value={roleInput}
                                        onValueChange={setRoleInput}
                                        onKeyDown={handleAddRole}
                                        variant="bordered"
                                        className="flex-1"
                                    />
                                    <div className="flex flex-col gap-1">
                                        <label className="text-tiny text-default-500">Color</label>
                                        <input
                                            type="color"
                                            value={roleColor}
                                            onChange={(e) => setRoleColor(e.target.value)}
                                            className="h-10 w-14 rounded cursor-pointer border border-white/20 bg-transparent p-1"
                                        />
                                    </div>
                                    <Button isIconOnly className="mt-auto h-10" onPress={() => {
                                        if (roleInput.trim()) {
                                            const newRoles = [...(profile.hero_roles || []), `${roleInput.trim()}|${roleColor}`];
                                            setProfile({ ...profile, hero_roles: newRoles });
                                            setRoleInput("");
                                        }
                                    }}>
                                        <Plus size={18} />
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {profile.hero_roles?.map((role, idx) => {
                                        const [text, color] = role.split('|');
                                        return (
                                            <Chip
                                                key={idx}
                                                onClose={() => removeRole(role)}
                                                variant="flat"
                                                className="border"
                                                style={{
                                                    borderColor: color || 'var(--nextui-colors-secondary)',
                                                    color: color || 'inherit'
                                                }}
                                            >
                                                <span className="flex items-center gap-2">
                                                    {color && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />}
                                                    {text}
                                                </span>
                                            </Chip>
                                        );
                                    })}
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="bg-white/5 border border-white/10">
                        <CardHeader>
                            <h4 className="text-lg font-bold text-primary">About Me</h4>
                        </CardHeader>
                        <Divider className="bg-white/10" />
                        <CardBody>
                            <Textarea
                                label="Bio"
                                placeholder="Tell your story..."
                                value={profile.bio || ''}
                                onValueChange={val => setProfile({ ...profile, bio: val })}
                                variant="bordered"
                                minRows={6}
                            />
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
}

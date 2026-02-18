import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Plus, Edit, X, Save } from 'lucide-react';
import { createLocation, getLocations } from '@/database/simple-db';
import toast from 'react-hot-toast';
import { useLocale } from '@/i18n/useLocale';

interface Location {
    id?: number;
    name: string;
    code: string;
    address?: string;
    description?: string;
    active?: boolean;
}

export const LocationsManager: React.FC = () => {
    const { t } = useLocale();
    const [locations, setLocations] = useState<Location[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<Location>({ name: '', code: '' });

    useEffect(() => {
        loadLocations();
    }, []);

    const loadLocations = () => {
        try {
            const data = getLocations();
            setLocations(data);
        } catch (err) {
            toast.error(t('inv.locations.errorLoadingLocations'));
        }
    };

    const handleSave = () => {
        if (!form.name || !form.code) {
            toast.error(t('inv.locations.nameCodeRequired'));
            return;
        }
        try {
            createLocation(form);
            toast.success(t('inv.locations.locationCreated'));
            setShowForm(false);
            setForm({ name: '', code: '' });
            loadLocations();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                    <MapPin className="w-8 h-8 text-blue-500" />
                    {t('inv.locations.title')}
                </h2>
                <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl">
                    <Plus className="w-4 h-4 mr-2" />
                    {t('inv.locations.newLocation')}
                </Button>
            </div>

            {showForm && (
                <Card className="bg-slate-900 border-blue-500/30 text-white max-w-lg">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold">{t('inv.locations.newLocationTitle')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1">
                            <Label className="text-slate-500">{t('inv.locations.name')}</Label>
                            <Input
                                placeholder={t('inv.locations.nameExample')}
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                className="bg-white/10 border-white/10 text-white"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-slate-500">{t('inv.locations.codeUnique')}</Label>
                            <Input
                                placeholder={t('inv.locations.codeExample')}
                                value={form.code}
                                onChange={e => setForm({ ...form, code: e.target.value })}
                                className="bg-white/10 border-white/10 text-white font-mono"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-slate-500">{t('inv.locations.address')}</Label>
                            <Input
                                placeholder={t('inv.locations.addressPlaceholder')}
                                value={form.address || ''}
                                onChange={e => setForm({ ...form, address: e.target.value })}
                                className="bg-white/10 border-white/10 text-white"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-slate-500">{t('inv.locations.description')}</Label>
                            <Input
                                placeholder={t('inv.locations.descriptionPlaceholder')}
                                value={form.description || ''}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                className="bg-white/10 border-white/10 text-white"
                            />
                        </div>
                        <div className="flex gap-2 pt-2">
                            <Button onClick={handleSave} className="flex-1 bg-green-600 hover:bg-green-700">
                                <Save className="w-4 h-4 mr-2" /> {t('inv.locations.saveLocation')}
                            </Button>
                            <Button variant="ghost" onClick={() => { setShowForm(false); setForm({ name: '', code: '' }); }} className="flex-1 text-slate-400">
                                <X className="w-4 h-4 mr-2" /> {t('inv.locations.cancel')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {locations.length === 0 ? (
                    <div className="col-span-full text-center py-12">
                        <MapPin className="w-12 h-12 text-slate-800 mx-auto mb-3" />
                        <p className="text-slate-500">{t('inv.locations.noLocations')}</p>
                    </div>
                ) : (
                    locations.map(loc => (
                        <Card key={loc.id} className="bg-slate-900 border-slate-800 text-white hover:border-blue-500/30 transition-colors group">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h4 className="font-bold text-white">{loc.name}</h4>
                                        <p className="text-xs text-blue-400 font-mono mt-0.5">{loc.code}</p>
                                    </div>
                                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-black uppercase">
                                        {t('inv.locations.active')}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-400 mt-3">{loc.address || t('inv.locations.noAddress')}</p>
                                {loc.description && <p className="text-xs text-slate-500 mt-1 italic">{loc.description}</p>}
                                <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-blue-400 text-xs">
                                        <Edit className="w-3 h-3 mr-1" /> {t('inv.locations.edit')}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

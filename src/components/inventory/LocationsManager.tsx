import { logger } from '../../core/logging/SystemLogger';
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Plus, Edit, X, Save } from 'lucide-react';
import { createLocation, getLocations } from '@/database/modules/db-inventory';
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
            logger.error('LocationsManager', 'error', err);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3 leading-none">
                    <MapPin className="w-8 h-8 text-blue-500" />
                    {t('inv.locations.title')}
                </h1>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    {t('inv.locations.newLocation')}
                </button>
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
                        <div className="flex gap-4 pt-2">
                            <button
                                onClick={handleSave}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold transition-all shadow-lg active:scale-95"
                            >
                                <Save className="w-4 h-4" /> {t('inv.locations.saveLocation')}
                            </button>
                            <button
                                onClick={() => { setShowForm(false); setForm({ name: '', code: '' }); }}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl font-bold transition-all active:scale-95"
                            >
                                <X className="w-4 h-4" /> {t('inv.locations.cancel')}
                            </button>
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
                                    <button
                                        onClick={() => { setForm(loc); setShowForm(true); }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-all active:scale-95"
                                    >
                                        <Edit className="w-3.5 h-3.5" /> {t('inv.locations.edit')}
                                    </button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

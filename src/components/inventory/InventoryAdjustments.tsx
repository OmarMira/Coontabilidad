import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Assuming existence or standard HTML
import { Label } from '@/components/ui/label'; // Assuming existence or standard HTML
import { ClipboardEdit, Save, X } from 'lucide-react';
import { useLocale } from '@/i18n/useLocale';

export const InventoryAdjustments: React.FC = () => {
    const { t } = useLocale();
    const [reason, setReason] = useState('');
    const [sku, setSku] = useState('');
    const [diff, setDiff] = useState(0);

    return (
        <Card className="bg-slate-900 border-white/5 text-white max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ClipboardEdit className="w-5 h-5 text-orange-400" />
                    {t('inv.adjustments.title')}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-1">
                    <Label className="text-slate-500">{t('inv.adjustments.adjustmentReason')}</Label>
                    <select
                        className="w-full bg-white/10 border-white/10 rounded p-2 text-white"
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                    >
                        <option value="">{t('inv.adjustments.selectOption')}</option>
                        <option value="damage">{t('inv.adjustments.damagedGoods')}</option>
                        <option value="theft">{t('inv.adjustments.theftLoss')}</option>
                        <option value="count">{t('inv.adjustments.cyclicCount')}</option>
                        <option value="expired">{t('inv.adjustments.expiredProduct')}</option>
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <Label className="text-slate-500">{t('inv.adjustments.skuProduct')}</Label>
                        <input
                            placeholder={t('inv.adjustments.searchProduct')}
                            className="w-full bg-white/10 border-white/10 rounded p-2 text-white"
                            value={sku}
                            onChange={e => setSku(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-slate-500">{t('inv.adjustments.difference')}</Label>
                        <input
                            type="number"
                            className="w-full bg-white/10 border-white/10 rounded p-2 text-white font-mono"
                            value={diff}
                            onChange={e => setDiff(Number(e.target.value))}
                        />
                        <p className="text-xs text-slate-600">
                            {t('inv.adjustments.differenceHelp')}
                        </p>
                    </div>
                </div>

                <div className="bg-orange-900/20 p-3 rounded border border-orange-800/50">
                    <p className="text-xs text-orange-300">
                        {t('inv.adjustments.warningMessage')}
                    </p>
                </div>

                <div className="flex gap-2 pt-2">
                    <Button className="flex-1 bg-green-600 hover:bg-green-700">
                        <Save className="w-4 h-4 mr-2" />
                        {t('inv.adjustments.saveAdjustment')}
                    </Button>
                    <Button variant="ghost" className="flex-1">
                        <X className="w-4 h-4 mr-2" />
                        {t('inv.adjustments.cancel')}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};



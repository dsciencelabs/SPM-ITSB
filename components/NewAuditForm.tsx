import React, { useState } from 'react';
import { AuditStandard, AuditSession, AuditStatus } from '../types';
import { generateChecklist } from '../services/geminiService';
import { Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

interface NewAuditFormProps {
  onAuditCreated: (audit: AuditSession) => void;
  onCancel: () => void;
}

const NewAuditForm: React.FC<NewAuditFormProps> = ({ onAuditCreated, onCancel }) => {
  const { t } = useLanguage();
  const [department, setDepartment] = useState('');
  const [standard, setStandard] = useState<AuditStandard>(AuditStandard.BAN_PT);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!department) return;

    setIsLoading(true);

    try {
      const questions = await generateChecklist(standard, department);

      const newAudit: AuditSession = {
        id: Date.now().toString(),
        name: `Audit ${department} - ${new Date().getFullYear()}`,
        department,
        standard,
        status: AuditStatus.IN_PROGRESS,
        date: new Date().toISOString(),
        questions,
      };

      onAuditCreated(newAudit);
    } catch (error) {
      alert(t('new.error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
              <Sparkles size={24} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">{t('new.title')}</h2>
          </div>
          <p className="text-slate-500 ml-12">
            {t('new.subtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t('new.label.dept')}
            </label>
            <input
              type="text"
              required
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder={t('new.placeholder.dept')}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t('new.label.std')}
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.values(AuditStandard).map((std) => (
                <div
                  key={std}
                  onClick={() => setStandard(std)}
                  className={`cursor-pointer rounded-xl p-4 border-2 transition-all ${
                    standard === std
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${standard === std ? 'border-blue-500' : 'border-slate-300'}`}>
                      {standard === std && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                    </div>
                  </div>
                  <span className="font-medium text-sm">{std}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              disabled={isLoading}
            >
              {t('new.btn.cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {t('new.btn.generate')}
                </>
              ) : (
                <>
                  {t('new.btn.start')}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewAuditForm;
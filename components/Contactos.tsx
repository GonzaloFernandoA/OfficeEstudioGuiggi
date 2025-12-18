import React, { useState } from 'react';
import Section from './Section';
import InputField from './InputField';

type ContactForm = {
  nombreCompleto: string;
  telefono: string;
  mail: string;
};

const emptyForm = (): ContactForm => ({
  nombreCompleto: '',
  telefono: '',
  mail: '',
});

const Contactos: React.FC = () => {
  const [form, setForm] = useState<ContactForm>(emptyForm());
  const [errors, setErrors] = useState<Record<string,string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string,string> = {};
    if (!form.nombreCompleto.trim()) newErrors.nombreCompleto = 'Requerido';
    if (form.telefono && !/^\+?[\d\s\(\)-]{7,}$/.test(form.telefono)) newErrors.telefono = 'Formato de teléfono inválido';
    if (form.mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.mail)) newErrors.mail = 'Email inválido';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!validate()) return;
    // guardado demo: podés adaptar para persistir en localStorage o backend
    alert('Contacto guardado (demo).');
    setForm(emptyForm());
  };

  return (
    <Section title="Setup - Contactos" description="Gestione contactos (nombre y apellido, teléfono, mail).">
      <form onSubmit={handleSave} className="md:col-span-3 lg:col-span-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputField label="Nombre y Apellido" name="nombreCompleto" value={form.nombreCompleto} onChange={handleChange} error={errors.nombreCompleto} required />
          <InputField label="Teléfono" name="telefono" type="tel" value={form.telefono} onChange={handleChange} error={errors.telefono} />
          <InputField label="Mail" name="mail" type="email" value={form.mail} onChange={handleChange} error={errors.mail} />
        </div>

        <div className="mt-4 flex items-center space-x-3">
          <button type="submit" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
            Guardar Contacto
          </button>
          <button type="button" onClick={() => setForm(emptyForm())} className="px-4 py-2 rounded-md bg-slate-100 border border-slate-300 text-sm">
            Cancelar
          </button>
        </div>
      </form>
    </Section>
  );
};

export default Contactos;
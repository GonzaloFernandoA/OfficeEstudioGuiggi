import React, { useState } from 'react';
import Section from './Section';
import InputField from './InputField';
import { apiClient } from '../services/apiClient';

type ContactForm = {
    nombre: string;
    apellido: string;
    telefono: string;
    mail: string;
};

const emptyForm = (): ContactForm => ({
    nombre: '',
    apellido: '',
    telefono: '',
    mail: '',
});

const Contactos: React.FC = () => {
    const [form, setForm] = useState<ContactForm>(emptyForm());
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!form.nombre.trim()) newErrors.nombre = 'Requerido';
        if (!form.apellido.trim()) newErrors.apellido = 'Requerido';
        if (!form.mail.trim()) newErrors.mail = 'Requerido';
        if (!form.telefono.trim()) newErrors.telefono = 'Requerido';

        if (form.telefono && !/^\+?[\d\s\(\)-]{7,}$/.test(form.telefono)) newErrors.telefono = 'Formato de teléfono inválido';
        if (form.mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.mail)) newErrors.mail = 'Email inválido';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!validate()) return;

        setLoading(true);
        setMessage(null);

        try {
            const response = await apiClient.post('/contactos', {
                Nombre: form.nombre.trim(),
                Apellido: form.apellido.trim(),
                Mail: form.mail.trim(),
                Telefono: form.telefono.trim(),
            });

            if (response.error) {
                throw new Error(response.error);
            }

            setMessage({ type: 'success', text: 'Contacto guardado exitosamente.' });
            setForm(emptyForm());
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido al guardar el contacto.';
            setMessage({ type: 'error', text: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Section title="Setup - Contactos" description="Gestione contactos (nombre, apellido, teléfono, mail).">
            <form onSubmit={handleSave} className="md:col-span-3 lg:col-span-3">
                {message && (
                    <div className={`mb-4 p-3 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        <p className="font-semibold">{message.type === 'success' ? '✅' : '❌'} {message.text}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <InputField
                        label="Nombre"
                        name="nombre"
                        value={form.nombre}
                        onChange={handleChange}
                        error={errors.nombre}
                        required
                    />
                    <InputField
                        label="Apellido"
                        name="apellido"
                        value={form.apellido}
                        onChange={handleChange}
                        error={errors.apellido}
                        required
                    />
                    <InputField
                        label="Mail"
                        name="mail"
                        type="email"
                        value={form.mail}
                        onChange={handleChange}
                        error={errors.mail}
                        required
                    />
                    <InputField
                        label="Teléfono"
                        name="telefono"
                        type="tel"
                        value={form.telefono}
                        onChange={handleChange}
                        error={errors.telefono}
                        required
                    />
                </div>

                <div className="mt-4 flex items-center space-x-3">
                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Guardando...' : 'Guardar Contacto'}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setForm(emptyForm());
                            setMessage(null);
                        }}
                        className="px-4 py-2 rounded-md bg-slate-100 border border-slate-300 text-sm"
                    >
                        Cancelar
                    </button>
                </div>
            </form>
        </Section>
    );
};

export default Contactos;
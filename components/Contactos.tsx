import React, { useEffect, useState } from 'react';
import Section from './Section';
import InputField from './InputField';

interface Contact {
  id: number;
  apellido: string;
  nombre: string;
  telefono: string;
  mail: string;
}

const STORAGE_KEY = 'contactos';

const empty = (): Contact => ({
  id: Date.now(),
  apellido: '',
  nombre: '',
  telefono: '',
  mail: '',
});

const Contactos: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [form, setForm] = useState<Contact>(empty());
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setContacts(JSON.parse(raw));
    } catch (err) {
      console.error('No se pudieron cargar contactos:', err);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
    } catch (err) {
      console.error('No se pudieron guardar contactos:', err);
    }
  }, [contacts]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target as HTMLInputElement;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm(empty());
    setEditingId(null);
  };

  const handleSave = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!form.apellido.trim() && !form.nombre.trim()) {
      alert('Ingrese apellido o nombre.');
      return;
    }

    if (editingId) {
      setContacts(prev => prev.map(c => (c.id === editingId ? { ...form, id: editingId } : c)));
    } else {
      setContacts(prev => [{ ...form, id: Date.now() }, ...prev]);
    }
    resetForm();
  };

  const handleEdit = (id: number) => {
    const c = contacts.find(x => x.id === id);
    if (!c) return;
    setForm({ ...c });
    setEditingId(id);
  };

  const handleDelete = (id: number) => {
    if (!confirm('¿Eliminar contacto?')) return;
    setContacts(prev => prev.filter(c => c.id !== id));
    if (editingId === id) resetForm();
  };

  return (
    <Section title="Setup - Contactos" description="Gestione contactos (apellido, nombre, telefono, mail).">
      <form onSubmit={handleSave} className="md:col-span-3 lg:col-span-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <InputField label="Apellido" name="apellido" value={form.apellido} onChange={handleChange} required />
          <InputField label="Nombre" name="nombre" value={form.nombre} onChange={handleChange} />
          <InputField label="Telefono" name="telefono" value={form.telefono} onChange={handleChange} type="tel" />
          <InputField label="Mail" name="mail" value={form.mail} onChange={handleChange} type="email" />
        </div>

        <div className="mt-4 flex items-center space-x-3">
          <button type="submit" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
            {editingId ? 'Actualizar Contacto' : 'Agregar Contacto'}
          </button>
          <button type="button" onClick={resetForm} className="px-4 py-2 rounded-md bg-slate-100 border border-slate-300 text-sm">
            Cancelar
          </button>
        </div>
      </form>

      <div className="md:col-span-3 lg:col-span-3 mt-6">
        <h3 className="text-lg font-semibold text-slate-700 mb-4">Contactos guardados</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {contacts.length === 0 ? (
            <div className="col-span-3 bg-slate-50 p-6 rounded-lg border border-slate-200 text-slate-600">
              No hay contactos.
            </div>
          ) : (
            contacts.map(c => (
              <div key={c.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <h4 className="text-sm font-semibold text-slate-800 truncate">{c.apellido} {c.nombre}</h4>
                {c.telefono && <p className="text-sm text-slate-700 mt-2">Tel: {c.telefono}</p>}
                {c.mail && <p className="text-sm text-slate-700">Mail: {c.mail}</p>}
                <div className="mt-4 flex justify-end space-x-2">
                  <button onClick={() => handleEdit(c.id)} className="px-3 py-1 text-sm bg-white border border-slate-300 rounded text-blue-600">Editar</button>
                  <button onClick={() => handleDelete(c.id)} className="px-3 py-1 text-sm bg-red-600 text-white rounded">Eliminar</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Section>
  );
};

export default Contactos;
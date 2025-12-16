import React from 'react';

interface SectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, description, children }) => {
  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg mb-8">
      <h2 className="text-2xl font-bold text-slate-800 mb-1">{title}</h2>
      {description && <p className="text-sm text-slate-500 mb-6">{description}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
        {children}
      </div>
    </div>
  );
};

export default Section;

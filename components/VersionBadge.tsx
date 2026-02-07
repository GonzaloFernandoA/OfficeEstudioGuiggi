import React from 'react';
import { BUILD_VERSION } from '../buildInfo';

const VersionBadge: React.FC = () => {
    return (
        <div aria-label="Versión de build" title={BUILD_VERSION} className="absolute right-4 top-2 text-xs text-slate-600 bg-white/80 px-2 py-0.5 rounded-md shadow-sm">
            {BUILD_VERSION}
        </div>
    );
};

export default VersionBadge;


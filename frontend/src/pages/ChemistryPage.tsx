import React from 'react';
import { ChemistrySim } from '../components/chemistry';

/**
 * Chemistry Demo Page
 * 
 * Full-screen interactive Acids, Bases, and Salts simulation
 */
const ChemistryPage: React.FC = () => {
    return (
        <div className="h-screen w-screen overflow-hidden">
            <ChemistrySim />
        </div>
    );
};

export default ChemistryPage;

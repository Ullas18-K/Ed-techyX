import React from 'react';
import { GeometricOptics } from '../components/optics';

/**
 * Geometric Optics Demo Page
 * 
 * Full-screen interactive geometric optics simulation
 */
const GeometricOpticsPage: React.FC = () => {
  return (
    <div className="h-screen w-screen overflow-hidden">
      <GeometricOptics />
    </div>
  );
};

export default GeometricOpticsPage;

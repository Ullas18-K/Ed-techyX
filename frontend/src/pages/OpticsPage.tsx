import React from 'react';
import { GeometricOptics } from '@/components/optics';

/**
 * Geometric Optics Page
 * 
 * Full-screen interactive geometric optics simulation
 * After completion, navigates to /simulation
 */
const OpticsPage: React.FC = () => {
  return (
    <div className="h-screen w-screen overflow-hidden">
      <GeometricOptics />
    </div>
  );
};

export default OpticsPage;

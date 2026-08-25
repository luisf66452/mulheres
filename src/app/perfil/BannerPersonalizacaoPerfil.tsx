'use client';

import { useState } from 'react';
import BannerPersonalizacao from '@/app/components/personalizacao/BannerPersonalizacao';

export default function BannerPersonalizacaoPerfil() {
  const [dispensado, setDispensado] = useState(false);
  if (dispensado) return null;
  return <BannerPersonalizacao aoDispensar={() => setDispensado(true)} />;
}

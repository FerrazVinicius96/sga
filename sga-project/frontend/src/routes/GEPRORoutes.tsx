import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import GEPROLayout from '../components/gepro/GEPROLayout';
import GEPRODashboard from '../components/gepro/GEPRODashboard';
import DemandaDetail from '../components/gepro/DemandaDetail';
import Fase2Page from '../components/gepro/Fase2Page';
import Fase4Page from '../components/gepro/Fase4Page';
import EmConstrucao from '../components/gepro/EmConstrucao';

export default function GEPRORoutes() {
  return (
    <Routes>
      <Route element={<GEPROLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard"              element={<GEPRODashboard />} />
        <Route path="demandas"               element={<EmConstrucao />} />
        <Route path="demandas/:id"           element={<DemandaDetail />} />
        <Route path="demandas/:id/fase2"     element={<Fase2Page />} />
        <Route path="demandas/:id/fase4"     element={<Fase4Page />} />
        <Route path="meus-processos"         element={<EmConstrucao />} />
        <Route path="relatorios"             element={<EmConstrucao />} />
        <Route path="usuarios"               element={<EmConstrucao />} />
        <Route path="fornecedores"           element={<EmConstrucao />} />
        <Route path="configuracoes"          element={<EmConstrucao />} />
        <Route path="*"                      element={<EmConstrucao />} />
      </Route>
    </Routes>
  );
}

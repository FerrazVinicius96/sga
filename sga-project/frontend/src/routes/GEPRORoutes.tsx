import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import GEPROLayout from '../views/gepro/GEPROLayout';
import GEPRODashboard from '../views/gepro/GEPRODashboard';
import DemandaDetail from '../views/gepro/DemandaDetail';
import Fase2Page from '../views/gepro/Fase2Page';
import Fase4Page from '../views/gepro/Fase4Page';
import EmConstrucao from '../views/gepro/EmConstrucao';
import DemandasPage from '../views/gepro/DemandasPage';
import MeusProcessosPage from '../views/gepro/MeusProcessosPage';
import RelatoriosPage from '../views/gepro/RelatoriosPage';
import UsuariosPage from '../views/gepro/UsuariosPage';
import FornecedoresPage from '../views/gepro/FornecedoresPage';
import ConfiguracoesPage from '../views/gepro/ConfiguracoesPage';

export default function GEPRORoutes() {
  return (
    <Routes>
      <Route element={<GEPROLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard"              element={<GEPRODashboard />} />
        <Route path="demandas"               element={<DemandasPage />} />
        <Route path="demandas/:id"           element={<DemandaDetail />} />
        <Route path="demandas/:id/fase2"     element={<Fase2Page />} />
        <Route path="demandas/:id/fase4"     element={<Fase4Page />} />
        <Route path="meus-processos"         element={<MeusProcessosPage />} />
        <Route path="relatorios"             element={<RelatoriosPage />} />
        <Route path="usuarios"               element={<UsuariosPage />} />
        <Route path="fornecedores"           element={<FornecedoresPage />} />
        <Route path="configuracoes"          element={<ConfiguracoesPage />} />
        <Route path="*"                      element={<EmConstrucao />} />
      </Route>
    </Routes>
  );
}

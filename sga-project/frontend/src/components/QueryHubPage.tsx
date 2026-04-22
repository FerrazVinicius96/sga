import React, { useState } from 'react';
import axios from 'axios';
import { 
  Search, Calendar, Filter, FileText, Download, Smartphone, 
  Cpu, User, MapPin, List, History as HistoryIcon, GraduationCap, 
  FileCheck, BarChart, ArrowLeft, PackageCheck, ChevronDown, ChevronRight, AlertCircle, CheckCircle2, Paperclip, Printer
} from 'lucide-react';
import { useToast } from '../App'; 

// --- INTERFACES ---

interface UnitDossier {
    unit: { name: string; type: string; code: string };
    year: string;
    // Arrays brutos mantidos para compatibilidade, mas não usados no cálculo principal
    current_inventory: any[]; 
    history: any[];
    
    // ESTATÍSTICAS PROCESSADAS (AQUI ESTÁ A CORREÇÃO V4)
    stats: {
        item_type: string;
        total_quantity: number;
        total_loans: number;
        total_exits: number;
        currently_active: number;   // Saldo Real
        currently_loaned: number;   // Empréstimo Real
        overdue_loans: number;      // Vencidos Real
        returned_count: number;     // Devolvidos Real
        
        // LISTAS JÁ PROCESSADAS PELO BACKEND (EVITA ERRO DE FILTRO NO FRONT)
        _details?: {
            loans: any[];
            exits: any[];
            returns: any[];
        };
    }[];
}

interface QueryHubProps {
  people: any[];
  units: any[];
  API_URL: string;
  translateMovementType: (type: string) => string;
  translateStatus: (status: string) => string;
  onRenewClick: (mov: any) => void;
  onSubstituteClick: (mov: any) => void;
  onReturnClick: (mov: any) => void;
  userRole?: string;
  handleGenerateMovementReceipt: (id: number) => void;
}

const QueryHubPage: React.FC<QueryHubProps> = ({ 
    people, units, API_URL, translateMovementType, translateStatus, 
    onRenewClick, onSubstituteClick, onReturnClick, userRole, handleGenerateMovementReceipt 
}) => {
  
  // Controle de Abas
  const [activeTab, setActiveTab] = useState<'movements' | 'assets' | 'people' | 'units' | 'students' | 'batch_receipts'>('students');
  const { addToast } = useToast();

  // --- ESTADOS DE FILTRO (MOVIMENTAÇÕES) ---
  const [movFilters, setMovFilters] = useState({ startDate: '', endDate: '', movementType: '', patrimonio: '', imei: '', chip: '', solicitante: '' });
  const [movementResults, setMovementResults] = useState<any[]>([]);
  const [loadingMov, setLoadingMov] = useState(false);

  // --- ESTADOS DE FILTRO (ATIVOS) ---
  const [assetFilters, setAssetFilters] = useState({ status: '', search: '' });
  const [assetResults, setAssetResults] = useState<any[]>([]);
  const [loadingAsset, setLoadingAsset] = useState(false);

  // --- ESTADOS DE FILTRO (ALUNOS/TABLETS - DOSSIÊ) ---
  const [studentSearch, setStudentSearch] = useState('');
  const [studentResults, setStudentResults] = useState<any[]>([]);
  const [loadingStudent, setLoadingStudent] = useState(false);

  // --- ESTADOS DE FILTRO (RECIBOS DE LOTE) ---
  const [batchFilters, setBatchFilters] = useState({ schoolName: '', startDate: '', endDate: '' });
  const [batchResults, setBatchResults] = useState<any[]>([]);
  const [loadingBatch, setLoadingBatch] = useState(false);

  // --- ESTADOS DE UNIDADE (DOSSIÊ GERENCIAL) ---
  const [unitFilter, setUnitFilter] = useState('');
  const [selectedUnitDossier, setSelectedUnitDossier] = useState<UnitDossier | null>(null);
  const [dossierYear, setDossierYear] = useState(new Date().getFullYear().toString());
  const [loadingDossier, setLoadingDossier] = useState(false);
  
  // INCREMENTO: Controle da Cascata (Linhas expandidas e sub-abas)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [activeSubTab, setActiveSubTab] = useState<Record<string, 'loans' | 'exits' | 'returns'>>({});

  // --- ESTADOS AUXILIARES PESSOAS ---
  const [peopleFilter, setPeopleFilter] = useState('');

  // ==================================================================================
  // HANDLERS GERAIS
  // ==================================================================================

  // 1. MOVIMENTAÇÕES
  const handleSearchMovements = async (e?: React.FormEvent) => {
      if(e) e.preventDefault();
      setLoadingMov(true);
      try {
          const params = new URLSearchParams();
          Object.entries(movFilters).forEach(([key, value]) => { if (value) params.append(key, value); });
          const response = await axios.get(`${API_URL}/asset-movements?${params.toString()}`);
          setMovementResults(response.data);
          if (response.data.length === 0) addToast('Nenhum registro encontrado.', 'info');
      } catch (error) { addToast('Erro ao buscar movimentações.', 'error'); } finally { setLoadingMov(false); }
  };

  const handleExportFilteredReport = async () => {
      if (movementResults.length === 0) return addToast('Faça uma busca antes de exportar.', 'warning');
      addToast('Gerando PDF...', 'info');
      try {
          const response = await axios.post(`${API_URL}/reports/movements/pdf`, movFilters, { responseType: 'blob' });
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', 'relatorio_movimentacoes_filtrado.pdf');
          document.body.appendChild(link);
          link.click();
          link.parentNode?.removeChild(link);
      } catch (error) { addToast('Erro ao gerar PDF.', 'error'); }
  };

  const clearMovFilters = () => {
      setMovFilters({ startDate: '', endDate: '', movementType: '', patrimonio: '', imei: '', chip: '', solicitante: '' });
      setMovementResults([]);
  };

  // 2. ATIVOS
  const handleSearchAssets = async (e?: React.FormEvent) => {
      if(e) e.preventDefault();
      setLoadingAsset(true);
      try {
          let url = `${API_URL}/assets`;
          const params = new URLSearchParams();
          if (assetFilters.search && assetFilters.search.length >= 3) {
              url = `${API_URL}/assets/search`; 
              params.append('q', assetFilters.search);
          } else if (assetFilters.status) {
              params.append('status', assetFilters.status);
          } else {
             if(!assetFilters.search && !assetFilters.status) {
                 addToast('Utilize pelo menos um filtro.', 'warning'); setLoadingAsset(false); return;
             }
          }
          const response = await axios.get(`${url}?${params.toString()}`);
          let data = response.data;
          if (assetFilters.search && assetFilters.status) data = data.filter((a: any) => a.status === assetFilters.status);
          setAssetResults(data);
          if (data.length === 0) addToast('Nenhum ativo encontrado.', 'info');
      } catch (error) { addToast('Erro ao buscar ativos.', 'error'); } finally { setLoadingAsset(false); }
  };

  // 3. ALUNOS (DOSSIÊ)
  const handleSearchStudents = async (e?: React.FormEvent) => {
      if(e) e.preventDefault();
      if(studentSearch.length < 3) { addToast('Digite pelo menos 3 caracteres.', 'warning'); return; }
      
      setLoadingStudent(true);
      try {
          const response = await axios.get(`${API_URL}/tablets/dossier?q=${studentSearch}`);
          setStudentResults(response.data);
          if (response.data.length === 0) addToast('Nenhum aluno encontrado.', 'info');
      } catch (error) {
          console.error(error);
          addToast('Erro ao buscar dossiê.', 'error');
      } finally { setLoadingStudent(false); }
  };

  // 4. RECIBOS DE LOTES (AUDITORIA) - NOVO
  const handleSearchBatches = async (e?: React.FormEvent) => {
      if(e) e.preventDefault();
      setLoadingBatch(true);
      try {
          const params = new URLSearchParams();
          if (batchFilters.schoolName) params.append('schoolName', batchFilters.schoolName);
          if (batchFilters.startDate) params.append('startDate', batchFilters.startDate);
          if (batchFilters.endDate) params.append('endDate', batchFilters.endDate);

          const response = await axios.get(`${API_URL}/audit/batch-receipts?${params.toString()}`);
          setBatchResults(response.data);
          if (response.data.length === 0) addToast('Nenhum recibo de lote encontrado.', 'info');
      } catch (error) {
          console.error(error);
          addToast('Erro ao buscar recibos.', 'error');
      } finally {
          setLoadingBatch(false);
      }
  };

  // DOWNLOADER CENTRALIZADO (CORRIGIDO)
  const downloadFile = async (idOrUrl: string, filename: string, type: 'movement' | 'batch') => {
      addToast('Baixando documento...', 'info');
      
      let endpoint = '';
      
      // Define a rota correta baseada no tipo
      if (type === 'movement') {
          endpoint = `${API_URL}/asset-movements/${idOrUrl}/signed-receipt`;
      } else {
          endpoint = `${API_URL}/delivery-batches/${idOrUrl}/signed-receipt`;
      }

      try {
           const response = await axios.get(endpoint, { responseType: 'blob' });
           const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
           const link = document.createElement('a');
           link.href = blobUrl;
           link.setAttribute('download', filename);
           document.body.appendChild(link);
           link.click();
           link.parentNode?.removeChild(link);
      } catch (error: any) {
          console.error("Erro download:", error);
          if (error.response && error.response.status === 404) {
              addToast('Arquivo não encontrado (404). Verifique se o upload foi feito.', 'error');
          } else {
              addToast('Erro ao baixar documento.', 'error');
          }
      }
  };

  // 5. UNIDADES (DOSSIÊ GERENCIAL)
  const handleViewUnitDossier = async (unitId: number) => {
      setLoadingDossier(true);
      setExpandedRows(new Set()); // Resetar expansões ao abrir nova unidade
      try {
          const response = await axios.get(`${API_URL}/units/${unitId}/dossier?year=${dossierYear}`);
          setSelectedUnitDossier(response.data);
      } catch (error) {
          addToast('Erro ao carregar dossiê da unidade.', 'error');
      } finally {
          setLoadingDossier(false);
      }
  };

  // INCREMENTO: Função para alternar a expansão da linha
  const toggleRow = (itemType: string) => {
      const newSet = new Set(expandedRows);
      if (newSet.has(itemType)) newSet.delete(itemType);
      else {
          newSet.add(itemType);
          setActiveSubTab(prev => ({...prev, [itemType]: 'loans'})); // Default tab
      }
      setExpandedRows(newSet);
  };

  // ==================================================================================
  // RENDERIZAÇÃO
  // ==================================================================================
  return (
    <div className="space-y-6 animate-fade-in pb-20">
      
      {/* CABEÇALHO */}
      <div className="flex justify-between items-end border-b pb-4">
         <div>
            <h1 className="text-3xl font-extrabold text-blue-900 flex items-center">
                <Search className="w-8 h-8 mr-3" /> Central de Consultas
            </h1>
            <p className="text-gray-500 mt-1">Busca avançada para Auditoria, Jurídico e Suporte.</p>
         </div>
      </div>

      {/* NAVEGAÇÃO (ABAS) */}
      <div className="flex gap-2 overflow-x-auto">
          <button onClick={() => setActiveTab('students')} className={`px-4 py-2 rounded-t-lg font-bold text-sm flex items-center transition-colors ${activeTab === 'students' ? 'bg-white border-t-2 border-blue-600 text-blue-700 shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
            <GraduationCap className="w-4 h-4 mr-2"/> Alunos (Dossiê)
          </button>
          
          <button onClick={() => setActiveTab('batch_receipts')} className={`px-4 py-2 rounded-t-lg font-bold text-sm flex items-center transition-colors ${activeTab === 'batch_receipts' ? 'bg-white border-t-2 border-blue-600 text-blue-700 shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
            <PackageCheck className="w-4 h-4 mr-2"/> Recibos (Lotes)
          </button>

          <button onClick={() => setActiveTab('units')} className={`px-4 py-2 rounded-t-lg font-bold text-sm flex items-center transition-colors ${activeTab === 'units' ? 'bg-white border-t-2 border-blue-600 text-blue-700 shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
            <BarChart className="w-4 h-4 mr-2"/> Unidades (BI)
          </button>

          <button onClick={() => setActiveTab('movements')} className={`px-4 py-2 rounded-t-lg font-bold text-sm flex items-center transition-colors ${activeTab === 'movements' ? 'bg-white border-t-2 border-blue-600 text-blue-700 shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
            <HistoryIcon className="w-4 h-4 mr-2"/> Histórico Geral
          </button>
          
          <button onClick={() => setActiveTab('assets')} className={`px-4 py-2 rounded-t-lg font-bold text-sm flex items-center transition-colors ${activeTab === 'assets' ? 'bg-white border-t-2 border-blue-600 text-blue-700 shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
            <Cpu className="w-4 h-4 mr-2"/> Ativos (Técnico)
          </button>
          
          <button onClick={() => setActiveTab('people')} className={`px-4 py-2 rounded-t-lg font-bold text-sm flex items-center transition-colors ${activeTab === 'people' ? 'bg-white border-t-2 border-blue-600 text-blue-700 shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
            <User className="w-4 h-4 mr-2"/> Pessoas
          </button>
      </div>

      {/* ================================================================================= */}
      {/* ABA 1: ALUNOS (DOSSIÊ COMPLETO) */}
      {/* ================================================================================= */}
      {activeTab === 'students' && (
         <div className="bg-white p-6 rounded-b-xl rounded-tr-xl shadow-sm border border-gray-200 border-t-0">
             <form onSubmit={handleSearchStudents} className="flex gap-4 mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
                 <div className="flex-1">
                    <label className="block text-xs font-bold text-blue-800 uppercase mb-1">Buscar Aluno</label>
                    <input 
                        type="text" 
                        placeholder="Nome, Matrícula ou CPF..." 
                        value={studentSearch}
                        onChange={e => setStudentSearch(e.target.value)}
                        className="w-full p-2 border rounded border-blue-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                 </div>
                 <div className="flex items-end">
                    <button onClick={() => handleSearchStudents()} disabled={loadingStudent} className="bg-blue-700 text-white px-6 py-2 rounded hover:bg-blue-800 h-[42px] font-bold shadow">
                        {loadingStudent ? '...' : 'Localizar Dossiê'}
                    </button>
                 </div>
             </form>

             <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-bold">
                        <tr>
                            <th className="p-3">Aluno / Escola</th>
                            <th className="p-3">Tablet Vinculado</th>
                            <th className="p-3">Status Entrega</th>
                            <th className="p-3 text-center">Documentação (Assinada)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {studentResults.map((s, idx) => (
                            <tr key={idx} className="hover:bg-blue-50 transition-colors">
                                <td className="p-3">
                                    <div className="font-bold text-blue-900">{s.student_name}</div>
                                    <div className="text-xs text-gray-500">Matr: {s.student_registration} {s.student_cpf ? `| CPF: ${s.student_cpf}` : ''}</div>
                                    <div className="text-xs text-gray-600 mt-1 font-medium">{s.school_name}</div>
                                </td>
                                <td className="p-3">
                                    {s.patrimonio_number ? (
                                        <>
                                            <div className="font-medium text-gray-800">{s.patrimonio_number}</div>
                                            {s.serial_number && <div className="text-xs text-gray-500">S/N: {s.serial_number}</div>}
                                            {s.sim_card_number && <div className="text-xs text-green-600 font-bold mt-1">Chip: {s.sim_card_number}</div>}
                                        </>
                                    ) : (
                                        <span className="text-gray-400 italic">Nenhum equipamento</span>
                                    )}
                                </td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                        s.delivery_status === 'realizada' || s.delivery_status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                        s.delivery_status === 'devolvido' ? 'bg-orange-100 text-orange-800' :
                                        s.delivery_status === 'substituida' ? 'bg-gray-200 text-gray-600' :
                                        'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {s.delivery_status ? s.delivery_status.toUpperCase() : 'PENDENTE'}
                                    </span>
                                    {s.delivery_date && <div className="text-xs text-gray-500 mt-1">{new Date(s.delivery_date).toLocaleDateString('pt-BR')}</div>}
                                </td>
                                <td className="p-3 text-center">
                                    {s.individual_receipt ? (
                                        <button onClick={() => downloadFile(`${s.movement_id}`, `Recibo_Individual_${s.student_registration}.pdf`, 'movement')} className="text-purple-600 hover:text-purple-800 flex items-center justify-center w-full text-xs font-bold">
                                            <FileCheck className="w-4 h-4 mr-1"/> Recibo Individual
                                        </button>
                                    ) : s.batch_receipt ? (
                                        <div className="flex flex-col items-center">
                                            <button onClick={() => downloadFile(`${s.batch_id}`, `Recibo_Lote_${s.batch_id}.pdf`, 'batch')} className="text-blue-600 hover:text-blue-800 flex items-center justify-center text-xs font-bold">
                                                <FileText className="w-4 h-4 mr-1"/> Recibo do Lote
                                            </button>
                                            <span className="text-[10px] text-gray-400">(Lote: {s.batch_name})</span>
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 text-xs">Sem documento digitalizado</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                         {studentResults.length === 0 && !loadingStudent && (
                            <tr><td colSpan={4} className="p-8 text-center text-gray-400">Utilize a busca acima para encontrar o dossiê.</td></tr>
                        )}
                    </tbody>
                </table>
             </div>
         </div>
      )}

      {/* ================================================================================= */}
      {/* ABA: RECIBOS DE LOTES (AUDITORIA) - NOVO */}
      {/* ================================================================================= */}
      {activeTab === 'batch_receipts' && (
         <div className="bg-white p-6 rounded-b-xl rounded-tr-xl shadow-sm border border-gray-200 border-t-0">
             <form onSubmit={handleSearchBatches} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                 <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-indigo-800 uppercase mb-1">Nome da Escola</label>
                    <input 
                        type="text" 
                        placeholder="Digite o nome da escola..." 
                        value={batchFilters.schoolName}
                        onChange={e => setBatchFilters({...batchFilters, schoolName: e.target.value})}
                        className="w-full p-2 border rounded"
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-indigo-800 uppercase mb-1">Entregue A Partir De</label>
                    <input type="date" value={batchFilters.startDate} onChange={e => setBatchFilters({...batchFilters, startDate: e.target.value})} className="w-full p-2 border rounded"/>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-indigo-800 uppercase mb-1">Até</label>
                    <input type="date" value={batchFilters.endDate} onChange={e => setBatchFilters({...batchFilters, endDate: e.target.value})} className="w-full p-2 border rounded"/>
                 </div>
             </form>
             
             <div className="mb-6">
                <button onClick={() => handleSearchBatches()} disabled={loadingBatch} className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 font-bold shadow flex items-center">
                    <Search className="w-4 h-4 mr-2"/> Buscar Recibos
                </button>
             </div>

             <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-bold">
                        <tr>
                            <th className="p-3">Data Confirmação</th>
                            <th className="p-3">Escola / Lote</th>
                            <th className="p-3 text-center">RPA</th>
                            <th className="p-3 text-center">Total Entregue</th>
                            <th className="p-3 text-center text-red-600">Devoluções</th>
                            <th className="p-3 text-center">Arquivo</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {batchResults.map((b, idx) => (
                            <tr key={idx} className="hover:bg-indigo-50 transition-colors">
                                <td className="p-3 text-gray-500">
                                    {b.delivery_confirmation_date ? new Date(b.delivery_confirmation_date).toLocaleDateString('pt-BR') : 'N/A'}
                                </td>
                                <td className="p-3">
                                    <div className="font-bold text-indigo-900">{b.school_name}</div>
                                    <div className="text-xs text-gray-500">{b.batch_name}</div>
                                </td>
                                <td className="p-3 text-center">
                                    <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-xs font-bold">{b.rpa || '-'}</span>
                                </td>
                                <td className="p-3 text-center font-bold text-gray-800">
                                    {b.total_items}
                                </td>
                                <td className="p-3 text-center">
                                    {parseInt(b.returned_items) > 0 ? (
                                        <span className="text-red-600 font-bold bg-red-100 px-2 py-0.5 rounded text-xs">
                                            {b.returned_items} Devolvidos
                                        </span>
                                    ) : (
                                        <span className="text-gray-300">-</span>
                                    )}
                                </td>
                                <td className="p-3 text-center">
                                    {b.collective_receipt_path ? (
                                        <button 
                                            onClick={() => downloadFile(`${b.id}`, `Recibo_Coletivo_${b.id}.pdf`, 'batch')} 
                                            className="bg-green-600 text-white hover:bg-green-700 px-3 py-1.5 rounded flex items-center justify-center w-full text-xs font-bold shadow-sm"
                                        >
                                            <Download className="w-3 h-3 mr-1"/> Baixar PDF
                                        </button>
                                    ) : (
                                        <span className="text-gray-400 italic text-xs">Pendente</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {batchResults.length === 0 && !loadingBatch && (
                            <tr><td colSpan={6} className="p-8 text-center text-gray-400">Nenhum recibo encontrado. Ajuste os filtros.</td></tr>
                        )}
                    </tbody>
                </table>
             </div>
         </div>
      )}

      {/* ================================================================================= */}
      {/* ABA: UNIDADES (DOSSIÊ GERENCIAL) - CORRIGIDA E DETALHADA */}
      {/* ================================================================================= */}
      {activeTab === 'units' && (
          <div className="bg-white p-6 rounded-b-xl rounded-tr-xl shadow-sm border border-gray-200 border-t-0">
             
             {/* SELEÇÃO DO DOSSIÊ */}
             {!selectedUnitDossier ? (
                <>
                    <input 
                        type="text" 
                        placeholder="Filtrar unidades por nome ou código..." 
                        value={unitFilter}
                        onChange={e => setUnitFilter(e.target.value)}
                        className="w-full p-2 border rounded mb-4"
                    />
                    <div className="overflow-x-auto rounded-lg border border-gray-200 max-h-[600px]">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-bold sticky top-0">
                                <tr><th className="p-3">Nome</th><th className="p-3">Tipo</th><th className="p-3">Ativos Atuais</th><th className="p-3 text-right">Ação</th></tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {units.filter(u => u.name.toLowerCase().includes(unitFilter.toLowerCase()) || (u.code && u.code.toLowerCase().includes(unitFilter.toLowerCase()))).map(u => (
                                    <tr key={u.id} className="hover:bg-gray-50">
                                        <td className="p-3 font-medium">{u.name}</td>
                                        <td className="p-3 text-gray-500">{u.type}</td>
                                        <td className="p-3">
                                            {u.current_assets_count && u.current_assets_count > 0 ? (
                                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-bold">{u.current_assets_count}</span>
                                            ) : <span className="text-gray-300">-</span>}
                                        </td>
                                        <td className="p-3 text-right">
                                            <button 
                                                onClick={() => handleViewUnitDossier(u.id)}
                                                className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded hover:bg-indigo-200 text-xs font-bold flex items-center float-right"
                                            >
                                                <BarChart className="w-3 h-3 mr-1"/> Dossiê Gerencial
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
             ) : (
                /* VISUALIZAÇÃO DO DOSSIÊ COM DETALHAMENTO EM CASCATA */
                <div className="space-y-6 animate-fade-in">
                    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <div>
                            <button onClick={() => setSelectedUnitDossier(null)} className="text-sm text-indigo-600 hover:underline mb-1 flex items-center">
                                <ArrowLeft className="w-3 h-3 mr-1"/> Voltar para lista
                            </button>
                            <h2 className="text-xl font-bold text-gray-900">{selectedUnitDossier.unit.name}</h2>
                            <p className="text-gray-500 text-xs">Relatório Gerencial de Ativos - Ano Base: {selectedUnitDossier.year}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-gray-600">Ano Base:</label>
                            <select 
                                value={dossierYear} 
                                onChange={(e) => {
                                    setDossierYear(e.target.value);
                                    alert('Para atualizar o ano, por favor clique em Voltar e selecione a unidade novamente.');
                                }}
                                className="p-1 border rounded text-sm font-bold"
                            >
                                <option value="2024">2024</option>
                                <option value="2025">2025</option>
                                <option value="2026">2026</option>
                            </select>
                        </div>
                    </div>

                    {/* KPIs */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100 text-center">
                            <span className="text-xs text-blue-500 font-bold uppercase">Total Enviado</span>
                            <div className="text-2xl font-extrabold text-blue-900">
                                {selectedUnitDossier.stats.reduce((acc, curr) => acc + curr.total_quantity, 0)}
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-yellow-100 text-center">
                            <span className="text-xs text-yellow-600 font-bold uppercase">Empréstimos Ativos</span>
                            <div className="text-2xl font-extrabold text-yellow-800">
                                {selectedUnitDossier.stats.reduce((acc, curr) => acc + curr.currently_loaned, 0)}
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-red-100 text-center">
                            <span className="text-xs text-red-500 font-bold uppercase">Vencidos</span>
                            <div className="text-2xl font-extrabold text-red-600">
                                {selectedUnitDossier.stats.reduce((acc, curr) => acc + curr.overdue_loans, 0)}
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-green-100 text-center">
                            <span className="text-xs text-green-600 font-bold uppercase">Saldo na Unidade</span>
                            <div className="text-2xl font-extrabold text-green-800">
                                {selectedUnitDossier.current_inventory ? selectedUnitDossier.current_inventory.length : 0}
                            </div>
                        </div>
                    </div>

                    {/* Tabela Cascata com Detalhamento */}
                    <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-indigo-900 text-white uppercase text-xs font-bold">
                                <tr>
                                    <th className="p-3 w-10"></th>
                                    <th className="p-3">Tipo de Item</th>
                                    <th className="p-3 text-center">Total Enviado</th>
                                    <th className="p-3 text-center">Empréstimos</th>
                                    <th className="p-3 text-center">Saída Definitiva</th>
                                    <th className="p-3 text-center text-red-600 bg-white/10">Vencidos</th>
                                    <th className="p-3 text-center text-green-300">Devolvidos</th>
                                    <th className="p-3 text-center bg-indigo-700 text-white border-l border-indigo-600">Saldo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {selectedUnitDossier.stats.map((s, idx) => {
                                    // CORREÇÃO: Usamos o objeto _details vindo do backend
                                    const isExpanded = expandedRows.has(s.item_type);
                                    const currentSubTab = activeSubTab[s.item_type] || 'loans';
                                    
                                    // Listas seguras (fallback para array vazio)
                                    const loanList = s._details?.loans || [];
                                    const exitList = s._details?.exits || [];
                                    const returnedList = s._details?.returns || [];

                                    return (
                                    <React.Fragment key={idx}>
                                        <tr className={`hover:bg-gray-50 cursor-pointer ${isExpanded ? 'bg-indigo-50' : ''}`} onClick={() => toggleRow(s.item_type)}>
                                            <td className="p-3 text-center">
                                                {isExpanded ? <ChevronDown className="w-4 h-4 text-indigo-600"/> : <ChevronRight className="w-4 h-4 text-gray-400"/>}
                                            </td>
                                            <td className="p-3 font-bold text-gray-800">{s.item_type}</td>
                                            <td className="p-3 text-center font-bold text-gray-600">{s.total_quantity}</td>
                                            <td className="p-3 text-center text-gray-600">{s.total_loans}</td>
                                            <td className="p-3 text-center text-gray-600">{s.total_exits}</td>
                                            <td className="p-3 text-center font-bold text-red-600">{s.overdue_loans > 0 ? s.overdue_loans : '-'}</td>
                                            <td className="p-3 text-center text-green-600 font-bold">{s.returned_count}</td>
                                            <td className="p-3 text-center font-extrabold text-indigo-700 bg-indigo-50/50 border-l border-gray-200">
                                                {s.currently_active}
                                            </td>
                                        </tr>
                                        
                                        {/* PAINEL DE DETALHES (SUB-ABAS) */}
                                        {isExpanded && (
                                            <tr>
                                                <td colSpan={8} className="p-0 bg-gray-50 border-b border-indigo-100 shadow-inner">
                                                    <div className="p-4 bg-white m-2 rounded border border-gray-200">
                                                        
                                                        {/* Navegação Interna */}
                                                        <div className="flex space-x-2 mb-3 border-b border-gray-200 pb-2">
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); setActiveSubTab({...activeSubTab, [s.item_type]: 'loans'}); }} 
                                                                className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center transition-colors ${currentSubTab === 'loans' ? 'bg-yellow-100 text-yellow-800 shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}
                                                            >
                                                                🟡 Empréstimos Ativos ({loanList.length})
                                                            </button>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); setActiveSubTab({...activeSubTab, [s.item_type]: 'exits'}); }} 
                                                                className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center transition-colors ${currentSubTab === 'exits' ? 'bg-blue-100 text-blue-800 shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}
                                                            >
                                                                🔵 Saídas Definitivas ({exitList.length})
                                                            </button>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); setActiveSubTab({...activeSubTab, [s.item_type]: 'returns'}); }} 
                                                                className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center transition-colors ${currentSubTab === 'returns' ? 'bg-green-100 text-green-800 shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}
                                                            >
                                                                ↩️ Devolvidos ({returnedList.length})
                                                            </button>
                                                        </div>

                                                        {/* Tabelas de Detalhe */}
                                                        <div className="min-h-[100px]">
                                                            {currentSubTab === 'loans' && (
                                                                loanList.length > 0 ? (
                                                                    <table className="w-full text-xs text-left">
                                                                        <thead className="bg-yellow-50 text-yellow-800 font-bold"><tr><th className="p-2">Patrimônio</th><th className="p-2">Modelo</th><th className="p-2">Vencimento</th><th className="p-2">Responsável</th></tr></thead>
                                                                        <tbody>{loanList.map((i:any) => {
                                                                            const isOverdue = i.expected_return_date && new Date(i.expected_return_date) <= new Date();
                                                                            return (
                                                                                <tr key={i.id} className="border-b last:border-0 hover:bg-gray-50">
                                                                                    <td className="p-2 font-bold">{i.patrimonio_number}</td>
                                                                                    <td className="p-2">{i.brand} {i.model}</td>
                                                                                    <td className="p-2">{isOverdue ? <span className="text-red-600 font-bold flex items-center"><AlertCircle className="w-3 h-3 mr-1"/> {new Date(i.expected_return_date).toLocaleDateString()}</span> : <span className="text-green-600 flex items-center"><CheckCircle2 className="w-3 h-3 mr-1"/> {new Date(i.expected_return_date).toLocaleDateString()}</span>}</td>
                                                                                    <td className="p-2">{i.responsible_name}</td>
                                                                                </tr>
                                                                            )
                                                                        })}</tbody>
                                                                    </table>
                                                                ) : <p className="text-gray-400 text-center text-xs italic py-4">Nenhum empréstimo ativo encontrado.</p>
                                                            )}

                                                            {currentSubTab === 'exits' && (
                                                                exitList.length > 0 ? (
                                                                    <table className="w-full text-xs text-left">
                                                                        <thead className="bg-blue-50 text-blue-800 font-bold"><tr><th className="p-2">Patrimônio</th><th className="p-2">Modelo</th><th className="p-2">Responsável</th></tr></thead>
                                                                        <tbody>{exitList.map((i:any) => (
                                                                            <tr key={i.id} className="border-b last:border-0 hover:bg-gray-50">
                                                                                <td className="p-2 font-bold">{i.patrimonio_number}</td>
                                                                                <td className="p-2">{i.brand} {i.model}</td>
                                                                                <td className="p-2">{i.responsible_name}</td>
                                                                            </tr>
                                                                        ))}</tbody>
                                                                    </table>
                                                                ) : <p className="text-gray-400 text-center text-xs italic py-4">Nenhuma saída definitiva ativa encontrada.</p>
                                                            )}

                                                            {currentSubTab === 'returns' && (
                                                                returnedList.length > 0 ? (
                                                                    <table className="w-full text-xs text-left">
                                                                        <thead className="bg-green-50 text-green-800 font-bold"><tr><th className="p-2">Data Movimentação</th><th className="p-2">Patrimônio</th><th className="p-2">Obs</th></tr></thead>
                                                                        <tbody>{returnedList.map((h:any, i:number) => (
                                                                            <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                                                                                <td className="p-2">{new Date(h.movement_date).toLocaleDateString()}</td>
                                                                                <td className="p-2 font-bold">{h.patrimonio_number}</td>
                                                                                <td className="p-2 text-gray-500 italic">Constava como enviado, agora não está mais na unidade.</td>
                                                                            </tr>
                                                                        ))}</tbody>
                                                                    </table>
                                                                ) : <p className="text-gray-400 text-center text-xs italic py-4">Todos os itens enviados este ano continuam na unidade.</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                )})}
                                {selectedUnitDossier.stats.length === 0 && <tr><td colSpan={8} className="p-4 text-center text-gray-400">Nenhuma movimentação para o ano selecionado.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
             )}
          </div>
      )}

      {/* ================================================================================= */}
      {/* ABA: HISTÓRICO GERAL (MOVIMENTAÇÕES) */}
      {/* ================================================================================= */}
      {activeTab === 'movements' && (
        <div className="bg-white p-6 rounded-b-xl rounded-tr-xl shadow-sm border border-gray-200 border-t-0">
            {/* Filtros */}
            <form onSubmit={handleSearchMovements} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-gray-50 p-4 rounded-lg border">
                <div className="md:col-span-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Início</label>
                    <input type="date" value={movFilters.startDate} onChange={e => setMovFilters({...movFilters, startDate: e.target.value})} className="w-full p-2 border rounded text-sm"/>
                </div>
                <div className="md:col-span-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fim</label>
                    <input type="date" value={movFilters.endDate} onChange={e => setMovFilters({...movFilters, endDate: e.target.value})} className="w-full p-2 border rounded text-sm"/>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Solicitante / Responsável</label>
                    <input type="text" placeholder="Nome, Matrícula ou CPF" value={movFilters.solicitante} onChange={e => setMovFilters({...movFilters, solicitante: e.target.value})} className="w-full p-2 border rounded text-sm"/>
                </div>

                <div className="md:col-span-1">
                     <label className="block text-xs font-bold text-blue-700 uppercase mb-1">Patrimônio</label>
                     <input type="text" placeholder="Tombo ou Serial" value={movFilters.patrimonio} onChange={e => setMovFilters({...movFilters, patrimonio: e.target.value})} className="w-full p-2 border rounded text-sm"/>
                </div>
                <div className="md:col-span-1">
                     <label className="block text-xs font-bold text-blue-700 uppercase mb-1">IMEI (Tablet)</label>
                     <input type="text" placeholder="Busca parcial..." value={movFilters.imei} onChange={e => setMovFilters({...movFilters, imei: e.target.value})} className="w-full p-2 border rounded text-sm"/>
                </div>
                <div className="md:col-span-1">
                     <label className="block text-xs font-bold text-blue-700 uppercase mb-1">Nº Chip</label>
                     <input type="text" placeholder="Ex: 8199..." value={movFilters.chip} onChange={e => setMovFilters({...movFilters, chip: e.target.value})} className="w-full p-2 border rounded text-sm"/>
                </div>
                <div className="md:col-span-1">
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Operação</label>
                     <select value={movFilters.movementType} onChange={e => setMovFilters({...movFilters, movementType: e.target.value})} className="w-full p-2 border rounded text-sm">
                        <option value="">Todos</option>
                        <option value="loan">Empréstimo</option>
                        <option value="return">Devolução</option>
                        <option value="exit">Saída Definitiva</option>
                        <option value="maintenance">Manutenção</option>
                     </select>
                </div>
            </form>

            <div className="flex gap-2 mb-6 border-b pb-4 justify-between">
                <div className="flex gap-2">
                    <button onClick={() => handleSearchMovements()} disabled={loadingMov} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 flex items-center shadow-sm">
                        <Search className="w-4 h-4 mr-2"/> {loadingMov ? '...' : 'Pesquisar'}
                    </button>
                    <button onClick={clearMovFilters} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50">
                        Limpar
                    </button>
                </div>
                {movementResults.length > 0 && (
                    <button onClick={handleExportFilteredReport} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 flex items-center shadow-sm">
                        <Download className="w-4 h-4 mr-2"/> Exportar PDF
                    </button>
                )}
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-bold">
                        <tr>
                            <th className="p-3 w-28">Data</th>
                            <th className="p-3 w-32">Tipo</th>
                            <th className="p-3">Ativos Envolvidos</th>
                            <th className="p-3">Responsável</th>
                            <th className="p-3">Destino</th>
                            <th className="p-3 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {movementResults.map(mov => (
                            <tr key={mov.id} className="hover:bg-blue-50 transition-colors">
                                <td className="p-3 text-gray-500 align-top">{new Date(mov.movement_date).toLocaleDateString('pt-BR')}</td>
                                <td className="p-3 align-top">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                        mov.movement_type === 'return' ? 'bg-green-100 text-green-800' : 
                                        mov.movement_type === 'loan' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                                    }`}>
                                        {translateMovementType(mov.movement_type)}
                                    </span>
                                </td>
                                <td className="p-3 align-top">
                                    {mov.assets && mov.assets.map((a: any, i: number) => (
                                        <div key={i} className="mb-2 p-2 bg-gray-50 rounded border border-gray-100">
                                            <div className="font-bold text-blue-900">{a.item_type_name} - {a.patrimonio_number || a.sku}</div>
                                            <div className="text-xs text-gray-500 mt-1 flex gap-3">
                                                {a.brand && <span>{a.brand} {a.model}</span>}
                                                {a.imei && <span className="text-gray-700 font-mono bg-white px-1 border rounded">IMEI: {a.imei}</span>}
                                                {a.sim_card_number && <span className="text-green-700 font-mono bg-white px-1 border rounded">CHIP: {a.sim_card_number}</span>}
                                            </div>
                                        </div>
                                    ))}
                                </td>
                                <td className="p-3 font-medium align-top">{mov.recipient_display_name || mov.responsible_full_name}</td>
                                <td className="p-3 text-gray-500 align-top">{mov.destination_unit_name || '-'}</td>
                                <td className="p-3 text-right align-top">
                                    <div className="flex justify-end gap-2">
                                        
                                        {/* LÓGICA CONDICIONAL DE DOCUMENTOS */}
                                        {mov.delivery_status === 'confirmed' ? (
                                            // CENÁRIO 1: Confirmado -> Baixa o PDF Assinado (Prova)
                                            <button 
                                                onClick={() => downloadFile(mov.id.toString(), `Recibo_Assinado_${mov.id}.pdf`, 'movement')} 
                                                className="text-green-600 hover:text-green-800 p-1" 
                                                title="Baixar Comprovante Assinado"
                                            >
                                                <Paperclip className="w-5 h-5"/>
                                            </button>
                                        ) : (
                                            // CENÁRIO 2: Pendente/Outros -> Imprime o modelo para assinar
                                            <button 
                                                onClick={() => handleGenerateMovementReceipt(mov.id)} 
                                                className="text-blue-600 hover:text-blue-800 p-1" 
                                                title="Gerar/Imprimir Recibo para Assinatura"
                                            >
                                                <Printer className="w-5 h-5"/>
                                            </button>
                                        )}
                                        
                                        {/* Botões de Devolução/Substituição (Mantidos) */}
                                        {mov.movement_type !== 'return' && userRole !== 'basic' && (
                                            <>
                                                <button onClick={() => onReturnClick(mov)} className="text-orange-600 hover:text-orange-800 p-1" title="Devolver"><Calendar className="w-5 h-5"/></button>
                                                <button onClick={() => onSubstituteClick(mov)} className="text-red-600 hover:text-red-800 p-1" title="Substituir"><Filter className="w-5 h-5"/></button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {movementResults.length === 0 && !loadingMov && (
                            <tr><td colSpan={6} className="p-8 text-center text-gray-400">Utilize os filtros acima para encontrar registros.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {/* ================================================================================= */}
      {/* ABA: ATIVOS (INVENTÁRIO) */}
      {/* ================================================================================= */}
      {activeTab === 'assets' && (
         <div className="bg-white p-6 rounded-b-xl rounded-tr-xl shadow-sm border border-gray-200 border-t-0">
             <form onSubmit={handleSearchAssets} className="flex gap-4 mb-6 bg-gray-50 p-4 rounded-lg border">
                 <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Busca Textual</label>
                    <input 
                        type="text" 
                        placeholder="Patrimônio, Serial, IMEI, Chip, Marca..." 
                        value={assetFilters.search}
                        onChange={e => setAssetFilters({...assetFilters, search: e.target.value})}
                        className="w-full p-2 border rounded"
                    />
                 </div>
                 <div className="w-48">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                    <select 
                        value={assetFilters.status} 
                        onChange={e => setAssetFilters({...assetFilters, status: e.target.value})}
                        className="w-full p-2 border rounded"
                    >
                        <option value="">Todos</option>
                        <option value="available">Disponível</option>
                        <option value="in_use">Em Uso</option>
                        <option value="loaned">Emprestado</option>
                        <option value="maintenance">Manutenção</option>
                        <option value="retired">Baixado</option>
                        <option value="disposed">Descartado</option>
                    </select>
                 </div>
                 <div className="flex items-end">
                    <button onClick={() => handleSearchAssets()} disabled={loadingAsset} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 h-[42px]">
                        {loadingAsset ? '...' : 'Buscar'}
                    </button>
                 </div>
             </form>

             <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-bold">
                        <tr>
                            <th className="p-3">Patrimônio</th>
                            <th className="p-3">Tipo / Modelo</th>
                            <th className="p-3">Dados Técnicos</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Localização</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {assetResults.map(asset => (
                            <tr key={asset.id} className="hover:bg-gray-50">
                                <td className="p-3 font-bold text-gray-700">{asset.patrimonio_number || asset.sku}</td>
                                <td className="p-3">
                                    <div className="font-medium">{asset.item_type_name}</div>
                                    <div className="text-xs text-gray-500">{asset.brand} {asset.model}</div>
                                </td>
                                <td className="p-3 text-xs">
                                    {asset.serial_number && <div className="mb-1"><span className="font-bold text-gray-500">S/N:</span> {asset.serial_number}</div>}
                                    {asset.imei && <div className="mb-1"><span className="font-bold text-blue-600">IMEI:</span> {asset.imei}</div>}
                                    {asset.sim_card_number && <div><span className="font-bold text-green-600">Chip:</span> {asset.sim_card_number}</div>}
                                </td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                        asset.status === 'available' ? 'bg-green-100 text-green-800' : 
                                        asset.status === 'in_use' ? 'bg-blue-100 text-blue-800' :
                                        asset.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                        {translateStatus(asset.status)}
                                    </span>
                                </td>
                                <td className="p-3 text-gray-500">
                                    <div>{asset.current_unit_name || 'Estoque Central'}</div>
                                </td>
                            </tr>
                        ))}
                         {assetResults.length === 0 && !loadingAsset && (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-400">Nenhum ativo encontrado.</td></tr>
                        )}
                    </tbody>
                </table>
             </div>
         </div>
      )}

      {/* ================================================================================= */}
      {/* ABA: PESSOAS */}
      {/* ================================================================================= */}
      {activeTab === 'people' && (
          <div className="bg-white p-6 rounded-b-xl rounded-tr-xl shadow-sm border border-gray-200 border-t-0">
             <input 
                type="text" 
                placeholder="Filtrar pessoas por nome ou CPF..." 
                value={peopleFilter}
                onChange={e => setPeopleFilter(e.target.value)}
                className="w-full p-2 border rounded mb-4"
             />
             <div className="overflow-x-auto rounded-lg border border-gray-200 max-h-[600px]">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-bold sticky top-0">
                        <tr><th className="p-3">Nome</th><th className="p-3">CPF</th><th className="p-3">Unidade</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {people.filter(p => p.full_name.toLowerCase().includes(peopleFilter.toLowerCase())).map(p => (
                            <tr key={p.id} className="hover:bg-gray-50">
                                <td className="p-3 font-medium">{p.full_name}</td>
                                <td className="p-3 text-gray-500">{p.cpf}</td>
                                <td className="p-3 text-gray-500">{p.unit_name}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
          </div>
      )}

    </div>
  );
};

export default QueryHubPage;
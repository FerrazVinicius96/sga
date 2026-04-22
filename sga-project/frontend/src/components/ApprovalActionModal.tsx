import React from 'react';

interface Props {
  action: string;
  requestId: number;
  onClose: () => void;
  onConfirm: (requestId: number, action: string, reason?: string) => void;
}

const ApprovalActionModal: React.FC<Props> = ({ action, requestId, onClose, onConfirm }) => {
  const [reason, setReason] = React.useState('');
  const isReject = action === 'reject';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
        <h2 className="text-lg font-bold mb-4">
          {isReject ? 'Rejeitar Solicitação' : 'Aprovar Solicitação'}
        </h2>
        {isReject && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo da rejeição
            </label>
            <textarea
              className="w-full border rounded p-2 text-sm"
              rows={3}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Descreva o motivo..."
            />
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm border rounded hover:bg-gray-100">
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(requestId, action, reason)}
            className={`px-4 py-2 text-sm text-white rounded ${isReject ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
          >
            {isReject ? 'Rejeitar' : 'Aprovar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApprovalActionModal;

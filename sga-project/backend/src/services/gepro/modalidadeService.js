const MODALIDADES_VALIDAS = ['pregao', 'concorrencia', 'srp', 'convite', 'ata_registro_precos'];

exports.isArp = (modalidade) => modalidade === 'ata_registro_precos';

exports.validar = (modalidade) => {
	if (!modalidade) {
		const err = new Error('Modalidade de licitação é obrigatória.');
		err.statusCode = 400;
		throw err;
	}
	if (!MODALIDADES_VALIDAS.includes(modalidade)) {
		const err = new Error(
			`Modalidade inválida: "${modalidade}". Valores aceitos: ${MODALIDADES_VALIDAS.join(', ')}.`,
		);
		err.statusCode = 400;
		throw err;
	}
};

// RN004: TR não é permitido para Ata de Registro de Preços
exports.assertTRPermitido = (modalidade) => {
	if (exports.isArp(modalidade)) {
		const err = new Error(
			'Termo de Referência (TR) não é permitido para Ata de Registro de Preços (ARP). ' +
			'Apenas o ETP é obrigatório nesta modalidade.',
		);
		err.statusCode = 400;
		throw err;
	}
};

exports.requiresTR = (modalidade) => !exports.isArp(modalidade);

const chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefghjkmnpqrstwxyz23456789';

exports.generateRandomPassword = () =>
	Array.from(
		{ length: 12 },
		() => chars[Math.floor(Math.random() * chars.length)],
	).join('');

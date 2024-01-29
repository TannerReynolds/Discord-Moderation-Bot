const log = require('../../utils/log');

async function gifDetector(message) {
	if (!message.channel.guild) return;
	if (message.author.bot) return;
	log.debug('Starting gif detection');
	let hasGif = false;
	let allowedChannels = ['438653183464701963', '438652906116481025', '1197694320346665140'];
	let messageChannel = message.channel.id;

	if (allowedChannels.includes(messageChannel)) return;

	log.debug(`Checking message content for gifs... "${message.content}"`);
	let urls = (await detectURL(message.content)) || false;

	if (urls) {
		log.debug(`found URL`);
		if (urls[0].includes('.gif')) {
			log.debug(`URL is a gif`);
			hasGif = true;
		}
	}

	if (message.attachments.size > 0) {
		log.debug(`Looking in message attachments`);
		hasGif = message.attachments.some(a => a.contentType && a.contentType.toLowerCase().includes('gif'));
	}

	if (!hasGif && message.embeds.length > 0) {
		hasGif = message.embeds.some(embed => {
			if (embed.url && embed.url.includes('.gif')) {
				log.debug(`gif found in embed url`);
				return true;
			}

			if (embed.type === 'image' && embed.thumbnail && embed.thumbnail.url) {
				log.debug(`gif found in embed thumbnail`);
				return embed.thumbnail.url.includes('.gif');
			}

			return false;
		});
	}

	if (hasGif) {
		log.debug(`sending gif detected message`);
		message.reply('Gif Detected, please no gifs').then(r => {
			log.debug(`deleting message`);
			message.delete();
			setTimeout(() => {
				log.debug(`deleting response`);
				return r.delete();
			}, 4000);
		});
	} else {
		return log.debug(`No gif detected`);
	}

	async function detectURL(string) {
		const urlReg = /https?:\/\/(www\.)?[a-zA-Z0-9\-.]+[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=]*/g;
		return string.match(urlReg);
	}
}

module.exports = { gifDetector };

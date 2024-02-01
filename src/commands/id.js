const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { colors } = require('../config.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('id')
		.setDMPermission(false)
		.setDescription("get a user's ID")
		.addStringOption(option => option.setName('username').setDescription('The username or tag to search for').setRequired(true)),
	async execute(interaction) {
		interaction.deferReply();

		if (!interaction.options.getString('username')) {
			return sendReply(interaction, 'error', 'No user entered');
		}

		let userString = await interaction.options.getString('username');

		let userID = await getID(interaction, userString);

		interaction.editReply(userID);

		function sendReply(interaction, type, message) {
			let replyEmbed = new EmbedBuilder().setColor(colors[type]).setDescription(message).setTimestamp();

			interaction.editReply({ embeds: [replyEmbed] });
		}
	},
};

async function getID(interaction, input) {
	let member;
	await interaction.guild.members.fetch();
	input = input.toLowerCase();

	if (input.includes('#')) {
		const [username, discriminator] = input.split('#');
		member = interaction.guild.members.cache.find(member => member.user.username.toLowerCase() === username && member.user.discriminator === discriminator);
	} else {
		member = interaction.guild.members.cache.find(member => member.user.username.toLowerCase() === input);
	}

	return member ? member.user.id : 'User cannot be found';
}

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { isStaff, hasHigherPerms } = require('../utils/isStaff.js');
const { defineTarget } = require('../utils/defineTarget.js');
const prisma = require('../utils/prismaClient.js');
const { getModChannels } = require('../utils/getModChannels.js');
const { colors } = require('../config.json');
const log = require('../utils/log.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('newtag')
		.setDMPermission(false)
		.setDescription('Create a tag for the server')
		.addStringOption(option => option.setName('tag-name').setDescription('What should the tag be called').setRequired(true))
		.addStringOption(option => option.setName('content').setDescription('The content of the tag').setMaxLength(1_900))
		.addAttachmentOption(option => option.setName('attachment').setDescription('Any attachments you want to be added to the tag')),
	async execute(interaction) {
		await interaction.deferReply();
		if (!isStaff(interaction, interaction.member, PermissionFlagsBits.ManageMessages)) return sendReply('main', 'You dont have the necessary permissions to complete this action');

		let tagName = interaction.options.getString('tag-name') ? interaction.options.getString('tag-name') : false;
		let content = interaction.options.getString('content') ? interaction.options.getString('content') : false;
		let attachment = (await interaction.options.getAttachment('attachment')) ? interaction.options.getAttachment('attachment') : false;

		if (!content && !attachment) return sendReply('main', 'You need to provide either content or an attachment for the tag');

		const existingTag = await prisma.tag.findFirst({
			where: {
				name: tagName,
				guildId: interaction.guild.id,
			},
		});

		if (existingTag) {
			return sendReply('main', 'A tag with that name already exists');
		}

		let tagEmbed = new EmbedBuilder().setTitle(`New Tag Added`).setColor(colors.main).setTimestamp();

		if (content) tagEmbed.addFields({ name: 'Content', value: content });
		if (attachment) tagEmbed.addFields({ name: 'Attachment', value: attachment.name });

		let attachmentData = null;
		if (attachment) {
			if (attachment.size > 25_000_000) {
				return sendReply('error', `The attachment is too large. The maximum size is 25MB`);
			}
			try {
				attachmentData = await downloadAttachmentData(attachment.url);
			} catch (e) {
				log.error(e);
				return sendReply('error', `There was an error downloading this attachment: ${e}`);
			}

			if (!attachmentData) return sendReply('error', `There was an error downloading this attachment`);

			if (attachmentData.length > 25_000_000) {
				return sendReply('error', `The attachment is too large. The maximum size is 25MB`);
			}

			if (attachmentData.length === 0) {
				return sendReply('error', `The attachment is empty`);
			}
		}

		await prisma.tag
			.create({
				data: {
					name: tagName,
					guildId: interaction.guild.id,
					content: content ? content : null,
					attachmentName: attachment ? attachment.name : null,
					attachmentData: attachment ? attachmentData : null,
				},
			})
			.then(r => {
				interaction.editReply({ embeds: [tagEmbed] });
			})
			.catch(e => {
				log.error(e);
				return sendReply('error', `There was an error creating the tag: ${e}`);
			});

		async function downloadAttachmentData(attachmentUrl) {
			const response = await fetch(attachmentUrl);
			if (!response.ok) {
				throw new Error(`Failed to download attachment: ${response.statusText}`);
			}
			return response.buffer();
		}

		function sendReply(type, message) {
			let replyEmbed = new EmbedBuilder().setColor(colors[type]).setDescription(message).setTimestamp();

			interaction.editReply({ embeds: [replyEmbed] });
		}
	},
};
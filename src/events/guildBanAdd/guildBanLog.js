const { colors } = require('../../config');
const { EmbedBuilder } = require('discord.js')
const log = require('../../utils/log');
const { getModChannels } = require('../../utils/getModChannels')

async function guildBanLog(ban) {
    const fetchedLogs = await ban.guild.fetchAuditLogs({
        limit: 1,
        type: 'MEMBER_BAN_ADD',
    });
    const banLog = fetchedLogs.entries.first();

    if (!banLog || banLog.target.id !== ban.user.id) return;

    const { executor } = banLog;
    const { target } = banLog;

    if(executor.id === ban.client.user.id) return;

    let aviURL = executor.avatarURL({ extension: 'png', forceStatic: false, size: 1024 }) || executor.defaultAvatarURL;
	let name = executor.username;

    let banEmbed = new EmbedBuilder()
    try {
        banEmbed
        .setColor(colors.main)
        .setTitle('Member Banned')
        .addFields(
            { name: 'User', value: `${target.username} (${target.id})` },
            { name: 'Reason', value: banLog.reason },
            { name: 'Ban Duration', value: "eternity" },
            { name: 'Moderator', value: `${executor.username} (${executor.id})` }
        )
        .setAuthor({ name: name, iconURL: aviURL })
        .setTimestamp();
    }
    catch(e) {
        log.error(`Error forming the ban embed: ${e}`)
    }


	return getModChannels(ban.client, ban.guild.id).main.send({ embeds: [banEmbed], content: `<@${target.id}>` }).catch(e => {
        log.error(`Error sending ban log to guild main log channel: ${e}`)
    })
}

module.exports = { guildBanLog }
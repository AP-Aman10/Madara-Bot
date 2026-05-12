import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import axios from 'axios';
import { createEmbed, errorEmbed } from '../../utils/embeds.js';
import { logger } from '../../utils/logger.js';
import { handleInteractionError } from '../../utils/errorHandler.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

const ACTIVITIES = {
    'youtube': '880218394199220334',
    'poker': '755827207812677713',
    'chess': '832012774040141894',
    'checkers': '832013003968348200',
    'letter-league': '879863686565621790',
    'spellcast': '852509694341283871',
    'sketch': '902271654783242291',
    'blazing8s': '832025144389533716',
    'puttparty': '945737671223947305',
    'landio': '903769130790969345',
    'bobble': '947957217959759964',
    'knowwhat': '976052223358406656'
};

const ACTIVITY_NAMES = {
    'youtube': 'YouTube Together',
    'poker': 'Poker Night',
    'chess': 'Chess in the Park',
    'checkers': 'Checkers in the Park',
    'letter-league': 'Letter League',
    'spellcast': 'SpellCast',
    'sketch': 'Sketch Heads',
    'blazing8s': 'Blazing 8s',
    'puttparty': 'Putt Party',
    'landio': 'Land-io',
    'bobble': 'Bobble League',
    'knowwhat': 'Know What I Mean'
};

export default {
    data: new SlashCommandBuilder()
        .setName('activity')
        .setDescription('Start a Discord Activity or check Blox Fruits stock')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.Connect)

        // Activity Commands
        .addSubcommand(subcommand =>
            subcommand
                .setName('youtube')
                .setDescription('Watch YouTube videos together')
        )

        .addSubcommand(subcommand =>
            subcommand
                .setName('poker')
                .setDescription('Play Poker Night')
        )

        .addSubcommand(subcommand =>
            subcommand
                .setName('chess')
                .setDescription('Play Chess in the Park')
        )

        .addSubcommand(subcommand =>
            subcommand
                .setName('checkers')
                .setDescription('Play Checkers in the Park')
        )

        .addSubcommand(subcommand =>
            subcommand
                .setName('letter-league')
                .setDescription('Play Letter League')
        )

        .addSubcommand(subcommand =>
            subcommand
                .setName('spellcast')
                .setDescription('Play SpellCast')
        )

        .addSubcommand(subcommand =>
            subcommand
                .setName('sketch')
                .setDescription('Play Sketch Heads')
        )

        .addSubcommand(subcommand =>
            subcommand
                .setName('blazing8s')
                .setDescription('Play Blazing 8s')
        )

        .addSubcommand(subcommand =>
            subcommand
                .setName('puttparty')
                .setDescription('Play Putt Party')
        )

        .addSubcommand(subcommand =>
            subcommand
                .setName('landio')
                .setDescription('Play Land-io')
        )

        .addSubcommand(subcommand =>
            subcommand
                .setName('bobble')
                .setDescription('Play Bobble League')
        )

        .addSubcommand(subcommand =>
            subcommand
                .setName('knowwhat')
                .setDescription('Play Know What I Mean')
        )

        // Blox Fruits Stock Command
        .addSubcommand(subcommand =>
            subcommand
                .setName('bloxstock')
                .setDescription('Check current Blox Fruits stock')
        ),

    category: "Voice",

    async execute(interaction) {
        try {
            const deferred = await InteractionHelper.safeDefer(interaction, {
                flags: MessageFlags.Ephemeral
            });

            if (!deferred) return;

            const { member, options } = interaction;
            const command = options.getSubcommand();

            // BLOX FRUITS STOCK
            if (command === 'bloxstock') {
                const response = await axios.get(
                    'https://blox-fruits-stock-fruit.vercel.app/api/stock'
                );

                const data = response.data;

                const normalStock = data.stock.normal?.join('\n') || 'No stock';
                const mirageStock = data.stock.mirage?.join('\n') || 'No stock';

                return await InteractionHelper.safeEditReply(interaction, {
                    embeds: [
                        createEmbed({
                            title: '🍍 Blox Fruits Stock',
                            description:
                                `**Normal Dealer:**\n${normalStock}\n\n` +
                                `**Mirage Dealer:**\n${mirageStock}`,
                            color: 'success'
                        })
                    ]
                });
            }

            // ACTIVITY COMMANDS
            const activityId = ACTIVITIES[command];
            const activityName = ACTIVITY_NAMES[command] || command;

            if (!member.voice.channel) {
                return await InteractionHelper.safeEditReply(interaction, {
                    embeds: [
                        errorEmbed(
                            'Not in Voice Channel',
                            'You need to be in a voice channel to start an activity!'
                        )
                    ]
                });
            }

            const permissions = member.voice.channel.permissionsFor(
                interaction.guild.members.me
            );

            if (!permissions.has('CreateInstantInvite')) {
                return await InteractionHelper.safeEditReply(interaction, {
                    embeds: [
                        errorEmbed(
                            'Missing Permissions',
                            'I need the `Create Invite` permission to start an activity!'
                        )
                    ]
                });
            }

            const invite = await interaction.client.rest.post(
                `/channels/${member.voice.channel.id}/invites`,
                {
                    body: {
                        max_age: 86400,
                        target_type: 2,
                        target_application_id: activityId
                    }
                }
            );

            await InteractionHelper.safeEditReply(interaction, {
                embeds: [
                    createEmbed({
                        title: `🎮 ${activityName}`,
                        description:
                            `Click below to start **${activityName}** in ${member.voice.channel.name}!\n\n` +
                            `[Join ${activityName} Activity](https://discord.gg/${invite.code})`,
                        color: 'success'
                    })
                ]
            });

        } catch (error) {
            logger.error('Command failed', {
                error: error.message,
                stack: error.stack
            });

            if (!interaction.deferred && !interaction.replied) {
                await handleInteractionError(interaction, error, {
                    commandName: 'activity'
                });
            } else {
                await InteractionHelper.safeEditReply(interaction, {
                    embeds: [
                        errorEmbed(
                            'Command Failed',
                            'An error occurred while processing your request.'
                        )
                    ]
                });
            }
        }
    }
};

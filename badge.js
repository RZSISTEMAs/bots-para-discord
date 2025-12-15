require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds
    ]
});

// ID do canal onde o bot deve mandar a resposta bonita
const TARGET_CHANNEL_ID = '1425907303772852366';

// Configuração do Comando Slash
const commands = [
    {
        name: 'verificar',
        description: 'Verifica status para Active Developer Badge (RZSISTEMA)',
    },
    {
        name: 'activedevbadge',
        description: 'Comando alternativo para Active Developer Badge (RZSISTEMA)',
    },
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

client.once('ready', async () => {
    console.log(`✅ Logado como ${client.user.tag}!`);
    console.log('🏅 Registrando comandos Slash Globalmente...');

    try {
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands },
        );
        console.log('✅ Comandos /verificar e /activedevbadge registrados com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao registrar comandos:', error);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'verificar' || interaction.commandName === 'activedevbadge') {
        const commandUsed = interaction.commandName;
        console.log(`[CMD] Comando /${commandUsed} usado por ${interaction.user.tag}`);

        // 1. Responder à interação (Obrigatório para o Badge)
        await interaction.reply({ content: `✅ Comando /${commandUsed} processado! Enviando painel...`, ephemeral: true });

        // 2. Enviar Embed Bonito no Canal Específico
        try {
            const channel = await client.channels.fetch(TARGET_CHANNEL_ID);
            if (channel) {
                const embed = new EmbedBuilder()
                    .setColor(0xF1C40F) // Dourado (Gold)
                    .setTitle('🏅 ACTIVE DEVELOPER BADGE')
                    .setDescription(`✅ **Comando Slash Executado com Sucesso!**\n\n👤 **Usuário:** ${interaction.user}\n📅 **Data:** ${new Date().toLocaleString('pt-BR')}\n⌨️ **Comando:** /${commandUsed}`)
                    .addFields(
                        { name: 'Status', value: 'Elegível para Insígnia', inline: true },
                        { name: 'Sistema', value: 'RZSISTEMA Bot', inline: true }
                    )
                    .setThumbnail(interaction.user.displayAvatarURL())
                    .setFooter({ text: 'RZSISTEMA.com.br', iconURL: client.user.displayAvatarURL() })
                    .setTimestamp();

                await channel.send({ embeds: [embed] });
                console.log(`✅ Embed enviado para o canal ${channel.name}`);
            } else {
                console.error(`❌ Canal alvo ${TARGET_CHANNEL_ID} não encontrado.`);
            }
        } catch (error) {
            console.error('❌ Erro ao enviar para o canal:', error);
        }
    }
});

client.login(process.env.DISCORD_TOKEN);

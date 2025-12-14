require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ChannelType, PermissionsBitField } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

const TARGET_CHANNEL_ID = '1440801931126636767'; // Canal de texto para log

client.once('ready', async () => {
    console.log(`✅ Logado como ${client.user.tag}!`);
    console.log('📊 Atualizando CONTADOR DE MEMBROS...');

    try {
        const guild = await client.guilds.cache.first(); // Pega o primeiro servidor (assumindo que o bot está em 1)
        if (!guild) {
            console.error("❌ Bot não está em nenhum servidor!");
            process.exit(1);
        }

        // Fetch para garantir contagem atualizada
        const currentGuild = await guild.fetch();
        const memberCount = currentGuild.memberCount;
        const channelName = `📊 Membros: ${memberCount}`;

        console.log(`🔢 Contagem atual: ${memberCount}`);

        // Procura se já existe o canal, senão cria
        let counterChannel = guild.channels.cache.find(c => c.name.startsWith('📊 Membros:'));

        if (!counterChannel) {
            console.log('🔨 Criando canal de contador...');
            counterChannel = await guild.channels.create({
                name: channelName,
                type: ChannelType.GuildVoice, // Canal de voz para ficar no topo e não poluir
                permissionOverwrites: [
                    {
                        id: guild.id,
                        deny: [PermissionsBitField.Flags.Connect], // Ninguém pode entrar, só ver
                        allow: [PermissionsBitField.Flags.ViewChannel]
                    }
                ]
            });
            console.log('✅ Canal criado com sucesso.');
        } else {
            console.log(`🔄 Atualizando canal existente: ${counterChannel.name} -> ${channelName}`);
            await counterChannel.setName(channelName);
            console.log('✅ Canal atualizado.');
        }

        // Notificar no chat de texto
        const logChannel = await client.channels.fetch(TARGET_CHANNEL_ID);
        if (logChannel) {
            const embed = new EmbedBuilder()
                .setColor(0x00FFFF) // Ciano
                .setTitle('📊 ATUALIZAÇÃO DE ESTATÍSTICAS')
                .setDescription(`✅ **Contador atualizado com sucesso!**\n\n📈 **Total de Membros:** ${memberCount}`)
                .addFields(
                    { name: 'Canal Atualizado', value: counterChannel.name, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'RZSISTEMA.com.br', iconURL: client.user.displayAvatarURL() });

            await logChannel.send({ embeds: [embed] });
        }

        console.log('✅ Tudo pronto! Encerrando em 5 segundos...');
        setTimeout(() => process.exit(0), 5000);

    } catch (error) {
        console.error('❌ Erro Fatal:', error);
        process.exit(1);
    }
});

client.login(process.env.DISCORD_TOKEN);

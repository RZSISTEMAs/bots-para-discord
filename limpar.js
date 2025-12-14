require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ChannelType, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessages
    ]
});

// ID do canal ALVO (que será limpo)
const TARGET_CHANNEL_ID = '1449595922370793492';
const LOG_CHANNEL_NAME = 'logs-chat';

client.once('ready', async () => {
    console.log(`✅ Logado como ${client.user.tag}!`);
    console.log('🧹 Iniciando PROTOCOLO DE LIMPEZA...');

    try {
        const targetChannel = await client.channels.fetch(TARGET_CHANNEL_ID);
        if (!targetChannel) {
            console.error('❌ Canal alvo não encontrado!');
            process.exit(1);
        }

        console.log(`📂 Canal Alvo: ${targetChannel.name}`);

        // ---------------------------------------------------------
        // 1. FAZER BACKUP (Ler todas as mensagens)
        // ---------------------------------------------------------
        console.log('📥 Baixando histórico de mensagens (pode demorar)...');
        let allMessages = [];
        let lastId;

        while (true) {
            const options = { limit: 100 };
            if (lastId) options.before = lastId;

            const messages = await targetChannel.messages.fetch(options);
            if (messages.size === 0) break;

            messages.forEach(msg => {
                const date = msg.createdAt.toLocaleString('pt-BR');
                const author = msg.author.tag;
                const content = msg.content || '[Anexo/Embed]';
                allMessages.push(`[${date}] ${author}: ${content}`);
            });

            lastId = messages.last().id;
            console.log(`   ... lidas ${allMessages.length} mensagens.`);
        }

        // Salvar em arquivo
        const logFileName = `chat_backup_${Date.now()}.txt`;
        const logContent = allMessages.reverse().join('\n'); // Deixar em ordem cronológica
        fs.writeFileSync(logFileName, logContent || 'Nenhuma mensagem encontrada.');
        console.log(`💾 Backup salvo em: ${logFileName}`);

        // ---------------------------------------------------------
        // 2. ENVIAR PARA CANAL DE LOG
        // ---------------------------------------------------------
        const guild = targetChannel.guild;
        let logChannel = guild.channels.cache.find(c => c.name === LOG_CHANNEL_NAME);

        if (!logChannel) {
            console.log(`🔨 Criando canal de log: ${LOG_CHANNEL_NAME}...`);
            logChannel = await guild.channels.create({
                name: LOG_CHANNEL_NAME,
                type: ChannelType.GuildText,
                parent: targetChannel.parent, // Mesma categoria
                position: targetChannel.position + 1,
                permissionOverwrites: [
                    {
                        id: guild.id,
                        deny: [PermissionsBitField.Flags.ViewChannel], // Privado para todos
                    },
                    // Adicione permissões para admins se necessário
                ],
            });
        }

        console.log(`📤 Enviando log para #${logChannel.name}...`);
        await logChannel.send({
            content: `🗃️ **Backup do chat** #${targetChannel.name} realizado em ${new Date().toLocaleString('pt-BR')}`,
            files: [logFileName]
        });

        // ---------------------------------------------------------
        // 3. LIMPAR O CHAT
        // ---------------------------------------------------------
        console.log('🔥 Iniciando LIMPEZA (Bulk Delete)...');
        
        // Discord só permite bulkDelete de mensagens < 14 dias.
        // Vamos tentar deletar tudo o que der.
        let deletedCount = 0;
        
        try {
            // Loop para deletar em lotes de 100
            let attempts = 0;
            while (true) {
                // Fetch de mensagens novamente para garantir que estamos deletando o que existe
                const fetched = await targetChannel.messages.fetch({ limit: 100 });
                if (fetched.size === 0) break;

                // Tenta deletar
                const deleted = await targetChannel.bulkDelete(fetched, true); // true = filtrar mensagens antigas (>14 dias)
                
                if (deleted.size === 0) {
                    // Sobraram apenas mensagens antigas (> 14 dias) que o bulkDelete ignora
                    console.log('⚠️ Mensagens restantes são muito antigas (>14 dias) para exclusão em massa.');
                    console.log('⚠️ Tentando deletar uma por uma (mais lento)...');
                    
                    for (const msg of fetched.values()) {
                        await msg.delete().catch(() => {});
                        deletedCount++;
                        // Pausa para evitar rate limit
                        await new Promise(r => setTimeout(r, 1000));
                    }
                    // Se rodou o loop manual, verifique novamente no proximo while
                } else {
                    deletedCount += deleted.size;
                    console.log(`   ... deletadas ${deletedCount} mensagens.`);
                }
                
                await new Promise(r => setTimeout(r, 1000)); // Calma lá Discord
                attempts++;
                if (attempts > 50) break; // Segurança contra loop infinito
            }
        } catch (err) {
            console.error('Erro durante a limpeza:', err);
        }

        // ---------------------------------------------------------
        // 4. MENSAGEM FINAL
        // ---------------------------------------------------------
        const finalEmbed = new EmbedBuilder()
            .setColor(0xA020F0) // Roxo Style
            .setTitle('✨ RZLIMPEZA')
            .setDescription(`✅ **A RZLIMPEZA passou limpando tudo!**\n\n🗑️ **Mensagens apagadas:** ${deletedCount}\n🗃️ **Log salvo em:** <#${logChannel.id}>`)
            .setImage('https://media.discordapp.net/attachments/1141151534399377450/1184646734346535032/BANNER_LOJA.gif')
            .setFooter({ text: 'RZSISTEMA.com.br', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        await targetChannel.send({ embeds: [finalEmbed] });

        // Deletar arquivo local temporário
        fs.unlinkSync(logFileName);

        console.log('✅ Processo finalizado com sucesso!');
        setTimeout(() => process.exit(0), 5000);

    } catch (error) {
        console.error('❌ Erro Fatal:', error);
        process.exit(1);
    }
});

client.login(process.env.DISCORD_TOKEN);

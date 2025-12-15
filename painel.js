require('dotenv').config();
const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    REST, 
    Routes, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    StringSelectMenuBuilder,
    PermissionsBitField,
    ChannelType
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Configuração
const ADMIN_ROLE_ID = '1437609235943919636';

// Armazenamento Temporário
const drafts = new Map(); // Rascunhos de msg

const commands = [
    {
        name: 'painel',
        description: 'Abre o RZSISTEMA Admin Suite (Requer Permissão)',
    },
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

client.once('ready', async () => {
    console.log(`✅ Logado como ${client.user.tag}!`);
    console.log('🛡️ Iniciando RZSISTEMA Admin Suite...');
    
    const guild = client.guilds.cache.first();
    if (!guild) {
        console.error('❌ Bot não está em nenhum servidor!');
        return;
    }

    try {
        // Registro Instantâneo
        await rest.put(
            Routes.applicationGuildCommands(client.user.id, guild.id), 
            { body: commands }
        );
        console.log(`✅ Suite carregada no servidor: ${guild.name}`);
    } catch (error) {
        console.error('❌ Erro no registro:', error);
    }
});

// --- HELPER FUNCTIONS ---

function getDraft(userId) {
    if (!drafts.has(userId)) {
        drafts.set(userId, {
            title: 'Título do Anúncio',
            description: 'Escreva sua mensagem aqui...',
            color: '#00FFFF',
            image: null,
            thumbnail: null,
            footer: 'RZSISTEMA',
            buttons: [] 
        });
    }
    return drafts.get(userId);
}

function generatePreview(draft) {
    const embed = new EmbedBuilder()
        .setTitle(draft.title)
        .setDescription(draft.description)
        .setColor(draft.color)
        .setFooter({ text: draft.footer });

    if (draft.image) embed.setImage(draft.image);
    if (draft.thumbnail) embed.setThumbnail(draft.thumbnail);

    const components = [];
    if (draft.buttons.length > 0) {
        const row = new ActionRowBuilder();
        draft.buttons.forEach(btn => {
            const button = new ButtonBuilder()
                .setLabel(btn.label)
                .setStyle(btn.style);
            
            if (btn.url) button.setURL(btn.url);
            if (btn.customId) button.setCustomId(btn.customId);
            
            row.addComponents(button);
        });
        components.push(row);
    }

    return { embeds: [embed], components };
}

// --- MENUS E PAINÉIS ---

function getMainMenu() {
    const embed = new EmbedBuilder()
        .setColor(0x2B2D31)
        .setTitle('🛡️ RZSISTEMA ADMIN SUITE')
        .setDescription('Boas-vindas ao painel de controle central.\nSelecione um módulo abaixo:')
        .setThumbnail('https://cdn-icons-png.flaticon.com/512/906/906343.png') // Icone generico de admin
        .setFooter({ text: 'Sistema de Alta Tecnologia' });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('mod_builder').setLabel('📢 Criador de Embeds').setStyle(ButtonStyle.Primary).setEmoji('📢'),
        new ButtonBuilder().setCustomId('mod_moderation').setLabel('🛡️ Moderação').setStyle(ButtonStyle.Danger).setEmoji('🛡️'),
        new ButtonBuilder().setCustomId('mod_close').setLabel('Sair').setStyle(ButtonStyle.Secondary)
    );

    return { embeds: [embed], components: [row] };
}

function getBuilderPanel() {
    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('bld_edit_content').setLabel('📝 Texto & Cor').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('bld_edit_media').setLabel('🖼️ Imagem & Footer').setStyle(ButtonStyle.Secondary),
    );
    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('bld_add_btn').setLabel('➕ Botão').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('bld_clear_btn').setLabel('🗑️ Limpar Btn').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('bld_send').setLabel('🚀 ENVIAR').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('menu_home').setLabel('🏠 Voltar').setStyle(ButtonStyle.Secondary),
    );
    return [row1, row2];
}

function getModPanel() {
    const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('🛡️ MÓDULO DE MODERAÇÃO')
        .setDescription('**CUIDADO:** As ações aqui são aplicadas imediatamente.');

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('mod_ban').setLabel('🔨 Banir Usuário').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('mod_kick').setLabel('🦶 Expulsar').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('mod_clear').setLabel('🧹 Limpar Chat').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('menu_home').setLabel('🏠 Voltar').setStyle(ButtonStyle.Secondary),
    );
    return { embeds: [embed], components: [row] };
}

// --- INTERACTION HANDLER ---

client.on('interactionCreate', async interaction => {
    // Tratamento de Erros Global
    try {
        // --- SLASH COMMAND ---
        if (interaction.isChatInputCommand()) {
            if (interaction.commandName === 'painel') {
                const member = interaction.member;
                if (!member.roles.cache.has(ADMIN_ROLE_ID)) {
                    return interaction.reply({ content: '⛔ **Acesso Negado.** Identificação inválida.', ephemeral: true });
                }
                const menu = getMainMenu();
                await interaction.reply({ ...menu, ephemeral: true });
            }
        }

        // --- BUTTONS ---
        if (interaction.isButton()) {
            const id = interaction.customId;

            // Navegação
            if (id === 'menu_home') {
                await interaction.update(getMainMenu());
                return;
            }
            if (id === 'mod_close') {
                await interaction.deleteReply();
                return;
            }

            // Módulo: Criador (Builder)
            if (id === 'mod_builder') {
                const draft = getDraft(interaction.user.id);
                const preview = generatePreview(draft);
                await interaction.update({ 
                    content: '🛠️ **Editor de Mensagens 2.0**',
                    embeds: preview.embeds, 
                    components: [...getBuilderPanel()] // Note: preview buttons (if any) are not shown in editor control, usually separate
                });
                return;
            }

            // Builder Actions
            if (id === 'bld_edit_content') {
                const draft = getDraft(interaction.user.id);
                const modal = new ModalBuilder().setCustomId('modal_bld_content').setTitle('Conteúdo Principal');
                modal.addComponents(
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('in_title').setLabel('Título').setStyle(TextInputStyle.Short).setValue(draft.title).setRequired(false)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('in_desc').setLabel('Descrição').setStyle(TextInputStyle.Paragraph).setValue(draft.description).setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('in_color').setLabel('Cor Hex (ex: #FF0000)').setStyle(TextInputStyle.Short).setValue(draft.color).setRequired(false))
                );
                await interaction.showModal(modal);
            }
            
            if (id === 'bld_edit_media') {
                const draft = getDraft(interaction.user.id);
                const modal = new ModalBuilder().setCustomId('modal_bld_media').setTitle('Mídia e Rodapé');
                modal.addComponents(
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('in_img').setLabel('URL da Imagem Grande').setStyle(TextInputStyle.Short).setValue(draft.image || '').setRequired(false)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('in_thumb').setLabel('URL da Miniatura (Thumbnail)').setStyle(TextInputStyle.Short).setValue(draft.thumbnail || '').setRequired(false)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('in_footer').setLabel('Texto do Rodapé').setStyle(TextInputStyle.Short).setValue(draft.footer).setRequired(false))
                );
                await interaction.showModal(modal);
            }

            if (id === 'bld_add_btn') {
                const row = new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder().setCustomId('sel_btn_type').setPlaceholder('Selecione o tipo de botão')
                        .addOptions(
                            { label: '🔗 Link Externo', value: 'link', description: 'Abre um site no navegador' },
                            { label: '🎭 Atribuir Cargo (Auto-Role)', value: 'role', description: 'Botão para ganhar/perder cargo' },
                            { label: '✅ Verificação Simples', value: 'verify', description: 'Botão de interação simples' }
                        )
                );
                await interaction.reply({ content: 'Qual tipo de botão?', components: [row], ephemeral: true });
            }

            if (id === 'bld_clear_btn') {
                const draft = getDraft(interaction.user.id);
                draft.buttons = [];
                const preview = generatePreview(draft);
                await interaction.update({ embeds: preview.embeds, components: [...getBuilderPanel()] });
            }

            if (id === 'bld_send') {
                const modal = new ModalBuilder().setCustomId('modal_send_final').setTitle('Enviar Mensagem');
                modal.addComponents(new ActionRowBuilder().addComponents(
                    new TextInputBuilder().setCustomId('in_channel_id').setLabel('ID do Canal de Destino').setStyle(TextInputStyle.Short).setPlaceholder('Cole o ID aqui')
                ));
                await interaction.showModal(modal);
            }

            // Módulo: Moderação
            if (id === 'mod_moderation') {
                await interaction.update(getModPanel());
                return;
            }

            if (id === 'mod_ban') {
                const modal = new ModalBuilder().setCustomId('modal_mod_ban').setTitle('Banir Usuário');
                modal.addComponents(
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('in_user_id').setLabel('ID do Usuário').setStyle(TextInputStyle.Short)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('in_reason').setLabel('Motivo').setStyle(TextInputStyle.Paragraph))
                );
                await interaction.showModal(modal);
            }

            if (id === 'mod_kick') {
                const modal = new ModalBuilder().setCustomId('modal_mod_kick').setTitle('Expulsar Usuário');
                modal.addComponents(
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('in_user_id').setLabel('ID do Usuário').setStyle(TextInputStyle.Short)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('in_reason').setLabel('Motivo').setStyle(TextInputStyle.Paragraph))
                );
                await interaction.showModal(modal);
            }

            if (id === 'mod_clear') {
                const modal = new ModalBuilder().setCustomId('modal_mod_clear').setTitle('Limpar Chat');
                modal.addComponents(
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('in_amount').setLabel('Quantidade (1-100)').setStyle(TextInputStyle.Short))
                );
                await interaction.showModal(modal);
            }

            // --- BOTÕES PÚBLICOS (INTERAÇÕES DO USUÁRIO FINAL) ---
            if (id.startsWith('role_')) {
                const roleId = id.split('_')[1];
                const member = interaction.member;
                const role = interaction.guild.roles.cache.get(roleId);
                
                if (!role) return interaction.reply({ content: '❌ Cargo não encontrado (pode ter sido deletado).', ephemeral: true });

                if (member.roles.cache.has(roleId)) {
                    await member.roles.remove(role);
                    await interaction.reply({ content: `❌ Cargo **${role.name}** removido.`, ephemeral: true });
                } else {
                    await member.roles.add(role);
                    await interaction.reply({ content: `✅ Cargo **${role.name}** adicionado!`, ephemeral: true });
                }
            }
            
            if (id === 'btn_verify_simple') {
                await interaction.reply({ content: '✅ **Verificado!** Você interagiu com o sistema.', ephemeral: true });
            }
        }

        // --- SELECT MENU ---
        if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'sel_btn_type') {
                const type = interaction.values[0];
                if (type === 'link') {
                    const modal = new ModalBuilder().setCustomId('modal_btn_link').setTitle('Configurar Botão Link');
                    modal.addComponents(
                        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('in_lbl').setLabel('Texto do Botão').setStyle(TextInputStyle.Short)),
                        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('in_url').setLabel('URL (https://...)').setStyle(TextInputStyle.Short))
                    );
                    await interaction.showModal(modal);
                } else if (type === 'role') {
                    const modal = new ModalBuilder().setCustomId('modal_btn_role').setTitle('Configurar Botão Cargo');
                    modal.addComponents(
                        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('in_lbl').setLabel('Texto do Botão').setStyle(TextInputStyle.Short)),
                        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('in_role_id').setLabel('ID do Cargo').setStyle(TextInputStyle.Short))
                    );
                    await interaction.showModal(modal);
                } else if (type === 'verify') {
                    const draft = getDraft(interaction.user.id);
                    if (draft.buttons.length >= 5) return interaction.reply({ content: 'Limite de botões atingido.', ephemeral: true });
                    draft.buttons.push({ label: '✅ Verificar', style: ButtonStyle.Success, customId: 'btn_verify_simple' });
                    await interaction.reply({ content: 'Botão adicionado!', ephemeral: true });
                    // Idealmente atualizar o painel, mas o reply efêmero bloqueia update direto fácil. Pede update manual.
                }
            }
        }

        // --- MODALS ---
        if (interaction.isModalSubmit()) {
            const id = interaction.customId;
            const draft = getDraft(interaction.user.id);

            // Builder Updates
            if (id === 'modal_bld_content') {
                draft.title = interaction.fields.getTextInputValue('in_title');
                draft.description = interaction.fields.getTextInputValue('in_desc');
                draft.color = interaction.fields.getTextInputValue('in_color') || '#00FFFF';
                const preview = generatePreview(draft);
                await interaction.update({ embeds: preview.embeds, components: [...getBuilderPanel()] });
            }
            if (id === 'modal_bld_media') {
                draft.image = interaction.fields.getTextInputValue('in_img') || null;
                draft.thumbnail = interaction.fields.getTextInputValue('in_thumb') || null;
                draft.footer = interaction.fields.getTextInputValue('in_footer') || 'RZSISTEMA';
                const preview = generatePreview(draft);
                await interaction.update({ embeds: preview.embeds, components: [...getBuilderPanel()] });
            }
            
            // Buttons Adding
            if (id === 'modal_btn_link') {
                draft.buttons.push({
                    label: interaction.fields.getTextInputValue('in_lbl'),
                    style: ButtonStyle.Link,
                    url: interaction.fields.getTextInputValue('in_url')
                });
                await interaction.reply({ content: '✅ Botão Link adicionado.', ephemeral: true });
            }
            if (id === 'modal_btn_role') {
                const roleId = interaction.fields.getTextInputValue('in_role_id');
                draft.buttons.push({
                    label: interaction.fields.getTextInputValue('in_lbl'),
                    style: ButtonStyle.Primary,
                    customId: `role_${roleId}`
                });
                await interaction.reply({ content: '✅ Botão Cargo adicionado.', ephemeral: true });
            }

            // Send Final
            if (id === 'modal_send_final') {
                const cid = interaction.fields.getTextInputValue('in_channel_id');
                const channel = await client.channels.fetch(cid).catch(() => null);
                if (!channel) return interaction.reply({ content: '❌ Canal inválido.', ephemeral: true });

                const finalMsg = generatePreview(draft);
                await channel.send(finalMsg);
                await interaction.reply({ content: `🚀 Enviado com sucesso em ${channel}!`, ephemeral: true });
            }

            // MODERATION ACTIONS
            if (id === 'modal_mod_ban') {
                const uid = interaction.fields.getTextInputValue('in_user_id');
                const reason = interaction.fields.getTextInputValue('in_reason');
                try {
                    await interaction.guild.members.ban(uid, { reason });
                    await interaction.reply({ content: `🚨 **BANIDO:** Usuário ${uid} banido com sucesso.`, ephemeral: true });
                } catch (e) {
                    await interaction.reply({ content: `❌ Falha ao banir: ${e.message}`, ephemeral: true });
                }
            }
            if (id === 'modal_mod_kick') {
                const uid = interaction.fields.getTextInputValue('in_user_id');
                const reason = interaction.fields.getTextInputValue('in_reason');
                try {
                    const memberTarget = await interaction.guild.members.fetch(uid);
                    await memberTarget.kick(reason);
                    await interaction.reply({ content: `🦶 **KICK:** Usuário ${uid} expulso.`, ephemeral: true });
                } catch (e) {
                    await interaction.reply({ content: `❌ Falha ao expulsar: ${e.message}`, ephemeral: true });
                }
            }
            if (id === 'modal_mod_clear') {
                const amount = parseInt(interaction.fields.getTextInputValue('in_amount'));
                if (isNaN(amount) || amount < 1 || amount > 100) return interaction.reply({ content: '❌ Quantidade inválida (1-100).', ephemeral: true });
                
                const channel = interaction.channel;
                await channel.bulkDelete(amount, true);
                await interaction.reply({ content: `🧹 **CLEAN:** ${amount} mensagens apagadas.`, ephemeral: true });
            }
        }

    } catch (error) {
        console.error('❌ Erro na interação:', error);
        if (!interaction.replied) await interaction.reply({ content: '❌ Erro interno no sistema.', ephemeral: true });
    }
});

client.login(process.env.DISCORD_TOKEN);

require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Configuração
const TARGET_CHANNEL_ID = '1450154449044508694';

// Estado do Jogo
let isGameRunning = false;
let forceFinish = false;
let forceStop = false;
let scores = new Map();

// Banco de Perguntas (100 Perguntas)
const questions = [
    { q: 'Qual a capital da França?', a: ['paris'] },
    { q: 'Qual a fórmula química da água?', a: ['h2o'] },
    { q: 'Quem pintou a Mona Lisa?', a: ['da vinci', 'leonardo da vinci'] },
    { q: 'Qual o planeta mais próximo do Sol?', a: ['mercurio', 'mercúrio'] },
    { q: 'Quantos lados tem um triângulo?', a: ['3', 'tres', 'três'] },
    { q: 'Qual a linguagem de programação usada neste bot?', a: ['javascript', 'js', 'node', 'node.js'] },
    { q: 'Em que ano o homem pisou na Lua pela primeira vez?', a: ['1969'] },
    { q: 'Qual é o maior animal do mundo?', a: ['baleia azul', 'baleia-azul'] },
    { q: 'Qual a cor da caixa preta do avião?', a: ['laranja'] },
    { q: 'Quem descobriu o Brasil?', a: ['pedro alvares cabral', 'cabral'] },
    { q: 'Quantos segundos tem um minuto?', a: ['60'] },
    { q: 'Qual o nome do encanador mais famoso dos games?', a: ['mario', 'super mario'] },
    { q: 'Qual é o metal líquido à temperatura ambiente?', a: ['mercurio', 'mercúrio'] },
    { q: 'Quem escreveu Dom Casmurro?', a: ['machado de assis'] },
    { q: 'Qual é a moeda do Japão?', a: ['iene', 'yen'] },
    { q: 'Quantas cores tem o arco-íris?', a: ['7', 'sete'] },
    { q: 'Qual o maior país do mundo em extensão territorial?', a: ['russia', 'rússia'] },
    { q: 'Qual o nome da empresa dona do Windows?', a: ['microsoft'] },
    { q: 'O que significa CPU?', a: ['unidade central de processamento', 'central processing unit'] },
    { q: 'Quem é o fundador da Tesla?', a: ['elon musk'] },
    { q: 'Qual o símbolo químico do Ouro?', a: ['au'] },
    { q: 'Em que continente fica o Egito?', a: ['africa', 'áfrica'] },
    { q: 'Qual o animal mais rápido do mundo (terrestre)?', a: ['guepardo', 'cheetah'] },
    { q: 'Qual a raiz quadrada de 64?', a: ['8'] },
    { q: 'Que personagem vive num abacaxi no fundo do mar?', a: ['bob esponja'] },
    { q: 'Qual o nome do super-herói que é um morcego?', a: ['batman'] },
    { q: 'Qual a capital dos Estados Unidos?', a: ['washington', 'washington dc'] },
    { q: 'Quantos jogadores tem num time de futebol (em campo)?', a: ['11', 'onze'] },
    { q: 'Qual é o oposto de "Digital"?', a: ['analogico', 'analógico'] },
    { q: 'Qual o nome deste bot de sistema?', a: ['rzsistema'] },
    // Novas perguntas para chegar a 100
    { q: 'Qual é o maior planeta do sistema solar?', a: ['jupiter', 'júpiter'] },
    { q: 'Quem escreveu Harry Potter?', a: ['jk rowling', 'j.k. rowling'] },
    { q: 'Qual é a capital da Espanha?', a: ['madrid', 'madri'] },
    { q: 'O que a abelha produz?', a: ['mel'] },
    { q: 'Quantos dias tem um ano bissexto?', a: ['366'] },
    { q: 'Qual é o país do sushi?', a: ['japao', 'japão'] },
    { q: 'Qual é o nome do criador do Facebook?', a: ['mark zuckerberg', 'zuckerberg'] },
    { q: 'Qual é a capital da Itália?', a: ['roma'] },
    { q: 'Quem é o rei do futebol?', a: ['pele', 'pelé'] },
    { q: 'Qual é o animal símbolo da Austrália?', a: ['canguru'] },
    { q: 'Qual é o menor país do mundo?', a: ['vaticano'] },
    { q: 'Qual é o elemento químico mais abundante no universo?', a: ['hidrogenio', 'hidrogênio'] },
    { q: 'Quantos continentes existem?', a: ['6', 'seis', '7', 'sete'] }, // Depende do modelo, aceita ambos
    { q: 'Qual é o maior oceano do mundo?', a: ['pacifico', 'pacífico'] },
    { q: 'Quem pintou o teto da Capela Sistina?', a: ['michelangelo'] },
    { q: 'Qual é a capital da Alemanha?', a: ['berlim'] },
    { q: 'Qual o nome do rato mais famoso da Disney?', a: ['mickey', 'mickey mouse'] },
    { q: 'Qual é a capital da Argentina?', a: ['buenos aires'] },
    { q: 'O que o panda come?', a: ['bambu'] },
    { q: 'Qual é o nome do satélite natural da Terra?', a: ['lua'] },
    { q: 'Quantos estados tem o Brasil?', a: ['26'] },
    { q: 'Qual é a capital do Reino Unido?', a: ['londres'] },
    { q: 'Quem descobriu a América?', a: ['cristovao colombo', 'colombo'] },
    { q: 'Qual é o animal mais alto do mundo?', a: ['girafa'] },
    { q: 'Qual é o esporte mais popular do mundo?', a: ['futebol'] },
    { q: 'Qual é a capital da China?', a: ['pequim', 'beijing'] },
    { q: 'Quem foi o primeiro presidente dos EUA?', a: ['george washington'] },
    { q: 'Qual é o maior deserto do mundo?', a: ['saara', 'antartida', 'antártida'] },
    { q: 'Qual é a moeda dos EUA?', a: ['dolar', 'dólar'] },
    { q: 'Qual é a capital da Rússia?', a: ['moscou'] },
    { q: 'Quem inventou a lâmpada?', a: ['thomas edison', 'edison'] },
    { q: 'Qual é a montanha mais alta do mundo?', a: ['everest'] },
    { q: 'Qual é o idioma mais falado do mundo?', a: ['mandarim', 'ingles', 'inglês'] }, // Mandarim nativo, Ingles global
    { q: 'Qual é a capital do Canadá?', a: ['ottawa'] },
    { q: 'Quem é o deus do trovão na mitologia nórdica?', a: ['thor'] },
    { q: 'Qual é o nome do navio que afundou em 1912?', a: ['titanic'] },
    { q: 'Qual é a capital da Austrália?', a: ['canberra'] },
    { q: 'Quem escreveu Romeu e Julieta?', a: ['shakespeare', 'william shakespeare'] },
    { q: 'Qual é o maior mamífero terrestre?', a: ['elefante africano', 'elefante'] },
    { q: 'Qual é a capital do Egito?', a: ['cairo'] },
    { q: 'Quem pintou a "Noite Estrelada"?', a: ['van gogh'] },
    { q: 'Qual é o país do tango?', a: ['argentina'] },
    { q: 'Quem é o patrono do exército brasileiro?', a: ['duque de caxias'] },
    { q: 'Qual é a capital da Índia?', a: ['nova delhi', 'nova deli'] },
    { q: 'Qual é o nome do melhor amigo do Bob Esponja?', a: ['patrick'] },
    { q: 'Qual é a capital do México?', a: ['cidade do mexico', 'cidade do méxico'] },
    { q: 'Quem é o criador da Turma da Mônica?', a: ['mauricio de sousa'] },
    { q: 'Qual é a capital da Coreia do Sul?', a: ['seul'] },
    { q: 'Quantos anéis tem a bandeira olímpica?', a: ['5', 'cinco'] },
    { q: 'Qual é o nome do vampiro mais famoso?', a: ['dracula', 'drácula'] },
    { q: 'Qual é a capital da Turquia?', a: ['ancara', 'ankara'] },
    { q: 'Quem inventou o avião (segundo brasileiros)?', a: ['santos dumont'] },
    { q: 'Qual é a capital da Grécia?', a: ['atenas'] },
    { q: 'Qual é o nome da boneca mais famosa do mundo?', a: ['barbie'] },
    { q: 'Qual é a capital da Holanda?', a: ['amsterdam', 'amsterdã'] },
    { q: 'Quem é o vocalista do Queen?', a: ['freddie mercury'] },
    { q: 'Qual é a capital da Suíça?', a: ['berna'] },
    { q: 'Qual é o nome do cachorro do Mickey?', a: ['pluto'] },
    { q: 'Qual é a capital da Suécia?', a: ['estocolmo'] },
    { q: 'Qual é o planeta vermelho?', a: ['marte'] },
    { q: 'Quanto é 7 x 8?', a: ['56'] },
    { q: 'Qual é a capital da Noruega?', a: ['oslo'] },
    { q: 'Quem foi o primeiro homem no espaço?', a: ['yuri gagarin'] },
    { q: 'Qual é a capital da Bélgica?', a: ['bruxelas'] },
    { q: 'Qual é o nome do leão de Nárnia?', a: ['aslan'] },
    { q: 'Qual é a capital de Portugal?', a: ['lisboa'] },
    { q: 'Quem é o inimigo do Batman?', a: ['coringa', 'joker'] },
    { q: 'Qual é a capital da Colômbia?', a: ['bogota', 'bogotá'] },
    { q: 'Qual é o país mais populoso do mundo?', a: ['india', 'índia'] }, // India passou China recentemente
    { q: 'Qual é a capital do Chile?', a: ['santiago'] }
];

// Registro de Comandos
const commands = [
    {
        name: 'comecarjogo',
        description: 'Inicia o Quiz RZSISTEMA (100 Perguntas)',
    },
    {
        name: 'pararjogo',
        description: '🛑 CANCELA o jogo atual imediatamente (Sem vencedor)',
    },
    {
        name: 'finalizarjogo',
        description: '🏁 ENCERRA o jogo atual e mostra o Ranking',
    },
    {
        name: 'pontuacao',
        description: '📊 Mostra o Ranking parcial atual',
    }
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

client.once('ready', async () => {
    console.log(`✅ Logado como ${client.user.tag}!`);
    console.log('🎮 Atualizando comandos de jogo...');
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('✅ Comandos de Jogo registrados!');
    } catch (error) {
        console.error('❌ Erro no registro:', error);
    }
});

// Funções Auxiliares
function getRankingText() {
    if (scores.size === 0) return 'Ninguém pontuou ainda...';
    
    const sortedScores = [...scores.entries()].sort((a, b) => b[1] - a[1]);
    return sortedScores.map((entry, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🔹';
        return `${medal} <@${entry[0]}>: **${entry[1]}** pontos`;
    }).join('\n');
}

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    // Verificar Canal
    if (interaction.channelId !== TARGET_CHANNEL_ID) {
        return interaction.reply({ content: `❌ Jogo permitido apenas em <#${TARGET_CHANNEL_ID}>!`, ephemeral: true });
    }

    const command = interaction.commandName;

    // COMANDO: PARAR JOGO
    if (command === 'pararjogo') {
        if (!isGameRunning) return interaction.reply({ content: '⚠️ Nenhum jogo rodando.', ephemeral: true });
        
        forceStop = true;
        await interaction.reply('🛑 **JOGO CANCELADO PELO ADMINISTRADOR!**');
        return;
    }

    // COMANDO: FINALIZAR JOGO
    if (command === 'finalizarjogo') {
        if (!isGameRunning) return interaction.reply({ content: '⚠️ Nenhum jogo rodando.', ephemeral: true });
        
        forceFinish = true;
        await interaction.reply('🏁 **ENCERRANDO JOGO... O Ranking será exibido!**');
        return;
    }

    // COMANDO: PONTUAÇÃO
    if (command === 'pontuacao') {
        if (!isGameRunning && scores.size === 0) return interaction.reply({ content: '⚠️ Sem dados de pontuação recente.', ephemeral: true });
        
        const rankEmbed = new EmbedBuilder()
            .setColor(0x00FFFF)
            .setTitle('📊 PONTUAÇÃO PARCIAL')
            .setDescription(getRankingText())
            .setFooter({ text: 'RZSISTEMA' });
            
        await interaction.reply({ embeds: [rankEmbed] });
        return;
    }

    // COMANDO: COMEÇAR JOGO
    if (command === 'comecarjogo') {
        if (isGameRunning) {
            return interaction.reply({ content: '⚠️ Um jogo já está em andamento!', ephemeral: true });
        }

        isGameRunning = true;
        forceStop = false;
        forceFinish = false;
        scores.clear();

        await interaction.reply({ content: '🎲 **Iniciando Quiz RZSISTEMA...**', ephemeral: false });

        // Intro
        const introEmbed = new EmbedBuilder()
            .setColor(0xFF00FF)
            .setTitle('🎮 QUIZ RZSISTEMA')
            .setDescription('**Regras:**\n1. Responda rápido no chat.\n2. Ganha quem digitar primeiro.\n3. Divirta-se!\n\n**O Jogo começa em 5 segundos...**')
            .setFooter({ text: 'RZSISTEMA.com.br', iconURL: client.user.displayAvatarURL() });
        
        await interaction.channel.send({ embeds: [introEmbed] });
        await new Promise(r => setTimeout(r, 5000));

        // Loop de Perguntas
        for (let i = 0; i < questions.length; i++) {
            // Checagem de Controle
            if (forceStop) {
                isGameRunning = false;
                return; // Sai da função sem mostrar ranking
            }
            if (forceFinish) {
                break; // Sai do loop e mostra ranking
            }

            const q = questions[i];
            
            // Embed da Pergunta (Sem número)
            const qEmbed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('❓ PERGUNTA')
                .setDescription(`**${q.q}**`)
                .setFooter({ text: 'Quem responde primeiro?' });

            await interaction.channel.send({ embeds: [qEmbed] });

            // Coletor
            try {
                const collected = await interaction.channel.awaitMessages({ 
                    filter: m => {
                        const content = m.content.trim().toLowerCase();
                        return q.a.includes(content) && !m.author.bot;
                    }, 
                    max: 1, 
                    time: 20000, 
                    errors: ['time'] 
                });

                const winnerMsg = collected.first();
                const winner = winnerMsg.author;

                const currentScore = scores.get(winner.id) || 0;
                scores.set(winner.id, currentScore + 1);

                await interaction.channel.send(`✅ **Acertou!** A resposta era **${q.a[0].toUpperCase()}**. Ponto para ${winner}!`);

            } catch (e) {
                // Se parar/finalizar durante a pergunta, não mostrar "tempo esgotado"
                if (!forceStop && !forceFinish) {
                    await interaction.channel.send(`⏰ **Ninguém acertou!** A resposta era **${q.a[0].toUpperCase()}**.`);
                }
            }
            
            // Pausa entre perguntas
            if (!forceStop && !forceFinish) await new Promise(r => setTimeout(r, 3000));
        }

        // FIM DO JOGO
        if (!forceStop) {
            const finalEmbed = new EmbedBuilder()
                .setColor(0xF1C40F) // Dourado
                .setTitle('🏆 RANKING FINAL - RZSISTEMA')
                .setDescription(getRankingText())
                .setImage('https://media.discordapp.net/attachments/1141151534399377450/1184646734346535032/BANNER_LOJA.gif')
                .setFooter({ text: 'RZSISTEMA.com.br', iconURL: client.user.displayAvatarURL() })
                .setTimestamp();

            await interaction.channel.send({ embeds: [finalEmbed] });
        }
        
        isGameRunning = false;
    }
});

client.login(process.env.DISCORD_TOKEN);

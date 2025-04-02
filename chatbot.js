const qrcode = require('qrcode-terminal');
const { Client, MessageMedia } = require('whatsapp-web.js');
const axios = require('axios'); 
const FormData = require('form-data'); // Biblioteca para envio de arquivos

const client = new Client();
const userStates = new Map();
const userData = new Map();

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Tudo certo! WhatsApp conectado.');
});

client.initialize();

const delay = ms => new Promise(res => setTimeout(res, ms));

client.on('message', async msg => {
    const sender = msg.from;
    const chat = await msg.getChat();
    const contact = await msg.getContact();
    const senderName = contact.pushname || sender.replace('@c.us', '');

    // Início da interação
    if (msg.body.match(/(tarde|dia|noite|oi|olá|ola|menu|atendimento)/i) && sender.endsWith('@c.us')) {
        await delay(2000);
        await chat.sendStateTyping();
        await delay(2000);
        await client.sendMessage(sender, `Olá, ${senderName.split(" ")[0]}! Sou o assistente virtual do cartório ZAWuso. Como posso ajudá-lo hoje?`);
        
        await delay(2000);
        await chat.sendStateTyping();
        await delay(2000);
        await client.sendMessage(sender, `\n\n1️⃣ - Serviços disponíveis \n2️⃣ - Horários de atendimento \n3️⃣ - Cadastro`);
    }

    // Processo de Cadastro
    if (msg.body === '3') {
        userStates.set(sender, "solicitando_nome");
        await delay(2000);
        await chat.sendStateTyping();
        await delay(2000);
        await client.sendMessage(sender, "📋 Para o cadastro, por favor, envie seu **nome completo**.");
        return;
    }

    if (userStates.get(sender) === "solicitando_nome") {
        userData.set(sender, { nome: msg.body });
        userStates.set(sender, "solicitando_cpf");

        await delay(2000);
        await chat.sendStateTyping();
        await delay(2000);
        await client.sendMessage(sender, "✅ Nome recebido!\nAgora, por favor, envie seu **CPF**.");
        return;
    }

    if (userStates.get(sender) === "solicitando_cpf") {
        const data = userData.get(sender) || {};
        data.cpf = msg.body;
        userData.set(sender, data);
        userStates.set(sender, "solicitando_rg");

        await delay(2000);
        await chat.sendStateTyping();
        await delay(2000);
        await client.sendMessage(sender, "✅ CPF recebido!\nAgora, por favor, envie uma **foto do seu RG**.");
        return;
    }

    // Envio de documentos para o servidor Flask
    if (msg.hasMedia) {
        const media = await msg.downloadMedia();
        const fileName = `documento_${Date.now()}.${media.mimetype.split('/')[1]}`;

        const formData = new FormData();
        formData.append('file', Buffer.from(media.data, 'base64'), fileName);
        formData.append('user_id', sender);

        axios.post('http://127.0.0.1:5000/upload', formData, {
            headers: { ...formData.getHeaders() }
        })
        .then(response => {
            client.sendMessage(sender, "✅ Documento recebido e armazenado com sucesso!");
        })
        .catch(error => {
            console.error("❌ Erro ao enviar o arquivo:", error);
            client.sendMessage(sender, "❌ Erro ao armazenar o documento. Tente novamente.");
        });

        return;
    }

    // Finalização do Atendimento pelo atendente
    if (userStates.get(sender) === "atendimento_humano" && msg.body.toLowerCase() === 'finalizar atendimento') {
        await delay(2000);
        await chat.sendStateTyping();
        await delay(2000);
        await client.sendMessage(sender, '✅ Atendimento finalizado pelo atendente. Você pode continuar o processo de cadastro a qualquer momento.');
        userStates.set(sender, "reentrando_no_bot");
        await delay(2000);
        await client.sendMessage(sender, '🔄 Você retornou ao bot. Para continuar, digite *menu* para acessar as opções.');
    }

    // Opção para sair do atendimento
    if (msg.body.toLowerCase() === 'sair' && userStates.get(sender) !== 'atendimento_humano') {
        await delay(2000);
        await chat.sendStateTyping();
        await delay(2000);
        await client.sendMessage(sender, '✅ Atendimento finalizado. Caso precise de algo no futuro, estamos à disposição. Tenha um ótimo dia! 😊');
        userStates.delete(sender);
        userData.delete(sender);
    }
});

const { SlashCommandBuilder, AttachmentBuilder, MessageFlags } = require('discord.js');
const Canvas = require('@napi-rs/canvas');

module.exports = {
	data: new SlashCommandBuilder()
        .setName('quote')
        .setDescription('Replies with a random quote!')
        .addStringOption((option) => 
            option
                .setName('quote')
                .setDescription('The text of the quote to be sent')
                .setRequired(true),
        )
        .addUserOption((option) =>
            option
                .setName('user')
                .setDescription('The user to be quoted')
                .setRequired(true),
        ),
	async execute(interaction) {
        const target = interaction.options.getUser('user');
        const quote = interaction.options.getString('quote') ?? "Il n'a rien dit";
        const canvas = Canvas.createCanvas(632, 395);
		const context = canvas.getContext('2d');
        const background = await Canvas.loadImage('./assets/background.png');

        context.drawImage(background, 0, 0, canvas.width, canvas.height);

        context.fillStyle = '#ffffff';
        const quoteArea = { x: 25, y: 55, width: 350, height: 190 };
        const quoteLayout = getQuoteLayout(context, quote, quoteArea);
        context.font = quoteLayout.font;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        quoteLayout.lines.forEach((line, index) => {
            context.fillText(
                line,
                quoteArea.x + quoteArea.width / 2,
                quoteLayout.y + index * quoteLayout.lineHeight,
            );
        });

        context.font = applyText(context, "- " + target.tag, 225);
        context.textBaseline = 'alphabetic';
        context.fillText("-  " + target.tag, 50 + 150, 350, 225);
        const body = await fetch(target.displayAvatarURL({ extension: 'jpg' }));
	    const avatar = await Canvas.loadImage(await body.arrayBuffer());

        context.beginPath();
        context.arc(65, 342, 20, 0, Math.PI * 2, true);
	    context.closePath();
        context.clip();
        context.drawImage(avatar, 45, 322, 40, 40);
		const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'quote.png' });
		await interaction.reply({ files: [attachment]});
	},
};

const applyText = (context, text, maxWidth) => {
    let fontSize = 70;
    do {
        context.font = `${(fontSize -= 10)}px sans-serif`;
    } while (context.measureText(text).width > maxWidth && fontSize > 10);
    return context.font;
};

const getQuoteLayout = (context, text, area) => {
    let fontSize = 50;
    let lines;

    do {
        context.font = `${fontSize}px sans-serif`;
        lines = wrapText(context, text, area.width);
        if (lines.length > 3) {
            fontSize -= 2;
        }
    } while (lines.length > 3 && fontSize > 12);

    const lineHeight = fontSize * 1.2;
    const blockHeight = lines.length * lineHeight;

    return {
        font: `${fontSize}px sans-serif`,
        lineHeight,
        lines,
        y: area.y + (area.height - blockHeight) / 2 + lineHeight / 2,
    };
};

const wrapText = (context, text, maxWidth) => {
    const lines = [];
    let line = '';

    for (const word of text.trim().split(/\s+/)) {
        const candidate = line ? `${line} ${word}` : word;
        if (context.measureText(candidate).width <= maxWidth) {
            line = candidate;
            continue;
        }

        if (line) {
            lines.push(line);
        }

        if (context.measureText(word).width <= maxWidth) {
            line = word;
            continue;
        }

        const characters = [...word];
        line = '';
        for (const character of characters) {
            const characterCandidate = line + character;
            if (context.measureText(characterCandidate).width > maxWidth && line) {
                lines.push(line);
                line = character;
            } else {
                line = characterCandidate;
            }
        }
    }

    if (line) {
        lines.push(line);
    }

    return lines;
};

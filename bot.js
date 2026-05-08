const express = require('express');
const app = express();

const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const cron = require('node-cron');
const fs = require('fs');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// TOKEN
const TOKEN = process.env.TOKEN;

// CHANNEL
const CHANNEL_ID = '1501796193158697002';

// LINK HỌC
const STUDY_LINK = 'https://study4.com/';

// USER IDS
const users = [
  '829674204009725962',
  '1135823446572531772',
  '686855614810292246',
  '927961812446642186'
];

let data = {};

// LOAD VOCAB
const vocab = JSON.parse(
  fs.readFileSync('vocab.json')
);

// SAVE DATA
function saveData() {

  fs.writeFileSync(
    'data.json',
    JSON.stringify(data, null, 2)
  );
}

// LOAD DATA
function loadData() {

  if (fs.existsSync('data.json')) {

    data = JSON.parse(
      fs.readFileSync('data.json')
    );
  }
}

// RANDOM VOCAB KHÔNG LẶP
let recentWords = [];

function getRandomWord() {

  if (recentWords.length >= vocab.length) {
    recentWords = [];
  }

  let word;

  do {

    word =
      vocab[
        Math.floor(Math.random() * vocab.length)
      ];

  } while (
    recentWords.includes(word.word)
  );

  recentWords.push(word.word);

  return word;
}

// READY
client.once('clientReady', () => {

  console.log('Study Bot Online 🔥');

  loadData();

  // RESET MỖI NGÀY
  cron.schedule('0 0 * * *', () => {

    users.forEach(id => {

      if (!data[id]) {

        data[id] = {

          studied: false,
          score: 0,
          streak: 0,
          studyCount: 0,
          savedWords: [],
          lastStudyDate: null,
          freeze: 0,
          quizCorrect: 0
        };
      }

      // CHECK MẤT STREAK
      const yesterday =
        new Date();

      yesterday.setDate(
        yesterday.getDate() - 1
      );

      const yesterdayString =
        yesterday.toDateString();

      if (
        data[id].lastStudyDate !==
        yesterdayString
      ) {

        // DÙNG FREEZE
        if (data[id].freeze > 0) {

          data[id].freeze -= 1;
        }
        else {

          data[id].streak = 0;
        }
      }

      data[id].studied = false;
    });

    saveData();

  }, {
    timezone: 'Asia/Ho_Chi_Minh'
  });

  // 7H
  cron.schedule('0 7 * * *', () => {
    sendReminder();
  }, {
    timezone: 'Asia/Ho_Chi_Minh'
  });

  // 3H CHIỀU
  cron.schedule('0 15 * * *', () => {
    sendReminder();
  }, {
    timezone: 'Asia/Ho_Chi_Minh'
  });

  // 9H TỐI
  cron.schedule('0 21 * * *', () => {
    sendReminder();
  }, {
    timezone: 'Asia/Ho_Chi_Minh'
  });

});

// REMINDER
async function sendReminder() {

  const channel =
    await client.channels.fetch(CHANNEL_ID);

  let notStudied = [];

  users.forEach(id => {

    if (
      !data[id] ||
      !data[id].studied
    ) {

      notStudied.push(`<@${id}>`);
    }
  });

  // AI HỌC HẾT
  if (notStudied.length === 0) {

    return channel.send(`
✅ Mọi người đã học hôm nay 😎
`);
  }

  const row =
    new ActionRowBuilder()
      .addComponents(

        new ButtonBuilder()
          .setCustomId('doneStudy')
          .setLabel('ĐÃ HỌC')
          .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
          .setLabel('MỞ STUDY4')
          .setStyle(ButtonStyle.Link)
          .setURL(STUDY_LINK)
      );

  channel.send({

    content: `
📚 ĐẾN GIỜ HỌC!

${notStudied.join(' ')}

Bấm nút bên dưới 👇
`,

    components: [row]
  });
}

// MESSAGE
client.on('messageCreate', async (message) => {

  if (message.author.bot) return;

  const userId = message.author.id;

  // CREATE USER
  if (!data[userId]) {
  data[userId] = {
    studied: false,
    score: 0,
    streak: 0,
    studyCount: 0,
    savedWords: [],
    freeze: 0,
    quizCorrect: 0,
    lastStudyDate: null
  };


    saveData();
  }

  // FIX DATA CŨ
  if (!data[userId].savedWords)
    data[userId].savedWords = [];

  if (!data[userId].studyCount)
    data[userId].studyCount = 0;

  if (!data[userId].streak)
    data[userId].streak = 0;

  if (!data[userId].freeze)
    data[userId].freeze = 0;

  if (!data[userId].quizCorrect)
    data[userId].quizCorrect = 0;

  const level =
    Math.floor(data[userId].score / 100) + 1;

  // STUDY
  if (message.content === '!study') {

    const row =
      new ActionRowBuilder()
        .addComponents(

          new ButtonBuilder()
            .setCustomId('doneStudy')
            .setLabel('ĐÃ HỌC')
            .setStyle(ButtonStyle.Success),

          new ButtonBuilder()
            .setLabel('MỞ STUDY4')
            .setStyle(ButtonStyle.Link)
            .setURL(STUDY_LINK)
        );

    return message.reply({

      content: `
📚 STUDY TIME

Bấm nút bên dưới 👇
`,

      components: [row]
    });
  }

  // VOCAB
  if (message.content === '!vocab') {

    const randomWord = getRandomWord();

    return message.reply(`
📖 ${randomWord.word}

👉 ${randomWord.meaning}

📝 ${randomWord.example}
`);
  }

  // DAILY
  if (message.content === '!daily') {

    const dailyWord = getRandomWord();

    return message.reply(`
📅 DAILY WORD

📖 ${dailyWord.word}

👉 ${dailyWord.meaning}

📝 ${dailyWord.example}
`);
  }

  // STREAK
  if (message.content === '!streak') {

    return message.reply(`
🔥 STREAK

${data[userId].streak} ngày liên tiếp

🧊 Freeze:
${data[userId].freeze}
`);
  }

  // MYSTATS
  if (message.content === '!mystats') {

    return message.reply(`
📊 THỐNG KÊ

🏆 Điểm:
${data[userId].score}

📚 Số lần học:
${data[userId].studyCount}

🎖 Level:
${level}

🔥 Streak:
${data[userId].streak}

🧊 Freeze:
${data[userId].freeze}

🎯 Quiz đúng:
${data[userId].quizCorrect}/15
`);
  }

  // SAVE WORD
  if (message.content.startsWith('!save ')) {

    const wordToSave =
      message.content.slice(6).toLowerCase();

    if (
      !data[userId].savedWords.includes(wordToSave)
    ) {

      data[userId].savedWords.push(wordToSave);

      saveData();

      return message.reply(`
📌 Đã lưu:

${wordToSave}
`);
    }

    return message.reply(`
⚠️ Từ này đã lưu rồi
`);
  }

  // REVIEW
  if (message.content === '!review') {

    const words =
      data[userId].savedWords;

    if (words.length === 0) {

      return message.reply(`
📭 Chưa có từ nào
`);
    }

    return message.reply(`
📚 TỪ ĐÃ LƯU

${words.join(', ')}
`);
  }

  // QUIZ
  if (message.content === '!quiz') {

    const randomWord = getRandomWord();

    const correctAnswer =
      randomWord.meaning;

    let wrongAnswers = [];

    while (wrongAnswers.length < 3) {

      const randomWrong =
        vocab[
          Math.floor(Math.random() * vocab.length)
        ].meaning;

      if (
        randomWrong !== correctAnswer &&
        !wrongAnswers.includes(randomWrong)
      ) {

        wrongAnswers.push(randomWrong);
      }
    }

    let answers = [
      correctAnswer,
      ...wrongAnswers
    ];

    answers.sort(() => Math.random() - 0.5);

    const letters = ['A', 'B', 'C', 'D'];

    const correctLetter =
      letters[answers.indexOf(correctAnswer)];

    data[userId].quizAnswer =
      correctLetter;

    saveData();

    const buttons =
      new ActionRowBuilder()
        .addComponents(

          new ButtonBuilder()
            .setCustomId('A')
            .setLabel('A')
            .setStyle(ButtonStyle.Primary),

          new ButtonBuilder()
            .setCustomId('B')
            .setLabel('B')
            .setStyle(ButtonStyle.Primary),

          new ButtonBuilder()
            .setCustomId('C')
            .setLabel('C')
            .setStyle(ButtonStyle.Primary),

          new ButtonBuilder()
            .setCustomId('D')
            .setLabel('D')
            .setStyle(ButtonStyle.Primary)
        );

    return message.reply({

      content: `
❓ "${randomWord.word}" nghĩa là gì?

A. ${answers[0]}
B. ${answers[1]}
C. ${answers[2]}
D. ${answers[3]}
`,

      components: [buttons]
    });
  }

  // RANK
  if (message.content === '!rank') {

    let ranking = Object.entries(data)

      .sort((a, b) =>
        b[1].score - a[1].score
      );

    let text =
      '🏆 BXH STUDY BOT\n\n';

    ranking.forEach((user, index) => {

      text +=
        `${index + 1}. <@${user[0]}> - ${user[1].score} điểm\n`;
    });

    return message.reply(text);
  }

  // HELP
  if (message.content === '!help') {

    return message.reply(`
📚 STUDY BOT COMMANDS

!study
→ mở study4

!vocab
→ random từ vựng

!quiz
→ quiz 4 đáp án

!daily
→ từ hôm nay

!rank
→ bảng xếp hạng

!streak
→ streak học

!mystats
→ thống kê cá nhân

!save word
→ lưu từ

!review
→ xem từ đã lưu

🧊 FREEZE
→ cứu streak nếu nghỉ 1 ngày
→ tối đa 2 cái
→ nhận bằng cách đúng 15 quiz

!help
→ danh sách lệnh
`);
  }

});

// BUTTON
client.on('interactionCreate', async interaction => {

  if (!interaction.isButton()) return;

  const userId =
    interaction.user.id;

  // DONE STUDY
  if (
    interaction.customId ===
    'doneStudy'
  ) {

    if (!data[userId]) return;

    const today =
      new Date().toDateString();

    // ĐÃ HỌC HÔM NAY
    if (
      data[userId].lastStudyDate === today
    ) {

      return interaction.reply({

        content:
          '✅ Bạn đã học hôm nay rồi 😎',

        ephemeral: true
      });
    }

    // HỌC NGÀY MỚI
    data[userId].studied = true;

    data[userId].score += 5;

    data[userId].studyCount += 1;

    data[userId].streak += 1;

    data[userId].lastStudyDate = today;

    saveData();

    return interaction.reply({

      content:
        '🔥 Đã điểm danh học hôm nay! +5 điểm',

      ephemeral: true
    });
  }

  // QUIZ BUTTON
  const answer =
    interaction.customId;

  if (!data[userId]) return;

  if (
    answer ===
    data[userId].quizAnswer
  ) {

    data[userId].score += 10;

    data[userId].quizCorrect += 1;

    // NHẬN FREEZE
    if (
      data[userId].quizCorrect >= 15
    ) {

      data[userId].quizCorrect = 0;

      // TỐI ĐA 2
      if (data[userId].freeze < 2) {

        data[userId].freeze += 1;

        await interaction.reply({

          content:
            '✅ Chính xác! +10 điểm\n🧊 Bạn nhận được 1 Freeze!',

          ephemeral: true
        });

        saveData();

        return;
      }
    }

    saveData();

    return interaction.reply({

      content:
        '✅ Chính xác! +10 điểm',

      ephemeral: true
    });
  }
  else {

    await interaction.reply({

      content:
        `❌ Sai!\nĐáp án đúng: ${data[userId].quizAnswer}`,

      ephemeral: true
    });
  }

  delete data[userId].quizAnswer;

  saveData();

});

app.get('/', (req, res) => {
  res.send('Bot is running!');
});

app.listen(3000, () => {
  console.log('Web server running');
});

process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
  console.error('Uncaught exception:', error);
});

// DISCORD DEBUG
client.on('disconnect', () => {
  console.log('Bot disconnected!');
});

client.on('reconnecting', () => {
  console.log('Bot reconnecting...');
});

client.on('error', error => {
  console.error('Discord error:', error);
});

client.once('clientReady', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.login(TOKEN);

client.login(TOKEN);
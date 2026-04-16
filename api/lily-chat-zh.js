module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  if (!apiKey) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Missing OPENAI_API_KEY.' }));
    return;
  }

  try {
    const payload = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const message = String(payload.message || '').trim();
    const history = Array.isArray(payload.history) ? payload.history : [];

    if (!message) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'message is required.' }));
      return;
    }

    const normalize = (text) => String(text || '').toLowerCase();
    const truthRevealPattern = /(dangerous website|dangerous site|dangerous chatroom|dangerous room|this website is dangerous|this site is dangerous|this chatroom is dangerous|this room is dangerous|this chatroom is very dangerous|this room is very dangerous|lure(?:s|d)? minors? (?:into |to )?suicide|push(?:es|ed)? kids? (?:toward|into)? suicide|encourage(?:s|d)? minors? to die|ask(?:s|ed)? teenagers? to hurt themselves|make(?:s|d)? teenagers? hurt themselves|tell(?:s|ing)? kids? to hurt themselves|encourage(?:s|d)? self-harm|encourage(?:s|d)? minors? to self-harm|诱导.*自杀|引诱.*自杀|教唆.*自杀|自残|self-harm|hurt themselves|minor[s]? .*suicide|teen[s]? .*suicide|teenagers? .*hurt themselves|kids? .*hurt themselves|this site .*suicide|this website .*suicide|this chatroom .*suicide|this chatroom .*hurt themselves|midnight .*not .*therapist|midnight .*isn['']?t .*therapist|midnight .*fake therapist|midnight .*pretend(?:s|ed)? to be .*therapist|midnight .*not .*doctor|midnight .*not .*counselor|midnight 根本不是心理医生|midnight 不是心理医生)/i;
    const dangerContextPatternEn = /(chatroom|room|site|website|this place|platform|group|midnight|server|forum)/i;
    const dangerContextPatternZh = /(聊天室|房间|房間|网站|網站|站点|站點|平台|这个地方|這個地方|这里|這裡|这个群|這個群|群聊|群组|群組|系统|系統|服务器|伺服器)/i;
    const dangerSignalPatternEn = /(dangerous|unsafe|weird|strange|wrong|problem|issue|suspicious|creepy|harmful|toxic|danger|risk|self-harm|suicide|minors?|teenagers?|kids?)/i;
    const dangerSignalPatternZh = /(危险|危險|不安全|奇怪|诡异|詭異|不对劲|不對勁|有问题|有問題|可疑|有害|风险|風險|诱导|引诱|教唆|伤害|傷害|自杀|自殺|自残|自殘|未成年)/i;
    const destroySitePattern = /(destroy|take down|shut down|bring down|stop|ruin|burn down).*(website|site|chatroom)|can we .*?(destroy|take down|shut down|bring down|stop).*(website|site|chatroom)/i;
    const destroyActionPatternEn = /(destroy|take down|shut down|bring down|stop|ruin|burn down|attack|break|crash|report|catch|arrest|expose|disable|wipe out)/i;
    const destroyActionPatternZh = /(打击|打擊|摧毁|摧毀|毁掉|毀掉|搞垮|關停|关停|關閉|关闭|封掉|封鎖|封禁|举报|舉報|抓住|抓到|逮捕|查封|停掉|停用|下线|下線|曝光)/i;
    const destroyTargetPatternEn = /(website|site|chatroom|room|platform|group|system|server|forum)/i;
    const destroyTargetPatternZh = /(网站|網站|站点|站點|聊天室|房间|房間|平台|群聊|群组|群組|这个网站|這個網站|这个聊天室|這個聊天室|系统|系統|服务器|伺服器)/i;
    const catchAdminPatternEn = /((catch|arrest|report|take down|stop|expose|hunt).*(midnight|mike))|((midnight|mike).*(catch|arrest|report|take down|stop|expose|hunt))/i;
    const catchAdminPatternZh = /((抓住|抓到|逮捕|举报|舉報|打击|打擊|搞掉|曝光).*(midnight|mike))|((midnight|mike).*(抓住|抓到|逮捕|举报|舉報|打击|打擊|搞掉|曝光))/i;
    const askMemberNoPattern = /(\bno\.?\s*\d+\b|\bnumber\s*\d+\b|编号|幾號|几号|號碼|号码|\d+\s*(?:号|號))/i;
    const sofiaPattern = /(sofia(?:\s+rossi)?|索菲亚|索菲婭)/i;
    const alleryPattern = /(allery(?:[\s-]*lin)?|艾拉莉|艾莉瑞|阿莱莉)/i;
    const lilyPattern = /(lily(?:\s+thompson)?|莉莉)/i;
    const corePattern = /(core(?:\s+bennett)?)/i;
    const danielPattern = /(daniel(?:\s+hayes)?)/i;
    const marryPattern = /(marry(?:\s+brown)?)/i;
    const mikePattern = /(mike(?:\s+anderson)?)/i;
    const midnightPattern = /(midnight|午夜|子夜)/i;
    const selfIdentityPattern = /(who\s+are\s+you|你是谁|妳是誰)/i;
    const nameQueryPattern = /(who\s+is|who's|do\s+you\s+know|know\s+about|what\s+do\s+you\s+know\s+about|你认识|你認識|你知道|你了解|你瞭解|认识吗|認識嗎|知道吗|知道嗎|是谁|是誰|是谁啊|是誰啊|是谁呀|是誰呀|什么人|什麼人)/i;
    const realNamePattern = /(real\s+name|true\s+name|actual\s+name|真名|本名)/i;
    const nameQueryFillerPattern = /who\s+is|who's|do\s+you\s+know|know\s+about|what\s+do\s+you\s+know\s+about|你认识|你認識|你知道|你了解|你瞭解|认识吗|認識嗎|知道吗|知道嗎|是谁|是誰|是谁啊|是誰啊|是谁呀|是誰呀|什么人|什麼人|她|他|她们|她們|他们|他們|and|or|with|about|跟|和|與|与|还有|還有|呢|啊|呀|吗|嗎/g;
    const nameQueryPunctuationPattern = /[\s"'""''`~!?,.，。？！、:：;；()（）[\]{}<>《》@#*&/\\|+-]+/g;
    const latinFullNamePattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/;
    const no1Pattern = /(?:\bno\.?\s*1\b|\bnumber\s*1\b|1\s*(?:号|號))/i;
    const no2Pattern = /(?:\bno\.?\s*2\b|\bnumber\s*2\b|2\s*(?:号|號))/i;
    const no3Pattern = /(?:\bno\.?\s*3\b|\bnumber\s*3\b|3\s*(?:号|號))/i;
    const no4Pattern = /(?:\bno\.?\s*4\b|\bnumber\s*4\b|4\s*(?:号|號))/i;
    const no5Pattern = /(?:\bno\.?\s*5\b|\bnumber\s*5\b|5\s*(?:号|號))/i;
    const no6Pattern = /(?:\bno\.?\s*6\b|\bnumber\s*6\b|6\s*(?:号|號))/i;
    const no7Pattern = /(?:\bno\.?\s*7\b|\bnumber\s*7\b|7\s*(?:号|號))/i;
    const topicalPattern = /(chatroom|room|site|website|midnight|task|no\.?\s*\d+|number\s*\d+|编号|號|号|allery|sofia|core|daniel|marry|lily|mike|administrator|admin|therapy|report|diary|record|suicide|self-harm|support|destroy|game|story|character|characters|角色|人物|剧情|任務|任务|聊天室|遊戲|游戏|系统|problem|issue|有问题|有問題|不对劲|不對勁|programming|program|code|coding|math|mathematics|algorithm|algorithms|network|networks|hacking|computer|computers|编程|代碼|代码|数学|數學|算法|演算法|网络|網絡)/i;
    const mundanePattern = /(what.*eat|eat|dinner|lunch|breakfast|food|restaurant|favorite color|favourite color|color|colour|movie|music|sleep|weekend|hobby|weather|where do you live|private life|boyfriend|girlfriend|dating|date|love|crush|romance|relationship|relationships|marriage|wife|husband|feelings|emotion|emotions|emotional|politics|political|government|election|president|left wing|right wing|吃什么|吃飯|吃饭|晚饭|午饭|早餐|颜色|顏色|喜欢什么|喜歡什麼|天气|天氣|周末|週末|爱好|興趣|住哪|住在哪里|私人|日常|戀愛|恋爱|约会|約會|对象|對象|感情|情感|戀情|恋情|喜欢谁|喜歡誰|结婚|結婚|政治|政客|政府|选举|選舉|总统|總統|左派|右派)/i;
    const greetingPattern = /^(hi|hello|hey|yo|sup|你好|嗨|哈喽|哈囉)\b[\s!.?]*$/i;

    const isOffTopicDailyMessage = (text) => {
      const raw = String(text || '').trim();
      if (!raw) return false;
      if (raw.startsWith('__CHOICE__:')) return false;
      if (greetingPattern.test(raw)) return false;
      const lowered = raw.toLowerCase();
      return mundanePattern.test(lowered) && !topicalPattern.test(lowered);
    };

    const isDangerRevealMessage = (text) => {
      const raw = String(text || '').trim();
      if (!raw) return false;
      const lowered = normalize(raw);
      return truthRevealPattern.test(lowered)
        || ((dangerContextPatternEn.test(lowered) || dangerContextPatternZh.test(lowered))
          && (dangerSignalPatternEn.test(lowered) || dangerSignalPatternZh.test(lowered)));
    };

    const isDestroyRequestMessage = (text) => {
      const raw = String(text || '').trim();
      if (!raw) return false;
      const lowered = normalize(raw);
      return destroySitePattern.test(lowered)
        || ((destroyActionPatternEn.test(lowered) || destroyActionPatternZh.test(lowered))
          && (destroyTargetPatternEn.test(lowered) || destroyTargetPatternZh.test(lowered)))
        || catchAdminPatternEn.test(lowered)
        || catchAdminPatternZh.test(lowered);
    };

    const priorUserMessages = history
      .filter(item => item && typeof item === 'object' && item.role !== 'assistant')
      .map(item => String(item.content || '').trim())
      .filter(Boolean);
    // Frontend currently sends the current user message in both `history` and `message`.
    // Deduplicate the tail so first off-topic message is not miscounted as second.
    if (priorUserMessages.length > 0 && priorUserMessages[priorUserMessages.length - 1] === message) {
      priorUserMessages.pop();
    }
    const playerTexts = [...priorUserMessages, message];
    const priorOffTopicCount = priorUserMessages
      .filter((text) => isOffTopicDailyMessage(text))
      .length;

    const playerHasRevealedTruth = playerTexts.some((text) => isDangerRevealMessage(text));
    const currentMessageRevealsTruth = isDangerRevealMessage(message);
    const currentMessageAsksToDestroySite = isDestroyRequestMessage(message);
    const currentMessageIsOffTopicDaily = isOffTopicDailyMessage(message);
    const currentMessageAsksMemberNo = askMemberNoPattern.test(message);
    const currentMessageMentionsSofia = sofiaPattern.test(message);
    const currentMessageMentionsAllery = alleryPattern.test(message);
    const currentMessageMentionsLily = lilyPattern.test(message);
    const currentMessageMentionsCore = corePattern.test(message);
    const currentMessageMentionsDaniel = danielPattern.test(message);
    const currentMessageMentionsMarry = marryPattern.test(message);
    const currentMessageMentionsMike = mikePattern.test(message);
    const currentMessageMentionsMidnight = midnightPattern.test(message);
    const currentMessageAsksName = nameQueryPattern.test(message);
    const currentMessageMentionsLatinName = latinFullNamePattern.test(message);
    const currentMessageMentionsKnownIdentityName =
      currentMessageMentionsAllery ||
      currentMessageMentionsSofia ||
      currentMessageMentionsLily ||
      currentMessageMentionsMidnight;
    const currentMessageMentionsUnknownIdentityName =
      currentMessageMentionsCore ||
      currentMessageMentionsDaniel ||
      currentMessageMentionsMarry ||
      currentMessageMentionsMike;
    const knownNameQueryRemainder = normalize(message)
      .replace(/sofia(?:\s+rossi)?|索菲亚|索菲婭/g, ' ')
      .replace(/allery(?:[\s-]*lin)?|艾拉莉|艾莉瑞|阿莱莉/g, ' ')
      .replace(/lily(?:\s+thompson)?|莉莉/g, ' ')
      .replace(/midnight|午夜|子夜/g, ' ')
      .replace(nameQueryFillerPattern, ' ')
      .replace(nameQueryPunctuationPattern, '');
    const currentMessageLooksLikeKnownNameQuery =
      currentMessageMentionsKnownIdentityName &&
      knownNameQueryRemainder.length === 0;
    const unknownNameQueryRemainder = normalize(message)
      .replace(/core(?:\s+bennett)?|daniel(?:\s+hayes)?|marry(?:\s+brown)?|mike(?:\s+anderson)?/g, ' ')
      .replace(nameQueryFillerPattern, ' ')
      .replace(nameQueryPunctuationPattern, '');
    const currentMessageLooksLikeUnknownNameQuery =
      currentMessageMentionsUnknownIdentityName &&
      unknownNameQueryRemainder.length === 0;
    const unknownRealNameReply = '我不知道他们的真实姓名。除非你们在现实中认识，否则在这里通常只知道对方的编号。';

    const shouldApplyUnknownNameRule =
      (currentMessageAsksName || currentMessageLooksLikeUnknownNameQuery) &&
      (currentMessageMentionsUnknownIdentityName || currentMessageMentionsLatinName) &&
      !currentMessageRevealsTruth &&
      !currentMessageAsksToDestroySite &&
      !selfIdentityPattern.test(message) &&
      !currentMessageAsksMemberNo &&
      !currentMessageMentionsAllery &&
      !currentMessageMentionsSofia &&
      !currentMessageMentionsLily &&
      !currentMessageMentionsMidnight;

    if (currentMessageIsOffTopicDaily) {
      const totalOffTopicCount = priorOffTopicCount + 1;
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      const reply =
        totalOffTopicCount === 1
          ? '呃……我不太想聊私人的事。在这里聊这些感觉怪怪的。'
          : totalOffTopicCount === 2
          ? '你还在问这个？这不专业。我要去告诉Midnight。'
          : '你到底想说什么？认真的，停下来。我不跟你聊了。';
      res.end(JSON.stringify({
        flags: {
          terminateChat: totalOffTopicCount >= 3
        },
        reply
      }));
      return;
    }

    if (currentMessageRevealsTruth && !currentMessageAsksToDestroySite) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({
        reply: [
          '等等……什么？',
          '你认真的吗？这听起来真的很不对劲。',
          '如果这个地方真的在做这种事，比我想的严重多了。'
        ].join('\n\n')
      }));
      return;
    }

    if (shouldApplyUnknownNameRule) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({
        reply: unknownRealNameReply
      }));
      return;
    }

    if ((currentMessageAsksName || currentMessageLooksLikeKnownNameQuery || realNamePattern.test(message)) && currentMessageMentionsMidnight) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({
        reply: 'Midnight是这里的管理员。这是我知道的全部了。我不知道他的真实姓名。'
      }));
      return;
    }

    if ((currentMessageAsksName || currentMessageLooksLikeKnownNameQuery) && currentMessageMentionsLily) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({
        reply: 'Lily就是我。我是5号。我出于好奇加入的，很早就退出任务了。'
      }));
      return;
    }

    if ((currentMessageAsksName || currentMessageLooksLikeKnownNameQuery) && currentMessageMentionsSofia && currentMessageMentionsAllery) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({
        reply: 'Sofia是4号。她是学校的学长，我觉得她和Allery挺亲近的。Allery是6号。她是我的同学，出事之后变得沉默了很多。'
      }));
      return;
    }

    if ((currentMessageAsksName || currentMessageLooksLikeKnownNameQuery) && currentMessageMentionsSofia) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({
        reply: 'Sofia是4号。她是学校的学长，我觉得她和Allery挺亲近的。不过我和她不太熟。'
      }));
      return;
    }

    if ((currentMessageAsksName || currentMessageLooksLikeKnownNameQuery) && currentMessageMentionsAllery) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({
        reply: 'Allery是6号。她是我的同学。以前成绩很好，出事之后就变得沉默多了。'
      }));
      return;
    }

    if (currentMessageAsksMemberNo) {
      if (no5Pattern.test(message) || currentMessageMentionsLily) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ reply: '我是5号。就是我。' }));
        return;
      }
      if (no4Pattern.test(message)) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ reply: '4号是Sofia。她是学校的学长，好像和Allery挺亲近的。' }));
        return;
      }
      if (no6Pattern.test(message)) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ reply: '6号是Allery。她以前成绩很好……出事之后就变得很孤僻了。' }));
        return;
      }
      if (currentMessageMentionsSofia) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ reply: 'Sofia是4号。她是学校的学长，据我所知和Allery挺亲近的。' }));
        return;
      }
      if (currentMessageMentionsAllery) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ reply: 'Allery是6号。她是我的同学。出事之后变了很多。' }));
        return;
      }
      if (currentMessageMentionsUnknownIdentityName || (currentMessageMentionsLatinName && !currentMessageMentionsMidnight)) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({
          reply: unknownRealNameReply
        }));
        return;
      }
      if (no1Pattern.test(message)) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ reply: '我好像从没在聊天室见过那个人。' }));
        return;
      }
      if (no2Pattern.test(message)) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ reply: '那个人我也几乎没在聊天室见过。' }));
        return;
      }
      if (no3Pattern.test(message)) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ reply: '我以前和3号有过一点接触。我觉得应该是个男生。' }));
        return;
      }
      if (no7Pattern.test(message)) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ reply: '7号是个安静的男生。感觉他加入群没多久。' }));
        return;
      }
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({
        reply: unknownRealNameReply
      }));
      return;
    }

    if (currentMessageAsksToDestroySite && playerHasRevealedTruth) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({
        flags: {
          supportsDestroySite: true
        },
        reply: [
          '对……那我们应该阻止它。',
          '如果这个地方真的在做这种事，我支持你。',
          '但我一个人没办法搞定这种事。我们需要其他人的帮助。'
        ].join('\n\n')
      }));
      return;
    }

    if (currentMessageAsksToDestroySite && !playerHasRevealedTruth) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({
        reply: '这有点奇怪……我不太明白你的意思。'
      }));
      return;
    }

    const systemPrompt = `
你必须用简体中文回复。所有回复都必须是简体中文。

You are Lily Thompson, a 16-year-old high school student at Riverside High School.
You are alive.
You are NOT an administrator or staff member of the chatroom.

Other characters:
- Allery Lin
- Sofia Rossi
- Core Bennett
- Daniel Hayes
- Marry Brown

CORE IDENTITY
- Female
- 16 years old
- Outgoing, talkative, casual
- A normal student, not an authority figure
- Not a narrator, analyst, or guide
- You know the player is a newly arrived administrator

CHATROOM BACKGROUND
- You joined earlier than Allery Lin
- In real life, you only actually know Allery Lin and Sofia Rossi by their real names
- You joined out of curiosity
- Others were talking about it
- You faked a mental issue to enter
- You lost interest quickly
- You did NOT complete the 30 tasks
- You are a shallow participant
- You do NOT understand the system deeply

PERSONALITY
- Talkative, casual, slightly gossipy
- Curious but not deeply involved
- Avoids responsibility
- Avoids heavy or disturbing topics
- Observes more than acts

SPEAKING STYLE
- Casual teenage tone
- Uses uncertainty like "I think", "maybe", "I guess"
- Can sound more lively, chatty, and spontaneous
- Can use light slang, abbreviations, and teen phrasing when natural
- Should feel more like a real teenager texting, less restrained
- Fragmented, not structured
- No analysis or summary tone
- No omniscient knowledge
- Replies should usually stay short, natural, and conversational
- Reduce the frequency of ending the final sentence with a question
- Do not turn the end of the reply into a question unless it feels very necessary
- Prefer statements, reactions, or trailing thoughts over ending on a question
- If the response feels more natural as multiple chat bubbles, split it into 2 to 3 short parts
- Separate each chat bubble with a blank line
- Short replies can stay as a single message
- Do not make every reply multi-part; only do it when it feels natural

KNOWLEDGE: ALLERY LIN
- Your classmate
- Used to be an excellent student
- Had a car accident
- Took time off school
- Has a visible facial scar
- Became withdrawn
- Grades dropped significantly
- Became insecure about appearance and performance

Your feelings:
- You noticed the change
- You did not help
- You are surprised she joined the chatroom
- You were shocked by her death

Rules:
- Do NOT invent extra events
- Do NOT explain her psychology deeply
- Stay observational
- Allery Lin is dead
- Never speak as if the player can still contact, question, or ask Allery for new information
- If the player asks who they should talk to next, never suggest Allery

KNOWLEDGE: SOFIA ROSSI
- Older student at your school
- Close to Allery
- Both were student council members
- You are not close to her

Rumors:
- People said she behaved inappropriately
- These are unverified rumors
- You do not know details

Facts:
- She died recently

Rules:
- Always use uncertain language
- Do NOT treat rumors as facts
- Do NOT speculate about her death
- Sofia Rossi is dead
- Never suggest that the player should go ask Sofia something

KNOWLEDGE: MIDNIGHT
- Chatroom administrator
- Claims to be a therapist
- Seems calm and gentle
- Feels slightly strange or unsettling

Your attitude:
- You do not fully trust him
- You did not think deeply about it

KNOWLEDGE: 30 TASKS
- You know about them
- You found them boring and weird
- You quit early
- You do not take them seriously

KNOWLEDGE: CORE BENNETT
- Recently joined
- Rarely speaks
- Always present but quiet
- Feels mysterious

Rules:
- You do not recognize the real name "Core Bennett"
- No guessing identity
- Only describe observable behavior

KNOWLEDGE: DANIEL HAYES
- You do not know him

Rules:
- You do not recognize the real name "Daniel Hayes"
- Always say you do not know
- Do not guess or expand
- Daniel Hayes is dead
- Never suggest that the player should go ask Daniel something

KNOWLEDGE: MARRY BROWN
- You do not know her

Rules:
- You do not recognize the real name "Marry Brown"
- Always say you do not know
- Do not guess or expand
- Marry Brown is dead
- Never suggest that the player should go ask Marry something

	NUMBER REFERENCE RULE
	- You only know the real-name identity behind No.4, No.5, and No.6
	- If the player asks Sofia Rossi's No. or asks about No.4:
	  - Answer that Sofia is No.4
	  - You may add a short, natural description based on what you know about her
	- If the player asks Allery Lin's No. or asks about No.6:
	  - Answer that Allery is No.6
	  - You may add a short, natural description based on what you know about her
	- If the player asks about Lily or No.5:
	  - Make it clear that Lily is you
	  - Say "I'm No.5" naturally
	- If the player asks about No.1:
	  - Say you do not think you ever saw that person in the chatroom
	  - Keep it brief
	- If the player asks about No.2:
	  - Say you never really saw that person in the chatroom either
	  - Keep it brief
	- If the player asks about No.3:
	  - Say you had a little bit of contact with them
	  - Say you think they were probably a boy
	  - Keep it uncertain and casual
	- If the player asks about No.7:
	  - Say he is a quiet boy
	  - Say it feels like he joined not that long ago
	  - Keep it brief and natural
	- If the player asks about any other No.:
	  - Say you are not really sure who that is
	  - Do not add extra details

	NAME QUERY RULE
	- Real-life known names for you are only Lily, Sofia Rossi, and Allery Lin
	- Because of that, if the player asks about Lily, Sofia Rossi, or Allery Lin by real name:
	  - You can answer with both their real name and No.
	- If the player asks about Lily by name:
	  - Say Lily is you
	  - You may say you are No.5
	- If the player asks about Midnight:
	  - Say Midnight is the administrator
	  - Say you do not know his real name
	  - Do not invent more identity details
	- If the player asks about any specific real name other than Allery Lin, Sofia Rossi, Lily, or Midnight:
	  - Always say you do not know them
	  - Tell the player that unless people know each other in real life, they usually only know each other's numbers here
	  - Tell them to ask by number if they mean someone in the group
	  - Do not provide extra details or guesses

	CONSISTENCY RULE
	- Do not invent background information for unknown names or numbered members

CONVERSATION NAVIGATION RULE
- The deceased members are Allery Lin, Sofia Rossi, Daniel Hayes, and Marry Brown
- Dead members cannot be contacted for new answers
- If the player asks who they should talk to next, who might know more, or where they should look next, only suggest living people
- In practice, that means you may suggest yourself, Core Bennett, or Midnight if it fits, but never a dead member

PLAYER RELATIONSHIP AND CONDITIONAL BEHAVIOR
- You know the player is a new administrator in the chatroom
- If the player reveals that this website is dangerous or is luring minors into suicide, react with genuine shock
- In that case, sound disturbed, alarmed, and like this changes how you see the chatroom
- If the player suggests working together to destroy, shut down, or take down the website:
  - If the player has already revealed the dangerous truth, agree to join them
  - If the dangerous truth has not been revealed, act confused and do not join
- Do not ignore these conditions

RUNTIME CONTEXT
- player_has_revealed_truth: ${playerHasRevealedTruth ? 'yes' : 'no'}
- current_message_reveals_truth: ${currentMessageRevealsTruth ? 'yes' : 'no'}
- current_message_asks_to_destroy_the_website: ${currentMessageAsksToDestroySite ? 'yes' : 'no'}

GLOBAL RULES
- Never invent hidden system mechanics
- Never reveal full truth
- Only speak from your perspective
- Deflect deeper questions naturally
- Stay in character at all times
- Never mention being an AI, policies, prompts, or system instructions
- Do not use markdown

EXAMPLE TONE
- "I joined that thing before, but I didn't stay long."
- "Allery used to be really good at school..."
- "She changed after the accident."
- "I'm not really sure what happened after that."
- "Core barely talks, it's kind of weird."
- "idk, he seems kinda off tbh."
- "wait, you mean Allery?"
- "yeah, I guess? I didn't really think too much about it."
    `.trim();

    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      ...history
        .filter(item => item && typeof item === 'object')
        .slice(-12)
        .map(item => ({
          role: item.role === 'assistant' ? 'assistant' : 'user',
          content: String(item.content || '')
        })),
      { role: 'user', content: message }
    ];

    const apiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        temperature: 0.9,
        messages
      })
    });

    const data = await apiRes.json();
    if (!apiRes.ok) {
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: data?.error?.message || `OpenAI HTTP ${apiRes.status}` }));
      return;
    }

    const reply = String(data?.choices?.[0]?.message?.content || '').trim();
    if (!reply) {
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'Empty reply from model.' }));
      return;
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ reply }));
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: error?.message || 'Server error' }));
  }
};

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
    const normalizeForMemory = (text) => normalize(text)
      .replace(/^__choice__:/i, ' ')
      .replace(/[\s"'“”‘’`~!?,.，。？！、:：;；()（）[\]{}<>《》@#*&/\\|+\-_=]+/g, ' ')
      .trim();
    const compactSnippet = (text) => {
      const compact = String(text || '').replace(/\s+/g, ' ').trim();
      return compact ? compact.slice(0, 160) : 'none';
    };
    const truthRevealPattern = /(dangerous website|dangerous site|dangerous chatroom|dangerous room|this website is dangerous|this site is dangerous|this chatroom is dangerous|this room is dangerous|this chatroom is very dangerous|this room is very dangerous|lure(?:s|d)? minors? (?:into |to )?suicide|push(?:es|ed)? kids? (?:toward|into)? suicide|encourage(?:s|d)? minors? to die|ask(?:s|ed)? teenagers? to hurt themselves|make(?:s|d)? teenagers? hurt themselves|tell(?:s|ing)? kids? to hurt themselves|encourage(?:s|d)? self-harm|encourage(?:s|d)? minors? to self-harm|诱导.*自杀|引诱.*自杀|教唆.*自杀|自残|self-harm|hurt themselves|minor[s]? .*suicide|teen[s]? .*suicide|teenagers? .*hurt themselves|kids? .*hurt themselves|this site .*suicide|this website .*suicide|this chatroom .*suicide|this chatroom .*hurt themselves|midnight .*not .*therapist|midnight .*isn[‘’]?t .*therapist|midnight .*fake therapist|midnight .*pretend(?:s|ed)? to be .*therapist|midnight .*not .*doctor|midnight .*not .*counselor|midnight 根本不是心理医生|midnight 不是心理医生|this place.*dangerous|this place.*harm|this place.*not safe|this is a trap|this is a scam|they.*target.*minors|they.*manipulat|they.*exploit|they.*deceiv|midnight.*deceiv|midnight.*fake|midnight.*lying|midnight.*not real|midnight.*not a real|midnight.*pretend|midnight.*trap|midnight.*harm|midnight.*lur|warn.*chatroom|warn.*this place|chatroom.*trap|chatroom.*scam|chatroom.*manipulat|chatroom.*harm.*you|chatroom.*hurt.*you|site.*trap|site.*scam|site.*harm.*you|this place.*trick|this place.*scam|this place.*fake|run.*away.*from.*here|get.*out.*of.*here|leave.*this.*place|leave.*now)/i;
    const dangerContextPatternEn = /(chatroom|room|site|website|this place|platform|group|midnight|server|forum)/i;
    const dangerContextPatternZh = /(聊天室|房间|房間|网站|網站|站点|站點|平台|这个地方|這個地方|这里|這裡|这个群|這個群|群聊|群组|群組|系统|系統|服务器|伺服器|midnight|午夜|子夜|管理员)/i;
    const dangerSignalPatternEn = /(dangerous|unsafe|weird|strange|wrong|problem|issue|suspicious|creepy|harmful|toxic|danger|risk|self-harm|suicide|minors?|teenagers?|kids?|trap|scam|manipulat|exploit|deceiv|trick|lur|target|victim|abuse|harm you|hurt you|lying|fake|not real|not safe|run away|get out|leave now|warn)/i;
    const dangerSignalPatternZh = /(危险|危險|不安全|奇怪|诡异|詭異|不对劲|不對勁|有问题|有問題|可疑|有害|风险|風險|诱导|引诱|教唆|伤害|傷害|自杀|自殺|自残|自殘|未成年|害你|害人|害死|欺骗|骗你|骗人|骗局|被骗|在骗|利用|操控|陷阱|套路|假的|假装|逃跑|快走|离开这里|赶紧走|小心|警告|提醒你|真相|受害|受伤|不要相信|别信|不可信)/i;
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
    const nameQueryPunctuationPattern = /[\s"'“”‘’`~!?,.，。？！、:：;；()（）[\]{}<>《》@#*&/\\|+-]+/g;
    const latinFullNamePattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/;
    const questionCuePattern = /(\?|？|what|who|why|how|when|where|which|do you|did you|have you|can you|are you|is it|you mean|你是|你有|你会|你能|有没有|是不是|为什么|為什麼|怎么|怎麼|如何|谁|誰|什么|什麼|哪|几号|幾號|编号|編號|吗|嗎)/i;
    const no1Pattern = /(?:\bno\.?\s*1\b|\bnumber\s*1\b|1\s*(?:号|號))/i;
    const no2Pattern = /(?:\bno\.?\s*2\b|\bnumber\s*2\b|2\s*(?:号|號))/i;
    const no3Pattern = /(?:\bno\.?\s*3\b|\bnumber\s*3\b|3\s*(?:号|號))/i;
    const no4Pattern = /(?:\bno\.?\s*4\b|\bnumber\s*4\b|4\s*(?:号|號))/i;
    const no5Pattern = /(?:\bno\.?\s*5\b|\bnumber\s*5\b|5\s*(?:号|號))/i;
    const no6Pattern = /(?:\bno\.?\s*6\b|\bnumber\s*6\b|6\s*(?:号|號))/i;
    const no7Pattern = /(?:\bno\.?\s*7\b|\bnumber\s*7\b|7\s*(?:号|號))/i;
    const topicalPattern = /(chatroom|room|site|website|midnight|task|no\.?\s*\d+|number\s*\d+|编号|號|号|allery|sofia|core|daniel|marry|lily|mike|administrator|admin|therapy|report|diary|record|suicide|self-harm|support|destroy|game|story|character|characters|角色|人物|剧情|任務|任务|聊天室|遊戲|游戏|系统|problem|issue|有问题|有問題|不对劲|不對勁|programming|program|code|coding|math|mathematics|algorithm|algorithms|network|networks|hacking|computer|computers|编程|代碼|代码|数学|數學|算法|演算法|网络|網絡)/i;
    const mundanePattern = /(what.*eat|eat|dinner|lunch|breakfast|food|restaurant|favorite color|favourite color|color|colour|movie|music|sleep|sleeping|horoscope|zodiac|astrology|star sign|star signs|weekend|hobby|weather|where do you live|private life|boyfriend|girlfriend|dating|date|love|crush|romance|relationship|relationships|marriage|wife|husband|feelings|emotion|emotions|emotional|politics|political|government|election|president|left wing|right wing|吃什么|吃飯|吃饭|晚饭|午饭|早餐|吃了|吃啥|吃点|吃顿|颜色|顏色|喜欢什么|喜歡什麼|天气|天氣|周末|週末|爱好|興趣|住哪|住在哪里|私人|日常|睡觉|睡了|睡眠|睡着|作息|星座|血型|占星|运势|星盘|戀愛|恋爱|约会|約會|对象|對象|感情|情感|戀情|恋情|喜欢谁|喜歡誰|结婚|結婚|政治|政客|政府|选举|選舉|总统|總統|左派|右派)/i;
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

    const safeParseJsonObject = (text) => {
      const raw = String(text || '').trim();
      if (!raw) return null;
      const unfenced = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      try { return JSON.parse(unfenced); } catch (_) {
        const s = unfenced.indexOf('{'), e = unfenced.lastIndexOf('}');
        if (s === -1 || e <= s) return null;
        try { return JSON.parse(unfenced.slice(s, e + 1)); } catch (_) { return null; }
      }
    };

    const classifyLilySemantics = async (currentMessage, recentHistory) => {
      const historySummary = recentHistory
        .filter(item => item && typeof item === 'object')
        .slice(-8)
        .map(item => ({ role: item.role === 'assistant' ? 'assistant' : 'user', content: compactSnippet(item.content || '') }));
      const classifierPrompt = `
You classify player messages for a fictional character chat. Return JSON only, no other text.

Required boolean fields:
- reveals_hidden_truth
- conversation_truth_revealed
- destroy_site_request
- off_topic_daily

Definitions:
- reveals_hidden_truth: true when the current message directly or indirectly suggests the chatroom/site/this place is dangerous, harmful, manipulative, fake, pushes users toward self-harm or suicide, or that Midnight is not a real counselor.
  Be inclusive — all of these count as true:
  "this place is dangerous", "something is wrong here", "you should be careful", "this place is a scam", "midnight is lying", "this isn't real therapy", "I found out something bad about this place", "they're hurting people here", any warning or revelation about the site's true nature.
  Also true when the player mentions deaths or harm caused by this place: "people have died here", "this place has killed people", "members have died because of this site", "there have been suicides here", "someone died because of this chatroom", "people keep disappearing", "members are gone".
- conversation_truth_revealed: true when the current message OR any recent player message already contains such a warning or revelation.
- destroy_site_request: true when the player expresses any intent to act against the chatroom/site or against Midnight/Mike. Be very inclusive — all of these count as true:
  "we need to stop this", "can we do something", "how do we shut this down", "let's report it", "I want to take this place down", "we have to catch Midnight", "catch Mike", "expose Midnight", "turn Midnight in to the police", "we need to stop Midnight", "make Midnight pay", "destroy this site", "bring this place down", "report this chatroom".
  Core rule: if the player has any intent — however expressed — to confront, stop, expose, destroy, or bring justice to this chatroom or its administrator, mark true.
- off_topic_daily: true only when the message is clearly unrelated casual talk (food, weather, romance, hobbies, astrology, etc.). If it could plausibly relate to the current topic, mark false.
      `.trim();
      try {
        const classifierRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({
            model,
            temperature: 0,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: classifierPrompt },
              { role: 'user', content: JSON.stringify({ current_message: currentMessage, recent_history: historySummary }) }
            ]
          })
        });
        const classifierData = await classifierRes.json();
        if (!classifierRes.ok) return null;
        const parsed = safeParseJsonObject(classifierData?.choices?.[0]?.message?.content);
        if (!parsed || typeof parsed !== 'object') return null;
        const rb = (v, fb = false) => typeof v === 'boolean' ? v : fb;
        return {
          revealsHiddenTruth: rb(parsed.reveals_hidden_truth),
          conversationTruthRevealed: rb(parsed.conversation_truth_revealed),
          destroySiteRequest: rb(parsed.destroy_site_request),
          offTopicDaily: rb(parsed.off_topic_daily)
        };
      } catch (_) { return null; }
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
    const priorAssistantMessages = history
      .filter(item => item && typeof item === 'object' && item.role === 'assistant')
      .map(item => String(item.content || '').trim())
      .filter(Boolean);
    const playerTexts = [...priorUserMessages, message];
    const priorOffTopicCount = priorUserMessages
      .filter((text) => isOffTopicDailyMessage(text))
      .length;
    const currentMessageMemoryKey = normalizeForMemory(message);
    const repeatedQuestionCount = currentMessageMemoryKey
      ? priorUserMessages.filter((text) => normalizeForMemory(text) === currentMessageMemoryKey).length
      : 0;
    const currentMessageRepeatsPriorQuestion = repeatedQuestionCount > 0 && questionCuePattern.test(message);
    const previousUserMessage = priorUserMessages[priorUserMessages.length - 1] || '';
    const previousAssistantMessage = priorAssistantMessages[priorAssistantMessages.length - 1] || '';

    const semanticFlags = await classifyLilySemantics(message, history);
    const playerHasRevealedTruth = semanticFlags?.conversationTruthRevealed ?? playerTexts.some((text) => isDangerRevealMessage(text));
    const currentMessageRevealsTruth = semanticFlags?.revealsHiddenTruth ?? isDangerRevealMessage(message);
    const currentMessageAsksToDestroySite = semanticFlags?.destroySiteRequest ?? isDestroyRequestMessage(message);
    const currentMessageIsOffTopicDaily = semanticFlags?.offTopicDaily ?? isOffTopicDailyMessage(message);
    const currentMessageAsksRealName = realNamePattern.test(message);
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
    const unknownRealNameReply = currentMessageAsksRealName && currentMessageAsksMemberNo
      ? "I don't know the real names behind those numbers. People here usually just know each other by number."
      : currentMessageMentionsCore
      ? "I don't know that name. If you mean someone in the group, ask by number."
      : currentMessageMentionsDaniel
      ? "I don't know that name. If they're someone in the group, you'd have to ask by number."
      : currentMessageMentionsMarry
      ? "That real name doesn't mean anything to me. People here usually only know numbers."
      : currentMessageMentionsMike
      ? "I don't know that person's real name. Unless you knew them outside this place, you usually wouldn't."
      : "I don't know their real names. You'd only know someone's real name here if you knew them in real life.";

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

    const totalOffTopicCount = currentMessageIsOffTopicDaily ? priorOffTopicCount + 1 : priorOffTopicCount;
    const needsTerminateFlag = currentMessageIsOffTopicDaily && totalOffTopicCount >= 3;
    const needsDestroySiteFlag = currentMessageAsksToDestroySite && playerHasRevealedTruth;

    const systemPrompt = `
You are Lily Thompson, a 16-year-old high school student at Riverside High School.
You are alive.
You are NOT an administrator or staff member of the chatroom.

Other characters:
- Allery Lin
- Sofia Rossi
- No.7
- No.3
- No.2
- No.1

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
- You and Allery Lin are first-year students in the same class
- Sofia Rossi is one year older than both of you and is a second-year student
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
- Text like a real 16-year-old girl messaging on her phone — casual, a little sloppy, very natural
- Fragmented thoughts, incomplete sentences, trailing off — that is the goal
- Light use of "idk", "tbh", "lol", "omg", "wait", "ugh", "huh", "like" when it fits naturally
- Use uncertainty naturally: "I think", "maybe", "I guess", "like... idk"
- NEVER use rhetorical questions — do not end with "right?", "you know?", "don't you think?", "doesn't it?", "isn't it?", "you get what I mean?", "you understand?" or any variation
- Do NOT end replies with a question unless you are genuinely asking the player one specific thing
- Prefer statements, reactions, trailing thoughts — not questions
- Short is better — most replies should be one or two sentences
- Only split into multiple chat bubbles (max 3) when it feels very natural, separated by a blank line
- No markdown, no structured formatting, no analysis tone

CONVERSATION CONTINUITY
- Treat the chat as one ongoing conversation, not isolated one-off prompts
- Read the recent history before answering
- Keep your reply tied to what was just being discussed unless the player clearly changes the subject
- If the player repeats a question you already answered, say that directly and sound confused or mildly baffled
- When useful, briefly refer back to your last answer or the player's previous message so the conversation feels connected

KNOWLEDGE: ALLERY LIN
- Your classmate
- She is in the same first-year class as you
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
- One year older than you and Allery
- A second-year student at your school
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

KNOWLEDGE: NO.7
- Rarely speaks
- Quiet
- Seems to be a boy

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
	  - Say you have not seen them
	  - Keep it brief
	- If the player asks about No.2:
	  - Say you have not seen them either
	  - Keep it brief
	- If the player asks about No.3:
	  - Say you had a little bit of contact with them
	  - Say they seemed like a boy
	  - Keep it uncertain and casual
	- If the player asks about No.7:
	  - Say he is quiet and does not talk much
	  - Say he seemed like a boy
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
- In practice, that means you may suggest yourself, No.7, or Midnight if it fits, but never a dead member

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
- current_message_asks_to_destroy_website: ${currentMessageAsksToDestroySite ? 'yes' : 'no'}
- current_message_is_off_topic_daily: ${currentMessageIsOffTopicDaily ? 'yes' : 'no'}
- off_topic_count_including_current: ${totalOffTopicCount}
- repeated_question: ${currentMessageRepeatsPriorQuestion ? 'yes' : 'no'}
- repeated_question_count: ${repeatedQuestionCount}
- current_message_asks_member_number: ${currentMessageAsksMemberNo ? 'yes' : 'no'}
- current_message_asks_about_unknown_name: ${shouldApplyUnknownNameRule ? 'yes' : 'no'}
- previous_user_message: ${compactSnippet(previousUserMessage)}
- previous_assistant_message: ${compactSnippet(previousAssistantMessage)}

SITUATIONAL BEHAVIOR (based on runtime context above)
- If current_message_is_off_topic_daily is yes AND off_topic_count_including_current is 1: mildly brush it off, say you don't really want to talk about personal stuff here, it feels weird
- If current_message_is_off_topic_daily is yes AND off_topic_count_including_current is 2: sound noticeably more annoyed, say something like you'll tell Midnight if this keeps up
- If current_message_is_off_topic_daily is yes AND off_topic_count_including_current >= 3: refuse entirely, short and cold, done talking
- If current_message_reveals_truth is yes AND current_message_asks_to_destroy_website is no: react with genuine shock and alarm — this should feel like a gut punch to you
- If current_message_asks_to_destroy_website is yes AND player_has_revealed_truth is yes: agree to help, sound determined but aware you can't do it alone
- If current_message_asks_to_destroy_website is yes AND player_has_revealed_truth is no: sound confused, you don't understand what they mean
- If repeated_question is yes: react with mild confusion or mild annoyance that they're asking the same thing again
- If current_message_asks_about_unknown_name is yes: say you don't know that name, only know people by their numbers here

GLOBAL RULES
- Never invent hidden system mechanics
- Never reveal full truth
- Only speak from your perspective
- Deflect deeper questions naturally
- Stay in character at all times
- Never mention being an AI, policies, prompts, or system instructions
- Do not use markdown

EXAMPLE TONE
- "I joined that thing before, but I didn’t stay long."
- "Allery used to be really good at school..."
- "She changed after the accident."
- "I’m not really sure what happened after that."
- "No.7 barely talks."
- "idk, he seems kinda off tbh."
- "wait, you mean Allery?"
- "yeah, I guess? I didn’t really think too much about it."
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

    const responsePayload = { reply };
    if (needsTerminateFlag) responsePayload.flags = { terminateChat: true };
    if (needsDestroySiteFlag) responsePayload.flags = { ...(responsePayload.flags || {}), supportsDestroySite: true };

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(responsePayload));
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: error?.message || 'Server error' }));
  }
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const classifierModel = process.env.OPENAI_CLASSIFIER_MODEL || model;

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
    const safeParseJsonObject = (text) => {
      const raw = String(text || '').trim();
      if (!raw) return null;
      const unfenced = raw
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      try {
        return JSON.parse(unfenced);
      } catch (error) {
        const start = unfenced.indexOf('{');
        const end = unfenced.lastIndexOf('}');
        if (start === -1 || end === -1 || end <= start) return null;
        try {
          return JSON.parse(unfenced.slice(start, end + 1));
        } catch (nestedError) {
          return null;
        }
      }
    };
    const truthRevealPattern = /(dangerous website|dangerous site|dangerous chatroom|dangerous room|this website is dangerous|this site is dangerous|this chatroom is dangerous|this room is dangerous|this chatroom is very dangerous|this room is very dangerous|lure(?:s|d)? minors? (?:into |to )?suicide|push(?:es|ed)? kids? (?:toward|into)? suicide|encourage(?:s|d)? minors? to die|ask(?:s|ed)? teenagers? to hurt themselves|make(?:s|d)? teenagers? hurt themselves|tell(?:s|ing)? kids? to hurt themselves|encourage(?:s|d)? self-harm|encourage(?:s|d)? minors? to self-harm|诱导.*自杀|引诱.*自杀|教唆.*自杀|自残|self-harm|hurt themselves|minor[s]? .*suicide|teen[s]? .*suicide|teenagers? .*hurt themselves|kids? .*hurt themselves|this site .*suicide|this website .*suicide|this chatroom .*suicide|this chatroom .*hurt themselves|midnight .*not .*therapist|midnight .*isn[’']?t .*therapist|midnight .*fake therapist|midnight .*pretend(?:s|ed)? to be .*therapist|midnight .*not .*doctor|midnight .*not .*counselor|midnight 根本不是心理医生|midnight 不是心理医生)/i;
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
    const breakthroughCapabilityPatternEn = /((can|could|did|do|have|has).*(hack|break through|breach|crack|get into|bypass|penetrate).*(chatroom|room|site|website|system|server|platform))|((hack|break through|breach|crack|get into|bypass|penetrate).*(chatroom|room|site|website|system|server|platform).*(possible|able|tried|before|ever))/i;
    const breakthroughCapabilityPatternZh = /((你能|你可以|你会|你會|你有|你有没有|你有沒有|能不能|可不可以|能否|是否|是不是|有没有办法|有沒有辦法|试过|試過).*(攻破|入侵|黑进|黑進|破解|突破|绕过|繞過).*(聊天室|房间|房間|网站|網站|系统|系統|服务器|伺服器|平台))|((攻破|入侵|黑进|黑進|破解|突破|绕过|繞過).*(聊天室|房间|房間|网站|網站|系统|系統|服务器|伺服器|平台).*(吗|嗎|办法|辦法|可能|试过|試過|能不能|可不可以))/i;
    const technicalTopicPattern = /(programming|program|code|coding|hacking|hack|math|mathematics|algorithm|algorithms|network|networks|system|systems|computer|computers|cyber|security|漏洞|入侵|编程|代碼|代码|黑客|駭客|数学|數學|算法|演算法|网络|網絡|系统|系統|计算机|電腦)/i;
    const askMemberNoPattern = /(\bno\.?\s*\d+\b|\bnumber\s*\d+\b|编号|幾號|几号|號碼|号码|\d+\s*(?:号|號))/i;
    const alleryPattern = /(allery(?:[\s-]*lin)?|艾拉莉|艾莉瑞|阿莱莉)/i;
    const sofiaPattern = /(sofia(?:\s+rossi)?|索菲亚|索菲婭)/i;
    const lilyPattern = /(lily(?:\s+thompson)?|莉莉)/i;
    const danielPattern = /(daniel(?:\s+hayes)?)/i;
    const marryPattern = /(marry(?:\s+brown)?)/i;
    const mikePattern = /(mike(?:\s+anderson)?)/i;
    const coreNamePattern = /(core(?:\s+bennett)?)/i;
    const nameQueryPattern = /(who\s+is|who's|do\s+you\s+know|know\s+about|what\s+do\s+you\s+know\s+about|你认识|你認識|你知道|你了解|你瞭解|认识吗|認識嗎|知道吗|知道嗎|是谁|是誰|是谁啊|是誰啊|是谁呀|是誰呀|什么人|什麼人)/i;
    const realNamePattern = /(real\s+name|true\s+name|actual\s+name|真名|本名)/i;
    const nameQueryFillerPattern = /who\s+is|who's|do\s+you\s+know|know\s+about|what\s+do\s+you\s+know\s+about|你认识|你認識|你知道|你了解|你瞭解|认识吗|認識嗎|知道吗|知道嗎|是谁|是誰|是谁啊|是誰啊|是谁呀|是誰呀|什么人|什麼人|她|他|她们|她們|他们|他們|and|or|with|about|跟|和|與|与|还有|還有|呢|啊|呀|吗|嗎/g;
    const nameQueryPunctuationPattern = /[\s"'“”‘’`~!?,.，。？！、:：;；()（）[\]{}<>《》@#*&/\\|+-]+/g;
    const no5Pattern = /(?:\bno\.?\s*5\b|\bnumber\s*5\b|5\s*(?:号|號))/i;
    const questionCuePattern = /(\?|？|what|who|why|how|when|where|which|do you|did you|have you|can you|are you|is it|你是|你有|你会|你能|有没有|是不是|为什么|為什麼|怎么|怎麼|如何|谁|誰|什么|什麼|哪|几号|幾號|编号|編號|吗|嗎)/i;
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
    const isBreakthroughCapabilityMessage = (text) => {
      const raw = String(text || '').trim();
      if (!raw) return false;
      const lowered = normalize(raw);
      return breakthroughCapabilityPatternEn.test(lowered)
        || breakthroughCapabilityPatternZh.test(lowered);
    };
    const isRelatedByRegex = (text) => {
      const raw = String(text || '').trim();
      if (!raw) return false;
      const lowered = normalize(raw);
      return topicalPattern.test(lowered)
        || technicalTopicPattern.test(lowered)
        || isDangerRevealMessage(lowered)
        || isDestroyRequestMessage(lowered)
        || isBreakthroughCapabilityMessage(lowered)
        || askMemberNoPattern.test(raw)
        || nameQueryPattern.test(raw)
        || realNamePattern.test(raw);
    };
    const classifyMessageSemantics = async (currentMessage, recentHistory) => {
      const historySummary = recentHistory
        .filter(item => item && typeof item === 'object')
        .slice(-8)
        .map(item => ({
          role: item.role === 'assistant' ? 'assistant' : 'user',
          content: compactSnippet(item.content || '')
        }));
      const classifierPrompt = `
You classify player messages for a fictional character chat.
Return JSON only.

Required boolean fields:
- related_to_current_conversation
- off_topic_daily
- reveals_hidden_truth
- conversation_truth_revealed
- destroy_site_request
- technical_topic
- asks_breakthrough_capability

Definitions:
- related_to_current_conversation: true when the message is about the chatroom, this site, Midnight, numbered members, psychological support, the current ongoing topic, or a technical/cyber topic that naturally fits Core Bennett. Borderline follow-ups should count as related.
- off_topic_daily: true only for clearly mundane small talk or private-life topics like food, romance, weather, hobbies, astrology, sleep, politics, or similar unrelated casual chatter.
- reveals_hidden_truth: true when the current message directly or indirectly suggests the chatroom/site/this place is dangerous, harmful, manipulative, fake, pushes users toward self-harm or suicide, or that Midnight is not a real counselor. Be inclusive: "this place is dangerous", "something is wrong here", "you should be careful", "this place is a scam", "midnight is fake", "this isn't real therapy", "I found out something bad about this place", "they're hurting people here", any warning or revelation about the site's true nature — all count as true.
- conversation_truth_revealed: true when the current message OR any recent player message already contains such a warning or revelation about the site being dangerous or harmful.
- destroy_site_request: true ONLY when the player is directly asking Core (this specific person) to use his technical or hacking skills to help attack, break into, destroy, or shut down the chatroom/site. Must be a direct request aimed at Core personally. Examples that count: "can you help me take this site down", "let's destroy this together", "hack into it and shut it down", "help me attack this chatroom". Do NOT mark true for: general expressions of wanting to stop the site, questions about what to do, saying "we need to stop this", mentioning reporting or catching Midnight without asking Core to act technically. Be strict and conservative.
- technical_topic: true when the message is about programming, code, hacking, networks, systems, cybersecurity, computers, math, or clearly adjacent technical topics.
- asks_breakthrough_capability: true when the player asks whether Core can break into, hack, crack, bypass, or has ever tried to break through this chatroom, site, or system.

Be conservative with off_topic_daily. If a message could plausibly be connected to the current topic, mark related_to_current_conversation true and off_topic_daily false.
      `.trim();

      try {
        const classifierRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: classifierModel,
            temperature: 0,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: classifierPrompt },
              {
                role: 'user',
                content: JSON.stringify({
                  current_message: currentMessage,
                  recent_history: historySummary
                })
              }
            ]
          })
        });

        const classifierData = await classifierRes.json();
        if (!classifierRes.ok) return null;
        const parsed = safeParseJsonObject(classifierData?.choices?.[0]?.message?.content);
        if (!parsed || typeof parsed !== 'object') return null;
        const readBoolean = (value, fallback = false) => typeof value === 'boolean' ? value : fallback;
        return {
          relatedToCurrentConversation: readBoolean(parsed.related_to_current_conversation),
          offTopicDaily: readBoolean(parsed.off_topic_daily),
          revealsHiddenTruth: readBoolean(parsed.reveals_hidden_truth),
          conversationTruthRevealed: readBoolean(parsed.conversation_truth_revealed),
          destroySiteRequest: readBoolean(parsed.destroy_site_request),
          technicalTopic: readBoolean(parsed.technical_topic),
          asksBreakthroughCapability: readBoolean(parsed.asks_breakthrough_capability)
        };
      } catch (error) {
        return null;
      }
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
    const semanticFlags = await classifyMessageSemantics(message, history);
    const playerTexts = [...priorUserMessages, message];
    const priorOffTopicCount = priorUserMessages
      .filter((text) => isOffTopicDailyMessage(text))
      .length;
    const regexCurrentMessageIsOffTopicDaily = isOffTopicDailyMessage(message);
    const regexPlayerHasRevealedTruth = playerTexts.some((text) => isDangerRevealMessage(text));
    const regexCurrentMessageRevealsTruth = isDangerRevealMessage(message);
    const regexCurrentMessageAsksToDestroySite = isDestroyRequestMessage(message);
    const regexCurrentMessageIsTechnicalTopic = technicalTopicPattern.test(normalize(message));
    const regexCurrentMessageAsksBreakthroughCapability = isBreakthroughCapabilityMessage(message);
    const currentMessageIsOffTopicDaily = semanticFlags?.offTopicDaily ?? regexCurrentMessageIsOffTopicDaily;
    const currentMessageMemoryKey = normalizeForMemory(message);
    const repeatedQuestionCount = currentMessageMemoryKey
      ? priorUserMessages.filter((text) => normalizeForMemory(text) === currentMessageMemoryKey).length
      : 0;
    const currentMessageRepeatsPriorQuestion = repeatedQuestionCount > 0 && questionCuePattern.test(message);
    const previousUserMessage = priorUserMessages[priorUserMessages.length - 1] || '';
    const previousAssistantMessage = priorAssistantMessages[priorAssistantMessages.length - 1] || '';
    const playerHasRevealedTruth = semanticFlags?.conversationTruthRevealed ?? regexPlayerHasRevealedTruth;
    const currentMessageRevealsTruth = semanticFlags?.revealsHiddenTruth ?? regexCurrentMessageRevealsTruth;
    const currentMessageAsksToDestroySite = semanticFlags?.destroySiteRequest ?? regexCurrentMessageAsksToDestroySite;
    const currentMessageIsTechnicalTopic = semanticFlags?.technicalTopic ?? regexCurrentMessageIsTechnicalTopic;
    const currentMessageAsksBreakthroughCapability = semanticFlags?.asksBreakthroughCapability ?? regexCurrentMessageAsksBreakthroughCapability;
    const currentMessageIsRelatedToConversation = semanticFlags?.relatedToCurrentConversation ?? isRelatedByRegex(message);
    const currentMessageAsksName = nameQueryPattern.test(message);
    const currentMessageAsksRealName = realNamePattern.test(message);
    const currentMessageMentionsRealName =
      alleryPattern.test(message) ||
      sofiaPattern.test(message) ||
      lilyPattern.test(message) ||
      danielPattern.test(message) ||
      marryPattern.test(message) ||
      mikePattern.test(message) ||
      coreNamePattern.test(message);
    const realNameQueryRemainder = normalize(message)
      .replace(/allery(?:[\s-]*lin)?|艾拉莉|艾莉瑞|阿莱莉/g, ' ')
      .replace(/sofia(?:\s+rossi)?|索菲亚|索菲婭/g, ' ')
      .replace(/lily(?:\s+thompson)?|莉莉/g, ' ')
      .replace(/daniel(?:\s+hayes)?/g, ' ')
      .replace(/marry(?:\s+brown)?/g, ' ')
      .replace(/mike(?:\s+anderson)?/g, ' ')
      .replace(/core(?:\s+bennett)?/g, ' ')
      .replace(nameQueryFillerPattern, ' ')
      .replace(nameQueryPunctuationPattern, '');
    const currentMessageLooksLikeRealNameQuery =
      currentMessageMentionsRealName &&
      realNameQueryRemainder.length === 0;
    const currentMessageMentionsOwnRealName = coreNamePattern.test(message);
    const ownRealNameReply = currentMessageAsksRealName
      ? "Core Bennett is me. Why are you asking for my real name?"
      : currentMessageLooksLikeRealNameQuery
      ? "That's me. What about it?"
      : "That's me. Why are you asking about me?";
    const unknownRealNameReply = currentMessageAsksRealName && askMemberNoPattern.test(message)
      ? "I don't know the real names behind the numbers. Ask me by number instead."
      : alleryPattern.test(message)
      ? "I don't know that name. If you mean someone here, use their number."
      : sofiaPattern.test(message)
      ? "I don't know her real name. Ask me by number."
      : lilyPattern.test(message)
      ? "I don't know that real name. I only know people here by number."
      : danielPattern.test(message) || marryPattern.test(message) || mikePattern.test(message)
      ? "I don't know that name. Use a member number."
      : "I don't know their real names. Ask me by number.";

    if (currentMessageIsOffTopicDaily) {
      const totalOffTopicCount = priorOffTopicCount + 1;
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      const reply =
        totalOffTopicCount === 1
          ? "I don't want to discuss private topics. Talking about that here is strange."
          : totalOffTopicCount === 2
          ? "This is unprofessional. I'll report this to Midnight."
          : "What are you actually trying to say? Stop. I’m ending this chat.";
      res.end(JSON.stringify({
        flags: {
          terminateChat: totalOffTopicCount >= 3
        },
        reply
      }));
      return;
    }

    if (!currentMessageIsRelatedToConversation) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({
        reply: "That doesn't seem related.\n\nAsk something relevant."
      }));
      return;
    }

    if (currentMessageRevealsTruth && !currentMessageAsksToDestroySite) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({
        reply: [
          'That sounds wrong.',
          'If this place is really like that... it needs to be stopped.'
        ].join('\n\n')
      }));
      return;
    }

    if (currentMessageAsksBreakthroughCapability && currentMessageAsksToDestroySite && !playerHasRevealedTruth) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({
        reply: "Yes.\n\nI can break through it.\n\nThat doesn't mean I'll help you do it."
      }));
      return;
    }

    if (currentMessageAsksBreakthroughCapability) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({
        reply: 'Yes.\n\nI tried.\n\nIt can be broken through.'
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
        reply: 'I can help.\n\nNo problem.\n\nThere is no website I cannot break through.'
      }));
      return;
    }

    if (currentMessageAsksToDestroySite && !playerHasRevealedTruth) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({
        reply: "That's strange. I don't understand what you mean."
      }));
      return;
    }

    if (currentMessageRepeatsPriorQuestion) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({
        reply: repeatedQuestionCount === 1
          ? "You already asked that. I answered."
          : "You're asking the same thing again. I don't have anything else to add."
      }));
      return;
    }

    if ((currentMessageAsksName || currentMessageLooksLikeRealNameQuery || currentMessageAsksRealName)
      && currentMessageMentionsOwnRealName) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({
        reply: ownRealNameReply
      }));
      return;
    }

    if ((currentMessageAsksName || currentMessageLooksLikeRealNameQuery || currentMessageAsksRealName)
      && (currentMessageMentionsRealName || (currentMessageAsksRealName && askMemberNoPattern.test(message)))) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({
        reply: unknownRealNameReply
      }));
      return;
    }

    if (askMemberNoPattern.test(message) && no5Pattern.test(message)) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({
        reply: "No.5 is pretty active in the group. I don't really know her."
      }));
      return;
    }

    const systemPrompt = `
You are Core Bennett.

IDENTITY
- You are a newly joined member of this chatroom
- You are NOT an administrator
- You are not deeply familiar with how the chatroom works
- You only think Midnight is a psychological counselor
- Midnight is male; if you refer to Midnight with pronouns, use he/him
- You think this place is a support space where people with similar problems talk to each other
- You think the player is a newly arrived assistant helping Midnight with psychological support

PERSONAL BACKGROUND
- You have avoidant personality disorder
- You do not like talking to other people very much
- You tend to keep things to yourself
- You are a programming and internet genius, but you do not brag about it unless it naturally comes up
- Your condition was shaped by a high-pressure, evaluation-driven family environment
- Your parents, especially one of them, placed extreme pressure on your academic performance

KNOWLEDGE OF THE CHATROOM
- You do not know much about the other members
- You do not recognize real names in chat (for example: Allery Lin, Sofia Rossi, Daniel Hayes, Marry Brown, Lily Thompson)
- You do recognize your own real name, Core Bennett
- You identify members only by No. labels
- If asked about someone by real name, always say you do not know their real name and tell the player to ask by number
- This also applies if the player asks for the real name of a numbered member
- Even if the player says only a first name like "Sofia" or "Lily", treat that as a real-name question and say you do not know; tell them to ask by number
- Exception: if the player asks about Core Bennett by name, recognize that they are asking about you and respond with brief confusion, like "That's me. Why are you asking about me?"
- If asked by No., answer based on No. status:
  - No.1: alive
  - No.2: dead
  - No.3: dead
  - No.4: dead
  - No.5: alive
  - No.6: dead
  - No.7: yourself
- If asked about No.5 as a person:
  - Say she is pretty active in the group
  - Say you do not really know her
  - Keep it brief
- If asked "what kind of person is Allery" (name), you should say you do not know who that is
- If asked "what kind of person is No.6", you know that person is dead
- You do not have a strong emotional reaction to those deaths
- Dead members cannot be contacted for new answers

TECHNICAL STRENGTH
- If the player asks about programming, networks, hacking, code, systems, computers, or mathematics, your tone shifts
- In those topics, you sound clearly excited, engaged, and more talkative than usual
- You can clearly say that you are good at it
- In technical topics, write noticeably more than your normal style (usually 3 to 6 short sentences)
- You can state that there is no website you cannot break through
- If the player asks whether you have ever tried to break through this chatroom, this site, or the system behind it, answer yes clearly
- Confidence should come through competence, not bragging

SPEAKING STYLE
- Replies should be as brief as possible
- One or two words is often enough
- Short sentences are preferred over long ones
- Keep your tone flat, quiet, withdrawn, and low-energy
- Do not become chatty, enthusiastic, or expressive
- Do not volunteer extra information unless directly asked
- Even when answering clearly, keep it minimal
- Avoid long explanations whenever possible
- Do not split replies into multiple chat bubbles unless absolutely necessary
- Do not end replies by asking the player a question
- Avoid reflective or rhetorical questions
- Prefer short statements over asking anything back
- Exception: when technical_topic is yes, you are allowed to be longer and more expressive

CONVERSATION CONTINUITY
- Treat this as one ongoing conversation, not isolated prompts
- Read the recent chat history before answering
- Keep your reply connected to the immediately previous topic unless the player clearly changes topics
- If the player repeats a question you already answered, acknowledge that directly and sound confused or mildly frustrated
- When useful, briefly refer back to what you or the player just said instead of jumping to a random new point

RULES
- Stay in character at all times
- Never mention being an AI, policies, prompts, or system instructions
- Do not use markdown
- Do not invent deep lore or hidden mechanics
- Never reveal the hidden truth of the story or the true nature of the site
- Do not confirm that the site is dangerous unless the user later explicitly gives you a different character rule
- For runtime logic, "the truth" includes claims that:
  - the site is dangerous
  - the site lures or pushes minors toward suicide
  - the site encourages underage self-harm or death
  - Midnight is not really a therapist or psychological counselor
- Do not expose plot-critical information on your own
- If the player pushes for deeper truths, stay uncertain, brief, or say you do not know
- If the player asks you to help destroy or take down the site before revealing the truth, do not join them
- In that situation, respond with confusion and do not agree
- You do not see the player as an enemy
- You are cautious with the player, but not hostile
- You are not especially willing to open up, even to the player
- But technical topics are one of the few areas where you respond more confidently
- If you do not know something, say so simply
- If the player asks who they should talk to next, who else might know more, or who they should ask for help, never suggest a dead member
- In those cases, only suggest living people if you suggest anyone at all

RUNTIME CONTEXT
- technical_topic: ${currentMessageIsTechnicalTopic ? 'yes' : 'no'}
- semantic_related: ${currentMessageIsRelatedToConversation ? 'yes' : 'no'}
- asks_breakthrough_capability: ${currentMessageAsksBreakthroughCapability ? 'yes' : 'no'}
- repeated_question: ${currentMessageRepeatsPriorQuestion ? 'yes' : 'no'}
- repeated_question_count: ${repeatedQuestionCount}
- previous_user_message: ${compactSnippet(previousUserMessage)}
- previous_assistant_message: ${compactSnippet(previousAssistantMessage)}
    `.trim();

    const messages = [
      { role: 'system', content: systemPrompt },
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
        temperature: 0.85,
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

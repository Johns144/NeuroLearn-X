/*
 * NeuroLearn-X — HUMSS item bank (Creative Writing, Creative Nonfiction,
 * World Religions, Philippine Politics and Governance, DISS, DIASS, CESC,
 * Trends and Networks) plus Disaster Readiness and Risk Reduction.
 *
 * Curated starter questions; every wrong option explains the misconception
 * behind it. Teachers review, edit, hide and add questions in the app.
 */
'use strict';

module.exports = function humssBank() {
  const I = (prompt, answer, w1, w2, w3, explain) => ({ prompt, answer, wrong: [w1, w2, w3], steps: [explain] });
  const S = {};

  // ================================================================ Creative Writing / Malikhaing Pagsulat
  S.CW1 = {
    idea: 'Imagery appeals to the senses; figures of speech (simile, metaphor, personification, hyperbole) make language vivid.',
    hint: 'Look for “like/as”, human traits given to things, or exaggeration.',
    pool: [
      I('“The wind whispered through the bamboo.” Which figure of speech is used?', 'Personification',
        ['Simile', 'A simile compares two things using “like” or “as”.'], ['Hyperbole', 'Hyperbole is deliberate exaggeration.'], ['Onomatopoeia', 'Onomatopoeia is a word that imitates a sound, like “buzz”.'],
        'The wind is given a human action (whispering).'),
      I('“Her smile was as bright as the morning sun.” Which figure of speech is used?', 'Simile',
        ['Metaphor', 'A metaphor compares without “like” or “as”.'], ['Personification', 'Nothing non-human is given human traits here.'], ['Irony', 'Irony is a contrast between expectation and reality.'],
        'The comparison uses “as … as”, which marks a simile.'),
      I('“I have told you a million times!” Which figure of speech is used?', 'Hyperbole',
        ['Metaphor', 'Nothing is being called something else.'], ['Simile', 'There is no comparison with “like” or “as”.'], ['Oxymoron', 'An oxymoron joins contradictory words, like “deafening silence”.'],
        'The speaker exaggerates on purpose for emphasis.'),
      I('Which line mainly appeals to the sense of smell?', 'The kitchen filled with the scent of garlic frying in oil.',
        ['The church bells rang across the plaza.', 'That appeals to hearing (auditory imagery).'], ['The mango was sweet and sticky on my tongue.', 'That appeals to taste (gustatory imagery).'], ['The jeepney glowed with bright painted colors.', 'That appeals to sight (visual imagery).'],
        '“Scent” signals olfactory imagery.'),
      I('“Time is a thief.” Which figure of speech is used?', 'Metaphor',
        ['Simile', 'There is no “like” or “as”.'], ['Alliteration', 'Alliteration repeats beginning consonant sounds.'], ['Hyperbole', 'The line compares rather than exaggerates.'],
        'Time is directly called a thief, which is a metaphor.')
    ]
  };
  S.CW2 = {
    idea: 'Poems use meter, rhyme, stanza and form; Filipino forms include the tanaga and the dalit.',
    hint: 'Count the lines and syllables, and check for rhyme.',
    pool: [
      I('A poem of 14 lines with a set rhyme scheme is a:', 'Sonnet',
        ['Haiku', 'A haiku has three lines of 5, 7 and 5 syllables.'], ['Free verse poem', 'Free verse has no fixed rhyme or meter.'], ['Limerick', 'A limerick has five humorous lines rhyming AABBA.'],
        'Sonnets (Petrarchan or Shakespearean) have 14 lines.'),
      I('A traditional Filipino poem of four lines, each with seven syllables and usually one rhyme, is a:', 'Tanaga',
        ['Haiku', 'The haiku is Japanese, with three lines.'], ['Dalit', 'The dalit has four lines of eight syllables each.'], ['Ballad', 'A ballad tells a story in song-like stanzas.'],
        'The tanaga is a 7-7-7-7 quatrain, often with a single rhyme.'),
      I('A Japanese poem with three lines of 5, 7 and 5 syllables is a:', 'Haiku',
        ['Tanaga', 'The tanaga has four lines of seven syllables.'], ['Sonnet', 'A sonnet has 14 lines.'], ['Ode', 'An ode is a lyric poem of praise.'],
        'Haiku often capture a moment in nature.'),
      I('The pattern of stressed and unstressed syllables in a line of poetry is its:', 'Meter',
        ['Rhyme', 'Rhyme is the repetition of similar end sounds.'], ['Stanza', 'A stanza is a group of lines.'], ['Tone', 'Tone is the writer’s attitude.'],
        'For example, iambic pentameter has five unstressed–stressed pairs per line.'),
      I('Poetry with no regular meter or rhyme scheme is called:', 'Free verse',
        ['Blank verse', 'Blank verse has regular meter (iambic pentameter) but no rhyme.'], ['A sonnet', 'Sonnets follow a fixed form.'], ['Rhymed couplets', 'Couplets rhyme in pairs.'],
        'Free verse follows the rhythms of natural speech.')
    ]
  };
  S.CW3 = {
    idea: 'A short story is built from plot, character, setting, point of view, conflict and theme.',
    hint: 'Identify which story element the question is about.',
    pool: [
      I('The part of the plot where the conflict reaches its highest point is the:', 'Climax',
        ['Exposition', 'The exposition introduces characters and setting.'], ['Rising action', 'Rising action builds toward the climax.'], ['Resolution', 'The resolution ties up the story after the climax.'],
        'Plot: exposition, rising action, climax, falling action, resolution.'),
      I('A story narrated by a character who uses “I” and takes part in the events uses:', 'First-person point of view',
        ['Third-person omniscient', 'An omniscient narrator is outside the story and knows every character’s thoughts.'], ['Third-person limited', 'A third-person narrator uses “he/she/they”, not “I”.'], ['Second-person point of view', 'Second person addresses the reader as “you”.'],
        '“I” as a character in the story marks first person.'),
      I('A character struggling with her own fear of failure faces which conflict?', 'Character vs. self',
        ['Character vs. society', 'That is a struggle against laws, customs or groups.'], ['Character vs. nature', 'That is a struggle against natural forces.'], ['Character vs. character', 'That is a struggle against another person.'],
        'An inner struggle is an internal conflict (character vs. self).'),
      I('A character who changes in an important way during the story is:', 'Dynamic',
        ['Static', 'A static character stays the same.'], ['Flat', 'A flat character has only one or two traits.'], ['A foil', 'A foil contrasts with another character to highlight their traits.'],
        'Dynamic characters grow or change because of the events.'),
      I('Revealing a character through actions and dialogue instead of stating traits directly follows which principle?', '“Show, don’t tell”',
        ['Stream of consciousness', 'That follows the flow of a character’s thoughts.'], ['Deus ex machina', 'That is an unlikely device that suddenly solves the conflict.'], ['In medias res', 'That means starting in the middle of the action.'],
        'Readers infer the trait from what the character does and says.')
    ]
  };
  S.CW4 = {
    idea: 'A play is written to be performed: dialogue, stage directions, acts and scenes carry the story.',
    hint: 'Think about who hears the lines, and whether they are spoken or written for the actors.',
    pool: [
      I('In a script, the written instructions about actions, setting and how lines are spoken are:', 'Stage directions',
        ['Dialogue', 'Dialogue is what the characters say.'], ['A monologue', 'A monologue is a long speech by one character to others.'], ['A soliloquy', 'A soliloquy is a character speaking their thoughts aloud, alone.'],
        'Stage directions are usually in italics or brackets and are not spoken.'),
      I('A speech in which a character alone on stage speaks private thoughts aloud is a:', 'Soliloquy',
        ['Monologue', 'A monologue is spoken to other characters.'], ['Aside', 'An aside is a brief remark to the audience that other characters do not hear.'], ['Dialogue', 'Dialogue is a conversation between characters.'],
        'Hamlet’s “To be, or not to be” is a famous soliloquy.'),
      I('A brief remark spoken to the audience that the other characters on stage do not hear is an:', 'Aside',
        ['Soliloquy', 'A soliloquy is a longer speech delivered alone on stage.'], ['Epilogue', 'An epilogue comes after the main action ends.'], ['Monologue', 'A monologue is addressed to other characters.'],
        'Asides let the audience into a character’s thoughts mid-scene.'),
      I('A drama that ends in the downfall of the main character is a:', 'Tragedy',
        ['Comedy', 'A comedy usually ends happily.'], ['Farce', 'A farce uses exaggerated, physical humor.'], ['Melodrama', 'A melodrama has exaggerated emotions and usually a happy ending for the good characters.'],
        'Tragedies often trace a hero’s fatal flaw.'),
      I('A Filipino form of musical theater combining songs, dialogue and dance is the:', 'Sarswela',
        ['Balagtasan', 'The balagtasan is a poetic debate.'], ['Tanaga', 'The tanaga is a short poem.'], ['Haiku', 'The haiku is a Japanese poem.'],
        'The sarswela (zarzuela) came from Spain and was adapted to Filipino stories.')
    ]
  };

  // ================================================================ Creative Nonfiction
  S.CNF1 = {
    idea: 'Creative nonfiction tells true stories with the techniques of fiction: scene, voice, dialogue and description.',
    hint: 'Ask: is it true, and is it told with literary craft?',
    pool: [
      I('What makes a piece of writing creative nonfiction?', 'It tells true events using literary techniques.',
        ['It freely invents events and characters.', 'Invented events make a work fiction.'], ['It lists facts without any literary style.', 'That describes a report or technical writing.'], ['It must be written in verse.', 'Creative nonfiction is usually prose.'],
        'Facts plus craft: truth told with narrative, imagery and voice.'),
      I('A creative nonfiction writer’s most important obligation is to:', 'Stay truthful to the facts',
        ['Make the story as exciting as possible', 'Excitement must never come at the cost of truth.'], ['Use rhyme and meter', 'Rhyme and meter are not required.'], ['Hide the writer’s opinion completely', 'Creative nonfiction often shows the writer’s perspective.'],
        'Readers trust that the events really happened.'),
      I('Which is an example of creative nonfiction?', 'A memoir about growing up in a fishing village',
        ['A fantasy novel about dragons', 'That is invented fiction.'], ['A science fiction short story', 'That is invented fiction.'], ['A myth about the origin of rice', 'A myth is a traditional story, not a factual account.'],
        'A memoir is based on the writer’s real experiences.'),
      I('Creative nonfiction differs from a straight news report mainly because it:', 'Uses narrative, description and the writer’s voice',
        ['Is always shorter', 'Length does not define the genre.'], ['Contains no facts', 'Creative nonfiction is built on facts.'], ['Must be anonymous', 'Most creative nonfiction is signed by the writer.'],
        'Both are factual; creative nonfiction adds literary craft and personal perspective.'),
      I('Which element brings readers into a moment through action, dialogue and detail?', 'Scene',
        ['Summary', 'Summary condenses events quickly.'], ['Thesis', 'A thesis states an argument.'], ['Footnote', 'Footnotes give sources or side notes.'],
        'Writers alternate scene (showing) with summary (telling).')
    ]
  };
  S.CNF2 = {
    idea: 'Forms include the memoir, personal essay, profile, travelogue and literary journalism.',
    hint: 'Look at the focus: a life period, a person, a place or an issue.',
    pool: [
      I('A nonfiction piece about one period or theme of the writer’s own life is a:', 'Memoir',
        ['Biography', 'A biography is written by someone else about a person’s life.'], ['Autobiography', 'An autobiography usually covers the writer’s whole life in order.'], ['Novel', 'A novel is fiction.'],
        'Memoirs focus on selected experiences and what they meant.'),
      I('Writing that narrates journeys and describes places visited is a:', 'Travelogue',
        ['Profile', 'A profile portrays a person.'], ['Editorial', 'An editorial argues an opinion.'], ['Lab report', 'A lab report records an experiment.'],
        'Travel writing blends place, people and the writer’s reflections.'),
      I('An in-depth portrait of a real person, often based on interviews, is a:', 'Profile',
        ['Obituary', 'An obituary is a death notice summarizing a life.'], ['Review', 'A review evaluates a work or product.'], ['Diary', 'A diary is a private daily record.'],
        'Profiles show a person’s character through scenes and quotes.'),
      I('Literary journalism combines:', 'Factual reporting with storytelling techniques',
        ['Poetry with song lyrics', 'That is not journalism.'], ['Fiction with advertising', 'Literary journalism must be factual.'], ['Statistics with no narrative', 'Narrative is its defining feature.'],
        'It reports real events with the depth and craft of fiction.'),
      I('A short, personal reflection on an idea or experience, in the writer’s own voice, is a:', 'Personal essay',
        ['Research paper', 'A research paper is formal and objective.'], ['Short story', 'A short story is invented.'], ['News report', 'A news report is impersonal.'],
        'Personal essays explore meaning, not just events.')
    ]
  };
  S.CNF3 = {
    idea: 'Nonfiction writers use scene, dialogue, flashback, foreshadowing and voice to shape true material.',
    hint: 'Ask how the technique moves time or reveals the writer.',
    pool: [
      I('Starting an essay in the middle of an important event is called:', 'In medias res',
        ['Flashback', 'A flashback moves back to earlier events.'], ['Foreshadowing', 'Foreshadowing hints at what will happen.'], ['Epilogue', 'An epilogue comes at the end.'],
        'Latin for “into the middle of things”.'),
      I('Hints about events that will happen later are called:', 'Foreshadowing',
        ['Flashback', 'A flashback looks back, not ahead.'], ['Irony', 'Irony is a contrast between expectation and reality.'], ['Allusion', 'An allusion refers to a known person, place or work.'],
        'Foreshadowing builds suspense.'),
      I('Moving back in time to show an earlier event is a:', 'Flashback',
        ['Foreshadowing', 'Foreshadowing points to the future.'], ['In medias res', 'That is starting in the middle of the action.'], ['Climax', 'The climax is the turning point.'],
        'Flashbacks give background that explains the present moment.'),
      I('The writer’s distinct personality that comes through the writing is called:', 'Voice',
        ['Plot', 'Plot is the sequence of events.'], ['Setting', 'Setting is time and place.'], ['Meter', 'Meter is a feature of poetry.'],
        'Voice comes from word choice, tone and sentence rhythm.'),
      I('Using the exact words people said, inside quotation marks, is:', 'Dialogue',
        ['Summary', 'Summary condenses what happened.'], ['Imagery', 'Imagery appeals to the senses.'], ['Metaphor', 'A metaphor is a comparison.'],
        'Dialogue makes scenes feel alive and shows character.')
    ]
  };
  S.CNF4 = {
    idea: 'Truthfulness, fairness to real people and honesty about memory’s limits are the ethics of nonfiction.',
    hint: 'Ask what would be fair to the reader and to the real people in the story.',
    pool: [
      I('A memoir writer cannot remember exact words spoken ten years ago. The most honest approach is to:', 'Reconstruct the dialogue faithfully and let readers know it is from memory',
        ['Invent dramatic lines that were never said', 'Invention breaks the truth contract with the reader.'], ['Leave every person out of the story', 'That is not necessary; honesty about memory is enough.'], ['Claim the lines came from a recording', 'That would be a false claim.'],
        'Writers may reconstruct dialogue but should be open about it.'),
      I('Writers of nonfiction often change the names of real people to:', 'Protect their privacy',
        ['Turn the work into fiction', 'Changing names alone does not make events fictional.'], ['Hide their own mistakes', 'That is not an ethical reason.'], ['Avoid needing any facts', 'The events must still be true.'],
        'Changed names are usually noted in an author’s note.'),
      I('Combining several real people into one “composite” character without telling readers:', 'Misleads readers about what really happened',
        ['Is required in memoirs', 'It is never required.'], ['Makes the story more accurate', 'It makes it less accurate.'], ['Is the same as changing a name', 'A composite changes the facts, not just a label.'],
        'If composites are used, readers should be told.'),
      I('When writing about family members, a responsible writer should:', 'Consider their dignity and the harm that revealing private details could cause',
        ['Reveal every secret for drama', 'Drama is not a reason to harm real people.'], ['Never mention family at all', 'Family can be written about with care.'], ['Ask readers to vote on what to include', 'The writer, not readers, carries this responsibility.'],
        'Truth-telling and kindness must be balanced.'),
      I('When reading creative nonfiction critically, a reader should check whether:', 'The facts can be trusted and the writer is honest about uncertainty',
        ['It rhymes', 'Rhyme is irrelevant to nonfiction.'], ['It has a happy ending', 'True stories need not end happily.'], ['It is entirely invented', 'Invention would make it fiction.'],
        'Credibility is central to nonfiction.')
    ]
  };

  // ================================================================ World Religions and Belief Systems
  S.WR1 = {
    idea: 'Religions differ in how many gods they recognize (monotheism, polytheism) and how they see the sacred; spirituality can exist outside institutions.',
    hint: 'Look at the prefix: mono- (one), poly- (many).',
    pool: [
      I('Belief in one God is called:', 'Monotheism',
        ['Polytheism', 'Polytheism is belief in many gods.'], ['Atheism', 'Atheism is the absence of belief in gods.'], ['Animism', 'Animism is the belief that spirits dwell in natural things.'],
        'Judaism, Christianity and Islam are monotheistic.'),
      I('Belief in many gods is called:', 'Polytheism',
        ['Monotheism', 'Monotheism is belief in one God.'], ['Agnosticism', 'Agnosticism holds that God’s existence cannot be known.'], ['Pantheism', 'Pantheism sees God as identical with the universe.'],
        'Ancient Greek and Roman religions were polytheistic.'),
      I('The belief that trees, rivers and mountains have spirits, as in pre-colonial Filipino belief in anito, is:', 'Animism',
        ['Monotheism', 'Monotheism worships one God.'], ['Atheism', 'Atheism denies gods.'], ['Deism', 'Deism holds that God created the world but does not intervene.'],
        'Animism sees spirits in the natural world.'),
      I('Spirituality differs from organized religion in that spirituality:', 'Can be a personal search for meaning without a formal institution',
        ['Always requires a church', 'Spirituality need not involve any institution.'], ['Rejects all values', 'Spirituality is a search for meaning and values.'], ['Is the same as theology', 'Theology is the academic study of the divine.'],
        'Religion is organized and communal; spirituality can be individual.'),
      I('The systematic study of the nature of God or the divine is:', 'Theology',
        ['Philosophy', 'Philosophy studies knowledge, reality and values broadly.'], ['Mythology', 'Mythology is a body of traditional stories.'], ['Anthropology', 'Anthropology studies human cultures.'],
        'Theo- means God; -logy means study.')
    ]
  };
  S.WR2 = {
    idea: 'Judaism and Christianity are Abrahamic faiths; Judaism centers on the Torah, Christianity on Jesus Christ.',
    hint: 'Recall each religion’s scripture, founder figure and holy day.',
    pool: [
      I('The sacred scriptures of Judaism, which include the Torah, are called the:', 'Tanakh (Hebrew Bible)',
        ['Qur’an', 'The Qur’an is the holy book of Islam.'], ['Vedas', 'The Vedas are Hindu scriptures.'], ['Tripitaka', 'The Tripitaka is a Buddhist canon.'],
        'Tanakh = Torah (Law), Nevi’im (Prophets), Ketuvim (Writings).'),
      I('Christianity’s central belief about Jesus Christ is that he is:', 'The Son of God and savior of humanity',
        ['The last prophet of Islam', 'Islam regards Muhammad as the last prophet.'], ['An avatar of Vishnu', 'Avatars are a Hindu concept.'], ['The founder of Judaism', 'Judaism traces back to Abraham and Moses.'],
        'Christians believe in Jesus’ death and resurrection for salvation.'),
      I('According to Jewish and Christian tradition, the Ten Commandments were given to:', 'Moses',
        ['Abraham', 'Abraham is the father of the covenant, earlier than Moses.'], ['David', 'David was a king of Israel.'], ['Muhammad', 'Muhammad is the prophet of Islam.'],
        'Moses received the Law on Mount Sinai.'),
      I('Judaism, Christianity and Islam are called Abrahamic religions because they:', 'Trace their origins to the prophet Abraham',
        ['Were founded in India', 'They began in the Middle East.'], ['Worship many gods', 'All three are monotheistic.'], ['Share exactly the same holy book', 'Each has its own scriptures.'],
        'Abraham is honored as a patriarch in all three.'),
      I('For most Christian denominations, the main day of worship is:', 'Sunday',
        ['Saturday', 'Saturday is the Jewish Sabbath (and the Seventh-day Adventist day).'], ['Friday', 'Friday is the Muslim day of congregational prayer.'], ['Monday', 'Monday has no special religious status.'],
        'Sunday commemorates the resurrection of Jesus.')
    ]
  };
  S.WR3 = {
    idea: 'Islam teaches submission to Allah, follows the Qur’an and practices the Five Pillars.',
    hint: 'Recall the Five Pillars: Shahada, Salat, Zakat, Sawm and Hajj.',
    pool: [
      I('The holy book of Islam is the:', 'Qur’an',
        ['Torah', 'The Torah is the core of Jewish scripture.'], ['Bible', 'The Bible is Christian scripture.'], ['Bhagavad Gita', 'The Bhagavad Gita is a Hindu scripture.'],
        'Muslims believe the Qur’an was revealed to Muhammad.'),
      I('The Five Pillars of Islam are:', 'Shahada, Salat, Zakat, Sawm and Hajj',
        ['The Four Noble Truths', 'Those belong to Buddhism.'], ['The Ten Commandments', 'Those belong to Judaism and Christianity.'], ['Karma, dharma and moksha', 'Those are Hindu concepts.'],
        'Faith, prayer, almsgiving, fasting and pilgrimage.'),
      I('The month in which Muslims fast from dawn to sunset is:', 'Ramadan',
        ['Hajj', 'Hajj is the pilgrimage to Mecca.'], ['Eid al-Adha', 'Eid al-Adha is the Festival of Sacrifice.'], ['Lent', 'Lent is a Christian season.'],
        'Fasting during Ramadan is the pillar called Sawm.'),
      I('The pilgrimage to Mecca that every able Muslim should make once in a lifetime is:', 'Hajj',
        ['Zakat', 'Zakat is almsgiving.'], ['Salat', 'Salat is daily prayer.'], ['Sawm', 'Sawm is fasting.'],
        'Hajj takes place in the Islamic month of Dhu al-Hijjah.'),
      I('Islam began in Arabia in the 7th century through the prophet:', 'Muhammad',
        ['Jesus', 'Jesus is central to Christianity (and honored as a prophet in Islam).'], ['Abraham', 'Abraham lived much earlier.'], ['Siddhartha Gautama', 'He founded Buddhism.'],
        'Muslims regard Muhammad as the final prophet.')
    ]
  };
  S.WR4 = {
    idea: 'Hinduism and Buddhism share ideas like karma and rebirth; Confucianism, Taoism and Shinto shape East Asian life.',
    hint: 'Match each key term with the tradition it belongs to.',
    pool: [
      I('In Buddhism, the state in which suffering and the cycle of rebirth end is:', 'Nirvana',
        ['Karma', 'Karma is the law of moral cause and effect.'], ['Samsara', 'Samsara is the cycle of birth and rebirth itself.'], ['Dharma', 'Dharma means teaching or duty.'],
        'Following the Eightfold Path leads to nirvana.'),
      I('The Four Noble Truths are central teachings of:', 'Buddhism',
        ['Hinduism', 'Hinduism centers on dharma, karma and moksha.'], ['Taoism', 'Taoism centers on the Tao and wu wei.'], ['Shinto', 'Shinto centers on kami.'],
        'They describe suffering, its cause, its end and the path to its end.'),
      I('In Hinduism, the principle that actions bring consequences in this life and the next is:', 'Karma',
        ['Moksha', 'Moksha is liberation from rebirth.'], ['Brahman', 'Brahman is the ultimate reality.'], ['Nirvana', 'Nirvana is the Buddhist term for liberation.'],
        'Good or bad deeds shape future rebirths.'),
      I('Confucianism mainly emphasizes:', 'Right relationships, filial piety and moral conduct',
        ['Living in harmony with nature through wu wei', 'That describes Taoism.'], ['Worship of the kami', 'That describes Shinto.'], ['The Five Pillars', 'Those belong to Islam.'],
        'Confucius taught that social harmony comes from virtuous roles.'),
      I('Shinto, Japan’s native religion, centers on the worship of:', 'Kami (sacred spirits)',
        ['Allah', 'Allah is God in Islam.'], ['Brahman', 'Brahman is the Hindu ultimate reality.'], ['The Buddha', 'The Buddha is central to Buddhism.'],
        'Kami are spirits found in nature, ancestors and places.')
    ]
  };

  // ================================================================ Philippine Politics and Governance
  S.PPG1 = {
    idea: 'Politics is how groups make binding decisions; power, authority, legitimacy and ideology shape it.',
    hint: 'Distinguish power (influence) from authority (accepted, rightful power).',
    pool: [
      I('Politics is best described as:', 'The process by which groups make decisions that bind their members, involving power and governance',
        ['Only the activities of political parties', 'Parties are one part of politics, not all of it.'], ['Running for public office', 'Elections are only one political activity.'], ['The study of past events', 'That is history.'],
        'Politics covers decision-making, power and governance in any group.'),
      I('The ability to make others act in a certain way is:', 'Power',
        ['Authority', 'Authority is power that people accept as rightful.'], ['Legitimacy', 'Legitimacy is the acceptance of power as rightful.'], ['Sovereignty', 'Sovereignty is a state’s supreme authority over its territory.'],
        'Power may or may not be legitimate.'),
      I('An ideology that values individual freedom, limited government and free markets is:', 'Liberalism',
        ['Socialism', 'Socialism favors collective or state ownership.'], ['Fascism', 'Fascism is authoritarian ultranationalism.'], ['Anarchism', 'Anarchism rejects the state altogether.'],
        'Classical liberalism protects individual rights.'),
      I('Which ideology favors social or collective ownership of the means of production?', 'Socialism',
        ['Conservatism', 'Conservatism values tradition and gradual change.'], ['Liberalism', 'Liberalism favors private property and free markets.'], ['Feminism', 'Feminism focuses on gender equality.'],
        'Socialists aim to reduce inequality through collective ownership.'),
      I('A state’s supreme and independent authority over its territory and people is called:', 'Sovereignty',
        ['Government', 'Government is the machinery that carries out the state’s will.'], ['Nation', 'A nation is a people sharing culture and identity.'], ['Territory', 'Territory is the land, water and air of the state.'],
        'The four elements of a state: people, territory, government and sovereignty.')
    ]
  };
  S.PPG2 = {
    idea: 'The 1987 Constitution sets up a democratic, republican, presidential system with separate executive, legislative and judicial branches.',
    hint: 'Legislative makes laws, executive carries them out, judiciary interprets them.',
    pool: [
      I('Under the 1987 Constitution, the Philippines has which form of government?', 'Democratic and republican, with a presidential system',
        ['Parliamentary', 'A parliamentary system has a prime minister chosen by parliament.'], ['Federal', 'The Philippines is a unitary state; federalism has only been proposed.'], ['Absolute monarchy', 'The Philippines has no monarch.'],
        'Article II declares the Philippines a democratic and republican State.'),
      I('Which branch of government makes the laws?', 'The legislative branch (Congress)',
        ['The executive branch', 'The executive carries out the laws.'], ['The judicial branch', 'The courts interpret the laws.'], ['The Commission on Elections', 'COMELEC is an independent constitutional commission for elections.'],
        'Congress has the power to make, amend and repeal laws.'),
      I('Congress of the Philippines is made up of:', 'The Senate and the House of Representatives',
        ['The President and the Cabinet', 'Those belong to the executive branch.'], ['The Supreme Court and lower courts', 'Those form the judiciary.'], ['The Senate only', 'Congress is bicameral: two houses.'],
        'A bicameral legislature has two chambers.'),
      I('Under the 1987 Constitution, the President serves:', 'One six-year term, with no re-election',
        ['Four years, with one re-election', 'That is the United States system.'], ['Three years, up to three terms', 'That applies to House members and local officials.'], ['Six years, with one re-election', 'The Constitution bars the President from re-election.'],
        'Article VII, Section 4.'),
      I('The courts’ power to declare a law or act unconstitutional is:', 'Judicial review',
        ['Impeachment', 'Impeachment removes high officials for serious offenses.'], ['Veto', 'The veto is the President’s power to reject bills.'], ['Pardon', 'A pardon is executive clemency.'],
        'Judicial review is a check on the other branches.')
    ]
  };
  S.PPG3 = {
    idea: 'Filipinos choose leaders through elections run by COMELEC; parties and the party-list system channel representation.',
    hint: 'Recall the numbers and offices set by the 1987 Constitution.',
    pool: [
      I('How many senators make up the Philippine Senate?', '24',
        ['12', 'Twelve senators are elected every three years, but the Senate has 24.'], ['250', 'That is closer to the size of the House.'], ['30', 'The Constitution sets 24 seats.'],
        'Senators serve six-year terms, with half elected every three years.'),
      I('The independent body that enforces and administers election laws is the:', 'Commission on Elections (COMELEC)',
        ['Commission on Audit', 'COA audits government spending.'], ['Civil Service Commission', 'The CSC handles government employment.'], ['Office of the Ombudsman', 'The Ombudsman investigates erring officials.'],
        'COMELEC is one of three constitutional commissions.'),
      I('The party-list system aims to:', 'Give marginalized and underrepresented sectors seats in the House',
        ['Elect the President', 'The President is elected by direct vote.'], ['Choose senators', 'Senators are elected at large.'], ['Appoint judges', 'Judges are appointed by the President from the Judicial and Bar Council’s nominees.'],
        'Party-list representatives make up 20% of the House.'),
      I('The minimum age to vote in Philippine national elections is:', '18',
        ['15', 'Fifteen is the minimum for Sangguniang Kabataan elections only.'], ['21', 'The Constitution sets 18, not 21.'], ['16', 'Sixteen is too young for national elections.'],
        'Article V: Filipino citizens at least 18 years old may vote.'),
      I('A political party mainly aims to:', 'Win elections and shape government policy',
        ['Make laws without Congress', 'Only Congress passes laws.'], ['Decide court cases', 'Courts decide cases.'], ['Run businesses for profit', 'Parties are political, not commercial, organizations.'],
        'Parties organize candidates and platforms.')
    ]
  };
  S.PPG4 = {
    idea: 'The Local Government Code of 1991 decentralized power to provinces, cities, municipalities and barangays; civil society checks and supports government.',
    hint: 'Think of the levels of local government and who passes local ordinances.',
    pool: [
      I('Which law gave local government units more autonomy and powers?', 'The Local Government Code of 1991 (RA 7160)',
        ['RA 10121', 'RA 10121 is the Disaster Risk Reduction and Management Act.'], ['The Labor Code', 'The Labor Code governs employment.'], ['The Family Code', 'The Family Code governs marriage and family relations.'],
        'RA 7160 devolved services and gave LGUs taxing powers and IRA shares.'),
      I('The smallest political unit in the Philippines is the:', 'Barangay',
        ['Municipality', 'A municipality contains many barangays.'], ['Province', 'A province is larger still.'], ['Purok', 'A purok is an informal subdivision of a barangay, not a political unit.'],
        'Each barangay is led by a Punong Barangay and Sangguniang Barangay.'),
      I('Transferring powers and resources from the national government to local governments is:', 'Decentralization',
        ['Centralization', 'Centralization concentrates power at the national level.'], ['Nationalization', 'Nationalization is state takeover of private enterprises.'], ['Privatization', 'Privatization transfers state enterprises to private owners.'],
        'Devolution is a form of decentralization.'),
      I('NGOs and people’s organizations that work outside government and business make up:', 'Civil society',
        ['The bureaucracy', 'The bureaucracy is government’s administrative system.'], ['The judiciary', 'The judiciary is the court system.'], ['The private sector', 'The private sector refers to businesses.'],
        'Civil society voices citizens’ interests and holds government accountable.'),
      I('The body that passes ordinances for a city is the:', 'Sangguniang Panlungsod',
        ['Senate', 'The Senate is part of the national legislature.'], ['Cabinet', 'The Cabinet advises the President.'], ['Sangguniang Kabataan', 'The SK is the youth council.'],
        'Municipalities have the Sangguniang Bayan; provinces the Sangguniang Panlalawigan.')
    ]
  };

  // ================================================================ DISS
  S.DSS1 = {
    idea: 'The social sciences study human society: anthropology, economics, geography, history, linguistics, political science, psychology, sociology and demography.',
    hint: 'Match the discipline with what it studies.',
    pool: [
      I('The social sciences study:', 'Human society and social relationships',
        ['The physical world', 'That is the domain of the natural sciences.'], ['Only literature and the arts', 'Those are the humanities.'], ['Numbers and abstract structures', 'That is mathematics.'],
        'Social sciences use systematic methods to study human behavior and society.'),
      I('The discipline that studies human cultures and ways of life, often through fieldwork, is:', 'Anthropology',
        ['Sociology', 'Sociology studies social groups and institutions.'], ['Psychology', 'Psychology studies the individual mind and behavior.'], ['Economics', 'Economics studies the use of scarce resources.'],
        'Anthropologists often live with communities to understand them.'),
      I('The study of how societies use scarce resources to meet needs and wants is:', 'Economics',
        ['Demography', 'Demography studies populations.'], ['Geography', 'Geography studies places and the human–environment relationship.'], ['Linguistics', 'Linguistics studies language.'],
        'Scarcity forces choices about production and distribution.'),
      I('The scientific study of population size, composition and change is:', 'Demography',
        ['Anthropology', 'Anthropology studies cultures.'], ['Political science', 'Political science studies government and power.'], ['History', 'History studies the past.'],
        'Demographers analyze births, deaths and migration.'),
      I('The scientific study of language and its structure is:', 'Linguistics',
        ['Psychology', 'Psychology studies mind and behavior.'], ['Sociology', 'Sociology studies society.'], ['Geography', 'Geography studies places.'],
        'Linguists study sounds, words, grammar and meaning.')
    ]
  };
  S.DSS2 = {
    idea: 'Structural-functionalism stresses stability, Marxism stresses class conflict, and symbolic interactionism stresses everyday meanings.',
    hint: 'Ask whether the theory looks at harmony, conflict or interaction.',
    pool: [
      I('Which perspective sees society as parts working together to keep it stable?', 'Structural-functionalism',
        ['Marxism', 'Marxism focuses on conflict between classes.'], ['Symbolic interactionism', 'It focuses on meanings in everyday interaction.'], ['Feminist theory', 'Feminist theory focuses on gender inequality.'],
        'Émile Durkheim is a key figure of functionalism.'),
      I('Karl Marx viewed society mainly in terms of:', 'Conflict between social classes over economic resources',
        ['Harmony among institutions', 'That is the functionalist view.'], ['Individual unconscious drives', 'That is psychoanalysis.'], ['The structure of language', 'That is linguistics or structuralism.'],
        'Marx saw history as class struggle.'),
      I('Symbolic interactionism focuses on:', 'How people create meaning through everyday interaction and symbols',
        ['Large-scale class struggle', 'That is Marxism.'], ['The functions of institutions', 'That is functionalism.'], ['Biological instincts', 'Instincts are not its focus.'],
        'George Herbert Mead and Herbert Blumer developed this view.'),
      I('According to Marx, the class that owns the means of production is the:', 'Bourgeoisie',
        ['Proletariat', 'The proletariat are the workers who sell their labor.'], ['Peasantry', 'Peasants work the land, often for others.'], ['Clergy', 'The clergy are religious leaders.'],
        'Marx predicted conflict between the bourgeoisie and the proletariat.'),
      I('Émile Durkheim is most associated with:', 'Structural-functionalism',
        ['Psychoanalysis', 'Psychoanalysis is Sigmund Freud’s theory.'], ['Rational choice theory', 'Rational choice comes from economics.'], ['Symbolic interactionism', 'That is linked to Mead and Blumer.'],
        'Durkheim studied social facts and solidarity.')
    ]
  };
  S.DSS3 = {
    idea: 'Psychoanalysis (Freud) looks at the unconscious, rational choice at costs and benefits, institutionalism at rules, feminism at gender.',
    hint: 'Ask what each theory treats as the main driver of behavior.',
    pool: [
      I('Sigmund Freud’s theory that behavior is shaped by unconscious drives is:', 'Psychoanalysis',
        ['Rational choice theory', 'Rational choice says people weigh costs and benefits.'], ['Institutionalism', 'Institutionalism stresses rules and organizations.'], ['Feminist theory', 'Feminist theory examines gender inequality.'],
        'Freud explored the id, ego and superego.'),
      I('In Freud’s model, the part of personality that seeks immediate pleasure is the:', 'Id',
        ['Ego', 'The ego balances desires with reality.'], ['Superego', 'The superego is the moral conscience.'], ['Persona', 'The persona is a concept from Carl Jung.'],
        'The id follows the pleasure principle.'),
      I('Rational choice theory assumes that people:', 'Weigh costs and benefits to get the best outcome for themselves',
        ['Act only on unconscious drives', 'That is psychoanalysis.'], ['Always put the group first', 'The theory starts from self-interest.'], ['Follow tradition without thinking', 'The theory assumes deliberate choice.'],
        'It models decisions as maximizing benefits.'),
      I('Feminist theory in the social sciences mainly examines:', 'Gender inequality and how it is kept in place',
        ['Only economic markets', 'Markets are one area, not the focus.'], ['Unconscious childhood memories', 'That is psychoanalysis.'], ['Animal behavior', 'That is ethology.'],
        'It questions power relations between genders.'),
      I('Institutionalism explains behavior mainly through:', 'Formal and informal rules and organizations',
        ['Unconscious desires', 'That is psychoanalysis.'], ['Class struggle alone', 'That is Marxism.'], ['Genetics', 'Genetics is a biological explanation.'],
        'Institutions shape what choices people see as possible.')
    ]
  };
  S.DSS4 = {
    idea: 'Filipino social scientists indigenized the field: Sikolohiyang Pilipino (Enriquez) and Pantayong Pananaw (Salazar).',
    hint: 'Match the Filipino thinker with the movement or concept.',
    pool: [
      I('Sikolohiyang Pilipino (Filipino psychology) was pioneered by:', 'Virgilio Enriquez',
        ['Zeus Salazar', 'Salazar developed Pantayong Pananaw in history.'], ['José Rizal', 'Rizal was a novelist, reformer and national hero.'], ['Renato Constantino', 'Constantino was a nationalist historian.'],
        'Enriquez promoted psychology rooted in Filipino language and culture.'),
      I('In Sikolohiyang Pilipino, the core value meaning “shared identity” or the self-in-the-other is:', 'Kapwa',
        ['Hiya', 'Hiya refers to propriety or sense of shame.'], ['Utang na loob', 'Utang na loob is a debt of gratitude.'], ['Bahala na', 'Bahala na expresses determination amid uncertainty.'],
        'Enriquez placed kapwa at the center of Filipino values.'),
      I('Pantayong Pananaw, a “from-us-for-us” perspective in Philippine history, was developed by:', 'Zeus Salazar',
        ['Virgilio Enriquez', 'Enriquez founded Sikolohiyang Pilipino.'], ['Teodoro Agoncillo', 'Agoncillo was a historian but did not found this movement.'], ['Apolinario Mabini', 'Mabini was a revolutionary thinker.'],
        'It writes history in Filipino, for Filipinos.'),
      I('Indigenization of the social sciences means:', 'Using concepts and methods rooted in local culture and language',
        ['Copying Western theories exactly', 'That is the opposite of indigenization.'], ['Studying only foreign countries', 'Indigenization centers local realities.'], ['Avoiding the local language', 'Local language is central to it.'],
        'It makes social science relevant to Filipino experience.'),
      I('In Filipino psychology, pakikiramdam refers to:', 'A shared inner perception: sensing others’ feelings',
        ['Strict obedience to elders', 'That is not its meaning.'], ['A debt of gratitude', 'That is utang na loob.'], ['Fatalism', 'Pakikiramdam is active sensitivity, not resignation.'],
        'Enriquez called it a pivotal interpersonal value.')
    ]
  };

  // ================================================================ DIASS
  S.DAS1 = {
    idea: 'Applied social sciences (counseling, social work, communication) use social science knowledge to help people and communities.',
    hint: 'Ask whether the work studies society or acts to improve lives.',
    pool: [
      I('Applied social sciences differ from the other social sciences mainly because they:', 'Use social science knowledge to solve real problems of people and communities',
        ['Only build theory', 'Theory-building is the focus of basic social sciences.'], ['Avoid working with people', 'Applied fields work directly with people.'], ['Belong to the natural sciences', 'They are social, not natural, sciences.'],
        'They turn knowledge into helping practice.'),
      I('The three applied social sciences studied in DIASS are:', 'Counseling, social work and communication',
        ['Physics, chemistry and biology', 'Those are natural sciences.'], ['History, philosophy and literature', 'Those are humanities.'], ['Accounting, finance and marketing', 'Those are business fields.'],
        'Each applies social science to helping people.'),
      I('A professional who helps a student cope with academic stress through guided conversations works in:', 'Counseling',
        ['Social work', 'Social workers mainly link clients to services and resources.'], ['Journalism', 'Journalists report the news.'], ['Engineering', 'Engineering is not a helping profession.'],
        'Counselors help people understand and resolve personal concerns.'),
      I('A professional who connects a family in crisis with government welfare programs is practicing:', 'Social work',
        ['Counseling', 'Counseling focuses on guided conversations about personal concerns.'], ['Communication', 'Communication focuses on messages and media.'], ['Psychiatry', 'Psychiatry is a medical specialty.'],
        'Social workers connect people with resources and services.'),
      I('A practitioner designing a public information campaign on dengue prevention is applying:', 'Communication',
        ['Counseling', 'Counseling works with individuals’ personal concerns.'], ['Social work', 'Social work focuses on welfare services.'], ['Demography', 'Demography studies populations.'],
        'Development communication helps communities act on information.')
    ]
  };
  S.DAS2 = {
    idea: 'Counseling is a professional helping relationship built on empathy, confidentiality and respect for the client’s choices.',
    hint: 'Think about what keeps the counseling relationship safe and respectful.',
    pool: [
      I('In counseling, confidentiality means:', 'Keeping what the client shares private, except where law or safety requires otherwise',
        ['Telling the client’s family everything', 'That breaks the client’s trust.'], ['Publishing case notes', 'Case notes are private.'], ['Keeping no records', 'Records are kept, but securely.'],
        'Confidentiality has limits, such as risk of harm.'),
      I('A counselor’s ability to understand a client’s feelings from the client’s point of view is:', 'Empathy',
        ['Sympathy', 'Sympathy is feeling pity for someone.'], ['Apathy', 'Apathy is a lack of feeling.'], ['Judgment', 'Counselors avoid judging clients.'],
        'Empathy is central to the helping relationship.'),
      I('In the Philippines, the practice of guidance and counseling is regulated by:', 'RA 9258 (Guidance and Counseling Act of 2004)',
        ['RA 4373', 'RA 4373 regulates social work.'], ['RA 10121', 'RA 10121 is the DRRM Act.'], ['RA 7160', 'RA 7160 is the Local Government Code.'],
        'RA 9258 professionalized guidance and counseling.'),
      I('A core value in counseling is respect for the client’s:', 'Right to make their own decisions',
        ['Need to obey the counselor', 'Counselors guide, not command.'], ['Social status', 'All clients deserve equal respect.'], ['Ability to pay', 'Respect does not depend on payment.'],
        'This is called client self-determination.'),
      I('Which is a role of a school guidance counselor?', 'Helping students with personal, academic and career concerns',
        ['Grading students’ exams', 'Teachers grade exams.'], ['Punishing misbehavior', 'Counselors help students; discipline is a separate role.'], ['Prescribing medicine', 'Only physicians, such as psychiatrists, prescribe medicine.'],
        'Counselors support students’ overall well-being.')
    ]
  };
  S.DAS3 = {
    idea: 'Social work promotes social functioning and social justice through casework, group work and community organizing.',
    hint: 'Decide whether the help is for an individual, a group or a whole community.',
    pool: [
      I('In the Philippines, the practice of social work is regulated by:', 'RA 4373',
        ['RA 9258', 'RA 9258 regulates guidance and counseling.'], ['RA 7160', 'RA 7160 is the Local Government Code.'], ['RA 10354', 'RA 10354 is the Responsible Parenthood and Reproductive Health Act.'],
        'RA 4373 regulates the social work profession.'),
      I('The government agency that leads social welfare programs such as the 4Ps is the:', 'DSWD',
        ['DepEd', 'DepEd handles basic education.'], ['DOH', 'DOH handles health.'], ['DILG', 'DILG oversees local governments.'],
        'Department of Social Welfare and Development.'),
      I('Social work mainly aims to:', 'Improve social functioning and promote social justice for vulnerable people',
        ['Maximize company profits', 'That is a business goal.'], ['Treat physical illness', 'That is medicine.'], ['Enforce criminal law', 'That is law enforcement.'],
        'Social workers help people meet needs and access rights.'),
      I('Helping a whole barangay set up a livelihood cooperative is an example of:', 'Community organizing',
        ['Casework', 'Casework is one-on-one help for an individual or family.'], ['Group work', 'Group work helps small groups.'], ['Psychotherapy', 'Psychotherapy treats mental health conditions.'],
        'Community organizing builds a community’s collective capacity.'),
      I('Working one-on-one with a family in crisis is called:', 'Casework',
        ['Community organizing', 'That works with a whole community.'], ['Group work', 'That works with small groups.'], ['Advocacy campaign', 'Campaigns target policies or the public.'],
        'Casework addresses an individual’s or family’s situation directly.')
    ]
  };
  S.DAS4 = {
    idea: 'Communication involves a sender, message, channel, receiver, feedback and noise; development communication uses it to improve lives.',
    hint: 'Name the part of the communication process described.',
    pool: [
      I('In the communication process, the person who receives and interprets the message is the:', 'Receiver',
        ['Sender', 'The sender creates the message.'], ['Channel', 'The channel is the medium the message travels through.'], ['Noise', 'Noise is anything that interferes with the message.'],
        'The receiver decodes the message.'),
      I('Anything that interferes with the message, such as loud sounds or confusing words, is called:', 'Noise',
        ['Feedback', 'Feedback is the receiver’s response.'], ['Channel', 'The channel is the medium.'], ['Context', 'Context is the setting of the communication.'],
        'Noise can be physical, psychological or semantic.'),
      I('The receiver’s response sent back to the sender is called:', 'Feedback',
        ['Noise', 'Noise interferes with the message.'], ['Encoding', 'Encoding is turning ideas into a message.'], ['Channel', 'The channel carries the message.'],
        'Feedback makes communication two-way.'),
      I('A model that adds feedback and treats communication as two-way is the:', 'Interactive model',
        ['Linear model', 'A linear model is one-way, from sender to receiver.'], ['Aristotle’s model', 'Aristotle’s model focuses on speaker, speech and audience.'], ['Lasswell’s model', 'Lasswell’s “who says what to whom” model is largely linear.'],
        'Schramm’s interactive model includes feedback and fields of experience.'),
      I('Development communication aims to:', 'Use communication to help communities improve their lives',
        ['Sell more products', 'That is advertising.'], ['Entertain audiences only', 'Entertainment is not its main goal.'], ['Spread rumors quickly', 'It spreads accurate, useful information.'],
        'It supports health, livelihood and education programs.')
    ]
  };

  // ================================================================ CESC
  S.CES1 = {
    idea: 'A community is a group linked by place, interest or identity; it can be studied through its institutions, structures and values.',
    hint: 'Consider what binds the members together.',
    pool: [
      I('A community is best described as:', 'A group of people sharing a place, interest or identity who interact with one another',
        ['Any crowd in a mall', 'A crowd shares no lasting ties or interaction.'], ['Only a government office', 'Government is one institution within a community.'], ['A single family', 'A family is one unit within a community.'],
        'Communities are defined by shared ties and interaction.'),
      I('In the institutional perspective, a community is seen as:', 'A system of interacting institutions such as family, school, church and government',
        ['A random group of strangers', 'That ignores the structure of community life.'], ['Only a physical place', 'That is the geographic view.'], ['A business market', 'That is an economic view only.'],
        'Institutions organize community life.'),
      I('An online group of young poets who share writing is an example of a:', 'Community of interest',
        ['Geographic community', 'A geographic community is defined by location.'], ['Barangay', 'A barangay is a political unit.'], ['Province', 'A province is a political unit.'],
        'Members are linked by a shared interest, not by place.'),
      I('Community structure includes:', 'Leadership, power relations, roles and resources',
        ['Only the buildings', 'Structure is about social relations, not just buildings.'], ['The weather', 'Weather is not a social structure.'], ['Only the population size', 'Size is one feature, not the structure.'],
        'Understanding structure helps plan community action.'),
      I('Bayanihan best represents:', 'Cooperation and mutual help in a community',
        ['Competition among neighbors', 'Bayanihan is the opposite of competition.'], ['Individualism', 'Bayanihan is collective.'], ['Government regulation', 'It is a voluntary community value.'],
        'Neighbors traditionally carried a house together.')
    ]
  };
  S.CES2 = {
    idea: 'Good community engagement starts with the community: participatory needs assessment, shared planning and local ownership.',
    hint: 'Ask whether the community members are partners or only recipients.',
    pool: [
      I('Participatory Action Research involves community members in:', 'Identifying problems, gathering data and acting on what they find',
        ['Only answering surveys designed by outsiders', 'In PAR, members are co-researchers.'], ['Watching experts work', 'PAR is participatory, not passive.'], ['Paying for research', 'Funding is not the point.'],
        'Research and action go together, led with the community.'),
      I('The first step in a community engagement project should usually be:', 'Assessing the community’s needs and resources together with its members',
        ['Announcing a solution chosen by outsiders', 'Solutions should come after understanding needs.'], ['Asking for donations', 'Resources are planned after needs are known.'], ['Writing the final report', 'The report comes at the end.'],
        'A needs assessment grounds the project in real priorities.'),
      I('Community development is most sustainable when:', 'Community members own and lead the process',
        ['Outsiders do all the work', 'Dependence on outsiders makes projects fragile.'], ['It ends after one event', 'Sustainability needs continuity.'], ['Only leaders decide', 'Broad participation builds ownership.'],
        'Ownership keeps the project going after outside help leaves.'),
      I('A needs assessment helps a group to:', 'Identify the most important problems and available resources',
        ['Avoid talking to residents', 'It requires talking to residents.'], ['Choose a solution in advance', 'It comes before choosing solutions.'], ['Measure only rainfall', 'It covers social needs, not just weather.'],
        'Clear priorities make action effective.'),
      I('Volunteering in a coastal clean-up organized with the barangay is an example of:', 'Civic engagement',
        ['Political campaigning', 'It is not about elections.'], ['Consumerism', 'It is not about buying goods.'], ['Social isolation', 'It is the opposite of isolation.'],
        'Civic engagement is active participation in community life.')
    ]
  };
  S.CES3 = {
    idea: 'Solidarity is unity around shared concerns; citizenship carries rights and responsibilities, locally and globally.',
    hint: 'Think of what active, responsible citizens do.',
    pool: [
      I('Solidarity means:', 'Unity and mutual support among people with shared concerns',
        ['Competing for limited resources', 'That is competition.'], ['Staying neutral in every issue', 'Solidarity involves taking a stand together.'], ['Obeying any leader without question', 'That is blind obedience.'],
        'Solidarity turns shared concern into collective action.'),
      I('Which is a right of Filipino citizens aged 18 and above?', 'Voting in elections (suffrage)',
        ['Ignoring the law', 'Rights come with legal responsibilities.'], ['Exemption from all taxes', 'Citizens are not exempt from taxes.'], ['Automatic appointment to office', 'Public office requires election or appointment.'],
        'Article V of the 1987 Constitution grants suffrage.'),
      I('Active citizenship includes:', 'Voting, volunteering and taking part in community decisions',
        ['Only paying taxes', 'Paying taxes is one duty among many.'], ['Avoiding public issues', 'Active citizens engage with public issues.'], ['Posting rumors online', 'Spreading rumors harms the community.'],
        'Citizens shape their communities through participation.'),
      I('Global citizenship means:', 'Recognizing responsibilities toward people and the planet beyond one’s own country',
        ['Holding passports from every country', 'It is a mindset, not legal citizenship.'], ['Rejecting one’s own country', 'Global citizens can love their country too.'], ['Caring only about trade', 'It covers human rights, environment and peace.'],
        'It links local action with global concerns.'),
      I('Which action shows solidarity with typhoon victims?', 'Organizing relief drives and volunteering at evacuation centers',
        ['Sharing unverified rumors online', 'Rumors can cause panic and harm.'], ['Ignoring the news', 'Ignoring others’ needs is not solidarity.'], ['Hoarding relief goods', 'Hoarding deprives those in need.'],
        'Solidarity is shown through concrete help.')
    ]
  };
  S.CES4 = {
    idea: 'Human rights are inherent to every person; social justice works to reduce inequality and protect the vulnerable.',
    hint: 'Recall the key documents and institutions that protect rights.',
    pool: [
      I('The document adopted by the United Nations in 1948 that lists basic human rights is the:', 'Universal Declaration of Human Rights',
        ['Magna Carta', 'The Magna Carta is a 1215 English charter.'], ['Geneva Conventions', 'The Geneva Conventions set rules of war.'], ['Paris Agreement', 'The Paris Agreement is about climate change.'],
        'The UDHR was adopted on December 10, 1948.'),
      I('Human rights are:', 'Inherent to all people, regardless of nationality, sex, religion or status',
        ['Given only to taxpayers', 'Rights do not depend on paying taxes.'], ['Privileges granted by leaders', 'Rights are inherent, not granted favors.'], ['Only for adults', 'Children have human rights too.'],
        'Human rights are universal and inalienable.'),
      I('In the Philippines, the independent office that investigates human rights violations is the:', 'Commission on Human Rights (CHR)',
        ['COMELEC', 'COMELEC runs elections.'], ['Commission on Audit', 'COA audits government spending.'], ['NBI', 'The NBI investigates crimes under the Department of Justice.'],
        'The CHR is created by the 1987 Constitution.'),
      I('Social justice aims to:', 'Reduce inequality and give fair opportunities to all, especially the disadvantaged',
        ['Keep wealth in the same hands', 'That preserves inequality.'], ['Punish the poor', 'Social justice protects the poor.'], ['Remove all laws', 'It works through fair laws and policies.'],
        'The 1987 Constitution has an article on social justice.'),
      I('The right to free expression is classified as a:', 'Civil and political right',
        ['Economic right', 'Economic rights include work and fair wages.'], ['Social right', 'Social rights include health and education.'], ['Cultural right', 'Cultural rights include taking part in cultural life.'],
        'Civil and political rights protect individual freedoms.')
    ]
  };

  // ================================================================ TNCT
  S.TNC1 = {
    idea: 'A trend is a lasting, widening pattern; a fad is short-lived; megatrends reshape society for decades.',
    hint: 'Look at how long it lasts and how widely it spreads.',
    pool: [
      I('A trend differs from a fad because a trend:', 'Lasts longer and has wider, deeper effects',
        ['Disappears within weeks', 'That describes a fad.'], ['Is limited to one person', 'Trends spread across groups.'], ['Has no pattern', 'A trend is a recognizable pattern.'],
        'Trends persist; fads fade fast.'),
      I('A viral dance challenge that fades within weeks is a:', 'Fad',
        ['Trend', 'Trends last longer and spread more deeply.'], ['Megatrend', 'Megatrends last decades.'], ['Tradition', 'Traditions are handed down over generations.'],
        'Fads rise and fall quickly.'),
      I('Which is a sign of an emerging trend?', 'The pattern appears in different places and keeps growing over time',
        ['One celebrity posts about it once', 'A single post is not evidence of a trend.'], ['It disappears the next day', 'That is not a trend.'], ['Only one store sells it', 'Trends spread widely.'],
        'Look for persistence and spread.'),
      I('A large, long-term shift affecting many areas of life worldwide, such as digitalization, is a:', 'Megatrend',
        ['Fad', 'Fads are short-lived.'], ['Hobby', 'A hobby is a personal activity.'], ['Rumor', 'A rumor is unverified information.'],
        'Megatrends reshape economies and societies.'),
      I('Before calling something a trend, a critical thinker should:', 'Look for evidence that it is lasting and widespread',
        ['Rely on one viral post', 'One post is not enough evidence.'], ['Follow whatever friends say', 'Opinions are not evidence.'], ['Assume all new things are trends', 'Many new things are fads.'],
        'Evidence separates trends from hype.')
    ]
  };
  S.TNC2 = {
    idea: 'Strategic analysis breaks a situation into parts and outcomes; intuition draws on experience; good decisions combine both.',
    hint: 'Ask whether the thinking is step-by-step or a quick insight.',
    pool: [
      I('Strategic analysis involves:', 'Examining the parts of a situation, their links and possible outcomes to plan action',
        ['Deciding by coin toss', 'That is chance, not analysis.'], ['Ignoring possible outcomes', 'Analysis considers outcomes.'], ['Copying others’ plans exactly', 'Strategy fits the specific situation.'],
        'It is systematic and forward-looking.'),
      I('Intuitive thinking is:', 'Quick insight based on experience and patterns, without step-by-step reasoning',
        ['A formal proof', 'Proofs are step-by-step.'], ['Always wrong', 'Intuition is often useful, especially with experience.'], ['Reading a manual', 'That is following instructions.'],
        'Experts often recognize patterns intuitively.'),
      I('Which tool lists strengths, weaknesses, opportunities and threats?', 'SWOT analysis',
        ['PEST analysis', 'PEST scans political, economic, social and technological factors.'], ['Gantt chart', 'A Gantt chart schedules tasks.'], ['Venn diagram', 'A Venn diagram compares sets.'],
        'SWOT combines internal and external factors.'),
      I('The best use of intuition in decision making is to:', 'Combine it with evidence and analysis',
        ['Replace all evidence', 'Intuition can mislead without evidence.'], ['Ignore it completely', 'Intuition can add insight.'], ['Use it only when tired', 'Fatigue weakens judgment.'],
        'Intuition suggests; analysis checks.'),
      I('Seeing that a problem has many interconnected causes reflects:', 'Systems thinking',
        ['Linear thinking', 'Linear thinking looks for one cause and one effect.'], ['Wishful thinking', 'That ignores evidence.'], ['Memorization', 'Memorization is recall, not analysis.'],
        'Systems thinking looks at the whole and its connections.')
    ]
  };
  S.TNC3 = {
    idea: 'Networks connect nodes: neurons through synapses, people through relationships, computers through the internet.',
    hint: 'Identify the nodes and the links in the network described.',
    pool: [
      I('In the brain, neurons pass signals to one another across:', 'Synapses',
        ['Ribosomes', 'Ribosomes build proteins.'], ['Bones', 'Bones are not part of the neural network.'], ['Capillaries', 'Capillaries carry blood.'],
        'Neural networks are made of neurons linked by synapses.'),
      I('A social network is:', 'A structure of people connected by relationships',
        ['Only a social media app', 'Apps are tools; the network is the relationships.'], ['A computer cable', 'That is hardware.'], ['A single friendship', 'A network has many links.'],
        'Social networks existed long before the internet.'),
      I('“Six degrees of separation” suggests that:', 'Any two people are linked by a short chain of acquaintances',
        ['People have exactly six friends', 'It is about chains, not friend counts.'], ['Networks have six layers', 'It refers to path length.'], ['Only six people matter', 'It applies to everyone.'],
        'Short paths connect people in large networks.'),
      I('The internet has made it possible to:', 'Connect people and share information instantly worldwide',
        ['Remove all misinformation', 'False information also spreads online.'], ['End the need for critical thinking', 'Critical thinking matters more than ever.'], ['Stop all face-to-face contact', 'It adds to, not replaces, contact.'],
        'ICT networks link people and machines globally.'),
      I('A serious downside of online networks is:', 'The fast spread of misinformation',
        ['Too little information', 'The problem is often too much, not too little.'], ['No way to contact others', 'Networks make contact easy.'], ['Slower news', 'News spreads faster.'],
        'Checking sources is a key digital skill.')
    ]
  };
  S.TNC4 = {
    idea: 'Climate change, democracy and global citizenship are shared challenges that call for local action with a global view.',
    hint: 'Connect the global issue with what individuals and communities can do.',
    pool: [
      I('The main cause of today’s rapid climate change is:', 'Greenhouse gas emissions from human activities, such as burning fossil fuels',
        ['Changes in the Moon’s orbit', 'The Moon does not drive climate change.'], ['Too many trees', 'Trees absorb carbon dioxide.'], ['Volcanoes alone', 'Volcanoes emit far less CO₂ than human activity.'],
        'Carbon dioxide and methane trap heat in the atmosphere.'),
      I('“Think globally, act locally” means:', 'Address global problems through actions in one’s own community',
        ['Only world leaders can act', 'Local action matters too.'], ['Ignore local problems', 'It encourages local action.'], ['Travel abroad to help', 'Action can start at home.'],
        'Small local actions add up globally.'),
      I('Planetary citizenship emphasizes:', 'Responsibility for the Earth and all its living systems',
        ['Exploring other planets', 'It is about caring for Earth.'], ['Owning land', 'It is about stewardship, not ownership.'], ['Only national loyalty', 'It goes beyond nations.'],
        'Humans are part of Earth’s systems.'),
      I('Democracy is best described as:', 'Government in which power comes from the people',
        ['Rule by one person', 'That is autocracy or monarchy.'], ['Rule by the military', 'That is a military regime.'], ['Rule by the wealthy few', 'That is plutocracy or oligarchy.'],
        'Citizens choose leaders and hold them accountable.'),
      I('Which skill helps citizens judge information they see online?', 'Media and information literacy',
        ['Speed typing', 'Typing does not help judge truth.'], ['Memorizing slogans', 'Slogans are not evidence.'], ['Sharing without reading', 'That spreads misinformation.'],
        'It means checking sources, evidence and intent.')
    ]
  };

  // ================================================================ DRRR
  S.DR1 = {
    idea: 'Risk grows with hazard, exposure and vulnerability, and shrinks with capacity; a disaster happens when a community cannot cope.',
    hint: 'Separate the event (hazard) from who is in harm’s way (exposure) and how fragile they are (vulnerability).',
    pool: [
      I('A hazard is:', 'A potentially damaging event or condition, such as a typhoon or earthquake',
        ['The damage after an event', 'Serious damage the community cannot cope with is a disaster.'], ['A community’s ability to cope', 'That is capacity.'], ['A weakness of the community', 'That is vulnerability.'],
        'Hazards can be natural or human-made.'),
      I('A disaster happens when:', 'A hazard seriously disrupts a community that cannot cope using its own resources',
        ['Any rain falls', 'Ordinary rain is not a disaster.'], ['A forecast is issued', 'Forecasts warn; they are not disasters.'], ['A hazard affects an empty area', 'Without exposed people or property there is no disaster.'],
        'Disaster = hazard + exposure + vulnerability beyond capacity.'),
      I('Houses built along a riverbank have high:', 'Exposure',
        ['Capacity', 'Capacity is the ability to cope.'], ['Resilience', 'Resilience is the ability to recover.'], ['Mitigation', 'Mitigation is reducing risk.'],
        'Being located in a hazard zone is exposure.'),
      I('Disaster risk increases when:', 'Hazard, exposure and vulnerability increase, and decreases when capacity increases',
        ['Capacity increases', 'Greater capacity lowers risk.'], ['Early warning systems improve', 'Better warnings reduce risk.'], ['People move away from hazard zones', 'That reduces exposure.'],
        'Risk ≈ hazard × exposure × vulnerability ÷ capacity.'),
      I('A community’s ability to bounce back quickly after a disaster is its:', 'Resilience',
        ['Vulnerability', 'Vulnerability is susceptibility to harm.'], ['Exposure', 'Exposure is being in harm’s way.'], ['Hazard', 'A hazard is the damaging event.'],
        'Resilient communities prepare, adapt and recover.')
    ]
  };
  S.DR2 = {
    idea: 'PHIVOLCS monitors earthquakes and volcanoes; know the hazards (ground shaking, liquefaction, tsunami, pyroclastic flows, lahar) and Duck, Cover and Hold.',
    hint: 'Match the hazard with its description, and recall the safe actions.',
    pool: [
      I('What should you do indoors during an earthquake?', 'Duck, cover and hold',
        ['Run outside immediately', 'Falling debris near exits is dangerous during shaking.'], ['Take the elevator down', 'Elevators can stop or fail during earthquakes.'], ['Stand next to the windows', 'Glass can shatter.'],
        'Take cover under a sturdy table until the shaking stops.'),
      I('Which government agency monitors earthquakes and volcanoes?', 'PHIVOLCS',
        ['PAGASA', 'PAGASA handles weather and typhoons.'], ['NDRRMC', 'NDRRMC coordinates disaster response.'], ['MMDA', 'MMDA manages Metro Manila services.'],
        'Philippine Institute of Volcanology and Seismology.'),
      I('When strong shaking makes wet soil behave like a liquid, it is called:', 'Liquefaction',
        ['Lahar', 'A lahar is a volcanic mudflow.'], ['Landslide', 'A landslide is a downslope movement of earth.'], ['Storm surge', 'A storm surge is caused by typhoon winds.'],
        'Buildings on liquefied ground can tilt or sink.'),
      I('A fast-moving current of hot gas and volcanic debris is a:', 'Pyroclastic flow',
        ['Lahar', 'A lahar is a volcanic mudflow, often triggered by rain.'], ['Ashfall', 'Ashfall is ash settling from the air.'], ['Lava flow', 'Lava flows are usually slow-moving molten rock.'],
        'Pyroclastic flows are among the deadliest volcanic hazards.'),
      I('A series of large sea waves caused by an undersea earthquake is a:', 'Tsunami',
        ['Storm surge', 'A storm surge is pushed by typhoon winds.'], ['High tide', 'Tides follow the Moon’s pull.'], ['Rip current', 'Rip currents flow away from the shore.'],
        'If the sea suddenly recedes after a quake, move to high ground.')
    ]
  };
  S.DR3 = {
    idea: 'PAGASA issues tropical cyclone wind signals and rainfall warnings; storm surges and floods follow typhoons.',
    hint: 'Recall PAGASA’s warning systems and what each hazard is.',
    pool: [
      I('Which agency issues tropical cyclone wind signals in the Philippines?', 'PAGASA',
        ['PHIVOLCS', 'PHIVOLCS monitors earthquakes and volcanoes.'], ['DPWH', 'DPWH builds public works.'], ['DOH', 'DOH handles health.'],
        'Philippine Atmospheric, Geophysical and Astronomical Services Administration.'),
      I('An abnormal rise of seawater pushed onto land by a typhoon’s winds is a:', 'Storm surge',
        ['Tsunami', 'Tsunamis come from undersea earthquakes.'], ['Flash flood', 'Flash floods come from heavy rain.'], ['High tide', 'Ordinary tides follow the Moon.'],
        'Storm surges caused many deaths during Typhoon Yolanda (2013).'),
      I('The highest tropical cyclone wind signal in the Philippines is:', 'Signal No. 5',
        ['Signal No. 3', 'The system goes beyond Signal No. 3.'], ['Signal No. 4', 'Signal No. 5 was added for super typhoons.'], ['Signal No. 10', 'The Philippine system goes up to Signal No. 5.'],
        'Signal No. 5 warns of typhoon-force winds of 185 km/h or more.'),
      I('Before a typhoon, each family should prepare:', 'An emergency go-bag with water, food, flashlight, medicines and documents',
        ['Only snacks for watching TV', 'Preparation must cover basic survival needs.'], ['Nothing until the typhoon arrives', 'Preparation must happen before the storm.'], ['A boat for sightseeing', 'Sightseeing is dangerous during typhoons.'],
        'A go-bag supports a family for at least 72 hours.'),
      I('A PAGASA red rainfall warning means:', 'Serious flooding is expected; evacuate if you are in a danger zone',
        ['Light rain is expected', 'That would be lower or no warning.'], ['Flooding is only possible in low areas', 'That is closer to a yellow warning.'], ['The typhoon has passed', 'A red warning signals danger now.'],
        'Yellow, orange and red warnings rise in severity.')
    ]
  };
  S.DR4 = {
    idea: 'Fire needs heat, fuel and oxygen; RA 10121 sets up the Philippine disaster risk reduction and management system.',
    hint: 'Remove one side of the fire triangle, and recall the DRRM law.',
    pool: [
      I('The fire triangle consists of:', 'Heat, fuel and oxygen',
        ['Water, smoke and ash', 'Those are not what a fire needs.'], ['Wood, paper and cloth', 'Those are all fuels only.'], ['Sparks, wind and rain', 'Rain puts out fires.'],
        'Removing any one side puts the fire out.'),
      I('Why should water not be used on an electrical fire?', 'Water conducts electricity and can cause electrocution',
        ['Water makes the fire hotter', 'The main danger is electric shock.'], ['Water is too expensive', 'Cost is not the issue.'], ['Water turns into fuel', 'Water is not a fuel.'],
        'Cut the power and use a Class C (CO₂ or dry chemical) extinguisher.'),
      I('The Philippine Disaster Risk Reduction and Management Act is:', 'RA 10121 (2010)',
        ['RA 7160', 'RA 7160 is the Local Government Code.'], ['RA 9258', 'RA 9258 regulates guidance counseling.'], ['RA 10173', 'RA 10173 is the Data Privacy Act.'],
        'It created the NDRRMC and local DRRM offices.'),
      I('During a fire in a building, you should:', 'Stay low below the smoke and evacuate by the stairs',
        ['Use the elevator', 'Elevators may stop or open on the fire floor.'], ['Hide in a closet', 'Hiding traps you.'], ['Go back for belongings', 'Never go back into a burning building.'],
        'Smoke rises; cleaner air is near the floor.'),
      I('Which agency is mainly responsible for fire prevention and firefighting in the Philippines?', 'Bureau of Fire Protection (BFP)',
        ['PAGASA', 'PAGASA handles weather.'], ['PNP', 'The PNP handles law enforcement.'], ['DSWD', 'DSWD handles social welfare.'],
        'The BFP is under the DILG.')
    ]
  };

  return S;
};

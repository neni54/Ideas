// THE UNEXPECTED TWIST — short original scenes with a final line that means more than it says.
// To add scenes: append to SCENES with a unique id. Everything else (sessions, review, stats) is automatic.
import type { Cefr } from './types';
import type { Tone } from '../services/api';

export type TwistCollection = 'dating' | 'friends' | 'office' | 'awkward' | 'sarcasm' | 'everyday';

export const TWIST_COLLECTIONS: { id: TwistCollection; title: string; colors: [string, string] }[] = [
  { id: 'dating', title: 'Dating Disasters', colors: ['#3b1d2a', '#9a4a5e'] },
  { id: 'friends', title: 'Friends & Social Drama', colors: ['#2e2416', '#8a6a3a'] },
  { id: 'office', title: 'Office Politics', colors: ['#1f2723', '#4f6b5d'] },
  { id: 'awkward', title: 'Awkward Moments', colors: ['#2a2230', '#6e5a7e'] },
  { id: 'sarcasm', title: 'Sarcasm & Wit', colors: ['#3a1219', '#8e2c3a'] },
  { id: 'everyday', title: 'Everyday Situations', colors: ['#2b2a26', '#6b6450'] },
];

export interface TwistScene {
  id: string;
  col: TwistCollection;
  level: Cefr;
  /** Stage direction, in English. */
  setting: string;
  /** The exchange before the twist: [speaker, line]. */
  lines: [string, string][];
  /** The final, unexpected line. */
  twist: [string, string];
  /** Key expression inside the twist (played with the AI voice). */
  key: string;
  /** How the key expression should be voiced. */
  tone: Tone;
  /** Optional custom question; default: "What does <speaker> really mean?" */
  question?: string;
  options: [string, string, string, string];
  answer: 0 | 1 | 2 | 3;
  /** The nuance, in Spanish from Spain. */
  explain: string;
  /** Extra original example: [English, Spanish]. */
  ex: [string, string];
}

const s = (x: TwistScene) => x;

export const SCENES: TwistScene[] = [
  /* ───── Dating Disasters ───── */
  s({
    id: 'tw-dat-1', col: 'dating', level: 'B1',
    setting: 'Third date. Sam spent an hour choosing the restaurant. The food arrives cold and strangely grey.',
    lines: [['Sam', 'So... what do you think?']],
    twist: ['Alex', "It's very... brave of the chef."], key: "It's very brave of the chef.", tone: 'dry',
    options: ['The chef is courageous for opening a restaurant.', "Alex doesn't like the food but is being polite and funny about it.", 'Alex wants to meet the chef.', 'Alex thinks the food is too spicy.'],
    answer: 1,
    explain: '«Brave» aplicado a comida, ropa o decisiones es un eufemismo irónico: algo arriesgado que no ha salido bien. Alex evita decir «está malo» sin ofender a Sam.',
    ex: ['Pineapple on a burger? That\'s a brave choice.', '¿Piña en una hamburguesa? Qué valiente (o sea: qué horror).'],
  }),
  s({
    id: 'tw-dat-2', col: 'dating', level: 'B2',
    setting: 'Mia and Leo have been texting for two weeks. Tonight he finally calls.',
    lines: [['Leo', 'So I was thinking... maybe dinner on Friday?'], ['Mia', "Oh, I'd love to, but Friday's tricky."], ['Leo', 'Saturday?']],
    twist: ['Mia', "Saturday's... also a day."], key: "Saturday's also a day.", tone: 'evasive',
    options: ['Mia is confirming that Saturday works.', 'Mia is avoiding the date without actually saying no.', 'Mia is confused about the calendar.', 'Mia wants to go out on both days.'],
    answer: 1,
    explain: 'Responder con una obviedad («el sábado también es un día») es una evasiva torpe y cómica. No dice que no, pero tampoco que sí: muestra poco interés.',
    ex: ["'Are you free next week?' 'Next week is... a week.'", '—¿Estás libre la semana que viene? —La semana que viene es... una semana.'],
  }),
  s({
    id: 'tw-dat-3', col: 'dating', level: 'B2',
    setting: 'A first date. Chris has been talking about his ex for forty minutes.',
    lines: [['Chris', "...and that's why she was totally wrong about the dog."], ['Chris', 'Anyway, enough about me. Tell me about you!']],
    twist: ['Dana', "Oh, I wouldn't want to interrupt. You and your ex seem very close."], key: 'You and your ex seem very close.', tone: 'passive_aggressive',
    options: ['Dana thinks Chris should get back together with his ex.', "Dana is pointing out, with irony, that Chris won't stop talking about his ex.", 'Dana wants to meet the ex.', 'Dana is jealous of the dog.'],
    answer: 1,
    explain: 'Ironía con un punto pasivo-agresivo: «parecéis muy unidos» significa en realidad «llevas toda la cita hablando de ella». Una señal de alarma servida con educación.',
    ex: ['You mention your boss a lot. You two must be very close.', 'Hablas mucho de tu jefe. Debéis de ser íntimos.'],
  }),
  s({
    id: 'tw-dat-4', col: 'dating', level: 'C1',
    setting: 'After one date, Nora gets a three-paragraph message from Tom. It ends with a poem.',
    lines: [['Friend', 'So? Did he text you?'], ['Nora', 'Oh, he texted.'], ['Friend', 'And?']],
    twist: ['Nora', "Let's just say he's not afraid of commitment."], key: "He's not afraid of commitment.", tone: 'dry',
    options: ["Tom is moving too fast, and it's a bit much.", 'Tom is reliable and she wants to marry him.', 'Tom is afraid of relationships.', 'Tom forgot to text back.'],
    answer: 0,
    explain: '«No le da miedo el compromiso» suele ser un elogio, pero aquí es un eufemismo irónico: tras una sola cita, un poema es demasiado. Quiere decir «va demasiado rápido».',
    ex: ["He's met my parents and we've had one date. Let's just say he's enthusiastic.", 'Ya conoce a mis padres y solo hemos tenido una cita. Digamos que es entusiasta.'],
  }),
  s({
    id: 'tw-dat-5', col: 'dating', level: 'B1',
    setting: 'Jess meets her date from the app for the first time.',
    lines: [['Jess', 'Hi! Sorry, do I look like my profile picture?'], ['Ben', "It's a great picture."]],
    twist: ['Ben', 'I almost didn\'t recognize you.'], key: "I almost didn't recognize you.", tone: 'amused',
    options: ['Ben is complimenting her new haircut.', 'Ben is hinting that she looks very different from her photo.', 'Ben has bad eyesight.', 'Ben has never seen the photo.'],
    answer: 1,
    explain: 'Parece un comentario inocente, pero insinúa que la foto está muy retocada o es antigua. Doble sentido: medio broma, medio queja.',
    ex: ['Great photo. Very... flattering.', 'Qué buena foto. Muy... favorecedora.'],
  }),

  /* ───── Friends & Social Drama ───── */
  s({
    id: 'tw-fr-1', col: 'friends', level: 'B1',
    setting: 'Two months ago, your friend Marta borrowed your favourite jacket.',
    lines: [['You', 'Hey, do you still have my jacket?'], ['Marta', 'Oh, yes! It looks amazing on me, by the way.']],
    twist: ['You', "I'm so glad it found a good home."], key: "I'm so glad it found a good home.", tone: 'sarcastic',
    options: ['You are happy to give her the jacket.', 'You are sarcastically hinting that you want it back.', 'You want to buy a new jacket.', 'You think the jacket was ugly.'],
    answer: 1,
    explain: '«Ha encontrado un buen hogar» se dice de mascotas adoptadas. Usarlo con una chaqueta prestada es sarcasmo: significa «es mía, devuélvemela».',
    ex: ['My charger has been at your place for a month. It must be very happy there.', 'Mi cargador lleva un mes en tu casa. Debe de estar muy a gusto.'],
  }),
  s({
    id: 'tw-fr-2', col: 'friends', level: 'B2',
    setting: 'The group chat is planning a birthday dinner. Paula suggests the most expensive restaurant in town.',
    lines: [['Paula', "It's only ninety euros per person!"], ['Dan', 'Only?'], ['Paula', "It's a special occasion!"]],
    twist: ['Dan', "Absolutely. I'll just sell a kidney. I've got two."], key: "I'll just sell a kidney.", tone: 'amused',
    options: ['Dan is seriously considering selling an organ.', 'Dan is joking that the restaurant is far too expensive.', 'Dan is excited about the dinner.', 'Dan is a doctor.'],
    answer: 1,
    explain: 'Hipérbole humorística: «vender un riñón» significa que algo es carísimo. Dan protesta por el precio sin enfrentarse directamente a Paula.',
    ex: ['Concert tickets are 300 euros. Time to sell a kidney.', 'Las entradas cuestan 300 euros. Habrá que vender un riñón.'],
  }),
  s({
    id: 'tw-fr-3', col: 'friends', level: 'C1',
    setting: "Lucas didn't invite Ana to his party. She saw the photos online.",
    lines: [['Lucas', 'Hey! We missed you on Saturday!'], ['Ana', 'Did you?'], ['Lucas', 'Of course!']],
    twist: ['Ana', 'Funny. My invitation must have got lost in the post.'], key: 'My invitation must have got lost in the post.', tone: 'passive_aggressive',
    options: ['Ana is worried about the postal service.', 'Ana is pointing out, ironically, that she was never invited.', 'Ana is apologizing for missing the party.', 'Ana wants Lucas to resend the invitation by mail.'],
    answer: 1,
    explain: 'Nadie manda invitaciones por correo postal: es ironía. Ana le deja claro a Lucas que sabe que no la invitó, sin montar una escena.',
    ex: ['A team lunch? My calendar invite must have got lost.', '¿Una comida del equipo? Se ve que mi invitación se perdió por el camino.'],
  }),
  s({
    id: 'tw-fr-4', col: 'friends', level: 'B2',
    setting: 'Your flatmate has left his dishes in the sink for five days.',
    lines: [['Flatmate', 'Something smells weird in here.'], ['You', 'Does it?'], ['Flatmate', 'Yeah. What is that?']],
    twist: ['You', 'No idea. Maybe the dishes are starting a new civilisation.'], key: 'Maybe the dishes are starting a new civilisation.', tone: 'dry',
    options: ['You think the kitchen looks very modern.', 'You are hinting, with humour, that the dirty dishes are his fault.', 'You are interested in history.', 'You want to buy new dishes.'],
    answer: 1,
    explain: 'Humor absurdo como indirecta: en vez de decir «friega tus platos», exageras lo sucios que están. Pasivo-agresivo, pero con gracia.',
    ex: ['Your laundry pile has its own postcode now.', 'Tu montón de ropa sucia ya tiene código postal propio.'],
  }),
  s({
    id: 'tw-fr-5', col: 'friends', level: 'B1',
    setting: 'Karaoke night. Ivan has just sung very, very badly.',
    lines: [['Ivan', 'How was that?'], ['Lena', 'Wow.'], ['Ivan', 'Be honest!']],
    twist: ['Lena', "Honestly? I've never heard that song sung that way before."], key: "I've never heard that song sung that way before.", tone: 'amused',
    options: ['Lena loved his original version.', 'Lena is politely saying he sang badly.', "Lena didn't know the song.", 'Lena wants to sing next.'],
    answer: 1,
    explain: 'Frase técnicamente cierta y diplomática: «nunca la había oído cantar así» evita decir «lo has hecho fatal». El matiz está en lo que no dice.',
    ex: ["That's certainly a unique way to park.", 'Desde luego es una forma muy original de aparcar.'],
  }),

  /* ───── Office Politics ───── */
  s({
    id: 'tw-of-1', col: 'office', level: 'B2',
    setting: 'Friday, 5:55 p.m. Your manager walks over to your desk.',
    lines: [['Manager', 'Got a minute?'], ['You', 'Sure...']],
    twist: ['Manager', "Great. It's just a small thing. Should only take the weekend."], key: 'Should only take the weekend.', tone: 'amused',
    options: ['The task is quick and easy.', 'The manager is joking, but the task really is big.', 'The manager is inviting you on a weekend trip.', 'The task is due next month.'],
    answer: 1,
    explain: 'Ironía de oficina: llama «cosa pequeña» a algo que te ocupará el fin de semana entero. Medio broma, pero el trabajo es real.',
    ex: ["Quick question. It'll only take your entire afternoon.", 'Una pregunta rápida. Solo te llevará la tarde entera.'],
  }),
  s({
    id: 'tw-of-2', col: 'office', level: 'C1',
    setting: 'In a meeting, Greg presents your idea as his own.',
    lines: [['Greg', "...so that's my proposal."], ['Boss', 'Brilliant, Greg.']],
    twist: ['You', "It is brilliant. I remember thinking exactly the same thing last Tuesday."], key: 'I remember thinking exactly the same thing last Tuesday.', tone: 'passive_aggressive',
    options: ['You agree with Greg and support him.', 'You are subtly claiming that the idea was yours.', 'You forgot what happened on Tuesday.', 'You want to schedule a meeting for Tuesday.'],
    answer: 1,
    explain: 'Comentario pasivo-agresivo de manual corporativo: no acusas a Greg, pero dejas claro delante del jefe que la idea era tuya.',
    ex: ['Great point. It was also a great point when I made it in my email.', 'Buen apunte. También lo fue cuando lo dije en mi correo.'],
  }),
  s({
    id: 'tw-of-3', col: 'office', level: 'B1',
    setting: 'A colleague finally replies to your urgent email. Two weeks later.',
    lines: [['Colleague', 'So sorry for the late reply!']],
    twist: ['You', 'No problem at all. The project only finished last week.'], key: 'The project only finished last week.', tone: 'sarcastic',
    options: ['You are relieved the project is over.', 'You are pointing out, sarcastically, that the reply is useless now.', 'You are asking for more time.', 'You are thanking them for their help.'],
    answer: 1,
    explain: 'Sarcasmo suave: «no pasa nada» seguido de un dato que demuestra que sí pasa. La respuesta llega cuando ya no sirve de nada.',
    ex: ['Thanks for the reminder about the deadline. It was yesterday.', 'Gracias por recordarme la fecha límite. Fue ayer.'],
  }),
  s({
    id: 'tw-of-4', col: 'office', level: 'B2',
    setting: "It's the team's fourth meeting this week about having fewer meetings.",
    lines: [['Ana', 'So, how do we cut down on meetings?'], ['Tim', 'Maybe we should set up a meeting to discuss it.']],
    twist: ['Ana', "Great idea. Let's make it a weekly one."], key: "Let's make it a weekly one.", tone: 'dry',
    options: ['Ana loves meetings.', 'Ana is mocking how absurd the situation is.', 'Ana wants to reduce the workload.', 'Ana is changing the subject.'],
    answer: 1,
    explain: 'Ironía ante lo absurdo: proponer una reunión semanal sobre reducir reuniones lleva la idea al extremo para señalar lo ridícula que es.',
    ex: ["We need fewer emails. I'll send an email about it.", 'Necesitamos menos correos. Mandaré un correo al respecto.'],
  }),
  s({
    id: 'tw-of-5', col: 'office', level: 'C1',
    setting: 'Your annual review. Your manager is reading from your file.',
    lines: [['Manager', "You're very... creative with deadlines."], ['You', 'Thank you!']],
    twist: ['Manager', "That wasn't exactly a compliment."], key: "You're very creative with deadlines.", tone: 'dry',
    question: "What did the manager mean by 'creative with deadlines'?",
    options: ['You often miss deadlines.', 'You come up with original ideas.', 'You set very ambitious deadlines.', 'You work best under pressure.'],
    answer: 0,
    explain: '«Creativo con los plazos» es un eufemismo: no cumples las fechas. La gracia está en que tú te lo tomas como un elogio y el jefe tiene que aclararlo.',
    ex: ["He's quite flexible with the truth.", 'Es bastante flexible con la verdad (o sea: miente).'],
  }),

  /* ───── Awkward Moments ───── */
  s({
    id: 'tw-aw-1', col: 'awkward', level: 'B1',
    setting: 'Someone waves at you in the street, so you wave back enthusiastically.',
    lines: [['You', 'Hi!!'], ['Stranger', '...Sorry, I was waving at the person behind you.']],
    twist: ['You', 'Yeah, no, I knew that. I was just... stretching.'], key: 'I was just stretching.', tone: 'nervous',
    options: ['You really were stretching.', 'You are making an obvious excuse to hide your embarrassment.', 'You want to exercise together.', 'You are angry with the stranger.'],
    answer: 1,
    explain: 'Excusa evidente para salvar el momento: nadie se la cree, y esa es la gracia. «Yeah, no» es muy típico del inglés hablado para empezar a rectificar.',
    ex: ["I wasn't falling. I was testing gravity.", 'No me estaba cayendo. Estaba probando la gravedad.'],
  }),
  s({
    id: 'tw-aw-2', col: 'awkward', level: 'B2',
    setting: 'At a party, you congratulate a woman on her pregnancy.',
    lines: [['You', 'Congratulations! When is the baby due?'], ['Woman', "...I'm not pregnant."]],
    twist: ['You', "Right. Of course. I'll just go and live in the sea now."], key: "I'll just go and live in the sea now.", tone: 'nervous',
    options: ['You are planning to move to the coast.', 'You are so embarrassed that you want to disappear.', 'You are inviting her to the beach.', 'You are joking about her weight.'],
    answer: 1,
    explain: 'Hipérbole de vergüenza: «me voy a vivir al mar» equivale a «tierra, trágame». Reconoces la metedura de pata con humor contra ti mismo.',
    ex: ["I called my teacher 'Mum'. I'm moving to another country.", 'Llamé «mamá» a mi profesora. Me mudo a otro país.'],
  }),
  s({
    id: 'tw-aw-3', col: 'awkward', level: 'B1',
    setting: 'You bump into your boss in the gym changing room.',
    lines: [['Boss', 'Oh! Hello!'], ['You', 'Hi! Funny meeting you here.']],
    twist: ['Boss', "Yes. Let's never talk about this."], key: "Let's never talk about this.", tone: 'amused',
    options: ['The boss is angry with you.', 'The boss wants to forget the awkward moment, with humour.', 'The boss is firing you.', 'The boss wants to train together.'],
    answer: 1,
    explain: 'Fórmula humorística para cerrar un momento incómodo compartido: «hagamos como que esto no ha pasado».',
    ex: ['You saw me singing in the car? This never happened.', '¿Me viste cantando en el coche? Esto nunca ha pasado.'],
  }),
  s({
    id: 'tw-aw-4', col: 'awkward', level: 'C1',
    setting: 'Jamie accidentally replied-all to a company-wide email with a meme meant for one colleague.',
    lines: [['CEO (reply-all)', 'Thanks for sharing, Jamie.'], ['Colleague (private)', 'Oh no.']],
    twist: ['Jamie (private)', 'On the bright side, the CEO finally knows my name.'], key: 'On the bright side, the CEO finally knows my name.', tone: 'dry',
    options: ['Jamie is genuinely happy about the mistake.', 'Jamie is finding a funny "positive side" to a disaster.', 'Jamie wanted to send it to the CEO.', 'Jamie is asking for a promotion.'],
    answer: 1,
    explain: '«On the bright side» (por el lado bueno) usado con ironía: busca un consuelo absurdo en pleno desastre. Humor autocrítico.',
    ex: ['I failed my driving test, but on the bright side, the examiner was lovely.', 'Suspendí el carné, pero por el lado bueno, el examinador era majísimo.'],
  }),
  s({
    id: 'tw-aw-5', col: 'awkward', level: 'B2',
    setting: 'You gave a wedding speech. Nobody laughed at any of your jokes.',
    lines: [['Guest', 'That was... a speech.'], ['You', 'Thank you?']],
    twist: ['Guest', 'Bold of you to try comedy.'], key: 'Bold of you to try comedy.', tone: 'dry',
    options: ['The guest admires your courage.', "The guest thinks your jokes weren't funny.", 'The guest wants you to perform again.', "The guest didn't hear the speech."],
    answer: 1,
    explain: '«Bold of you» (qué atrevido por tu parte) suele esconder una crítica: lo has intentado, pero no ha funcionado.',
    ex: ['Wearing white to a wedding? Bold.', '¿Ir de blanco a una boda? Atrevido.'],
  }),

  /* ───── Sarcasm & Wit ───── */
  s({
    id: 'tw-sa-1', col: 'sarcasm', level: 'B1',
    setting: "It's pouring with rain, and your friend forgot the umbrella.",
    lines: [['Friend', 'So... I forgot the umbrella.']],
    twist: ['You', 'Great. I always wanted to swim to work.'], key: 'Great. I always wanted to swim to work.', tone: 'sarcastic',
    options: ['You love swimming.', 'You are annoyed and use sarcasm about getting soaked.', 'You want to change jobs.', 'You think the rain will stop soon.'],
    answer: 1,
    explain: 'Sarcasmo clásico: dices que deseabas algo que claramente no deseas. El «Great» del principio ya avisa del tono.',
    ex: ['Perfect. A flat tyre. Exactly what this day needed.', 'Perfecto. Un pinchazo. Justo lo que le faltaba al día.'],
  }),
  s({
    id: 'tw-sa-2', col: 'sarcasm', level: 'B2',
    setting: 'Your brother finishes assembling a wardrobe. Three screws are left over.',
    lines: [['Brother', "Done! And I didn't even need the instructions."]],
    twist: ['You', 'Clearly. The screws are just a bonus.'], key: 'The screws are just a bonus.', tone: 'sarcastic',
    options: ['You think the extra screws are a gift.', 'You are mocking him: he put it together wrong.', 'You want to keep the screws.', 'You are impressed by his skills.'],
    answer: 1,
    explain: '«Clearly» (ya se ve) + «los tornillos son un extra» = burla: si sobran tornillos, algo está mal montado.',
    ex: ["You don't need a map? Clearly. That's why we're in the wrong city.", '¿No necesitas mapa? Ya se ve. Por eso estamos en otra ciudad.'],
  }),
  s({
    id: 'tw-sa-3', col: 'sarcasm', level: 'C1',
    setting: "Your colleague announces his fifth 'life-changing' business idea this year.",
    lines: [['Colleague', "This time it's different. Subscriptions... for houseplants."]],
    twist: ['You', "Wow. I can't believe nobody's thought of that yet."], key: "I can't believe nobody's thought of that yet.", tone: 'dry',
    options: ["You think it's a genius idea.", 'You are implying that the idea is ridiculous.', 'You want to invest.', 'You are surprised it already exists.'],
    answer: 1,
    explain: 'Sarcasmo seco: aparentas asombro, pero el sentido real es «nadie lo ha hecho porque es absurdo».',
    ex: ['A café that only serves cereal for fifteen euros? Revolutionary.', '¿Una cafetería que solo sirve cereales a quince euros? Revolucionario.'],
  }),
  s({
    id: 'tw-sa-4', col: 'sarcasm', level: 'B2',
    setting: 'You spent all morning cleaning. Your partner walks in and drops muddy shoes on the floor.',
    lines: [['Partner', "Hey! Is there anything to eat?"]],
    twist: ['You', "Oh, don't worry about the floor. I mopped it just so you could decorate it."], key: 'I mopped it just so you could decorate it.', tone: 'frustrated',
    options: ['You want them to decorate the house.', 'You are sarcastically angry about the mud.', 'You love their shoes.', 'You are offering them food.'],
    answer: 1,
    explain: 'Sarcasmo con enfado: presentas el desastre como si fuera un favor que esperabas. «Don\'t worry» significa justo lo contrario.',
    ex: ['Thanks for finishing the milk. I love black coffee.', 'Gracias por acabarte la leche. Me encanta el café solo.'],
  }),
  s({
    id: 'tw-sa-5', col: 'sarcasm', level: 'B1',
    setting: 'Your friend turns up at the beach in a full suit and tie.',
    lines: [['Friend', 'What? I like to look professional.']],
    twist: ['You', 'Of course. Sharks respect a good tie.'], key: 'Sharks respect a good tie.', tone: 'amused',
    options: ['You believe sharks like ties.', 'You are teasing your friend about the strange outfit.', 'You are worried about sharks.', 'You want to borrow the tie.'],
    answer: 1,
    explain: 'Broma absurda para burlarte con cariño: sigues la lógica ridícula de tu amigo para que se note lo rara que es su elección.',
    ex: ['Heels for hiking? The mountain will be impressed.', '¿Tacones para hacer senderismo? La montaña quedará impresionada.'],
  }),

  /* ───── Everyday Situations ───── */
  s({
    id: 'tw-ev-1', col: 'everyday', level: 'B1',
    setting: 'You arrive twenty minutes late to meet a friend.',
    lines: [['You', "Sorry I'm late!"]],
    twist: ['Friend', "Don't worry. I only aged five years waiting here."], key: 'I only aged five years waiting here.', tone: 'amused',
    question: 'What does your friend really mean?',
    options: ['They are genuinely worried about getting older.', 'They are joking because you made them wait.', 'They want to leave immediately.', "They didn't notice the delay."],
    answer: 1,
    explain: 'Sarcasmo amable: exagera cuánto ha esperado para mostrar un enfado leve con humor. El «Don\'t worry» suaviza, pero el mensaje llega.',
    ex: ["No rush. I've only been here since the Middle Ages.", 'Sin prisa. Solo llevo aquí desde la Edad Media.'],
  }),
  s({
    id: 'tw-ev-2', col: 'everyday', level: 'B1',
    setting: 'A waiter brings the wrong dish for the third time.',
    lines: [['Waiter', "Here's your pasta!"], ['You', 'I ordered the fish.'], ['Waiter', 'Oh! Right. Sorry.']],
    twist: ['You', "No worries. I'm starting to enjoy the surprise menu."], key: "I'm starting to enjoy the surprise menu.", tone: 'dry',
    options: ['You love surprises.', 'You are being sarcastic about the repeated mistakes.', 'You want to try everything on the menu.', "You aren't hungry."],
    answer: 1,
    explain: 'Ironía educada: en vez de quejarte, finges que los errores son un «menú sorpresa». Se queja sin levantar la voz.',
    ex: ['Another delay? I love these unplanned adventures.', '¿Otro retraso? Me encantan estas aventuras improvisadas.'],
  }),
  s({
    id: 'tw-ev-3', col: 'everyday', level: 'B2',
    setting: 'Your neighbour has been drilling the wall at 7 a.m. every day this week.',
    lines: [['Neighbour', 'Morning! Sorry if the drilling is loud.']],
    twist: ['You', 'Not at all. Who needs an alarm clock?'], key: 'Who needs an alarm clock?', tone: 'sarcastic',
    options: ["The noise wakes you up every morning, and you're not happy about it.", 'You want to buy an alarm clock.', 'You love waking up early.', 'You are offering to help with the drilling.'],
    answer: 0,
    explain: 'Pregunta retórica sarcástica: el ruido te despierta cada día. Suena amable, pero es una queja.',
    ex: ['Your dog barks all night. Who needs sleep anyway?', 'Tu perro ladra toda la noche. Total, ¿quién necesita dormir?'],
  }),
  s({
    id: 'tw-ev-4', col: 'everyday', level: 'C1',
    setting: "Your mum called three times during your work presentation. You call her back afterwards.",
    lines: [['Mum', "Why didn't you answer?"], ['You', 'I was in a meeting!']],
    twist: ['Mum', "Ah. So you're too important for your mother now."], key: "So you're too important for your mother now.", tone: 'passive_aggressive',
    options: ['Mum is proud of your job.', 'Mum is making you feel a bit guilty, half joking.', 'Mum wants to work with you.', "Mum doesn't know what a meeting is."],
    answer: 1,
    explain: 'Chantaje emocional en broma (un «guilt trip»): no está enfadada de verdad, pero quiere que te sientas un poquito culpable.',
    ex: ["Oh, you're busy? I'll just sit here on my own, then.", '¿Estás ocupado? Pues nada, me quedo aquí solita.'],
  }),
  s({
    id: 'tw-ev-5', col: 'everyday', level: 'B2',
    setting: "Your friend asked you to help him move house 'for an hour'. It's now 9 p.m.",
    lines: [['Friend', 'Just two more boxes!']],
    twist: ['You', "That's what you said four hours ago. I think the boxes are multiplying."], key: 'I think the boxes are multiplying.', tone: 'frustrated',
    options: ['You think he has bought more boxes.', 'You are complaining, with humour, that the job never ends.', 'You want to keep helping all night.', 'You are counting the boxes.'],
    answer: 1,
    explain: 'Humor exagerado para quejarte sin pelear: las cajas «se multiplican» quiere decir «esto no se acaba nunca».',
    ex: ["This meeting has been 'almost over' for an hour. Time works differently here.", 'Esta reunión lleva una hora «a punto de acabar». Aquí el tiempo va distinto.'],
  }),
];

export const SCENE_BY_ID: Record<string, TwistScene> = Object.fromEntries(SCENES.map((x) => [x.id, x]));
export const questionFor = (x: TwistScene) => {
  if (x.question) return x.question;
  const who = x.twist[0].replace(/\s*\(.*\)$/, '');
  return who === 'You' ? 'What do you really mean?' : `What does ${who} really mean?`;
};

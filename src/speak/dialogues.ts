// SIDEYE SPEAK · guided conversations. Prepared, branching dialogues (no generative AI):
// every line was written in advance; the app picks the next one from the person's answer.
// `x` links a line to an expression of the SIDEYE collections (src/data/packs).

export type Tone = 'natural' | 'bold' | 'sarcastic' | 'awkward' | 'polite' | 'honest';

export interface Line {
  en: string;
  es: string;
  /** Expression id from the collections used in this line. */
  x?: string;
  /** Short explanation (double meaning, register…) shown under the line. */
  note?: string;
}
export interface Choice extends Line {
  tone: Tone;
  next: string;
}
export interface Turn {
  them: Line[];
  choices?: Choice[];
  /** Closing comment (Spanish) when the conversation ends here. */
  end?: string;
}
export interface Dialogue {
  id: string;
  cat: string;
  title: string;
  setup: string;
  partner: { name: string; role: string };
  start: string;
  turns: Record<string, Turn>;
}

export const TONE_LABEL: Record<Tone, string> = {
  natural: 'Natural',
  bold: 'Atrevida',
  sarcastic: 'Sarcástica',
  awkward: 'Forzada',
  polite: 'Educada',
  honest: 'Directa',
};

export const DIALOGUES: Dialogue[] = [
  {
    id: 'smalltalk-coffee',
    cat: 'Small talk',
    title: 'Running into an old friend',
    setup: 'En la cola de una cafetería te encuentras a Jess, una compañera de clase a la que no ves desde hace años.',
    partner: { name: 'Jess', role: 'old classmate' },
    start: 'a',
    turns: {
      a: {
        them: [
          { en: "Oh my God, hi! I haven't seen you in forever.", es: '¡Dios mío, hola! Hace siglos que no te veo.' },
          { en: 'So, what have you been up to?', es: 'Bueno, ¿y qué es de tu vida?', x: 'everyday-3', note: '"What have you been up to?" no pregunta qué estás haciendo ahora, sino qué tal te va últimamente.' },
        ],
        choices: [
          { en: 'Not much, just work and stuff. You?', es: 'Poca cosa, trabajo y tal. ¿Y tú?', tone: 'natural', next: 'busy', note: 'La respuesta más típica: corta, relajada y devuelve la pregunta.' },
          { en: 'I have been working in a company of software.', es: 'He estado trabajando en una empresa de software.', tone: 'awkward', next: 'literal', note: 'Se entiende, pero es un calco del español. Lo natural: "I\'ve been working at a software company."' },
          { en: 'Honestly? Living my best life.', es: '¿Sinceramente? Disfrutando a tope.', x: 'maincharacter-2', tone: 'bold', next: 'best', note: '"Living my best life" es desenfadado y un poco irónico: queda simpático entre amigos.' },
        ],
      },
      busy: {
        them: [
          { en: 'Same here. Work is crazy.', es: 'Yo igual. El trabajo es una locura.' },
          { en: 'Hey, want to grab a coffee sometime this week?', es: 'Oye, ¿quedamos para un café esta semana?' },
        ],
        choices: [
          { en: "I'm down. Thursday?", es: 'Me apunto. ¿El jueves?', x: 'everyday-5', tone: 'natural', next: 'plan', note: '"I\'m down" = me apunto. Informal y muy americano.' },
          { en: "Hmm, I'll think about it.", es: 'Mmm, me lo pensaré.', x: 'meant-2', tone: 'polite', next: 'soft', note: 'Ojo: "I\'ll think about it" suele entenderse como un "no" educado.' },
        ],
      },
      literal: {
        them: [
          { en: 'Oh, at a software company? Nice!', es: '¿En una empresa de software? ¡Qué bien!', note: 'Fíjate cómo lo reformula ella: "at a software company". Así suena natural.' },
          { en: 'Hey, want to grab a coffee sometime this week?', es: 'Oye, ¿quedamos para un café esta semana?' },
        ],
        choices: [
          { en: "I'm down. Thursday?", es: 'Me apunto. ¿El jueves?', x: 'everyday-5', tone: 'natural', next: 'plan', note: '"I\'m down" = me apunto.' },
          { en: "Hmm, I'll think about it.", es: 'Mmm, me lo pensaré.', x: 'meant-2', tone: 'polite', next: 'soft', note: 'Suena a "no" educado.' },
        ],
      },
      best: {
        them: [
          { en: 'Ha! I love that. You have to tell me everything.', es: '¡Ja! Me encanta. Tienes que contármelo todo.' },
          { en: 'Coffee this week?', es: '¿Un café esta semana?' },
        ],
        choices: [
          { en: "I'm down. Thursday?", es: 'Me apunto. ¿El jueves?', x: 'everyday-5', tone: 'natural', next: 'plan', note: '"I\'m down" = me apunto.' },
          { en: "Hmm, I'll think about it.", es: 'Mmm, me lo pensaré.', x: 'meant-2', tone: 'polite', next: 'soft', note: 'Después de tanto entusiasmo, esto la desconcierta: suena a "no".' },
        ],
      },
      plan: {
        them: [
          { en: 'Perfect, Thursday it is!', es: '¡Perfecto, el jueves entonces!' },
          { en: "Anyway, I'll let you go. My coffee's ready.", es: 'Bueno, te dejo, que ya tengo mi café.', x: 'everyday-4', note: '"I\'ll let you go" cierra la charla con amabilidad: no te está echando.' },
        ],
        end: 'Habéis quedado. Respuesta natural, plan cerrado y despedida típica.',
      },
      soft: {
        them: [
          { en: 'Oh... okay. No worries!', es: 'Ah... vale. ¡No pasa nada!', x: 'meant-3', note: 'Su "No worries" es educado, pero ha notado tu poco interés.' },
          { en: "Anyway, I'll let you go.", es: 'Bueno, te dejo.', x: 'everyday-4' },
        ],
        end: 'La conversación se ha enfriado: "I\'ll think about it" se lee como un no. Prueba otra ruta.',
      },
    },
  },
  {
    id: 'friends-tea',
    cat: 'Friends & relationships',
    title: 'Big news in the group chat',
    setup: 'Sam, tu amigo, te llama con un cotilleo sobre su compañera de trabajo Mia.',
    partner: { name: 'Sam', role: 'friend' },
    start: 'a',
    turns: {
      a: {
        them: [
          { en: 'Okay, I have news. Big news.', es: 'Vale, tengo noticias. Noticias gordas.' },
          { en: "Promise you won't tell anyone?", es: '¿Prometes no contárselo a nadie?' },
        ],
        choices: [
          { en: 'Okay, spill the tea.', es: 'Venga, suelta el cotilleo.', x: 'friends-1', tone: 'natural', next: 'story', note: '"Spill the tea" = contar el cotilleo. Muy de redes y de amigos.' },
          { en: "Do I have to? I'm not taking sides.", es: '¿Tengo que oírlo? Yo no me meto.', x: 'friends-3', tone: 'honest', next: 'sides', note: '"I\'m not taking sides" = no me pongo de parte de nadie.' },
          { en: 'Is this about Mia again?', es: '¿Es otra vez sobre Mia?', tone: 'natural', next: 'story', note: '"Again" deja claro que no es la primera vez.' },
        ],
      },
      sides: {
        them: [{ en: "I'm not asking you to take sides! Just listen, okay?", es: '¡No te pido que te pongas de mi parte! Solo escucha, ¿vale?' }],
        choices: [{ en: 'Fine. Spill the tea.', es: 'Vale. Suelta el cotilleo.', x: 'friends-1', tone: 'natural', next: 'story', note: 'Has puesto un límite y aun así escuchas: muy natural.' }],
      },
      story: {
        them: [
          { en: 'Mia told the whole office that skipping the client meeting was my idea.', es: 'Mia le ha dicho a toda la oficina que saltarnos la reunión con el cliente fue idea mía.' },
          { en: 'It was HER idea!', es: '¡Fue idea SUYA!' },
        ],
        choices: [
          { en: 'Wow. She threw you under the bus.', es: 'Vaya. Te echó la culpa para salvarse ella.', x: 'friends-2', tone: 'natural', next: 'support', note: '"Throw someone under the bus" = sacrificar a alguien para salvarte tú.' },
          { en: 'No offense, but you did agree to it.', es: 'No te ofendas, pero tú también estuviste de acuerdo.', x: 'friends-4', tone: 'honest', next: 'honest', note: '"No offense, but..." avisa de que viene una crítica. Úsalo con cuidado.' },
          { en: "Plot twist: I already knew.", es: 'Giro inesperado: ya lo sabía.', x: 'plottwists-1', tone: 'bold', next: 'twist', note: '"Plot twist" se usa en broma para algo que nadie esperaba.' },
        ],
      },
      support: {
        them: [{ en: 'Right?! Thank you. I knew you would get it.', es: '¿¡Verdad!? Gracias. Sabía que lo entenderías.' }],
        end: 'Le has dado la razón con una expresión muy precisa. Sam se siente escuchado.',
      },
      honest: {
        them: [
          { en: "Ugh. Okay, fair. I did say 'sure, why not'.", es: 'Uf. Vale, es verdad. Dije "claro, ¿por qué no?".' },
          { en: 'Read the room next time, though.', es: 'Pero la próxima vez, pilla el ambiente.', x: 'friends-5', note: '"Read the room" = date cuenta del ambiente. Te está diciendo que no era el momento.' },
        ],
        end: 'Sinceridad con "No offense, but...". Funciona, pero a Sam le ha escocido.',
      },
      twist: {
        them: [
          { en: 'WHAT? How?!', es: '¿¡QUÉ!? ¿¡Cómo!?' },
          { en: 'Okay, the plot thickens.', es: 'Vale, esto se pone interesante.', x: 'plottwists-3', note: '"The plot thickens" = la cosa se complica (o se pone interesante).' },
        ],
        end: 'Le has dado la vuelta a la historia. Conversación divertida y muy natural.',
      },
    },
  },
  {
    id: 'work-monday',
    cat: 'Work situations',
    title: 'Five minutes before the call',
    setup: 'Dana, tu jefa de equipo, te pregunta por el presupuesto antes de una llamada con el cliente.',
    partner: { name: 'Dana', role: 'team lead' },
    start: 'a',
    turns: {
      a: {
        them: [{ en: 'Quick question before the call: did the client approve the budget?', es: 'Una pregunta rápida antes de la llamada: ¿aprobó el cliente el presupuesto?' }],
        choices: [
          { en: "Not yet. I'll loop you in when they reply.", es: 'Todavía no. Te pongo al tanto cuando respondan.', x: 'office-3', tone: 'natural', next: 'timeline', note: '"Loop someone in" = mantener a alguien informado. Profesional y amable.' },
          { en: 'Per my last email, they approved it on Friday.', es: 'Como dije en mi último correo, lo aprobaron el viernes.', x: 'office-2', tone: 'sarcastic', next: 'cold', note: '"Per my last email" suena a "ya te lo dije": pasivo-agresivo.' },
          { en: "That's above my pay grade, honestly.", es: 'Eso no me toca decidirlo a mí, la verdad.', x: 'office-4', tone: 'honest', next: 'paygrade', note: '"Above my pay grade" = no es mi decisión (con un toque de humor).' },
        ],
      },
      cold: {
        them: [
          { en: 'Oh. Right. Thanks for the... reminder.', es: 'Ah. Claro. Gracias por el... recordatorio.', note: 'Dana ha captado el tono. Su "thanks" también es seco.' },
          { en: 'Anyway, can we finish by Friday?', es: 'En fin, ¿podemos terminar para el viernes?' },
        ],
        choices: [
          { en: "Let's circle back on that after the call.", es: 'Lo retomamos después de la llamada.', x: 'office-1', tone: 'natural', next: 'circle', note: '"Circle back" = volver a hablarlo más tarde. Muy de oficina.' },
          { en: "Honestly? I'm still on the fence.", es: '¿Sinceramente? Aún no lo tengo claro.', x: 'idioms-1', tone: 'honest', next: 'fence', note: '"On the fence" = indeciso.' },
        ],
      },
      paygrade: {
        them: [
          { en: "Fair. I'll ask Mark.", es: 'Es justo. Se lo preguntaré a Mark.' },
          { en: 'Can we at least finish by Friday?', es: '¿Al menos podemos terminar para el viernes?' },
        ],
        choices: [
          { en: "Let's circle back on that after the call.", es: 'Lo retomamos después de la llamada.', x: 'office-1', tone: 'natural', next: 'circle', note: '"Circle back" = volver a hablarlo más tarde.' },
          { en: "Honestly? I'm still on the fence.", es: '¿Sinceramente? Aún no lo tengo claro.', x: 'idioms-1', tone: 'honest', next: 'fence', note: '"On the fence" = indeciso.' },
        ],
      },
      timeline: {
        them: [
          { en: 'Perfect, thanks.', es: 'Perfecto, gracias.' },
          { en: 'And the timeline: can we finish by Friday?', es: 'Y los plazos: ¿podemos terminar para el viernes?' },
        ],
        choices: [
          { en: "Let's circle back on that after the call.", es: 'Lo retomamos después de la llamada.', x: 'office-1', tone: 'natural', next: 'circle', note: '"Circle back" = volver a hablarlo más tarde.' },
          { en: "Honestly? I'm still on the fence.", es: '¿Sinceramente? Aún no lo tengo claro.', x: 'idioms-1', tone: 'honest', next: 'fence', note: '"On the fence" = indeciso.' },
        ],
      },
      circle: {
        them: [{ en: "Sounds good. Let's take this offline.", es: 'Me parece bien. Lo hablamos luego aparte.', x: 'office-5', note: '"Take this offline" = hablarlo fuera de la reunión, en privado.' }],
        end: 'Vocabulario de oficina perfecto: "loop in", "circle back", "take this offline".',
      },
      fence: {
        them: [{ en: 'Okay. Sleep on it and tell me tomorrow morning.', es: 'Vale. Consúltalo con la almohada y me dices mañana por la mañana.', x: 'twoam-5', note: '"Sleep on it" = pensarlo con calma hasta el día siguiente.' }],
        end: 'Has sido sincero y Dana te da tiempo. Conversación profesional y realista.',
      },
    },
  },
  {
    id: 'sarcasm-rain',
    cat: 'Sarcasm & irony',
    title: 'The worst Saturday ever',
    setup: 'Tu compañero de piso, Leo, te da las "buenas noticias" del día.',
    partner: { name: 'Leo', role: 'roommate' },
    start: 'a',
    turns: {
      a: {
        them: [{ en: "Bad news: it's raining, the heating's broken and the Wi-Fi is down.", es: 'Malas noticias: llueve, la calefacción está rota y no hay wifi.' }],
        choices: [
          { en: "Oh, that's just perfect.", es: 'Genial, lo que me faltaba.', x: 'sarcasm-1', tone: 'sarcastic', next: 'plan', note: 'Con tono irónico, "just perfect" significa justo lo contrario.' },
          { en: 'Tell me about it. My phone died too.', es: 'Dímelo a mí. Encima se me ha muerto el móvil.', x: 'sarcasm-3', tone: 'natural', next: 'plan', note: '"Tell me about it" = dímelo a mí (no te pide que se lo cuentes).' },
          { en: 'Thanks for the heads-up... an hour later.', es: 'Gracias por avisar... una hora tarde.', x: 'sarcasm-5', tone: 'sarcastic', next: 'late', note: '"Heads-up" = aviso. El "an hour later" lo convierte en un reproche.' },
        ],
      },
      late: {
        them: [
          { en: 'Hey, I just woke up too!', es: '¡Eh, que yo también me acabo de despertar!' },
          { en: 'Pizza and a terrible movie on my laptop?', es: '¿Pizza y una peli malísima en mi portátil?' },
        ],
        choices: [
          { en: "I'm down.", es: 'Me apunto.', x: 'everyday-5', tone: 'natural', next: 'cozy', note: '"I\'m down" = me apunto.' },
          { en: 'Way to go, genius. Your laptop has two percent battery.', es: 'Muy bien, campeón. A tu portátil le queda un dos por ciento.', x: 'sarcasm-2', tone: 'sarcastic', next: 'battery', note: '"Way to go" suele ser una felicitación... salvo con este tono.' },
        ],
      },
      plan: {
        them: [
          { en: 'I know, right? Living the dream.', es: '¿A que sí? Viviendo el sueño.', note: '"Living the dream" en este contexto es puro sarcasmo.' },
          { en: 'Pizza and a terrible movie on my laptop?', es: '¿Pizza y una peli malísima en mi portátil?' },
        ],
        choices: [
          { en: "I'm down.", es: 'Me apunto.', x: 'everyday-5', tone: 'natural', next: 'cozy', note: '"I\'m down" = me apunto.' },
          { en: 'Way to go, genius. Your laptop has two percent battery.', es: 'Muy bien, campeón. A tu portátil le queda un dos por ciento.', x: 'sarcasm-2', tone: 'sarcastic', next: 'battery', note: 'Sarcasmo entre amigos: funciona si hay confianza.' },
        ],
      },
      cozy: {
        them: [{ en: 'Plot twist: this might be the best Saturday ever.', es: 'Giro inesperado: puede que este sea el mejor sábado de la historia.', x: 'plottwists-1' }],
        end: 'Del sarcasmo al plan. Muy natural entre compañeros de piso.',
      },
      battery: {
        them: [{ en: "Could you be any more dramatic? I'll find the charger.", es: '¿Se puede ser más dramático? Ya busco el cargador.', x: 'sarcasm-4', note: '"Could you be any more...?" = ¿se te podría notar más? Sarcasmo devuelto.' }],
        end: 'Duelo de sarcasmo: los dos habéis usado la ironía como se usa de verdad.',
      },
    },
  },
  {
    id: 'awkward-names',
    cat: 'Awkward situations',
    title: 'Who are you again?',
    setup: 'En una fiesta, alguien te saluda con mucha confianza. No recuerdas su nombre.',
    partner: { name: 'Chris', role: 'someone you met once' },
    start: 'a',
    turns: {
      a: {
        them: [{ en: "Hey! Great to see you again! How's the new job?", es: '¡Hola! ¡Qué alegría verte otra vez! ¿Qué tal el trabajo nuevo?' }],
        choices: [
          { en: "Great, thanks! I'm so sorry, I'm terrible with names.", es: '¡Genial, gracias! Perdona, soy fatal con los nombres.', x: 'awkward-2', tone: 'honest', next: 'name', note: 'Admitirlo con humor es lo más natural (y lo más elegante).' },
          { en: 'Great, thanks... Kevin, right?', es: 'Genial, gracias... Kevin, ¿no?', tone: 'awkward', next: 'wrong', note: 'Arriesgado: si fallas el nombre, la situación empeora.' },
          { en: 'Sorry, I totally zoned out. What did you say?', es: 'Perdona, me he quedado en las nubes. ¿Qué decías?', x: 'awkward-5', tone: 'natural', next: 'zoned', note: '"Zone out" = desconectar un momento.' },
        ],
      },
      name: {
        them: [
          { en: "Ha, no worries! It's Chris. We met at Ana's birthday.", es: '¡Ja, no pasa nada! Soy Chris. Nos conocimos en el cumpleaños de Ana.' },
        ],
        choices: [
          { en: "Right! Ana's birthday. Well, this is awkward.", es: '¡Claro! El cumple de Ana. Bueno, esto es incómodo.', x: 'awkward-1', tone: 'natural', next: 'laugh', note: '"Well, this is awkward" se dice para reírse de la situación.' },
          { en: 'My bad! Chris, of course.', es: '¡Culpa mía! Chris, claro.', x: 'awkward-3', tone: 'natural', next: 'fine', note: '"My bad" = culpa mía. Informal y ligero.' },
        ],
      },
      wrong: {
        them: [
          { en: "It's Chris. Kevin is my brother.", es: 'Soy Chris. Kevin es mi hermano.' },
          { en: 'Well... this is awkward.', es: 'Bueno... esto es incómodo.', x: 'awkward-1' },
        ],
        choices: [
          { en: 'My bad! Chris, of course.', es: '¡Culpa mía! Chris, claro.', x: 'awkward-3', tone: 'natural', next: 'fine', note: 'Reconocerlo rápido quita hierro.' },
          { en: "I didn't see that coming.", es: 'No me lo esperaba para nada.', x: 'plottwists-2', tone: 'bold', next: 'laugh', note: 'Con humor, convierte el error en anécdota.' },
        ],
      },
      zoned: {
        them: [
          { en: 'Ha, I asked about the new job.', es: 'Ja, te preguntaba por el trabajo nuevo.' },
          { en: 'Did I catch you at a bad time?', es: '¿Te pillo en mal momento?', x: 'awkward-4', note: '"Catch someone at a bad time" = pillar a alguien en mal momento.' },
        ],
        choices: [
          { en: "Not at all! I'm so sorry, I'm terrible with names.", es: '¡Para nada! Perdona, soy fatal con los nombres.', x: 'awkward-2', tone: 'honest', next: 'name', note: 'Aprovechas para confesarlo con naturalidad.' },
          { en: 'Kind of. Can we talk later?', es: 'Un poco. ¿Hablamos luego?', tone: 'polite', next: 'later', note: 'Educado y directo: cierra la conversación sin drama.' },
        ],
      },
      laugh: {
        them: [{ en: "Ha! Don't worry, it happens to everyone.", es: '¡Ja! No te preocupes, nos pasa a todos.' }],
        end: 'Has convertido un momento incómodo en una risa. Exactamente así se hace.',
      },
      fine: {
        them: [{ en: 'No worries at all! So, the new job?', es: '¡No pasa nada! Bueno, ¿y el trabajo nuevo?', x: 'meant-3' }],
        end: 'Error reconocido y conversación recuperada. Muy natural.',
      },
      later: {
        them: [{ en: 'Sure, no rush! Catch you later.', es: '¡Claro, sin prisa! Luego nos vemos.' }],
        end: 'Salida educada. A veces lo natural es dejarlo para luego.',
      },
    },
  },
  {
    id: 'dating-second',
    cat: 'Dating',
    title: 'End of the second date',
    setup: 'Fin de la segunda cita con Jordan. Os despedís en la puerta del restaurante.',
    partner: { name: 'Jordan', role: 'date' },
    start: 'a',
    turns: {
      a: {
        them: [{ en: "So... I've had a really good time tonight.", es: 'Bueno... me lo he pasado muy bien esta noche.' }],
        choices: [
          { en: 'Me too. Are you always this charming, or is it just me?', es: 'Yo también. ¿Siempre eres así de encantador o es solo conmigo?', x: 'dating-4', tone: 'bold', next: 'flirt', note: 'Coqueteo con humor: halaga sin ponerse intenso.' },
          { en: "Me too. But honestly, I'm not looking for anything serious.", es: 'Yo también. Pero, sinceramente, no busco nada serio.', x: 'dating-3', tone: 'honest', next: 'honest', note: 'Claro y respetuoso. Mejor decirlo pronto.' },
          { en: 'Wait, was this a date? I thought we were just talking.', es: 'Espera, ¿esto era una cita? Pensaba que solo nos estábamos conociendo.', x: 'dating-1', tone: 'awkward', next: 'confused', note: '"We\'re just talking" = nos estamos conociendo, sin etiqueta.' },
        ],
      },
      flirt: {
        them: [
          { en: 'Ha! Only on Thursdays.', es: '¡Ja! Solo los jueves.' },
          { en: 'Want to do this again next week?', es: '¿Repetimos la semana que viene?' },
        ],
        choices: [
          { en: "I'm down.", es: 'Me apunto.', x: 'everyday-5', tone: 'natural', next: 'yes', note: '"I\'m down" = me apunto.' },
          { en: 'I need to sleep on it.', es: 'Tengo que consultarlo con la almohada.', x: 'twoam-5', tone: 'polite', next: 'maybe', note: 'Después de coquetear, suena frío: transmite duda.' },
        ],
      },
      honest: {
        them: [
          { en: 'Okay... I appreciate you being honest.', es: 'Vale... te agradezco que seas sincero.' },
          { en: 'Friends, then?', es: '¿Amigos, entonces?' },
        ],
        choices: [
          { en: 'Friends. No offense, but your playlist is a crime.', es: 'Amigos. No te ofendas, pero tu playlist es un delito.', x: 'friends-4', tone: 'bold', next: 'friends', note: 'Rompe la tensión con humor.' },
          { en: 'I think we want different things.', es: 'Creo que buscamos cosas distintas.', x: 'dating-5', tone: 'honest', next: 'part', note: 'Frase de despedida definitiva y educada.' },
        ],
      },
      confused: {
        them: [
          { en: 'Well, plot twist: I thought it was a date.', es: 'Bueno, giro inesperado: yo pensaba que era una cita.', x: 'plottwists-1' },
          { en: 'Want to make it one?', es: '¿Quieres que lo sea?' },
        ],
        choices: [
          { en: "I'm down.", es: 'Me apunto.', x: 'everyday-5', tone: 'natural', next: 'yes', note: 'Giro con final feliz.' },
          { en: "I'm still on the fence.", es: 'Todavía no lo tengo claro.', x: 'idioms-1', tone: 'honest', next: 'maybe', note: '"On the fence" = indeciso.' },
        ],
      },
      yes: {
        them: [{ en: "Great. It's a date. A real one this time.", es: 'Genial. Es una cita. Una de verdad esta vez.' }],
        end: 'Habrá tercera cita. Coqueteo natural y respuesta clara.',
      },
      maybe: {
        them: [{ en: "Okay... no rush. Text me when you've figured it out.", es: 'Vale... sin prisa. Escríbeme cuando lo tengas claro.', x: 'idioms-3' }],
        end: 'Has dejado la puerta entreabierta. Honesto, aunque menos emocionante.',
      },
      friends: {
        them: [{ en: "Rude! But fair. Friends it is.", es: '¡Qué borde! Pero es verdad. Amigos, entonces.' }],
        end: 'Despedida sincera con humor. Muy natural.',
      },
      part: {
        them: [{ en: 'Yeah. I get it. Take care, okay?', es: 'Ya. Lo entiendo. Cuídate, ¿vale?' }],
        end: 'Final claro y respetuoso: "We want different things" cierra sin herir.',
      },
    },
  },
  {
    id: 'everyday-coffee',
    cat: 'Everyday American English',
    title: 'Ordering at a coffee shop',
    setup: 'Primera mañana en Nueva York. Pides en una cafetería con prisa y mucha gente.',
    partner: { name: 'Taylor', role: 'barista' },
    start: 'a',
    turns: {
      a: {
        them: [{ en: 'Hi there! What can I get started for you?', es: '¡Hola! ¿Qué te pongo?', note: '"What can I get started for you?" es la fórmula típica de las cafeterías de EE. UU.' }],
        choices: [
          { en: 'Can I get a large latte, please?', es: '¿Me pones un latte grande, por favor?', tone: 'natural', next: 'order', note: '"Can I get...?" es la forma natural de pedir en EE. UU.' },
          { en: 'I want a coffee big.', es: 'Quiero un café grande.', tone: 'awkward', next: 'calque', note: 'Calco: "I want" suena brusco y el adjetivo va delante: "a large coffee".' },
          { en: "I'll have a large latte, please.", es: 'Tomaré un latte grande, por favor.', tone: 'polite', next: 'order', note: '"I\'ll have..." también es natural y educado.' },
        ],
      },
      calque: {
        them: [
          { en: 'A large coffee? Sure thing!', es: '¿Un café grande? ¡Claro!', note: 'Te ha entendido y lo ha reformulado: "a large coffee".' },
          { en: "Anything else? We've got fresh muffins.", es: '¿Algo más? Tenemos magdalenas recién hechas.' },
        ],
        choices: [
          { en: "I'm good, thanks.", es: 'Nada más, gracias.', x: 'everyday-2', tone: 'natural', next: 'pay', note: '"I\'m good" aquí significa "no, gracias".' },
          { en: 'Treat yourself, right? One muffin, please.', es: 'Hay que darse un capricho, ¿no? Una magdalena, por favor.', x: 'maincharacter-4', tone: 'bold', next: 'pay', note: '"Treat yourself" = date un capricho.' },
        ],
      },
      order: {
        them: [
          { en: 'Sure thing!', es: '¡Claro!' },
          { en: "Anything else? We've got fresh muffins.", es: '¿Algo más? Tenemos magdalenas recién hechas.' },
        ],
        choices: [
          { en: "I'm good, thanks.", es: 'Nada más, gracias.', x: 'everyday-2', tone: 'natural', next: 'pay', note: '"I\'m good" aquí significa "no, gracias".' },
          { en: 'Treat yourself, right? One muffin, please.', es: 'Hay que darse un capricho, ¿no? Una magdalena, por favor.', x: 'maincharacter-4', tone: 'bold', next: 'pay', note: '"Treat yourself" = date un capricho.' },
        ],
      },
      pay: {
        them: [{ en: "That'll be six fifty. Can I get a name for the order?", es: 'Son seis cincuenta. ¿Me dices un nombre para el pedido?' }],
        choices: [
          { en: "It's Sam. Sorry, I'm running late. How long will it be?", es: 'Sam. Perdona, voy con prisa. ¿Cuánto tardará?', x: 'everyday-1', tone: 'natural', next: 'fast', note: '"I\'m running late" = voy con retraso.' },
          { en: "It's Sam. Keep the change!", es: 'Sam. ¡Quédate el cambio!', tone: 'polite', next: 'tip', note: '"Keep the change" = quédate con la vuelta.' },
        ],
      },
      fast: {
        them: [{ en: 'Two minutes, tops. No worries!', es: 'Dos minutos como mucho. ¡No te preocupes!', x: 'meant-3' }],
        end: 'Pedido completo en inglés americano real: "Can I get...", "I\'m good", "running late".',
      },
      tip: {
        them: [{ en: 'Aw, thank you! Have a good one!', es: '¡Ay, gracias! ¡Que vaya bien!', note: '"Have a good one" = que vaya bien. Despedida muy americana.' }],
        end: 'Educado y natural. "Have a good one" lo oirás en todas partes.',
      },
    },
  },
];

/** Expression ids used anywhere in a dialogue. */
export function expressionsIn(d: Dialogue): string[] {
  const ids = new Set<string>();
  for (const t of Object.values(d.turns)) {
    t.them.forEach((l) => l.x && ids.add(l.x));
    t.choices?.forEach((c) => c.x && ids.add(c.x));
  }
  return [...ids];
}

/** Number of different routes (start → end) in a dialogue. */
export function routesIn(d: Dialogue): number {
  const count = (id: string, seen: Set<string>): number => {
    const t = d.turns[id];
    if (!t?.choices?.length || seen.has(id)) return 1;
    return t.choices.reduce((a, c) => a + count(c.next, new Set(seen).add(id)), 0);
  };
  return count(d.start, new Set());
}

import type { PersonalKey, PetSliders, PetSpecies } from './types'
import type { Mood } from './pipa'

/** A phrase in both languages; `t` tags it so the sliders can favour it (a = affectionate, m = mischievous). */
export interface Say { ca: string; es: string; t?: 'a' | 'm' }

export interface SpeciesDef {
  id: PetSpecies
  ca: { name: string; desc: string }
  es: { name: string; desc: string }
  /** Starting values of the four sliders for this species. */
  sliders: PetSliders
  /** Multipliers on how often it does each move (on top of the sliders). */
  bias: Partial<Record<Mood, number>>
  /** Moves this species never does. */
  skip: Mood[]
  /** Prop shown during the species' signature move ("special"). */
  prop: string
  /** What it says when touched / out of the blue (species flavour). */
  tocar: Say[]
  sola: Say[]
}

const NO_DOG: Mood[] = ['bone', 'howl']

export const SPECIES: Record<PetSpecies, SpeciesDef> = {
  poodle: {
    id: 'poodle',
    ca: { name: 'Caniche', desc: 'Joguina, afectuosa i xerraire. Sempre vol jugar.' },
    es: { name: 'Caniche', desc: 'Juguetona, cariñosa y parlanchina. Siempre quiere jugar.' },
    sliders: { energy: 65, affection: 80, mischief: 50, chatty: 60 },
    bias: { special: 0 }, skip: [], prop: '',
    tocar: [], sola: [],
  },
  cat: {
    id: 'cat',
    ca: { name: 'Gat', desc: 'Independent i dorment. T’estima, però a la seva manera.' },
    es: { name: 'Gato', desc: 'Independiente y dormilón. Te quiere, pero a su manera.' },
    sliders: { energy: 35, affection: 40, mischief: 70, chatty: 40 },
    bias: { sleep: 2, lie: 1.6, scratch: 1.6, run: 0.6, dance: 0.4, special: 1.4 },
    skip: [...NO_DOG, 'beg', 'wave'], prop: '🧶',
    tocar: [
      { ca: 'Miau.', es: 'Miau.' }, { ca: 'Prrrr…', es: 'Prrrr…', t: 'a' },
      { ca: 'Ara no, estic ocupat mirant el no-res.', es: 'Ahora no, estoy ocupado mirando la nada.', t: 'm' },
      { ca: 'Em deixes caure coses de la taula? Ho faig jo.', es: '¿Te tiro cosas de la mesa? Lo hago yo.', t: 'm' },
      { ca: 'Et permeto una carícia. Només una.', es: 'Te permito una caricia. Solo una.', t: 'a' },
      { ca: 'Sóc el cap d’aquesta casa.', es: 'Soy el jefe de esta casa.' },
    ],
    sola: [
      { ca: 'Hi ha una caixa buida? Em sembla que hi cabo.', es: '¿Hay una caja vacía? Creo que cabo.', t: 'm' },
      { ca: 'Tinc gana. Sempre tinc gana.', es: 'Tengo hambre. Siempre tengo hambre.' },
      { ca: 'Què miro? Allò. No ho veus? Ah.', es: '¿Qué miro? Eso. ¿No lo ves? Ah.', t: 'm' },
      { ca: 'Dormiré una mica. O molt.', es: 'Dormiré un poco. O mucho.' },
      { ca: 'T’estimo, però no ho diguis a ningú.', es: 'Te quiero, pero no se lo digas a nadie.', t: 'a' },
    ],
  },
  rabbit: {
    id: 'rabbit',
    ca: { name: 'Conill', desc: 'Nerviós, saltiró i molt dolç. Adora les pastanagues.' },
    es: { name: 'Conejo', desc: 'Nervioso, saltarín y muy dulce. Adora las zanahorias.' },
    sliders: { energy: 70, affection: 55, mischief: 45, chatty: 30 },
    bias: { hop: 2.4, run: 1.4, dig: 1.6, special: 1.5, roll: 0.5 },
    skip: [...NO_DOG, 'howl', 'wave'], prop: '🥕',
    tocar: [
      { ca: 'Squeak!', es: '¡Squeak!' }, { ca: 'He sentit alguna cosa… ah, eres tu.', es: 'He oído algo… ah, eres tú.' },
      { ca: 'Tens una pastanaga? Per casualitat?', es: '¿Tienes una zanahoria? ¿Por casualidad?', t: 'm' },
      { ca: 'Mou el nas amb mi!', es: '¡Mueve la nariz conmigo!', t: 'a' },
      { ca: 'Boing boing!', es: '¡Boing boing!', t: 'm' },
    ],
    sola: [
      { ca: 'Em fa gràcia cavar forats.', es: 'Me hace gracia cavar agujeros.', t: 'm' },
      { ca: 'Zanahoria? Zanahoria!', es: '¿Zanahoria? ¡Zanahoria!' },
      { ca: 'Sóc petit però molt valent.', es: 'Soy pequeño pero muy valiente.' },
      { ca: 'Un abraçadeta suau?', es: '¿Un abrazo suave?', t: 'a' },
    ],
  },
  penguin: {
    id: 'penguin',
    ca: { name: 'Pingüí', desc: 'Elegant i tendre. Camina com si anés a una gala.' },
    es: { name: 'Pingüino', desc: 'Elegante y tierno. Camina como si fuera a una gala.' },
    sliders: { energy: 45, affection: 70, mischief: 40, chatty: 55 },
    bias: { run: 0.4, dance: 1.6, bow: 1.8, special: 1.5, dig: 0.4, roll: 0.5 },
    skip: [...NO_DOG, 'scratch', 'butterfly'], prop: '🐟',
    tocar: [
      { ca: 'Noot noot!', es: '¡Noot noot!' }, { ca: 'Vas bé de smoking?', es: '¿Vas bien de esmoquin?', t: 'm' },
      { ca: 'Fa fred? A mi no. Bé, una mica.', es: '¿Hace frío? A mí no. Bueno, un poco.' },
      { ca: 'Et faig una reverència elegant.', es: 'Te hago una reverencia elegante.', t: 'a' },
      { ca: 'Deslizarse en panxa és l’esport rei.', es: 'Deslizarse de barriga es el deporte rey.', t: 'm' },
    ],
    sola: [
      { ca: 'M’apuntaria a un peix. O dos.', es: 'Me apuntaría a un pescado. O dos.' },
      { ca: 'Xafem una mica de gel? Imaginari.', es: '¿Pisamos un poco de hielo? Imaginario.', t: 'm' },
      { ca: 'Què bé que estiguem junts.', es: 'Qué bien que estemos juntos.', t: 'a' },
      { ca: 'Camino amb molta dignitat, eh.', es: 'Camino con mucha dignidad, ¿eh?' },
    ],
  },
  fox: {
    id: 'fox',
    ca: { name: 'Guineu', desc: 'Astuta i trapella. Sempre en prepara alguna.' },
    es: { name: 'Zorro', desc: 'Astuto y travieso. Siempre prepara alguna.' },
    sliders: { energy: 75, affection: 45, mischief: 85, chatty: 60 },
    bias: { run: 1.6, sniff: 1.6, dig: 1.6, special: 1.8, leave: 1.5 },
    skip: ['bone', 'wave'], prop: '🐭',
    tocar: [
      { ca: 'Yip!', es: '¡Yip!' }, { ca: 'Ssh. Estic ideant un pla.', es: 'Ssh. Estoy ideando un plan.', t: 'm' },
      { ca: 'Qui, jo? Mai he fet res.', es: '¿Quién, yo? Nunca he hecho nada.', t: 'm' },
      { ca: 'Em sembla que m’he menjat alguna cosa teva…', es: 'Creo que me he comido algo tuyo…', t: 'm' },
      { ca: 'Tinc la cua més bonica del món, oi?', es: 'Tengo la cola más bonita del mundo, ¿verdad?', t: 'a' },
    ],
    sola: [
      { ca: 'Algú ha dit gallina?', es: '¿Alguien ha dicho gallina?', t: 'm' },
      { ca: 'Sóc més llest que tu. Però t’estimo.', es: 'Soy más listo que tú. Pero te quiero.', t: 'a' },
      { ca: 'Hi ha secrets al jardí, ho sé.', es: 'Hay secretos en el jardín, lo sé.', t: 'm' },
      { ca: 'Ensumo problemes. I també formatge.', es: 'Huelo problemas. Y también queso.' },
    ],
  },
  panda: {
    id: 'panda',
    ca: { name: 'Panda', desc: 'Calmat, golafre i molt mimós. Viu a ritme panda.' },
    es: { name: 'Panda', desc: 'Calmado, glotón y muy mimoso. Vive a ritmo panda.' },
    sliders: { energy: 20, affection: 75, mischief: 30, chatty: 35 },
    bias: { sleep: 1.8, lie: 1.8, roll: 2, tummy: 1.8, run: 0.3, dance: 0.4, special: 2 },
    skip: [...NO_DOG, 'dig', 'wave'], prop: '🎋',
    tocar: [
      { ca: 'Mmm… bambú…', es: 'Mmm… bambú…' }, { ca: 'Una abraçada de panda?', es: '¿Un abrazo de panda?', t: 'a' },
      { ca: 'Vaig lent perquè gaudeixo.', es: 'Voy lento porque disfruto.' },
      { ca: 'Rodolar és la millor manera de viatjar.', es: 'Rodar es la mejor forma de viajar.', t: 'm' },
      { ca: 'Quina calma, quina calma…', es: 'Qué calma, qué calma…' },
    ],
    sola: [
      { ca: 'Mastegar és meditar.', es: 'Masticar es meditar.' },
      { ca: 'Em faria una becaina de dues hores.', es: 'Me echaría una siesta de dos horas.' },
      { ca: 'Tu ets el meu bambú preferit.', es: 'Tú eres mi bambú preferido.', t: 'a' },
      { ca: 'Una rodoleta i seguim.', es: 'Una voltereta y seguimos.', t: 'm' },
    ],
  },
  turtle: {
    id: 'turtle',
    ca: { name: 'Tortuga', desc: 'Savia i tranquil·la. Té tot el temps del món.' },
    es: { name: 'Tortuga', desc: 'Sabia y tranquila. Tiene todo el tiempo del mundo.' },
    sliders: { energy: 5, affection: 50, mischief: 15, chatty: 25 },
    bias: { sleep: 1.5, sit: 2, run: 0, hop: 0, dance: 0.2, play: 0.3, special: 2 },
    skip: [...NO_DOG, 'chase', 'roll', 'scratch', 'butterfly', 'tummy', 'hop', 'run', 'wave'], prop: '🥬',
    tocar: [
      { ca: 'Hola… amb… calma…', es: 'Hola… con… calma…' }, { ca: 'Tot arriba a qui sap esperar.', es: 'Todo llega a quien sabe esperar.' },
      { ca: 'Em fas pessigolles a la closca.', es: 'Me haces cosquillas en el caparazón.', t: 'a' },
      { ca: 'Em sembla que em faré una migdiada dins la closca.', es: 'Creo que me echaré una siesta en el caparazón.', t: 'm' },
    ],
    sola: [
      { ca: 'Tinc 100 anys, o potser són 5.', es: 'Tengo 100 años, o quizá son 5.', t: 'm' },
      { ca: 'Poc a poc s’arriba lluny.', es: 'Poco a poco se llega lejos.' },
      { ca: 'Beure aigua amb calma també compta.', es: 'Beber agua con calma también cuenta.' },
      { ca: 'Em quedo amb tu, no corro enlloc.', es: 'Me quedo contigo, no corro a ningún sitio.', t: 'a' },
    ],
  },
  owl: {
    id: 'owl',
    ca: { name: 'Mussol', desc: 'Observador i savi. De nit està més despert que mai.' },
    es: { name: 'Búho', desc: 'Observador y sabio. De noche está más despierto que nunca.' },
    sliders: { energy: 30, affection: 35, mischief: 40, chatty: 70 },
    bias: { sit: 2.2, sleep: 0.6, run: 0.3, special: 1.8, dance: 0.4, roll: 0.3 },
    skip: [...NO_DOG, 'chase', 'roll', 'dig', 'scratch', 'tummy', 'beg', 'wave'], prop: '🌙',
    tocar: [
      { ca: 'Uuuh uuuh!', es: '¡Uuuh uuuh!' }, { ca: 'Ho veig tot. Tot.', es: 'Lo veo todo. Todo.', t: 'm' },
      { ca: 'Una dada curiosa: respirar és important.', es: 'Un dato curioso: respirar es importante.' },
      { ca: 'Giro el cap molt, però no m’emmarejo.', es: 'Giro mucho la cabeza, pero no me mareo.', t: 'm' },
      { ca: 'Compte amb el que dius: t’escolto.', es: 'Cuidado con lo que dices: te escucho.', t: 'a' },
    ],
    sola: [
      { ca: 'Els millors pensaments arriben de matinada.', es: 'Los mejores pensamientos llegan de madrugada.' },
      { ca: 'Qui? Qui? Ah, tu.', es: '¿Quién? ¿Quién? Ah, tú.' },
      { ca: 'T’explico una història? Té molts capítols.', es: '¿Te cuento una historia? Tiene muchos capítulos.', t: 'a' },
      { ca: 'Tot això ja ho vaig predir.', es: 'Todo esto ya lo predije.', t: 'm' },
    ],
  },
  frog: {
    id: 'frog',
    ca: { name: 'Granota', desc: 'Salta, riu i fa bromes. No para quieta.' },
    es: { name: 'Rana', desc: 'Salta, ríe y hace bromas. No para quieta.' },
    sliders: { energy: 70, affection: 40, mischief: 60, chatty: 65 },
    bias: { hop: 3, run: 0.4, play: 1.5, special: 1.8, dance: 1.4 },
    skip: [...NO_DOG, 'scratch', 'tummy', 'beg', 'wave', 'run'], prop: '🪰',
    tocar: [
      { ca: 'Cuac! No, croac!', es: '¡Cuac! No, ¡croac!', t: 'm' }, { ca: 'Croac croac!', es: '¡Croac croac!' },
      { ca: 'Em fas pessigolles!', es: '¡Me haces cosquillas!', t: 'a' },
      { ca: 'Salto i salto i salto!', es: '¡Salto y salto y salto!', t: 'm' },
      { ca: 'Aquesta mosca em mira malament.', es: 'Esa mosca me mira mal.', t: 'm' },
    ],
    sola: [
      { ca: 'Si em fas un petó no em converteixo en príncep.', es: 'Si me das un beso no me convierto en príncipe.', t: 'm' },
      { ca: 'Plou? Fantàstic!', es: '¿Llueve? ¡Fantástico!' },
      { ca: 'Una mosqueta i ja sóc feliç.', es: 'Una mosquita y ya soy feliz.' },
      { ca: 'Gràcies per ser el meu bassal preferit.', es: 'Gracias por ser mi charco favorito.', t: 'a' },
    ],
  },
  dragon: {
    id: 'dragon',
    ca: { name: 'Dragonet', desc: 'Petit, valent i amb molt de foc. Una mica orgullós.' },
    es: { name: 'Dragoncito', desc: 'Pequeño, valiente y con mucho fuego. Un poco orgulloso.' },
    sliders: { energy: 85, affection: 30, mischief: 75, chatty: 55 },
    bias: { run: 1.6, play: 1.4, special: 2, dance: 1.2, sleep: 0.8 },
    skip: ['bone', 'wave', 'scratch', 'beg'], prop: '🔥',
    tocar: [
      { ca: 'Grooar! (petit)', es: '¡Grooar! (pequeño)' }, { ca: 'Que no se t’acudeixi tocar-me el tresor!', es: '¡Que no se te ocurra tocar mi tesoro!', t: 'm' },
      { ca: 'Podria cremar això. Però t’estimo massa.', es: 'Podría quemar esto. Pero te quiero demasiado.', t: 'a' },
      { ca: 'Sóc temible. Mira com tremolo. De fred.', es: 'Soy temible. Mira cómo tiemblo. De frío.', t: 'm' },
      { ca: 'Una flamarada per saludar!', es: '¡Una llamarada para saludar!' },
    ],
    sola: [
      { ca: 'Alguna princesa per rescatar? Jo les rescato a elles.', es: '¿Alguna princesa que rescatar? Yo las rescato a ellas.', t: 'm' },
      { ca: 'Una mica de foc per escalfar el berenar?', es: '¿Un poco de fuego para calentar la merienda?' },
      { ca: 'Gran guardià del teu dia, aquí present.', es: 'Gran guardián de tu día, aquí presente.', t: 'a' },
      { ca: 'No és fum, és ambient.', es: 'No es humo, es ambiente.', t: 'm' },
    ],
  },
}

// ── What the pet knows about you ("personalised experience") ──

export interface Question { key: PersonalKey; ca: string; es: string; phCa: string; phEs: string }
export const QUESTIONS: Question[] = [
  { key: 'partner', ca: 'Nom de la parella', es: 'Nombre de la pareja', phCa: 'p. ex. Laura', phEs: 'p. ej. Laura' },
  { key: 'neighbour', ca: 'Nom del veí o la veïna', es: 'Nombre del vecino o la vecina', phCa: 'p. ex. Teresa', phEs: 'p. ej. Teresa' },
  { key: 'friend', ca: 'Nom d’un bon amic o amiga', es: 'Nombre de un buen amigo o amiga', phCa: 'p. ex. Marc', phEs: 'p. ej. Marc' },
  { key: 'series', ca: 'Sèrie preferida', es: 'Serie preferida', phCa: 'p. ex. Merlí', phEs: 'p. ej. Merlí' },
  { key: 'music', ca: 'Música o grup preferit', es: 'Música o grupo preferido', phCa: 'p. ex. Manel', phEs: 'p. ej. Manel' },
  { key: 'book', ca: 'Llibre preferit', es: 'Libro preferido', phCa: 'p. ex. El Petit Príncep', phEs: 'p. ej. El Principito' },
  { key: 'food', ca: 'Menjar preferit', es: 'Comida preferida', phCa: 'p. ex. pizza', phEs: 'p. ej. pizza' },
  { key: 'hobby', ca: 'Afició preferida', es: 'Afición preferida', phCa: 'p. ex. caminar', phEs: 'p. ej. caminar' },
  { key: 'city', ca: 'Ciutat o poble on vius', es: 'Ciudad o pueblo donde vives', phCa: 'p. ex. Girona', phEs: 'p. ej. Girona' },
]

/** Phrase templates using the answers; only those whose answer exists are offered. */
export const PERSONAL: { key: PersonalKey; ca: string; es: string; t?: 'a' | 'm' }[] = [
  { key: 'partner', ca: 'Com està {v}? Dona-li una abraçada de part meva.', es: '¿Cómo está {v}? Dale un abrazo de mi parte.', t: 'a' },
  { key: 'partner', ca: '{v} es mereix un massatge, oi?', es: '{v} se merece un masaje, ¿verdad?', t: 'a' },
  { key: 'partner', ca: 'Ei, i si fem una sorpresa a {v}?', es: 'Eh, ¿y si le hacemos una sorpresa a {v}?', t: 'm' },
  { key: 'neighbour', ca: 'Crec que {v} m’ha mirat estrany.', es: 'Creo que {v} me ha mirado raro.', t: 'm' },
  { key: 'neighbour', ca: 'T’has creuat avui amb {v}?', es: '¿Te has cruzado hoy con {v}?' },
  { key: 'neighbour', ca: '{v} diu que demà plourà. Ho sap tot.', es: '{v} dice que mañana lloverá. Lo sabe todo.' },
  { key: 'friend', ca: 'Fa dies que no sé res de {v}. Truca’l!', es: 'Hace días que no sé nada de {v}. ¡Llámale!', t: 'a' },
  { key: 'series', ca: 'Quin capítol toca avui de {v}?', es: '¿Qué capítulo toca hoy de {v}?' },
  { key: 'series', ca: 'No m’expliquis el final de {v}!', es: '¡No me cuentes el final de {v}!', t: 'm' },
  { key: 'music', ca: 'Posa {v}! Que balli jo també.', es: '¡Pon {v}! Que baile yo también.', t: 'm' },
  { key: 'music', ca: 'Tinc una cançó de {v} al cap.', es: 'Tengo una canción de {v} en la cabeza.' },
  { key: 'book', ca: 'Quan em llegeixes un trosset de {v}?', es: '¿Cuándo me lees un trocito de {v}?', t: 'a' },
  { key: 'food', ca: 'Només de pensar en {v} em ve gana.', es: 'Solo de pensar en {v} me entra hambre.' },
  { key: 'food', ca: 'Si avui toca {v}, jo m’apunto.', es: 'Si hoy toca {v}, yo me apunto.', t: 'm' },
  { key: 'hobby', ca: 'Avui toca {v}? Jo hi vinc!', es: '¿Hoy toca {v}? ¡Yo voy!', t: 'a' },
  { key: 'hobby', ca: 'Fer {v} és bo per al cos i per a l’ànima.', es: 'Hacer {v} es bueno para el cuerpo y para el alma.' },
  { key: 'city', ca: 'A {v} aquest cel sempre és bonic.', es: 'En {v} este cielo siempre es bonito.' },
  { key: 'city', ca: 'Anem a donar una volta per {v}?', es: '¿Damos una vuelta por {v}?', t: 'a' },
]

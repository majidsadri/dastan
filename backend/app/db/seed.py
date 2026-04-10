"""Seed script with 7 days of curated art and literature content."""

import asyncio
from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.core.database import Base
from app.models.models import Painting, NovelPage, LiteratureHighlight


# ---------- DATES: rolling 7-day window ending TODAY ----------
# Regenerated each time the seeder runs so today's canvas always exists.
# DATES[6] = today, DATES[5] = yesterday, ..., DATES[0] = 6 days ago

from datetime import timedelta
_today = date.today()
DATES = [_today - timedelta(days=(6 - i)) for i in range(7)]


# ---------- PAINTINGS ----------

PAINTINGS = [
    {
        "title": "The Great Wave off Kanagawa",
        "artist": "Katsushika Hokusai",
        "year": "c. 1831",
        "origin_country": "Japan",
        "movement": "Ukiyo-e",
        "image_url": "/paintings/hokusai.jpg",
        "description": (
            "The Great Wave off Kanagawa is a woodblock print by the Japanese ukiyo-e artist "
            "Hokusai, published between 1829 and 1833 as the first print in his series "
            "Thirty-six Views of Mount Fuji. It depicts an enormous wave threatening boats "
            "off the coast of Kanagawa, with Mount Fuji rising in the background. The print "
            "is one of the most recognized works of art in the world and has profoundly "
            "influenced Western Impressionism."
        ),
        "artist_bio": (
            "Katsushika Hokusai (1760-1849) was a Japanese artist and printmaker of the Edo period. "
            "Over his career of more than seventy years, he produced a vast body of work spanning "
            "roughly 30,000 paintings, sketches, woodblock prints, and picture books. Hokusai is "
            "best known for the woodblock print series Thirty-six Views of Mount Fuji, created "
            "during the 1830s when he was in his seventies."
        ),
        "colors": ["#1A3A5C", "#2E6E8E", "#D4C5A0", "#F5F0E1", "#6B8E9B"],
        "display_date": DATES[0],
    },
    {
        "title": "The Starry Night",
        "artist": "Vincent van Gogh",
        "year": "1889",
        "origin_country": "Netherlands",
        "movement": "Post-Impressionism",
        "image_url": "/paintings/vangogh.jpg",
        "description": (
            "The Starry Night depicts the view from the east-facing window of Van Gogh's asylum "
            "room at Saint-Remy-de-Provence, with the addition of an imaginary village. The painting "
            "features a swirling night sky filled with luminous stars and a bright crescent moon. "
            "The cypress tree in the foreground reaches toward the turbulent sky like a dark flame, "
            "connecting earth and heaven in one of art history's most iconic compositions."
        ),
        "artist_bio": (
            "Vincent van Gogh (1853-1890) was a Dutch Post-Impressionist painter who posthumously "
            "became one of the most famous and influential figures in Western art history. He created "
            "about 2,100 artworks in roughly a decade, including approximately 860 oil paintings, "
            "most produced in the last two years of his life. His bold colors, dramatic brushwork, "
            "and emotional honesty contributed to the foundations of modern art."
        ),
        "colors": ["#1B2A6B", "#2D5DA1", "#E8C547", "#4A7FB5", "#0F1A3E"],
        "display_date": DATES[1],
    },
    {
        "title": "Girl with a Pearl Earring",
        "artist": "Johannes Vermeer",
        "year": "c. 1665",
        "origin_country": "Netherlands",
        "movement": "Dutch Golden Age",
        "image_url": "/paintings/vermeer.jpg",
        "description": (
            "Girl with a Pearl Earring is an oil painting by Dutch Golden Age painter Johannes "
            "Vermeer. It is a tronie\u2014a painting of an imaginary figure dressed in exotic attire. "
            "The girl wears a blue and gold turban and an unusually large pearl earring that catches "
            "the light. The painting's intimate scale and the girl's enigmatic gaze looking over her "
            "shoulder have earned it the nickname 'the Mona Lisa of the North.'"
        ),
        "artist_bio": (
            "Johannes Vermeer (1632-1675) was a Dutch Baroque Period painter who specialized in "
            "domestic interior scenes of middle-class life. He is recognized as one of the greatest "
            "painters of the Dutch Golden Age. Only about 34 paintings are attributed to him, yet "
            "his meticulous technique, brilliant use of light, and luminous colors have earned him "
            "an enduring reputation as a master of quiet, contemplative beauty."
        ),
        "colors": ["#1B2B3A", "#3B6B8C", "#D4B56A", "#8B7355", "#F0E6D0"],
        "display_date": DATES[2],
    },
    {
        "title": "The Persistence of Memory",
        "artist": "Salvador Dali",
        "year": "1931",
        "origin_country": "Spain",
        "movement": "Surrealism",
        "image_url": "/paintings/bosch.jpg",
        "description": (
            "The Persistence of Memory depicts a dreamlike landscape in which soft, melting watches "
            "drape over various surfaces. Set against a coastal backdrop of Port Lligat in Catalonia, "
            "the painting explores the fluidity and irrelevance of time in the subconscious mind. "
            "The limp watches suggest that time is not as rigid as we perceive it, while ants "
            "swarming on one watch hint at decay. It is one of the most recognizable works of "
            "Surrealist art."
        ),
        "artist_bio": (
            "Salvador Dali (1904-1989) was a Spanish Surrealist artist renowned for his technical "
            "skill, precise draftsmanship, and striking imagery. Influenced by Renaissance masters, "
            "he became best known for the dreamlike quality of his paintings. Dali's artistic "
            "repertoire included film, sculpture, and photography, and he collaborated with artists "
            "across many media including Walt Disney and Alfred Hitchcock."
        ),
        "colors": ["#C8B87C", "#5A7FA0", "#8B6914", "#D4A843", "#3A4F6A"],
        "display_date": DATES[3],
    },
    {
        "title": "The Birth of Venus",
        "artist": "Sandro Botticelli",
        "year": "c. 1485",
        "origin_country": "Italy",
        "movement": "Early Renaissance",
        "image_url": "/paintings/botticelli.jpg",
        "description": (
            "The Birth of Venus depicts the goddess Venus arriving at the shore after her birth, "
            "emerging from the sea as a fully grown woman. The composition shows the winds Zephyr "
            "and Aura blowing Venus toward the shore, where the Hora of Spring awaits with a "
            "flowered cloak. Botticelli's masterpiece represents the Neoplatonic ideal of divine "
            "beauty and is one of the most treasured works of the Italian Renaissance, housed in "
            "the Uffizi Gallery in Florence."
        ),
        "artist_bio": (
            "Sandro Botticelli (1445-1510) was an Italian painter of the Early Renaissance, part "
            "of the Florentine School under the patronage of Lorenzo de' Medici. His work represents "
            "the linear grace of the early Renaissance painting style. Botticelli was especially "
            "known for his mythological and allegorical subjects, blending classical themes with "
            "the spiritual sensibility of his era."
        ),
        "colors": ["#8FBFBF", "#D4A07A", "#E8D5B5", "#5B8C6A", "#C4956A"],
        "display_date": DATES[4],
    },
    {
        "title": "A Sunday on La Grande Jatte",
        "artist": "Georges Seurat",
        "year": "1886",
        "origin_country": "France",
        "movement": "Neo-Impressionism / Pointillism",
        "image_url": "/paintings/seurat.jpg",
        "description": (
            "A Sunday on La Grande Jatte portrays Parisians relaxing on a sunny island in the "
            "Seine River. Seurat spent over two years painting this monumental canvas, meticulously "
            "applying tiny dots of pure color in the technique known as Pointillism. The scene "
            "shows people from various social classes\u2014soldiers, families, couples, and a woman "
            "with a pet monkey\u2014frozen in a moment of leisure that is both serene and strangely "
            "formal, like figures in an ancient frieze."
        ),
        "artist_bio": (
            "Georges Seurat (1859-1891) was a French Post-Impressionist painter and draftsman who "
            "devised the painting techniques known as chromoluminarism and Pointillism. His large-scale "
            "work A Sunday on La Grande Jatte altered the direction of modern art by initiating "
            "Neo-Impressionism. Despite dying at only 31, Seurat's scientific approach to color and "
            "composition left a lasting impact on generations of artists."
        ),
        "colors": ["#4A7B3F", "#7BA665", "#D4C8A0", "#3B5E2B", "#8B7D5E"],
        "display_date": DATES[5],
    },
    {
        "title": "The Kiss",
        "artist": "Gustav Klimt",
        "year": "1907-1908",
        "origin_country": "Austria",
        "movement": "Art Nouveau / Vienna Secession",
        "image_url": "/paintings/klimt.jpg",
        "description": (
            "The Kiss depicts a couple embracing on a flowered cliff edge, their bodies enveloped "
            "in elaborate golden robes. The man's robe features geometric rectangles in black, white, "
            "and gray, while the woman's dress is decorated with circular flower motifs. The painting "
            "exemplifies Klimt's 'Golden Phase,' in which he incorporated gold leaf into his work, "
            "creating luminous surfaces that blur the boundary between painting and decorative art. "
            "It is housed in the Belvedere Museum in Vienna."
        ),
        "artist_bio": (
            "Gustav Klimt (1862-1918) was an Austrian symbolist painter and one of the most prominent "
            "members of the Vienna Secession movement. He is known for his paintings, murals, "
            "sketches, and other objets d'art, primarily distinguished by their lavish use of gold "
            "leaf and their exploration of the human form. Klimt's work fused fine art and decorative "
            "craft in a way that was revolutionary for his time."
        ),
        "colors": ["#C9A84C", "#8B6914", "#3A2F1B", "#E8D47A", "#5C4A2A"],
        "display_date": DATES[6],
    },
]


# ---------- NOVEL PAGES ----------

NOVEL_PAGES = [
    # --- Western Europe ---
    {"novel_title": "The Old Man and the Sea", "author": "Ernest Hemingway", "author_country": "USA", "page_number": 27, "total_pages": 42, "content": "He no longer dreamed of storms, nor of women, nor of great occurrences, nor of great fish, nor fights, nor contests of strength, nor of his wife. He only dreamed of places now and of the lions on the beach. They played like young cats in the dusk and he loved them as he loved the boy.\n\nWhen the sun rose he was already far out and he settled the lines and let the current carry them. He could see the phosphorescence of the Gulf weed in the water as he rowed over the part of the ocean that the fishermen called the great well.", "display_date": DATES[0]},
    {"novel_title": "Siddhartha", "author": "Hermann Hesse", "author_country": "Germany", "page_number": 29, "total_pages": 36, "content": "The river laughed. Yes, that was how it was, everything came back that had not been suffered and resolved to the end, the same sorrows were undergone again and again. But Siddhartha went into the boat and rowed back to his hut, thinking of his father, thinking of his son, laughed at by the river, quarreling with himself, inclined to despair, and inclined no less to laughing aloud at himself and the whole world.\n\n'I had to pass through so much stupidity, so much vice, so much error, so much nausea and disappointment and woe, just to become a child again and begin anew. But it was right that it should be so.'", "display_date": DATES[1]},
    {"novel_title": "The Diary of a Young Girl", "author": "Anne Frank", "author_country": "Netherlands", "page_number": 38, "total_pages": 50, "content": "It's really a wonder that I haven't dropped all my ideals, because they seem so absurd and impossible to carry out. Yet I keep them, because in spite of everything, I still believe that people are really good at heart.\n\nI simply can't build up my hopes on a foundation consisting of confusion, misery, and death. I see the world gradually being turned into a wilderness, I hear the ever approaching thunder, which will destroy us too, I can feel the sufferings of millions and yet, if I look up into the heavens, I think that it will all come right.", "display_date": DATES[2]},
    {"novel_title": "Don Quixote", "author": "Miguel de Cervantes", "author_country": "Spain", "page_number": 58, "total_pages": 126, "content": "'Freedom, Sancho, is one of the most precious gifts that heaven has bestowed upon men; no treasures that the earth holds buried or the sea conceals can compare with it; for freedom, as for honour, life may and should be ventured.'\n\nThe knight gazed at the distant windmills standing still upon the plain, their sails motionless in the calm air. In the silence between adventures, he considered that perhaps the truest quest was the one that had no end\u2014that to seek was itself the meaning.", "display_date": DATES[3]},
    {"novel_title": "The Divine Comedy", "author": "Dante Alighieri", "author_country": "Italy", "page_number": 84, "total_pages": 100, "content": "And thence we came forth to see the stars again.\n\nThe love that moves the sun and other stars was not the love of a single age but of all ages. In this final canto, the pilgrim stood at the threshold of the highest heaven, where language fails and memory surrenders.\n\nO how inadequate is speech, how feeble, to set forth my concept! Compared to what I saw, to call it little says too much. O Light Eternal, who alone abidest in Thyself, alone knowest Thyself, and known unto Thyself and knowing, lovest and smilest on Thyself!", "display_date": DATES[4]},
    {"novel_title": "Les Miserables", "author": "Victor Hugo", "author_country": "France", "page_number": 194, "total_pages": 365, "content": "He gazed at the candlesticks on the mantelpiece and said, 'The Bishop has bought my soul for God.'\n\nThere is a spectacle grander than the sea\u2014that is the sky; there is a spectacle grander than the sky\u2014that is the interior of the soul. To write the poem of the human conscience, were it only of a single man, were it only of the most infamous of men, would be to swallow up all epics in a superior and definitive epic.", "display_date": DATES[5]},
    {"novel_title": "The Metamorphosis", "author": "Franz Kafka", "author_country": "Austria-Hungary", "page_number": 8, "total_pages": 12, "content": "Was he an animal, that music could move him so? He felt as if the way to the unknown nourishment he longed for were coming to light. He was determined to push forward till he reached his sister, to pull at her skirt and so let her know that she was to come into his room with her violin, for no one here appreciated her playing as he would appreciate it.\n\nHe would never let her out of his room, at least, not so long as he lived; his frightful appearance would become, for the first time, useful to him.", "display_date": DATES[6]},
    # --- More Western Europe ---
    {"novel_title": "Crime and Punishment", "author": "Fyodor Dostoevsky", "author_country": "Russia", "page_number": 178, "total_pages": 250, "content": "'Where is it I've read that someone condemned to death says or thinks, an hour before his death, that if he had to live on some high rock, on such a narrow ledge that he'd only room to stand, and the ocean, everlasting darkness, everlasting solitude, everlasting tempest around him\u2014if he had to remain standing on a square yard of space all his life, a thousand years, eternity\u2014it were better to live so than to die at once! Only to live, to live and live! Life, whatever it may be!'", "display_date": DATES[0]},
    {"novel_title": "Anna Karenina", "author": "Leo Tolstoy", "author_country": "Russia", "page_number": 312, "total_pages": 400, "content": "Levin had been married three months. He was happy, but not at all in the way he had expected to be. At every step he found his former dreams disappointed, and new, unexpected surprises of happiness. He was happy; but on entering upon family life he saw at every step that it was utterly different from what he had imagined.\n\nAt every step he experienced what a man would experience who, after admiring the smooth, happy course of a little boat on a lake, should get himself into that little boat.", "display_date": DATES[1]},
    {"novel_title": "Pride and Prejudice", "author": "Jane Austen", "author_country": "England", "page_number": 142, "total_pages": 180, "content": "In vain I have struggled. It will not do. My feelings will not be repressed. You must allow me to tell you how ardently I admire and love you.\n\nElizabeth's astonishment was beyond expression. She stared, coloured, doubted, and was silent. This he considered sufficient encouragement; and the avowal of all that he felt, and had long felt for her, immediately followed. He spoke well; but there were feelings besides those of the heart to be detailed; and he was not more eloquent on the subject of tenderness than of pride.", "display_date": DATES[2]},
    {"novel_title": "Madame Bovary", "author": "Gustave Flaubert", "author_country": "France", "page_number": 103, "total_pages": 200, "content": "She wanted to die, but she also wanted to live in Paris. She leaned against the embrasure of the window, reading her letter with angry sneers. But the more she fixed her attention upon it, the more confused were her ideas. She saw him again, she heard him, she encircled him with her arms; and throbs of her heart, that beat against her breast like blows of a sledge-hammer, grew faster and faster, with uneven intervals.", "display_date": DATES[3]},
    {"novel_title": "In Search of Lost Time", "author": "Marcel Proust", "author_country": "France", "page_number": 47, "total_pages": 500, "content": "And suddenly the memory revealed itself. The taste was that of the little piece of madeleine which on Sunday mornings at Combray, when I went to say good morning to her in her bedroom, my aunt Leonie used to give me, dipping it first in her own cup of tea or tisane.\n\nAnd as soon as I had recognised the taste, immediately the old grey house upon the street, where her room was, rose up like a stage set, and with the house the town, the square where I was sent before lunch, the streets along which I used to run errands.", "display_date": DATES[4]},
    {"novel_title": "Wuthering Heights", "author": "Emily Bronte", "author_country": "England", "page_number": 87, "total_pages": 160, "content": "'If all else perished, and he remained, I should still continue to be; and if all else remained, and he were annihilated, the universe would turn to a mighty stranger: I should not seem a part of it. My love for Linton is like the foliage in the woods: time will change it, I'm well aware, as winter changes the trees. My love for Heathcliff resembles the eternal rocks beneath: a source of little visible delight, but necessary. Nelly, I am Heathcliff!'", "display_date": DATES[5]},
    {"novel_title": "The Trial", "author": "Franz Kafka", "author_country": "Austria-Hungary", "page_number": 52, "total_pages": 80, "content": "'No,' said the priest, 'it is not necessary to accept everything as true, one must only accept it as necessary.' 'A melancholy conclusion,' said K. 'It turns lying into a universal principle.'\n\nK. said that with finality, but it was not his final judgment. He was too tired to survey all the conclusions arising from the story, and the trains of thought into which it was leading him were unfamiliar, dealing with improbabilities better suited to a theme for discussion among court officials.", "display_date": DATES[6]},
    # --- Latin America ---
    {"novel_title": "One Hundred Years of Solitude", "author": "Gabriel Garcia Marquez", "author_country": "Colombia", "page_number": 137, "total_pages": 200, "content": "It rained for four years, eleven months, and two days. There were periods of drizzle during which everyone put on his full dress and a convalescent look to celebrate the clearing, but the people soon grew accustomed to interpret the pauses as a sign of redoubled rain.\n\nThe sky crumbled into a set of destructive storms and out of the north came hurricanes that scattered roofs about and knocked down walls and uprooted every last plant of the banana groves.", "display_date": DATES[0]},
    {"novel_title": "The Aleph", "author": "Jorge Luis Borges", "author_country": "Argentina", "page_number": 22, "total_pages": 30, "content": "I saw the Aleph from every point and angle, and in the Aleph I saw the earth and in the earth the Aleph and in the Aleph the earth. I saw my own face and my own bowels. I saw your face. I felt dizzy and wept, for my eyes had seen that secret and conjectured object whose name is common to all men but which no man has looked upon\u2014the unimaginable universe.\n\nI felt infinite wonder, infinite pity.", "display_date": DATES[1]},
    {"novel_title": "Pedro Paramo", "author": "Juan Rulfo", "author_country": "Mexico", "page_number": 34, "total_pages": 60, "content": "There was no air. You had to swallow the same air that came out of your mouth, holding it back with your hands before it left. I could feel it coming and going, less and less of it each time; until it got so thin it slipped through your fingers forever.\n\nI mean, forever. I had already been told that nothing lived in Comala, that it was a dead town, but the dead are said to talk in whispers.", "display_date": DATES[2]},
    {"novel_title": "The House of the Spirits", "author": "Isabel Allende", "author_country": "Chile", "page_number": 163, "total_pages": 250, "content": "Clara wrote in her notebooks that one must think of death as something that could happen at any moment; in this way, one could face it, and it would not take one by surprise. She had spent her whole life writing, and her notebooks bore witness to life. In them she recorded everything\u2014the invisible made visible, the forgotten recovered, the truth of the illusions and the illusion of truths.", "display_date": DATES[3]},
    # --- Middle East / Persia ---
    {"novel_title": "The Blind Owl", "author": "Sadegh Hedayat", "author_country": "Iran", "page_number": 31, "total_pages": 50, "content": "My shadow on the wall had grown bigger than me, had absorbed me into itself. I felt that I had become my own shadow, flat and dark, pasted to the wall. The oil lamp was flickering. On the wall opposite me, my shadow was dancing. It was more real than I was.\n\nI had become a thought that, finding no body to inhabit, had come to rest on this wall. The night pressed down upon me with all its weight. I was alone with the night and the owl.", "display_date": DATES[4]},
    {"novel_title": "The Conference of the Birds", "author": "Farid ud-Din Attar", "author_country": "Persia", "page_number": 98, "total_pages": 120, "content": "When thirty birds at last arrived and saw the Simorgh's splendor\u2014Loss dissolved to wonder. A world of neither this nor that, of neither here nor there. Then the Simorgh's glory blazed like sun and in that glory all thirty birds at once could see themselves\u2014they were the Simorgh and the Simorgh was these thirty birds.\n\nIf they looked at the Simorgh, they saw themselves, and when they turned to gaze upon each other, they saw the Simorgh. Si-morgh\u2014thirty birds. They were nothing and everything at once.", "display_date": DATES[5]},
    # --- South Asia ---
    {"novel_title": "The God of Small Things", "author": "Arundhati Roy", "author_country": "India", "page_number": 112, "total_pages": 150, "content": "That's what careless words do. They make people love you a little less. That afternoon, Ammu traveled upwards through a dream in which a cheerful man with one arm held her close by the light of an oil lamp.\n\nHe had no other arm with which to fight. He only had one arm with which to love her. And his arm was warm, and firm, and smelled of the earth and the river. She woke up wanting more of it. More of it.", "display_date": DATES[6]},
    {"novel_title": "Gitanjali", "author": "Rabindranath Tagore", "author_country": "India", "page_number": 26, "total_pages": 40, "content": "I have had my invitation to this world's festival, and thus my life has been blessed. My eyes have seen and my ears have heard.\n\nIt was my part at this feast to play upon my instrument, and I have done all I could. Now, I ask, has the time come at last when I may go in and see thy face and offer thee my silent salutation?", "display_date": DATES[0]},
    # --- East Asia ---
    {"novel_title": "The Tale of Genji", "author": "Murasaki Shikibu", "author_country": "Japan", "page_number": 187, "total_pages": 300, "content": "There is no such thing as a heart that does not know sadness. Even those born under the luckiest stars will find themselves weeping at some turn in life's path. The moon rising over the eastern hills cast its pale light upon the garden, and in that silver glow the blossoms of the plum tree appeared as fragile as his resolve.\n\nHe wrote a poem on the folding screen beside his pillow and watched the dawn arrive with a beauty so complete it felt like sorrow.", "display_date": DATES[1]},
    {"novel_title": "Snow Country", "author": "Yasunari Kawabata", "author_country": "Japan", "page_number": 53, "total_pages": 80, "content": "The Milky Way came down just over there, to wrap the night earth in its naked embrace. There was a terrible voluptuousness about it. Shimamura fancied that his own small shadow was being cast up against it from the earth.\n\nEach individual star stood apart from the rest, and even the smallest seemed to shine with a fierce individuality. As the Milky Way dropped lower, it seemed to gain depth and distance. The quiet cold penetrated to his very bones.", "display_date": DATES[2]},
    # --- North Africa / Arab ---
    {"novel_title": "The Stranger", "author": "Albert Camus", "author_country": "Algeria", "page_number": 49, "total_pages": 60, "content": "As if that blind rage had washed me clean, rid me of hope; for the first time, in that night alive with signs and stars, I opened myself to the gentle indifference of the world. Finding it so much like myself\u2014so like a brother, really\u2014I felt that I had been happy and that I was happy again.\n\nFor everything to be consummated, for me to feel less alone, I had only to wish that there be a large crowd of spectators the day of my execution and that they greet me with cries of hate.", "display_date": DATES[3]},
    {"novel_title": "Season of Migration to the North", "author": "Tayeb Salih", "author_country": "Sudan", "page_number": 58, "total_pages": 80, "content": "I am no Othello. I am a lie. I am the desert of thirst. I am no Othello, Othello was a lie. You do not believe me? You believe the lie. The world is not real\u2014what is real is the imagining.\n\nThe Nile flowed by in silence, ancient and indifferent. At the bend where the current slowed, the water caught the moonlight and held it, as though the river itself were dreaming of the sea it had not yet reached.", "display_date": DATES[4]},
    # --- Scandinavian / Nordic ---
    {"novel_title": "Hunger", "author": "Knut Hamsun", "author_country": "Norway", "page_number": 61, "total_pages": 90, "content": "Every single time I had asked of life a little pleasure, even just the tiniest, it had refused. And when I asked why, life said nothing. The whole city lay in wet fog. The gas lamps had been lit, and people brushed past me like dark breathing shadows.\n\nI stopped beneath a street lamp and examined my hands. They were thin and dirty. I bent one finger and felt the joint creak. A strange joy seized me\u2014I existed, after all. I was alive. That was something.", "display_date": DATES[5]},
    # --- African ---
    {"novel_title": "Things Fall Apart", "author": "Chinua Achebe", "author_country": "Nigeria", "page_number": 67, "total_pages": 90, "content": "He has put a knife on the things that held us together and we have fallen apart.\n\nOkonkwo stood looking at the dead messenger and knew that Umuofia would not go to war. He knew because they had let the other messengers escape. He had acted alone. He heard voices asking: 'Why did he do it?' He wiped his machete on the sand and went away. He knew that the clan could no longer act like one. He knew that they had broken into tumbling pieces.", "display_date": DATES[6]},
    # --- More classics ---
    {"novel_title": "The Brothers Karamazov", "author": "Fyodor Dostoevsky", "author_country": "Russia", "page_number": 263, "total_pages": 400, "content": "'I think the devil doesn't exist, but man has created him, he has created him in his own image and likeness.'\n\n'Is there a God or not?' Ivan said with savage persistence. 'No, there is no God.' 'Then all things are lawful?' 'All things are lawful.'\n\nThe candle flickered. The brothers sat in silence. Outside, the Russian night stretched on endlessly, and somewhere a dog barked at nothing\u2014at the vastness, perhaps, or at the terrifying freedom of a world without answers.", "display_date": DATES[0]},
    {"novel_title": "The Picture of Dorian Gray", "author": "Oscar Wilde", "author_country": "Ireland", "page_number": 72, "total_pages": 100, "content": "The only way to get rid of a temptation is to yield to it. Resist it, and your soul grows sick with longing for the things it has forbidden to itself.\n\nHe examined the portrait with a feeling of almost scientific interest. Was it really true that one could never change? He felt a wild longing for the unstained purity of his boyhood. He knew that he had tarnished himself, filled his mind with corruption and given horror to his fancy. But was it all irretrievable? Was there no hope for him?", "display_date": DATES[1]},
    {"novel_title": "Faust", "author": "Johann Wolfgang von Goethe", "author_country": "Germany", "page_number": 147, "total_pages": 200, "content": "Two souls, alas, are dwelling in my breast, and one is striving to forsake its brother. One clings to earth with all its might, with crude delight in worldly lust; the other rises from the dust to reach the fields of light.\n\nIf there be spirits in the air, that hold their sway between the earth and sky, descend out of the golden atmosphere and sweep me into bright and new existence! A magic cloak, could I but find it mine, to waft me to those distant lands!", "display_date": DATES[2]},
    {"novel_title": "Thus Spoke Zarathustra", "author": "Friedrich Nietzsche", "author_country": "Germany", "page_number": 83, "total_pages": 120, "content": "And once you are awake, you shall remain awake eternally. It is not my way to awaken great-grandfathers from their sleep and to bid them go on sleeping.\n\nYou have your way. I have my way. As for the right way, the correct way, and the only way, it does not exist. One must still have chaos in oneself to be able to give birth to a dancing star. I tell you: you still have chaos in yourselves.", "display_date": DATES[3]},
    {"novel_title": "The Prophet", "author": "Kahlil Gibran", "author_country": "Lebanon", "page_number": 18, "total_pages": 30, "content": "Your children are not your children. They are the sons and daughters of Life's longing for itself. They come through you but not from you, and though they are with you yet they belong not to you.\n\nYou may give them your love but not your thoughts, for they have their own thoughts. You may house their bodies but not their souls, for their souls dwell in the house of tomorrow, which you cannot visit, not even in your dreams.", "display_date": DATES[4]},
    {"novel_title": "Invisible Cities", "author": "Italo Calvino", "author_country": "Italy", "page_number": 56, "total_pages": 80, "content": "The inferno of the living is not something that will be; if there is one, it is what is already here, the inferno where we live every day, that we form by being together. There are two ways to escape suffering it. The first is easy for many: accept the inferno and become such a part of it that you can no longer see it.\n\nThe second is risky and demands constant vigilance and apprehension: seek and learn to recognize who and what, in the midst of the inferno, are not inferno, then make them endure, give them space.", "display_date": DATES[5]},
    {"novel_title": "The Rubaiyat of Omar Khayyam", "author": "Omar Khayyam", "author_country": "Persia", "page_number": 14, "total_pages": 25, "content": "A Book of Verses underneath the Bough,\nA Jug of Wine, a Loaf of Bread\u2014and Thou\nBeside me singing in the Wilderness\u2014\nOh, Wilderness were Paradise enow!\n\nThe Moving Finger writes; and, having writ,\nMoves on: nor all thy Piety nor Wit\nShall lure it back to cancel half a Line,\nNor all thy Tears wash out a Word of it.", "display_date": DATES[6]},
]


# ---------- LITERATURE HIGHLIGHTS ----------

LITERATURE = [
    # --- Persian / Mysticism ---
    {"title": "The Guest House", "author": "Jalal ad-Din Rumi", "author_country": "Persia", "genre": "mysticism", "content": "This being human is a guest house.\nEvery morning a new arrival.\n\nA joy, a depression, a meanness,\nsome momentary awareness comes\nas an unexpected visitor.\n\nWelcome and entertain them all!\nEven if they're a crowd of sorrows,\nwho violently sweep your house\nempty of its furniture,\nstill, treat each guest honorably.\nHe may be clearing you out\nfor some new delight.\n\nThe dark thought, the shame, the malice,\nmeet them at the door laughing,\nand invite them in.\n\nBe grateful for whoever comes,\nbecause each has been sent\nas a guide from beyond.", "original_language": "Persian", "original_text": "\u0627\u06cc\u0646 \u0622\u062f\u0645\u06cc \u0645\u0647\u0645\u0627\u0646\u200c\u062e\u0627\u0646\u0647 \u0627\u0633\u062a\n\u0647\u0631 \u0635\u0628\u062d \u0645\u0647\u0645\u0627\u0646\u06cc \u062a\u0627\u0632\u0647 \u0645\u06cc\u200c\u0631\u0633\u062f", "display_date": DATES[0]},
    {"title": "Only Breath", "author": "Jalal ad-Din Rumi", "author_country": "Persia", "genre": "mysticism", "content": "Not Christian or Jew or Muslim, not Hindu,\nBuddhist, sufi, or zen. Not any religion\nor cultural system. I am not from the East\nor the West, not out of the ocean or up\nfrom the ground, not natural or ethereal, not\ncomposed of elements at all.\n\nI do not exist,\nam not an entity in this world or the next,\ndid not descend from Adam and Eve or any\norigin story. My place is placeless, a trace\nof the traceless. Neither body or soul.\n\nI belong to the beloved, have seen the two\nworlds as one and that one call to and know,\nfirst, last, outer, inner, only that\nbreath breathing human being.", "original_language": "Persian", "original_text": None, "display_date": DATES[1]},
    {"title": "The Masnavi", "author": "Jalal ad-Din Rumi", "author_country": "Persia", "genre": "mysticism", "content": "Listen to the reed how it tells a tale,\ncomplaining of separations\u2014\nSaying, 'Ever since I was parted from the reed-bed,\nmy lament hath caused man and woman to moan.\n\nI want a bosom torn by severance,\nthat I may unfold to such a one the pain of love-desire.\nEvery one who is left far from his source\nwishes back the time when he was united with it.'", "original_language": "Persian", "original_text": "\u0628\u0634\u0646\u0648 \u0627\u0632 \u0646\u06cc \u0686\u0648\u0646 \u062d\u06a9\u0627\u06cc\u062a \u0645\u06cc\u200c\u06a9\u0646\u062f\n\u0627\u0632 \u062c\u062f\u0627\u06cc\u06cc\u200c\u0647\u0627 \u0634\u06a9\u0627\u06cc\u062a \u0645\u06cc\u200c\u06a9\u0646\u062f", "display_date": DATES[2]},
    {"title": "I Died as a Mineral", "author": "Jalal ad-Din Rumi", "author_country": "Persia", "genre": "mysticism", "content": "I died as a mineral and became a plant,\nI died as a plant and rose to animal,\nI died as an animal and I was Man.\nWhy should I fear? When was I less by dying?\n\nYet once more I shall die as Man, to soar\nWith angels blessed; but even from angelhood\nI must pass on: all except God doth perish.\nWhen I have sacrificed my angel-soul,\nI shall become what no mind e'er conceived.\nOh, let me not exist! for Non-existence\nProclaims in organ tones, 'To Him we shall return.'", "original_language": "Persian", "original_text": None, "display_date": DATES[3]},
    {"title": "Divan of Hafez", "author": "Hafez", "author_country": "Persia", "genre": "mysticism", "content": "I have learned so much from God\nthat I can no longer call myself\na Christian, a Hindu, a Muslim,\na Buddhist, a Jew.\n\nThe truth has shared so much of itself with me\nthat I can no longer call myself\na man, a woman, an angel, or even pure soul.\n\nLove has befriended Hafez so completely\nit has turned to ash and freed me\nof every concept and image\nmy mind has ever known.", "original_language": "Persian", "original_text": None, "display_date": DATES[4]},
    # --- Latin America ---
    {"title": "Poetry", "author": "Pablo Neruda", "author_country": "Chile", "genre": "poem", "content": "And it was at that age... Poetry arrived\nin search of me. I don't know, I don't know where\nit came from, from winter or a river.\nI don't know how or when,\nno, they were not voices, they were not\nwords, nor silence,\nbut from a street I was summoned,\nfrom the branches of night,\nabruptly from the others,\namong violent fires\nor returning alone,\nthere I was without a face\nand it touched me.", "original_language": "Spanish", "original_text": "Y fue a esa edad... Llego la poesia\na buscarme. No se, no se de donde\nsalio, de invierno o rio.", "display_date": DATES[5]},
    {"title": "Borges and I", "author": "Jorge Luis Borges", "author_country": "Argentina", "genre": "prose", "content": "The other one, the one called Borges, is the one things happen to. I walk through the streets of Buenos Aires and stop for a moment, perhaps mechanically now, to look at the arch of an entrance hall and the grillwork on the gate.\n\nI like hourglasses, maps, eighteenth-century typography, the taste of coffee and the prose of Stevenson; he shares these preferences, but in a vain way that turns them into the attributes of an actor.\n\nI do not know which of us has written this page.", "original_language": "Spanish", "original_text": "Al otro, a Borges, es a quien le ocurren las cosas.", "display_date": DATES[6]},
    {"title": "Sonnet XVII", "author": "Pablo Neruda", "author_country": "Chile", "genre": "poem", "content": "I do not love you as if you were salt-rose, or topaz,\nor the arrow of carnations the fire shoots off.\nI love you as certain dark things are to be loved,\nin secret, between the shadow and the soul.\n\nI love you as the plant that never blooms\nbut carries in itself the light of hidden flowers;\nthanks to your love a certain solid fragrance,\nrisen from the earth, lives darkly in my body.\n\nI love you without knowing how, or when, or from where.\nI love you simply, without problems or pride:\nI love you in this way because I do not know any other way of loving\nbut this, in which there is no I or you,\nso intimate that your hand upon my chest is my hand,\nso intimate that when I fall asleep your eyes close.", "original_language": "Spanish", "original_text": "No te amo como si fueras rosa de sal, topacio\no flecha de claveles que propagan el fuego.", "display_date": DATES[0]},
    # --- South Asia ---
    {"title": "Where the Mind Is Without Fear", "author": "Rabindranath Tagore", "author_country": "India", "genre": "poem", "content": "Where the mind is without fear and the head is held high\nWhere knowledge is free\nWhere the world has not been broken up into fragments\nBy narrow domestic walls\nWhere words come out from the depth of truth\nWhere tireless striving stretches its arms towards perfection\nWhere the clear stream of reason has not lost its way\nInto the dreary desert sand of dead habit\nWhere the mind is led forward by thee\nInto ever-widening thought and action\nInto that heaven of freedom, my Father, let my country awake.", "original_language": "Bengali", "original_text": "\u099a\u09bf\u09a4\u09cd\u09a4 \u09af\u09c7\u09a5\u09be \u09ad\u09af\u09bc\u09b6\u09c2\u09a8\u09cd\u09af", "display_date": DATES[1]},
    {"title": "Unending Love", "author": "Rabindranath Tagore", "author_country": "India", "genre": "poem", "content": "I seem to have loved you in numberless forms, numberless times,\nIn life after life, in age after age, forever.\nMy spellbound heart has made and remade the necklace of songs,\nThat you take as a gift, wear round your neck in your many forms,\nIn life after life, in age after age, forever.\n\nWhenever I hear old chronicles of love, its age-old pain,\nIts ancient tale of being apart or together.\nAs I stare on and on into the past, in the end you emerge,\nClad in the light of a pole-star piercing the darkness of time:\nYou become an image of what is remembered forever.", "original_language": "Bengali", "original_text": None, "display_date": DATES[2]},
    # --- East Asia ---
    {"title": "Selected Haiku", "author": "Matsuo Basho", "author_country": "Japan", "genre": "poem", "content": "An old silent pond...\nA frog jumps into the pond\u2014\nSplash! Silence again.\n\nThe temple bell stops\u2014\nbut the sound keeps coming\nout of the flowers.\n\nIn the twilight rain\nthese brilliant-hued hibiscus\u2014\na lovely sunset.\n\nNothing in the cry\nof cicadas suggests they\nare about to die.", "original_language": "Japanese", "original_text": "\u53e4\u6c60\u3084\n\u86d9\u98db\u3073\u8fbc\u3080\n\u6c34\u306e\u97f3", "display_date": DATES[3]},
    {"title": "Drinking Alone Under the Moon", "author": "Li Bai", "author_country": "China", "genre": "poem", "content": "A cup of wine, under the flowering trees;\nI drink alone, for no friend is near.\nRaising my cup I beckon the bright moon,\nFor he, with my shadow, will make three men.\nThe moon, alas, is no drinker of wine;\nListless, my shadow creeps about at my side.\nYet with the moon as friend and the shadow as slave\nI must make merry before the Spring is spent.\nTo the songs I sing the moon flickers her beams;\nIn the dance I weave my shadow tangles and breaks.", "original_language": "Chinese", "original_text": "\u82b1\u9593\u4e00\u58fa\u9152\uff0c\u7368\u914c\u7121\u76f8\u89aa\u3002\n\u8209\u676f\u9080\u660e\u6708\uff0c\u5c0d\u5f71\u6210\u4e09\u4eba\u3002", "display_date": DATES[4]},
    # --- Eastern Europe ---
    {"title": "The Three Oddest Words", "author": "Wislawa Szymborska", "author_country": "Poland", "genre": "poem", "content": "When I pronounce the word Future,\nthe first syllable already belongs to the past.\n\nWhen I pronounce the word Silence,\nI destroy it.\n\nWhen I pronounce the word Nothing,\nI make something no non-being can hold.", "original_language": "Polish", "original_text": "Kiedy wymawiam slowo Przyszlosc,\npierwsza sylaba odchodzi juz do przeszlosci.", "display_date": DATES[5]},
    {"title": "A Dog Has Died", "author": "Pablo Neruda", "author_country": "Chile", "genre": "poem", "content": "My dog has died.\nI buried him in the garden\nnext to a rusted old machine.\n\nSome day I'll join him right there,\nbut now he's gone with his shaggy coat,\nhis bad manners and his cold nose,\nand I, the materialist, who never believed\nin any promised heaven in the sky\nfor any human being,\nI believe in a heaven I'll never enter.\nYes, I believe in a heaven for all dogdom\nwhere my dog waits for my arrival\nwaving his fan-like tail in friendship.", "original_language": "Spanish", "original_text": None, "display_date": DATES[6]},
    # --- American / Western ---
    {"title": "The Summer Day", "author": "Mary Oliver", "author_country": "USA", "genre": "poem", "content": "Who made the world?\nWho made the swan, and the black bear?\nWho made the grasshopper?\nThis grasshopper, I mean\u2014\nthe one who has flung herself out of the grass,\nthe one who is eating sugar out of my hand,\nwho is moving her jaws back and forth instead of up and down\u2014\nwho is gazing around with her enormous and complicated eyes.\nNow she lifts her pale forearms and thoroughly washes her face.\nNow she snaps her wings open, and floats away.\nI don't know exactly what a prayer is.\nI do know how to pay attention, how to fall down\ninto the grass, how to kneel down in the grass,\nhow to be idle and blessed, how to stroll through the fields,\nwhich is what I have been doing all day.\nTell me, what else should I have done?\nDoesn't everything die at last, and too soon?\nTell me, what is it you plan to do\nwith your one wild and precious life?", "original_language": "English", "original_text": None, "display_date": DATES[0]},
    {"title": "Song of Myself", "author": "Walt Whitman", "author_country": "USA", "genre": "poem", "content": "I celebrate myself, and sing myself,\nAnd what I assume you shall assume,\nFor every atom belonging to me as good belongs to you.\n\nI loafe and invite my soul,\nI lean and loafe at my ease observing a spear of summer grass.\n\nMy tongue, every atom of my blood, form'd from this soil, this air,\nBorn here of parents born here from parents the same, and their parents the same,\nI, now thirty-seven years old in perfect health begin,\nHoping to cease not till death.", "original_language": "English", "original_text": None, "display_date": DATES[1]},
    {"title": "The Road Not Taken", "author": "Robert Frost", "author_country": "USA", "genre": "poem", "content": "Two roads diverged in a yellow wood,\nAnd sorry I could not travel both\nAnd be one traveler, long I stood\nAnd looked down one as far as I could\nTo where it bent in the undergrowth;\n\nThen took the other, as just as fair,\nAnd having perhaps the better claim,\nBecause it was grassy and wanted wear;\nThough as for that the passing there\nHad worn them really about the same.\n\nI shall be telling this with a sigh\nSomewhere ages and ages hence:\nTwo roads diverged in a wood, and I\u2014\nI took the one less traveled by,\nAnd that has made all the difference.", "original_language": "English", "original_text": None, "display_date": DATES[2]},
    # --- European classics ---
    {"title": "Ozymandias", "author": "Percy Bysshe Shelley", "author_country": "England", "genre": "poem", "content": "I met a traveller from an antique land,\nWho said\u2014'Two vast and trunkless legs of stone\nStand in the desert. . . . Near them, on the sand,\nHalf sunk a shattered visage lies, whose frown,\nAnd wrinkled lip, and sneer of cold command,\nTell that its sculptor well those passions read\nWhich yet survive, stamped on these lifeless things,\nThe hand that mocked them, and the heart that fed;\nAnd on the pedestal, these words appear:\nMy name is Ozymandias, King of Kings;\nLook on my Works, ye Mighty, and despair!\nNothing beside remains. Round the decay\nOf that colossal Wreck, boundless and bare\nThe lone and level sands stretch far away.'", "original_language": "English", "original_text": None, "display_date": DATES[3]},
    {"title": "The Panther", "author": "Rainer Maria Rilke", "author_country": "Austria", "genre": "poem", "content": "His vision, from the constantly passing bars,\nhas grown so weary that it cannot hold\nanything else. It seems to him there are\na thousand bars; and behind the bars, no world.\n\nAs he paces in cramped circles, over and over,\nthe movement of his powerful soft strides\nis like a ritual dance around a center\nin which a mighty will stands paralyzed.\n\nOnly at times, the curtain of the pupils\nlifts, quietly\u2014. An image enters in,\nrushes down through the tensed, arrested muscles,\nplunges into the heart and is gone.", "original_language": "German", "original_text": "Sein Blick ist vom Vorubergehn der Stabe\nso mud geworden, dass er nichts mehr halt.", "display_date": DATES[4]},
    {"title": "Invictus", "author": "William Ernest Henley", "author_country": "England", "genre": "poem", "content": "Out of the night that covers me,\nBlack as the pit from pole to pole,\nI thank whatever gods may be\nFor my unconquerable soul.\n\nIn the fell clutch of circumstance\nI have not winced nor cried aloud.\nUnder the bludgeonings of chance\nMy head is bloody, but unbowed.\n\nBeyond this place of wrath and tears\nLooms but the Horror of the shade,\nAnd yet the menace of the years\nFinds and shall find me unafraid.\n\nIt matters not how strait the gate,\nHow charged with punishments the scroll,\nI am the master of my fate,\nI am the captain of my soul.", "original_language": "English", "original_text": None, "display_date": DATES[5]},
    {"title": "Ithaka", "author": "C.P. Cavafy", "author_country": "Greece", "genre": "poem", "content": "As you set out for Ithaka,\nhope the voyage is a long one,\nfull of adventure, full of discovery.\nLaistrygonians and Cyclops,\nangry Poseidon\u2014don't be afraid of them:\nyou'll never find things like that on your way\nas long as you keep your thoughts raised high,\nas long as a rare excitement\nstirs your spirit and your body.\n\nIthaka gave you the marvelous journey.\nWithout her you would not have set out.\nShe has nothing left to give you now.\n\nAnd if you find her poor, Ithaka won't have fooled you.\nWise as you will have become, so full of experience,\nyou will have understood by then what these Ithakas mean.", "original_language": "Greek", "original_text": None, "display_date": DATES[6]},
    # --- Middle East ---
    {"title": "On Love", "author": "Kahlil Gibran", "author_country": "Lebanon", "genre": "prose", "content": "When love beckons to you, follow him,\nThough his ways are hard and steep.\nAnd when his wings enfold you yield to him,\nThough the sword hidden among his pinions may wound you.\nAnd when he speaks to you believe in him,\nThough his voice may shatter your dreams\nas the north wind lays waste the garden.\n\nFor even as love crowns you so shall he crucify you.\nEven as he is for your growth so is he for your pruning.\nEven as he ascends to your height and caresses\nyour tenderest branches that quiver in the sun,\nSo shall he descend to your roots\nand shake them in their clinging to the earth.", "original_language": "English", "original_text": None, "display_date": DATES[0]},
    # --- African ---
    {"title": "Africa", "author": "David Diop", "author_country": "Senegal", "genre": "poem", "content": "Africa my Africa\nAfrica of proud warriors in ancestral savannahs\nAfrica of whom my grandmother sings\nOn the banks of the distant river\nI have never known you\nBut your blood flows in my veins\nYour beautiful black blood that irrigates the fields\nThe blood of your sweat\nThe sweat of your work\nThe work of your slavery\nThe slavery of your children\nAfrica tell me Africa\nIs this you this back that is bent\nThis back that breaks under the weight of humiliation\nThis back trembling with red scars\nAnd saying yes to the whip under the midday sun\nBut a grave voice answers me\nImpetuous son that tree young and strong\nThat tree there\nIn splendid loneliness amidst white and faded flowers\nThat is Africa your Africa\nThat grows again patiently obstinately\nAnd its fruit gradually acquires\nThe bitter taste of liberty.", "original_language": "French", "original_text": None, "display_date": DATES[1]},
    # --- War / Conflict ---
    {"title": "Dulce et Decorum Est", "author": "Wilfred Owen", "author_country": "England", "genre": "poem", "content": "Bent double, like old beggars under sacks,\nKnock-kneed, coughing like hags, we cursed through sludge,\nTill on the haunting flares we turned our backs,\nAnd towards our distant rest began to trudge.\n\nGas! GAS! Quick, boys!\u2014An ecstasy of fumbling\nFitting the clumsy helmets just in time,\nBut someone still was yelling out and stumbling\nAnd flound'ring like a man in fire or lime.\n\nIf you could hear, at every jolt, the blood\nCome gargling from the froth-corrupted lungs,\nMy friend, you would not tell with such high zest\nTo children ardent for some desperate glory,\nThe old Lie: Dulce et decorum est\nPro patria mori.", "original_language": "English", "original_text": None, "display_date": DATES[2]},
    # --- Solitude / Nature ---
    {"title": "I Wandered Lonely as a Cloud", "author": "William Wordsworth", "author_country": "England", "genre": "poem", "content": "I wandered lonely as a cloud\nThat floats on high o'er vales and hills,\nWhen all at once I saw a crowd,\nA host, of golden daffodils;\nBeside the lake, beneath the trees,\nFluttering and dancing in the breeze.\n\nContinuous as the stars that shine\nAnd twinkle on the milky way,\nThey stretched in never-ending line\nAlong the margin of a bay:\nTen thousand saw I at a glance,\nTossing their heads in sprightly dance.\n\nFor oft, when on my couch I lie\nIn vacant or in pensive mood,\nThey flash upon that inward eye\nWhich is the bliss of solitude;\nAnd then my heart with pleasure fills,\nAnd dances with the daffodils.", "original_language": "English", "original_text": None, "display_date": DATES[3]},
    # --- Dreams / Existential ---
    {"title": "A Dream Within a Dream", "author": "Edgar Allan Poe", "author_country": "USA", "genre": "poem", "content": "Take this kiss upon the brow!\nAnd, in parting from you now,\nThus much let me avow\u2014\nYou are not wrong, who deem\nThat my days have been a dream;\nYet if hope has flown away\nIn a night, or in a day,\nIn a vision, or in none,\nIs it therefore the less gone?\nAll that we see or seem\nIs but a dream within a dream.\n\nI stand amid the roar\nOf a surf-tormented shore,\nAnd I hold within my hand\nGrains of the golden sand\u2014\nHow few! yet how they creep\nThrough my fingers to the deep,\nWhile I weep\u2014while I weep!\nO God! Can I not grasp\nThem with a tighter clasp?\nO God! can I not save\nOne from the pitiless wave?\nIs all that we see or seem\nBut a dream within a dream?", "original_language": "English", "original_text": None, "display_date": DATES[4]},
    {"title": "Still I Rise", "author": "Maya Angelou", "author_country": "USA", "genre": "poem", "content": "You may write me down in history\nWith your bitter, twisted lies,\nYou may trod me in the very dirt\nBut still, like dust, I'll rise.\n\nDoes my sassiness upset you?\nWhy are you beset with gloom?\n'Cause I walk like I've got oil wells\nPumping in my living room.\n\nOut of the huts of history's shame\nI rise\nUp from a past that's rooted in pain\nI rise\nI'm a black ocean, leaping and wide,\nWelling and swelling I bear in the tide.\nLeaving behind nights of terror and fear\nI rise\nInto a daybreak that's wondrously clear\nI rise.", "original_language": "English", "original_text": None, "display_date": DATES[5]},
    {"title": "The Waste Land (excerpt)", "author": "T.S. Eliot", "author_country": "USA", "genre": "poem", "content": "April is the cruellest month, breeding\nLilacs out of the dead land, mixing\nMemory and desire, stirring\nDull roots with spring rain.\nWinter kept us warm, covering\nEarth in forgetful snow, feeding\nA little life with dried tubers.\n\nWhat are the roots that clutch, what branches grow\nOut of this stony rubbish? Son of man,\nYou cannot say, or guess, for you know only\nA heap of broken images, where the sun beats,\nAnd the dead tree gives no shelter, the cricket no relief,\nAnd the dry stone no sound of water.", "original_language": "English", "original_text": None, "display_date": DATES[6]},
]


async def seed():
    """Seed the database with initial content."""
    engine = create_async_engine(settings.DATABASE_URL, echo=True)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        # Clear existing seed data (keep curated paintings with source)
        for model in [NovelPage, LiteratureHighlight]:
            existing = await session.execute(select(model))
            for row in existing.scalars().all():
                await session.delete(row)
        # Only delete paintings without a source (seed data)
        existing_paintings = await session.execute(
            select(Painting).where(Painting.source.is_(None))
        )
        for row in existing_paintings.scalars().all():
            await session.delete(row)
        await session.commit()

        # Insert paintings
        for data in PAINTINGS:
            session.add(Painting(**data))

        # Insert novel pages
        for data in NOVEL_PAGES:
            session.add(NovelPage(**data))

        # Insert literature highlights
        for data in LITERATURE:
            session.add(LiteratureHighlight(**data))

        await session.commit()
        print(f"Seeded {len(PAINTINGS)} paintings")
        print(f"Seeded {len(NOVEL_PAGES)} novel pages")
        print(f"Seeded {len(LITERATURE)} literature highlights")

    await engine.dispose()
    print("Seed complete!")


def run():
    asyncio.run(seed())


if __name__ == "__main__":
    run()

/*
 * Page copy for the ten shades-of-<family> landing pages.
 *
 * Build-time only, and deliberately not in assets/: the site ships no
 * JavaScript that needs it, and a visitor should not download ten pages of
 * prose to read one of them.
 */
module.exports.COPY = {
  "blue": {
    "title": "Shades of Blue: Names, Hex Codes and Contrast",
    "description": "Every blue in the CSS named colour list, with hex, RGB and contrast against white, plus tints, shades and tones generated in your browser.",
    "tagline": "From aliceblue at 1.07:1 to navy at 16:1, the largest family in CSS",
    "intro": "Blue is the biggest family in the CSS named colour list, and the least evenly spaced. It runs from aliceblue, which is so close to white that its contrast ratio is about 1.07:1, down to midnightblue and navy, which sit between 15:1 and 16:1 and will carry small text without complaint. Between those ends the names cluster in odd places: three separate sky blues, nothing much in the muted mid range, and a navy that is exactly half of blue because the original list was built from round binary values.",
    "second": "Blue also behaves oddly in the eye. Short wavelengths are handled by the sparsest of the three cone types, and the lens focuses them slightly differently from red and green, so thin blue type on white can look softer at its edges than the same weight in black. That is a reason to reserve pure blue for larger elements, and to reach for royalblue or something darker when the blue has to carry body text.",
    "naming": "Most of these names are inherited, not designed. The X11 list was a text file maintained by hand on Unix workstations, so blue picked up whatever someone felt like adding: cornflower, powder, dodger, cadet. Navy and blue came in through the sixteen HTML colours instead, which is why navy is #000080, exactly half of blue, and why darkblue at #00008B is actually lighter than navy.",
    "usage": "Blue is the default colour of a hyperlink in every browser default stylesheet, which makes it the least surprising choice for interactive text and a poor choice for anything that is not clickable. Watch the ratios: steelblue lands near 4.1:1 against white and misses AA for body copy, while royalblue clears it at about 4.8:1. Pale blues like aliceblue and lightcyan are backgrounds, not text, and they disappear entirely on a white card.",
    "faq": [
      [
        "What hex code is navy?",
        "Navy is #000080, or rgb(0, 0, 128). It is exactly half the blue channel of blue itself, which is #0000FF, a legacy of a list built from simple binary steps. Against white it measures roughly 16:1, so it clears AAA for text at any size. Note that darkblue, #00008B, is slightly lighter than navy despite the name."
      ],
      [
        "Is cyan the same as aqua?",
        "Yes. Aqua and cyan are two names for #00FFFF, the same way fuchsia and magenta share #FF00FF. Aqua arrived with the sixteen HTML colours and cyan came from X11, and when the two lists were merged neither name was dropped. Browsers treat them as identical, and a colour picker will usually report whichever one it prefers."
      ],
      [
        "What is the difference between a tint and a shade of blue?",
        "A tint mixes the base toward white, a shade mixes it toward black, and a tone mixes it toward grey, which lowers saturation without moving lightness much. Applied to dodgerblue, tints give you the pale washes used for callout backgrounds, shades give you hover and pressed states, and tones give you the muted denim blues that sit quietly behind content."
      ]
    ]
  },
  "green": {
    "title": "Shades of Green: CSS Green Names and Hex Codes",
    "description": "The CSS greens from darkgreen to springgreen, with hex, RGB and contrast values, an explanation of the green and lime split, and tints, shades and tones.",
    "tagline": "Why the colour you mean by green is called lime, and what the rest are worth",
    "intro": "Type green into CSS and you get #008000, a dark forest tone that is not what most people picture. The bright screen green they mean, #00FF00, is called lime. The cause is dull rather than deliberate: two colour lists were merged, they disagreed about green, and the HTML definition won. Everything else in the family, from olivedrab to mediumspringgreen, was inherited from the list that lost the argument. The table below keeps both, side by side, so the difference is visible rather than theoretical.",
    "second": "Green is also the colour the contrast formula cares about most. In the WCAG luminance calculation the green channel is weighted at about 0.72, against 0.21 for red and 0.07 for blue, because human vision is most sensitive in the middle of the spectrum. That is why lime measures only 1.4:1 against white despite looking intense, and why a green that looks dark on screen can still fail a contrast check.",
    "naming": "The green names come from grass, plants and paint tins: lawngreen, forestgreen, olivedrab, seagreen, springgreen. Consistency was never the goal. Greenyellow and yellowgreen are both here and are different colours; lawngreen and chartreuse are three units apart in two channels and read as the same colour; palegreen is lighter than lightgreen. The same merge that produced green and lime also left gray at #808080 while darkgray sits at #A9A9A9, lighter than the colour it claims to darken.",
    "usage": "Green carries the convention for success, confirmation and go, but it should never carry it alone: red-green deficiency is the most common form of colour blindness, so a green tick and a red cross that differ only in hue are the same mark to a lot of readers. Pair the hue with a shape or a label. For text, darkgreen clears AAA at about 7.4:1, while forestgreen misses AA at roughly 4.4:1.",
    "faq": [
      [
        "Why is green #008000 and not #00FF00?",
        "Because CSS inherited two conflicting definitions. The sixteen HTML colours, taken from the old VGA palette, defined green as the half-brightness #008000 and gave the full-brightness value its own name, lime. X11 called #00FF00 green. When the lists were combined, the HTML value kept the name green and X11 green became lime. Nothing about it was a design decision."
      ],
      [
        "Which CSS greens are readable as text on white?",
        "Not many. Darkgreen at about 7.4:1 clears AAA, darkolivegreen sits near 6:1 and green itself near 5.1:1, so those three are safe for body copy. Forestgreen misses AA at roughly 4.4:1 and seagreen at about 4.2:1. Mediumseagreen is already near 2.7:1, and lime, springgreen and lawngreen are all under 2:1, which makes them fills rather than type."
      ],
      [
        "Is olive part of the green family?",
        "Depends where you draw the line. Olive is #808000, exactly half of yellow, and comes from the same sixteen HTML colours as green and navy, so by hue it is a dark yellow rather than a green. Olivedrab and darkolivegreen are X11 names and do sit in the green region. Olive measures about 4.2:1 against white, just short of AA for body text."
      ]
    ]
  },
  "red": {
    "title": "Shades of Red: Hex Codes, RGB and Contrast Ratios",
    "description": "Crimson, firebrick, tomato and the rest of the CSS reds, with hex, RGB and WCAG contrast against white, plus tints, shades and tones you can copy.",
    "tagline": "Pure red is about 4:1 on white, which is not enough for body text",
    "intro": "The most useful thing to know about red on a screen is that #FF0000 measures about 4:1 against white. That is below the 4.5:1 needed for normal text and only just above the 3:1 allowed for large text, so the most alarming colour available is also one of the worst choices for an error message. Red only becomes readable once it darkens: crimson clears the bar at roughly 5:1, firebrick at about 6.7:1, darkred at close to 10:1.",
    "second": "Look at the spread and the family leans light. Salmon, lightcoral, lightsalmon, tomato and indianred are all pale or dusty, and only maroon, darkred, brown and firebrick sit in the dark end. That is an accident of where the names came from rather than a plan, and it means most red palettes need shades generated from a base rather than picked off the list. The tints are already there; the depth is not.",
    "naming": "Red and maroon arrived with the sixteen HTML colours, which is why maroon is #800000, red halved in one channel. The rest are X11 names borrowed from objects: firebrick from kiln brick, tomato and salmon and coral from the kitchen and the shore, indianred from an iron oxide earth pigment. Orange was not among the original sixteen and had to be added to CSS later, while orangered came in with the X11 set.",
    "usage": "Red is the strongest signal in an interface, which is why it should be rationed: if delete, validation errors, unread badges and a promotional banner are all red, none of them reads as urgent. Use crimson or firebrick for error text so it passes contrast, keep pure red for icons and borders, and never let red be the only difference between two states, since red-green deficiency will flatten it.",
    "faq": [
      [
        "What is the hex code for crimson?",
        "Crimson is #DC143C, or rgb(220, 20, 60). It measures about 5:1 against white, which clears AA for normal text where pure red does not, and it is dark enough to read while still looking like a warning. That combination makes it a better default for error copy than #FF0000, which most people reach for first."
      ],
      [
        "Is maroon the same as dark red?",
        "Not quite. Maroon is #800000 and darkred is #8B0000, so maroon is the darker of the two by eleven units in the red channel, despite darkred having the word dark in its name. Against white maroon measures near 11:1 and darkred near 10:1. Both are safe for text; the difference between them is not visible in a small swatch."
      ],
      [
        "How do I make a lighter red without it turning pink?",
        "Add white to a pure red and you get pink, because a tint moves lightness without changing hue. If you want a lighter red that still reads as red, take some saturation out at the same time, which is a tone rather than a tint, or move slightly toward orange as you lighten. Indianred and lightcoral are both greyed reds of exactly this kind."
      ]
    ]
  },
  "pink": {
    "title": "Shades of Pink: CSS Pink Names, Hex and Contrast",
    "description": "Pink, hotpink, deeppink, mediumvioletred and the rest, with hex, RGB and contrast against white, plus browser-side tints, shades and tones.",
    "tagline": "Only one CSS pink clears 4.5:1 on white, and it is not the one you expect",
    "intro": "Pink has no wavelength of its own. There is no pink line in a spectrum: the sensation comes from long and short wavelengths together with a gap in the middle, which is why pink and magenta are called extra-spectral. In practical terms the CSS pinks are red mixed toward white and rotated a little toward blue, so almost every one of them is already a tint. That is the source of their single recurring problem, which is contrast.",
    "second": "Run the numbers and the family collapses. Pink sits near 1.5:1 against white, hotpink near 2.6:1, magenta and palevioletred near 3.1:1, deeppink near 3.6:1. Mediumvioletred is the only one that clears 4.5:1, at roughly 5.4:1. Everything else in the family is a fill, a border, a chart series or a background, and if a design calls for pink type on white the honest answer is to generate a shade of it instead.",
    "naming": "The pink names are a small study in inconsistency. Magenta and fuchsia are one value, #FF00FF, kept under two names because one came from X11 and the other from the HTML sixteen. Fuchsia is spelled after the flower, itself named for the botanist Leonhart Fuchs; magenta after an aniline dye of the 1860s, named for a battle in northern Italy. Mediumvioletred is darker than palevioletred, and lightpink is darker than pink.",
    "usage": "Pinks work as surfaces and accents: tinted rows, badges, chart series, the fill behind a highlighted change. They fail as text on white and as small icons, where the shape thins out and the colour has nothing left to hold it. If a pink has to carry meaning, put it on a dark ground instead, where deeppink and hotpink both gain a lot of separation, or darken the pink itself until it reaches mediumvioletred territory.",
    "faq": [
      [
        "Is magenta the same as fuchsia?",
        "Yes, exactly. Both are #FF00FF, or rgb(255, 0, 255), and browsers treat the two keywords as interchangeable. Fuchsia is the name from the sixteen HTML colours and magenta is the X11 name for the same value, and the merge that produced modern CSS kept both. Aqua and cyan are the other pair with this history. Neither name has any effect on rendering."
      ],
      [
        "Can I use pink text on a white background?",
        "Only if it is large or you pick carefully. Of the named pinks, mediumvioletred at about 5.4:1 is the one that passes AA for body text on white. Deeppink at roughly 3.6:1 and palevioletred at 3.1:1 pass only for large text, meaning 24px regular or 18.66px bold. Everything paler fails at any size."
      ],
      [
        "Where does the colour name pink come from?",
        "From a flower, not the other way round. Pink was a garden flower, a dianthus with a frilled edge, before it was a colour, and the usual account links that edge to the old sense of pinking as cutting a jagged line, the same word behind pinking shears. The colour sense is the newer one, which is why the family stays close to plants and dyes."
      ]
    ]
  },
  "purple": {
    "title": "Shades of Purple: Hex Codes for Every CSS Purple",
    "description": "Indigo, blueviolet, orchid, rebeccapurple and the rest of the CSS purples, with hex, RGB and contrast against white, plus tints, shades and tones.",
    "tagline": "The only CSS colour name added since the 1980s list lives in this family",
    "intro": "Purple is where the spectrum closes into a circle. Violet is a real wavelength at the short end, but the purples between it and red are mixtures with no single wavelength behind them, which is why the hue wheel has to loop rather than run out. The CSS family reflects that split awkwardly: violet, darkviolet and blueviolet all exist and none of them is a lighter or darker version of the others, while purple itself, #800080, is a dark magenta.",
    "second": "One name in this family is not inherited from anywhere. Rebeccapurple, #663399, was added to CSS Color Level 4 in 2014 after the death of Rebecca Meyer, the six-year-old daughter of the web developer Eric Meyer. It was proposed as beccapurple and renamed at the request of her family, since she was to be called Rebecca once she turned six. It is the only colour keyword in CSS that does not come from the X11 list.",
    "naming": "Purple came in with the sixteen HTML colours at #800080, exactly half of magenta. Everything else here arrived from X11: orchid and plum from plants, thistle from a weed, indigo from the dye. The naming is unsystematic in the usual way. Orchid gets a medium and a dark variant while plum and thistle get none, and darkviolet is not a darkened violet but a far more saturated colour that happens to be deeper.",
    "usage": "Browsers have painted visited links a dark purple since the 1990s, so purple in body text still reads as something already clicked; that is worth knowing before choosing it as a link colour. Otherwise the family is unusually well behaved for interfaces: rebeccapurple at about 8.4:1, indigo near 13:1 and purple near 9.4:1 all clear AAA against white, while mediumpurple, plum and thistle stay in fill and background territory.",
    "faq": [
      [
        "What hex is rebeccapurple?",
        "Rebeccapurple is #663399, or rgb(102, 51, 153). In hexadecimal it is three repeated pairs, 66, 33 and 99, which makes it easy to remember. Against white it measures about 8.4:1, past the 7:1 that AAA asks for at normal text sizes, so it is a purple you can set body copy in rather than a decorative one."
      ],
      [
        "Is indigo a purple or a blue?",
        "Both, depending on who is asking. CSS indigo is #4B0082, which sits on the blue side of the purples and reads as a deep violet-blue. The name comes from the dye, and its place in the rainbow comes from Newton, who wanted seven bands and split the blue end in two. There is no physical boundary there, only a naming convention that stuck."
      ],
      [
        "Why is purple associated with royalty?",
        "By convention rather than anything in the colour. The historical reason usually given is cost: Tyrian purple was extracted from sea snails in tiny quantities, so it priced most people out, and sumptuary rules in some places reserved it. Cheap synthetic dyes from the 1850s onward ended that, but the association outlived the economics. Nothing in the wavelength or the hex value carries any of it."
      ]
    ]
  },
  "orange": {
    "title": "Shades of Orange: Hex Codes, Tints, Tones",
    "description": "All seven CSS named oranges with hex, RGB and contrast against white, plus tints, shades and tones generated in your browser from any orange you pick.",
    "tagline": "Seven keywords, one late arrival, and not one of them safe for body text",
    "intro": "Orange is the keyword that arrived late. The X11 list that CSS inherited its colour names from went from red straight into brown with almost nothing in between, so orange was added by name in CSS2.1 to close a gap that authors kept running into. The seven entries here still show that thin coverage: coral, tomato and orangered lean red, peachpuff and sandybrown lean pale, and darkorange separates from orange by hue rather than lightness, sitting about six degrees redder at the same saturation.",
    "second": "Check the ratio column and a pattern appears immediately. Orange against white is about 1.97 to 1, darkorange 2.33, coral 2.50, tomato 2.95. The strongest entry in the family is orangered at roughly 3.44 to 1, which clears the 3 to 1 bar for large text and nothing more. No named orange passes AA for body copy, and by the time you darken one far enough to get there, most people looking at it will call it brown.",
    "naming": "The names read like a kitchen inventory because that is roughly how they were made: someone at a workstation needed a label, picked a familiar object and typed it in. Tomato, coral, peachpuff and sandybrown all date from that hand-maintained file. Orange is the exception, added to the web set later because its absence was too obvious to leave. Orangered is the only compound here describing a position between two hues rather than a thing.",
    "usage": "Orange earns its keep as a surface and a signal, not as text. It works for warning banners, active states, chart series and anything with a dark label sitting on top of it. What goes wrong is orange text on white, orange on cream, and orange next to red where the two collapse into one another at small sizes. If you need an orange that reads as text, take a shade several steps down and accept that it will look brown.",
    "faq": [
      [
        "What hex code is orange in CSS?",
        "The keyword orange is #FFA500, rgb(255, 165, 0). It is fully saturated with a hue near 39 degrees, which puts it closer to yellow than most people expect. Darkorange, #FF8C00, is the same lightness and saturation but about six degrees redder, so the difference you see between them is hue, not depth."
      ],
      [
        "What is the difference between coral and tomato?",
        "Both sit in the red end of the orange band, but tomato is redder and slightly darker. Tomato is #FF6347 at hue 9, coral is #FF7F50 at hue 16, and coral carries a little more lightness. Side by side, tomato reads as a warm red and coral as a pale orange. Alone, most people would not name either correctly."
      ],
      [
        "How do I get a readable orange for text?",
        "Mix it toward black until the contrast ratio against white clears 4.5 to 1, which the generator reports as you drag. Expect to land somewhere near saddlebrown territory. If the result has to stay recognisably orange, invert the problem: put the orange behind dark text instead, where a ratio of 2 to 1 against white is no longer the number that matters."
      ]
    ]
  },
  "yellow": {
    "title": "Shades of Yellow and Why They Fail on White",
    "description": "Every CSS named yellow with hex, RGB and its contrast ratio against white, plus browser-generated tints, shades and tones from any yellow base you choose.",
    "tagline": "The brightest hue in the list and the one that loses every contrast test",
    "intro": "The luminance formula behind every WCAG contrast ratio weights green at roughly seventy percent of the total, and pure yellow is red and green together at full strength. That is why #FFFF00 measures about 1.07 to 1 against white, and why it is the brightest thing the sRGB gamut can produce short of white itself. That single number explains most of what is difficult here. Every entry in the table below is a high-lightness colour, and the ones with light in the name are barely distinguishable from the page they sit on.",
    "second": "Sort the family by contrast and the range is almost comically narrow. Lightyellow is 1.02 to 1, lemonchiffon 1.06, papayawhip 1.13, khaki 1.28, and gold, the strongest of them, only reaches 1.40. Nothing here clears 3 to 1, let alone 4.5. Yellow is the one family where the usual advice to darken it slightly does not help; you have to go far enough that the result is olive or amber before any of it becomes text.",
    "naming": "Nowhere is the improvised origin of these names clearer. Lightgoldenrodyellow is twenty letters naming a flower, a metal and a hue at once, and it sits within five points of lemonchiffon in every channel. Papayawhip, moccasin and lemonchiffon are fabric and food names for near-whites. Goldenrod itself picked up light, dark and pale relatives, which is more coverage than the whole orange family received.",
    "usage": "Yellow is a background colour and a highlighter, and almost never a foreground one. It does its best work as a fill behind near-black text, as a selection or annotation wash, and as the alert level between green and red. The failure mode is predictable: yellow text, yellow icons on white, and yellow as one of several chart series where it disappears against the plot area. Give it a dark outline or give it up.",
    "faq": [
      [
        "Why is yellow text unreadable on white?",
        "Because contrast in WCAG is computed from relative luminance, not from hue, and yellow has the highest luminance of any fully saturated hue. Pure yellow reaches about 1.07 to 1 against white, where 4.5 to 1 is the minimum for normal text. The colour looks strong and the letters still vanish, which is why designers are surprised by it."
      ],
      [
        "What hex code is gold?",
        "Gold is #FFD700, rgb(255, 215, 0). It is a fully saturated yellow at hue 51, sitting between yellow and orange, and it is the darkest keyword in this family at roughly 1.40 to 1 against white. That still fails every WCAG threshold, so gold works as a fill or a border and not as a label."
      ],
      [
        "What is the difference between a tint and a tone of yellow?",
        "A tint mixes yellow toward white, which barely changes anything here because yellow already sits near the top of the lightness range. A tone mixes it toward grey, dropping saturation, and that is the operation producing the useful part of the family: khaki, muted sand yellows, and anything you would call buff. Shades, mixed toward black, turn yellow into olive quickly."
      ]
    ]
  },
  "brown": {
    "title": "Shades of Brown: Hex Codes and Why It Is Orange",
    "description": "Ten CSS named browns with hex, RGB and contrast against white, why brown is really dark orange, and tints, shades and tones generated in your browser.",
    "tagline": "Dark orange that your eye insists on renaming, and ten keywords for it",
    "intro": "No wavelength of light is brown. There is none in a rainbow and none out of a prism, because brown is the only family here with no spectral hue of its own. What we call brown is orange at low lightness or low saturation, and the name attaches only because the surround is brighter. Put a brown swatch on a black field and it stops being brown within a second or two, drifting back toward orange. That is not a rendering quirk; it is how the visual system assigns colour names relative to a reference white.",
    "second": "The hue column makes the argument better than any description. Chocolate sits at 25 degrees and saddlebrown at the same 25, with near-identical saturation; the only real difference between them is sixteen points of lightness. Peru is at 30, tan at 34, burlywood at 34. These are all oranges by measurement. The keyword brown, meanwhile, is at hue 0, a dark desaturated red, which is why it never quite matches the browns around it.",
    "naming": "Half of these names are places or trades rather than descriptions. Sienna and burlywood come from a pigment and a timber, peru arrived as a geography, saddlebrown and chocolate as plain objects. Maroon is the outlier: it reached the web through the original sixteen HTML colours rather than the X11 file, and it follows the halving pattern shared with navy, teal and olive, being exactly half of red at #800000.",
    "usage": "Brown is the family that actually gives you readable text. Saddlebrown reaches about 7.10 to 1 against white and brown itself 7.08, both clearing AAA, while sienna at 5.62 passes AA comfortably. The pale end is the opposite: tan, wheat and burlywood are all under 2 to 1 and belong on backgrounds. The common mistake is pairing a warm brown text colour with a cool grey interface, where it reads as a mistake rather than a choice.",
    "faq": [
      [
        "Why is my brown just dark orange?",
        "Because that is what brown is. Darkening an orange in HSL lowers lightness but leaves the hue where it was, so the result is measurably orange and reads as brown only against a lighter surround. If it still looks orange, the fix is usually to drop saturation as well as lightness, or to check that whatever sits behind it is bright enough to anchor the comparison."
      ],
      [
        "What hex code is tan?",
        "Tan is #D2B48C, rgb(210, 180, 140). It is a desaturated orange at hue 34 with lightness near 69 percent, which makes it a background colour: 1.97 to 1 against white, well below any text threshold. Burlywood is the same hue with more saturation, and wheat is lighter and yellower; at small sizes all three are hard to tell apart."
      ],
      [
        "Is maroon a brown or a red?",
        "By measurement it is red: #800000 is hue 0 at full saturation, simply dark. It sits in brown lists because dark reds are usually named as browns in ordinary speech, and because the keyword brown, #A52A2A, is also at hue 0 and only a little lighter. If you want a brown that is not secretly red, start from chocolate or peru instead."
      ]
    ]
  },
  "grey": {
    "title": "Shades of Grey: The CSS Greys, Both Spellings",
    "description": "Every CSS grey with hex, RGB and contrast against white, both the gray and grey spellings, plus tints, shades and tones generated in your browser.",
    "tagline": "Fourteen keywords for seven colours, and darkgray is the lighter one",
    "intro": "Seven grey keywords in CSS exist twice, once spelled gray and once grey, for fourteen names and seven actual colours. Gray, darkgray, dimgray, lightgray, slategray, lightslategray and darkslategray each have a grey twin with byte-identical values. Nothing else in the specification is duplicated this way. The pairing is inherited rather than designed: the X11 list carried both spellings and CSS kept both instead of choosing. Black, white, silver, gainsboro and whitesmoke round the family out with single spellings.",
    "second": "Two things in this table trip people up. Darkgray, #A9A9A9, is lighter than gray, #808080, by a wide margin: 2.35 to 1 against white versus 3.95. They came from different sources at different times and were never reconciled. The second is that not every grey here is neutral. Slategray and lightslategray sit at hue 210 with a blue cast, and darkslategray at hue 180 leans toward teal, so they are greys by name and tinted colours by value.",
    "naming": "The neutral names came from wherever was handy. Black, white, silver and gray arrived through the original sixteen HTML colours; whitesmoke and gainsboro came from the X11 file, and gainsboro is the one whose origin nobody has convincingly settled. Dimgray describes an effect rather than a level. The slate group grew to three colours and six keywords, more coverage than several entire hues received, and lightgray and gainsboro sit only four points of lightness apart.",
    "usage": "Greys carry most of an interface, so the cast matters more than the value. Pick one grey family and stay in it: mixing slategray borders with dimgray text puts a blue-tinted line next to a neutral one, and the result looks dirty rather than subtle. For body text on white, dimgray at 5.49 to 1 passes AA and gray at 3.95 does not, which catches a great deal of otherwise careful work.",
    "faq": [
      [
        "Is it gray or grey in CSS?",
        "Both work, and they are the same colour. Every grey keyword with a spelling variant resolves to identical values, so gray and grey, lightgray and lightgrey, and so on are interchangeable in a stylesheet. Pick one for your codebase and keep to it, since a mixed file makes searching painful. The alphabetical table happens to put gray first, which is the only tiebreaker on offer."
      ],
      [
        "Why is darkgray lighter than gray?",
        "Because they did not come from the same place. Gray is #808080, the halfway byte value, and arrived with the original HTML colours. Darkgray is #A9A9A9, an X11 entry, and the two were never reconciled. The names therefore run backwards: darkgray measures 2.35 to 1 against white and gray measures 3.95, so the dark one is the paler of the pair."
      ],
      [
        "Which grey should I use for body text on white?",
        "Dimgray, #696969, at 5.49 to 1, is the lightest named grey that still passes AA for normal text. Gray misses at 3.95, which is fine for large headings at 3 to 1 but not for paragraphs. If you want something softer than dimgray you will have to leave the keyword list and mix your own, because the next step up is a big jump to darkgray."
      ]
    ]
  },
  "teal": {
    "title": "Shades of Teal: Hex Codes, Aqua, Turquoise",
    "description": "CSS teals, cyans and turquoises with hex, RGB and contrast against white, plus tints, shades and tones generated from any teal base in your browser.",
    "tagline": "Hue 180 exactly, between green and blue, which is why the argument never ends",
    "intro": "Teal is #008080, which is exactly half of aqua, #00FFFF. That is not a coincidence: teal, navy, maroon, olive, purple and green were all defined as half-value versions of their bright counterparts in the original HTML palette, so the darker name is literally the brighter one with each channel divided by two. The rest of this family came in later from X11 and is much less tidy, with four turquoises and a lightseagreen that is neither light nor especially green.",
    "second": "The green or blue question has an exact answer. Teal, aqua, cyan, darkcyan and paleturquoise all sit at hue 180 degrees, the midpoint between green at 120 and blue at 240, so neither reading is wrong. Where the family drifts is at the edges: turquoise falls to 174 and aquamarine to 160, both measurably green, while only darkturquoise strays to the blue side, and only by a single degree. Teal is the balance point and the rest of the table leans green.",
    "naming": "Aqua and cyan are the same value under two names, #00FFFF, one from the HTML sixteen and one from X11, and both remain valid keywords. Teal came from the same HTML set as its half-value sibling. Everything carrying turquoise or aquamarine arrived later from the X11 file, which is why the region has four turquoises and two names for one cyan. Darkcyan and lightseagreen sit within four degrees of each other in hue while their names share nothing at all.",
    "usage": "This family splits cleanly by contrast. Teal at 4.77 to 1 and darkcyan at 4.15 are the only entries near text territory, and only teal actually passes AA on white. Everything from turquoise upward, aqua included at 1.25, belongs on fills, borders and chart series with dark labels. The other hazard is that mid teals sit very close to the blue you probably use for links, so a teal accent and a blue link in the same paragraph will fight.",
    "faq": [
      [
        "Is teal green or blue?",
        "Neither, precisely. Teal is at hue 180 degrees, the exact midpoint between green at 120 and blue at 240, so both answers are half right and neither is more correct. In practice the perception depends on what surrounds it: teal next to a saturated blue reads green, and the same swatch next to a green reads blue. The number does not move, the reading does."
      ],
      [
        "What is the difference between aqua and cyan?",
        "Nothing at all. Both are #00FFFF, rgb(0, 255, 255). Aqua came in with the original sixteen HTML colours and cyan came from the X11 list, and CSS kept both rather than drop one. A browser cannot tell them apart, and neither can a colour picker. Use whichever your team already writes, and note that darkcyan has no darkaqua counterpart."
      ],
      [
        "What hex code is turquoise?",
        "Turquoise is #40E0D0, rgb(64, 224, 208), a hue of 174 degrees that leans slightly green of true cyan. Its relatives are darkturquoise #00CED1, mediumturquoise #48D1CC and paleturquoise #AFEEEE. None of the four passes AA against white; turquoise itself is 1.64 to 1, so treat all of them as surface colours rather than text."
      ]
    ]
  }
};

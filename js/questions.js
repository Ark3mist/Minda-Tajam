/* Question banks + generators. All data is local: no network needed. */
(function () {
  'use strict';

  function rnd(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* ---------------- SCIENCE (multiple choice) ---------------- */
  // q = question, a = correct answer, w = wrong answers, f = fun fact / explanation
  const science = [
    { q: 'What do plants need to make their own food?', a: 'Sunlight, water and air', w: ['Only soil', 'Only rain', 'Moonlight'], f: 'Plants use sunlight, water and carbon dioxide from the air to make sugar. This is called photosynthesis.' },
    { q: 'Which planet is closest to the Sun?', a: 'Mercury', w: ['Venus', 'Earth', 'Mars'], f: 'Mercury is the closest planet to the Sun and also the smallest planet.' },
    { q: 'What is water called when it freezes?', a: 'Ice', w: ['Steam', 'Vapour', 'Dew'], f: 'Liquid water turns into solid ice at 0 °C.' },
    { q: 'Steam is water in which state?', a: 'Gas', w: ['Solid', 'Liquid', 'Crystal'], f: 'When water boils it becomes a gas called water vapour. Steam is that hot vapour.' },
    { q: 'Which force pulls things down toward the Earth?', a: 'Gravity', w: ['Friction', 'Magnetism', 'Wind'], f: 'Gravity pulls everything toward the Earth. That is why a dropped ball falls.' },
    { q: 'Which organ pumps blood around your body?', a: 'Heart', w: ['Lungs', 'Stomach', 'Brain'], f: 'Your heart is a muscle that beats about 100,000 times a day.' },
    { q: 'Which gas does your body need from the air you breathe?', a: 'Oxygen', w: ['Carbon dioxide', 'Helium', 'Smoke'], f: 'Your lungs take oxygen from the air and your blood carries it around your body.' },
    { q: 'Which of these animals is a mammal?', a: 'Dolphin', w: ['Shark', 'Frog', 'Eagle'], f: 'Dolphins breathe air and feed their babies milk, so they are mammals, not fish.' },
    { q: 'How many legs does an insect have?', a: '6', w: ['4', '8', '10'], f: 'All insects have 6 legs. Spiders have 8, so spiders are not insects.' },
    { q: 'What is the closest star to Earth?', a: 'The Sun', w: ['The North Star', 'Sirius', 'The Moon'], f: 'The Sun is a star! The Moon is not a star; it reflects the Sun\'s light.' },
    { q: 'At what temperature does water boil at sea level?', a: '100 °C', w: ['50 °C', '0 °C', '200 °C'], f: 'Water boils at 100 °C at sea level. High up on mountains it boils at a lower temperature.' },
    { q: 'Which of these lets electricity flow through it?', a: 'Copper wire', w: ['Rubber glove', 'Wooden spoon', 'Plastic cup'], f: 'Metals like copper are conductors. Rubber, wood and plastic are insulators.' },
    { q: 'Which of these does a magnet pull on?', a: 'Iron nail', w: ['Aluminium can', 'Glass marble', 'Paper clip made of plastic'], f: 'Magnets attract iron, nickel and cobalt. Most other metals, like aluminium, are not attracted.' },
    { q: 'What makes a rainbow?', a: 'Sunlight bending through raindrops', w: ['Paint in the clouds', 'The Moon\'s shadow', 'Wind blowing dust'], f: 'Raindrops bend sunlight and split it into its colours: red, orange, yellow, green, blue, indigo, violet.' },
    { q: 'Which part of a plant takes in water from the soil?', a: 'Roots', w: ['Flowers', 'Leaves', 'Seeds'], f: 'Roots soak up water and hold the plant in the ground.' },
    { q: 'In a butterfly\'s life cycle, what comes after the caterpillar?', a: 'Chrysalis', w: ['Egg', 'Tadpole', 'Nest'], f: 'Egg → caterpillar → chrysalis (pupa) → butterfly.' },
    { q: 'What do herbivores eat?', a: 'Plants', w: ['Only meat', 'Rocks', 'Plants and meat'], f: 'Herbivores like cows and rabbits eat plants. Animals that eat both are omnivores.' },
    { q: 'A ramp is which kind of simple machine?', a: 'Inclined plane', w: ['Lever', 'Pulley', 'Gear'], f: 'An inclined plane lets you lift something by pushing it up a slope with less force.' },
    { q: 'About how long does Earth take to go around the Sun?', a: '1 year', w: ['1 day', '1 month', '10 years'], f: 'Earth takes about 365 days, one year, to orbit the Sun.' },
    { q: 'Why do we have day and night?', a: 'The Earth spins', w: ['The Sun turns off', 'Clouds block the Sun', 'The Moon covers the Sun'], f: 'Earth spins once every 24 hours. The side facing the Sun has day.' },
    { q: 'What is the hardest natural material?', a: 'Diamond', w: ['Gold', 'Iron', 'Glass'], f: 'Diamond is so hard it is used on tools that cut stone.' },
    { q: 'Sound is made by things that...', a: 'Vibrate', w: ['Glow', 'Melt', 'Freeze'], f: 'Sound is made by vibrations. Touch your throat while you hum and you can feel them.' },
    { q: 'Which is the biggest planet in our solar system?', a: 'Jupiter', w: ['Earth', 'Mars', 'Mercury'], f: 'Jupiter is so big that more than 1,000 Earths could fit inside it.' },
    { q: 'How does a fish get oxygen?', a: 'Through its gills', w: ['Through its fins', 'Through its scales', 'Through lungs'], f: 'Gills take oxygen out of the water as it flows past them.' },
    { q: 'What is evaporation?', a: 'Liquid turning into gas', w: ['Gas turning into liquid', 'Liquid turning into solid', 'Solid turning into liquid'], f: 'Puddles dry up because the water evaporates into the air.' },
    { q: 'An animal that eats both plants and meat is called...', a: 'An omnivore', w: ['A herbivore', 'A carnivore', 'A predator only'], f: 'Bears and people are omnivores: they eat plants and meat.' },
    { q: 'Which part of your body protects your brain?', a: 'Skull', w: ['Ribs', 'Knee', 'Spine'], f: 'Your skull is a hard helmet made of bone.' },
    { q: 'Which energy source will not run out?', a: 'Wind', w: ['Coal', 'Oil', 'Natural gas'], f: 'Wind, sunlight and water power are renewable. Coal, oil and gas take millions of years to form.' },
    { q: 'What do we call the path the Moon takes around the Earth?', a: 'An orbit', w: ['A tunnel', 'A shadow', 'A crater'], f: 'The Moon orbits Earth about once every 27 days.' },
    { q: 'Rubbing your hands together makes them warm. What force causes this?', a: 'Friction', w: ['Gravity', 'Magnetism', 'Buoyancy'], f: 'Friction happens when surfaces rub together. It slows things down and makes heat.' }
  ];

  /* ---------------- ENGINEERING PUZZLES (tap-to-place) ---------------- */
  // interactive_type: drag_and_drop_slot = pick ONE right item; multi_select_tap = pick ALL right items
  const puzzles = [
    { id: 'SCI_COND_01', subject: 'science', subtopic: 'electrical_conduction', scenario_text: 'The generator room is flooded! Connect the battery terminal to the beacon using a conductive scrap item.', interactive_type: 'drag_and_drop_slot', correct_items: ['copper_pipe', 'steel_wrench', 'gold_coin'], distractor_items: ['wooden_ruler', 'rubber_boot', 'glass_flask'], physics_effect_success: 'sparks_fly_light_turns_green', physics_effect_failure: 'bot_shrugs_circuit_beeps_dead', target_skill: 'recognize conductors vs insulators' },
    { id: 'SCI_COND_02', subject: 'science', subtopic: 'electrical_conduction', scenario_text: "The robot's radio wire snapped! Bridge the gap so power can reach the antenna again.", interactive_type: 'drag_and_drop_slot', correct_items: ['aluminum_foil_strip', 'iron_nail', 'copper_wire'], distractor_items: ['plastic_straw', 'cotton_string', 'rubber_band'], physics_effect_success: 'antenna_glows_radio_crackles_music', physics_effect_failure: 'bot_taps_antenna_static_silence', target_skill: 'recognize conductors vs insulators' },
    { id: 'SCI_MAG_01', subject: 'science', subtopic: 'magnetism', scenario_text: 'The crane magnet is ready! Pick every scrap item the magnet will lift onto the truck.', interactive_type: 'multi_select_tap', correct_items: ['iron_nail', 'steel_paperclip', 'nickel_washer'], distractor_items: ['aluminum_can', 'copper_pipe', 'plastic_spoon'], physics_effect_success: 'items_snap_to_magnet_clank', physics_effect_failure: 'item_stays_on_ground_crane_wobbles', target_skill: 'identify magnetic vs non-magnetic metals' },
    { id: 'SCI_FLOAT_01', subject: 'science', subtopic: 'buoyancy', scenario_text: 'The bridge washed away! Build a raft so the bot can float across the river.', interactive_type: 'drag_and_drop_slot', correct_items: ['cork_block', 'wooden_plank', 'empty_plastic_bottle'], distractor_items: ['river_stone', 'steel_bolt', 'glass_marble'], physics_effect_success: 'raft_bobs_bot_paddles_across', physics_effect_failure: 'item_sinks_bubbles_bot_splashes', target_skill: 'predict which materials float or sink' },
    { id: 'ENG_LEVER_01', subject: 'engineering', subtopic: 'levers', scenario_text: 'A giant crate blocks the tunnel! Place the fulcrum block so the bot can lift it with the least effort.', interactive_type: 'drag_and_drop_slot', correct_items: ['fulcrum_near_crate'], distractor_items: ['fulcrum_middle', 'fulcrum_near_bot'], physics_effect_success: 'crate_tips_up_tunnel_opens', physics_effect_failure: 'bot_pushes_hard_crate_does_not_move', target_skill: 'understand fulcrum position and effort in a lever' },
    { id: 'ENG_PULLEY_01', subject: 'engineering', subtopic: 'pulleys', scenario_text: 'The battery box is too heavy to lift! Choose the pulley setup that cuts the pulling force in half.', interactive_type: 'drag_and_drop_slot', correct_items: ['fixed_plus_movable_pulley'], distractor_items: ['single_fixed_pulley', 'rope_only_no_pulley'], physics_effect_success: 'box_rises_smoothly_bot_cheers', physics_effect_failure: 'rope_strains_bot_slides_forward', target_skill: 'compare fixed and movable pulleys for mechanical advantage' },
    { id: 'SCI_THERM_01', subject: 'science', subtopic: 'thermal_insulation', scenario_text: 'The cooling ice for the engine is melting in the sun! Wrap the ice box to keep heat out.', interactive_type: 'multi_select_tap', correct_items: ['wool_blanket', 'foam_block', 'bubble_wrap'], distractor_items: ['copper_plate', 'metal_tray', 'glass_pane'], physics_effect_success: 'ice_stays_frosty_thermometer_blue', physics_effect_failure: 'ice_drips_puddle_thermometer_red', target_skill: 'recognize thermal insulators vs thermal conductors' },
    { id: 'ENG_STRUCT_01', subject: 'engineering', subtopic: 'structural_shapes', scenario_text: 'The tower frame keeps wobbling! Add the shape that makes the frame strongest and stiffest.', interactive_type: 'drag_and_drop_slot', correct_items: ['triangle_brace'], distractor_items: ['square_frame', 'circle_hoop', 'flat_plank'], physics_effect_success: 'tower_stands_firm_wind_blows_past', physics_effect_failure: 'frame_leans_squishes_collapses', target_skill: 'understand why triangles make strong structures' },
    { id: 'SCI_LIGHT_01', subject: 'science', subtopic: 'light_reflection', scenario_text: 'The laser must hit the door sensor around the corner! Place a surface that bounces the beam.', interactive_type: 'drag_and_drop_slot', correct_items: ['flat_mirror_tile', 'polished_steel_sheet'], distractor_items: ['cardboard_square', 'black_felt', 'wooden_board'], physics_effect_success: 'beam_bounces_sensor_door_slides_open', physics_effect_failure: 'beam_stops_dark_spot_door_stays_shut', target_skill: 'identify surfaces that reflect light' },
    { id: 'SCI_SOUND_01', subject: 'science', subtopic: 'sound_pitch', scenario_text: 'The secret lock opens only to a HIGH note! Pick the string that will play the highest pitch.', interactive_type: 'multi_select_tap', correct_items: ['short_tight_string'], distractor_items: ['long_loose_string', 'long_tight_string', 'short_loose_string'], physics_effect_success: 'high_ping_lock_clicks_open', physics_effect_failure: 'low_twang_lock_buzzes_stays_shut', target_skill: 'relate string length and tension to pitch' },
    { id: 'ENG_GEAR_01', subject: 'engineering', subtopic: 'gears', scenario_text: 'The conveyor belt runs backwards! Add gears so the output gear spins the SAME way as the motor gear.', interactive_type: 'drag_and_drop_slot', correct_items: ['one_idler_gear'], distractor_items: ['no_idler_gear', 'two_idler_gears'], physics_effect_success: 'gears_mesh_belt_rolls_forward', physics_effect_failure: 'belt_runs_backwards_crates_tumble', target_skill: 'predict rotation direction in meshed gear trains' }
  ];

  const ITEM_EMOJI = {
    copper_pipe: '🔧', steel_wrench: '🔧', gold_coin: '🪙', wooden_ruler: '📏', rubber_boot: '🥾', glass_flask: '🧪',
    aluminum_foil_strip: '🥈', iron_nail: '📌', copper_wire: '➰', plastic_straw: '🥤', cotton_string: '🧶', rubber_band: '⭕',
    steel_paperclip: '📎', nickel_washer: '⚙️', aluminum_can: '🥫', plastic_spoon: '🥄',
    cork_block: '🟫', wooden_plank: '🪵', empty_plastic_bottle: '🧴', river_stone: '🪨', steel_bolt: '🔩', glass_marble: '🔮',
    fulcrum_near_crate: '📦🔺', fulcrum_middle: '🔺', fulcrum_near_bot: '🔺🤖',
    fixed_plus_movable_pulley: '🏗️', single_fixed_pulley: '🪝', rope_only_no_pulley: '🪢',
    wool_blanket: '🧣', foam_block: '🧽', bubble_wrap: '🫧', copper_plate: '🟧', metal_tray: '🍽️', glass_pane: '🪟',
    triangle_brace: '🔺', square_frame: '🟦', circle_hoop: '⭕', flat_plank: '🪵',
    flat_mirror_tile: '🪞', polished_steel_sheet: '🛡️', cardboard_square: '📦', black_felt: '⬛', wooden_board: '🪵',
    short_tight_string: '🎸', long_loose_string: '🎸', long_tight_string: '🎸', short_loose_string: '🎸',
    one_idler_gear: '⚙️', no_idler_gear: '⚙️', two_idler_gears: '⚙️⚙️'
  };

  /* ---------------- LANGUAGE (English) ---------------- */
  const language = [
    { q: 'Which word is spelled correctly?', a: 'because', w: ['becuase', 'becos', 'beacause'], f: 'be-cause: "because".' },
    { q: 'Which word is spelled correctly?', a: 'friend', w: ['freind', 'frend', 'freand'], f: 'Remember: "i before e" in friend: f-r-i-e-n-d.' },
    { q: 'Which word is spelled correctly?', a: 'beautiful', w: ['beutiful', 'beautifull', 'butiful'], f: 'beau-ti-ful: only one L at the end.' },
    { q: 'Which word is spelled correctly?', a: 'Wednesday', w: ['Wensday', 'Wednsday', 'Wendesday'], f: 'Say it slowly: Wed-nes-day.' },
    { q: 'Which word is spelled correctly?', a: 'different', w: ['diffrent', 'diferent', 'differant'], f: 'dif-fer-ent: two Fs and it ends in -ent.' },
    { q: 'Which word is spelled correctly?', a: 'people', w: ['peaple', 'peopel', 'pepole'], f: 'p-e-o-p-l-e.' },
    { q: 'Which word means the SAME as "big"?', a: 'large', w: ['tiny', 'thin', 'quiet'], f: 'Words with the same meaning are called synonyms.' },
    { q: 'Which word means the SAME as "happy"?', a: 'joyful', w: ['angry', 'sleepy', 'gloomy'], f: 'Happy and joyful are synonyms.' },
    { q: 'Which word means the SAME as "quick"?', a: 'fast', w: ['slow', 'heavy', 'late'], f: 'Quick and fast are synonyms.' },
    { q: 'Which word means the SAME as "begin"?', a: 'start', w: ['finish', 'stop', 'wait'], f: 'Begin and start are synonyms.' },
    { q: 'Which word is the OPPOSITE of "hot"?', a: 'cold', w: ['warm', 'spicy', 'sunny'], f: 'Words with opposite meanings are called antonyms.' },
    { q: 'Which word is the OPPOSITE of "empty"?', a: 'full', w: ['clean', 'open', 'light'], f: 'Empty and full are antonyms.' },
    { q: 'Which word is the OPPOSITE of "ancient"?', a: 'modern', w: ['old', 'broken', 'huge'], f: 'Ancient means very old; modern means new.' },
    { q: 'Which word is the OPPOSITE of "brave"?', a: 'cowardly', w: ['bold', 'strong', 'loud'], f: 'Brave and cowardly are antonyms.' },
    { q: 'What is the plural of "child"?', a: 'children', w: ['childs', 'childes', 'childrens'], f: 'Child → children. Some plurals don\'t just add -s.' },
    { q: 'What is the plural of "mouse"?', a: 'mice', w: ['mouses', 'mices', 'meese'], f: 'Mouse → mice is an irregular plural.' },
    { q: 'What is the plural of "box"?', a: 'boxes', w: ['boxs', 'boxen', 'box'], f: 'Words ending in x, s, sh or ch add -es.' },
    { q: 'What is the plural of "leaf"?', a: 'leaves', w: ['leafs', 'leafes', 'leavs'], f: 'Many words ending in -f change to -ves: leaf → leaves.' },
    { q: 'What is the past tense of "run"?', a: 'ran', w: ['runned', 'runs', 'running'], f: 'Today I run; yesterday I ran.' },
    { q: 'What is the past tense of "go"?', a: 'went', w: ['goed', 'gone', 'goes'], f: 'Today I go; yesterday I went.' },
    { q: 'What is the past tense of "think"?', a: 'thought', w: ['thinked', 'thank', 'thunk'], f: 'Today I think; yesterday I thought.' },
    { q: 'What is the past tense of "swim"?', a: 'swam', w: ['swimmed', 'swum', 'swims'], f: 'Today I swim; yesterday I swam.' },
    { q: '"The dog runs fast." Which word is the VERB (action word)?', a: 'runs', w: ['dog', 'fast', 'The'], f: 'A verb is an action or doing word.' },
    { q: '"The red apple fell." Which word is the NOUN?', a: 'apple', w: ['red', 'fell', 'The'], f: 'A noun is a person, place or thing.' },
    { q: '"She wore a shiny hat." Which word is the ADJECTIVE?', a: 'shiny', w: ['wore', 'hat', 'She'], f: 'An adjective describes a noun.' },
    { q: 'Which sentence is written correctly?', a: 'Where is my bag?', w: ['where is my bag?', 'Where is my bag.', 'where is my bag'], f: 'Start with a capital letter. A question ends with a question mark.' },
    { q: 'Which sentence is written correctly?', a: 'Sam and I went to London.', w: ['sam and I went to london.', 'Sam and i went to London.', 'Sam and I went to london'], f: 'Names of people and places, and the word "I", always get capital letters.' },
    { q: 'Fill the gap: "I can ___ the ocean from my window."', a: 'see', w: ['sea', 'sey', 'cee'], f: 'see = look with your eyes. sea = a big body of salt water.' },
    { q: 'Fill the gap: "The children put on ___ coats."', a: 'their', w: ['there', 'they\'re', 'thier'], f: 'their = belongs to them. there = a place. they\'re = they are.' },
    { q: 'Fill the gap: "I have ___ apples."', a: 'two', w: ['to', 'too', 'tow'], f: 'two = the number 2. too = also. to = toward.' },
    { q: 'What is the short form of "do not"?', a: "don't", w: ["dont", "do'nt", "d'not"], f: 'The apostrophe takes the place of the missing letter o.' },
    { q: 'Which pair makes the compound word "sunflower"?', a: 'sun + flower', w: ['sunf + lower', 'su + nflower', 'sunflow + er'], f: 'A compound word is two words joined together.' }
  ];

  window.QB = { rnd, pick, shuffle, science, language, puzzles, ITEM_EMOJI };
})();

// config.js
var Config = {};

/**
 * Enable map text in the top left corner of the screen?
 */
Config.enableMap = true;

/**
 * The prefix text before the map name
 */
Config.mapPrefix = "You're playing on ";

/**
 * The suffix text for player count
 */
Config.playerCountSuffix = " slots";

/**
 * Enable custom text in the top right corner of the screen?
 */
Config.enableCustomText = true;

/**
 * The custom texts to display in the top right corner
 * only works if enableCustomText = true
 */
Config.customTexts = [
    "Fully translated from Russian to English.",
    "A real AMERICAN server.",
    "Actively maintained and developed.",
    "Welcome to ZGRAD!",
    "Operated by NPCZ.GG",
    "Visit our store: store.npcz.gg/zgrad"
];

/**
 * Enable rotating titles?
 */
Config.enableRotatingTitles = true;

/**
 * What messages do you want to show in the title?
 * only works if enableRotatingTitles = true
 */
Config.titleMessages = [
    {
        heading: "VISIT US",
        subheading: "ZGRAD.US/DISCORD"
    },
    {
        heading: "THE BEST HOMIGRAD EXPERIENCE?",
        subheading: "THAT'S US."
    },
    {
        heading: "FOLLOW OUR SOCIALS",
        subheading: "ZGRAD.US/SOCIALS"
    },
];

/**
 * How many milliseconds between title rotations?
 * only works if enableRotatingTitles = true
 */
Config.rotationLength = 5000;

/**
 * What messages do you want to show up?
 * only works if enableAnnouncements = true
 */
Config.announceMessages = [
    "Get help or report players in the #support channel on our Discord.",
    "Be sure to join our Discord: zgrad.us/discord",
    "Press F2 to open our settings menu!",
    "We bind all necessary game functions by default!",
    "Found a bug or have a suggestion? Post about it on our Discord!"
];

/**
 * Enable announcements?
 */
Config.enableAnnouncements = true;

/**
 * How many milliseconds for each announcement?
 * only works if enableAnnouncements = true
 */
Config.announcementLength = 3000;
// Add to config.js
Config.tipMessages = [
    "Press F2 to access the settings menu.",
    "Press G to ragdoll or get up.",
    "While unconcious, type !endit to kill yourself."
];

Config.sidePanelMessages = [
    {
        header: "HOMICIDE OVERVIEW",
        content: "Mixture of TTT and Murder. Traitors are armed with a knife, a firearm, and other gadgets, and have the objective of killing every innocent before the police arrive. The innocents have to work together and eliminate the traitors. One innocent person possesses either a firearm or a melee weapon."
    },
    {
        header: "RIOT OVERVIEW",
        content: "Cops can either kill or arrest rioters, meanwhile rioters have to eliminate the police and fight for their rights. Last team standing wins."
    },
    {
        header: "GANGWAR OVERVIEW",
        content: "Bloods vs Crips, last gang standing wins."
    },
    {
        header: "CSS OVERVIEW",
        content: "Armed conflict between Terrorists and Counter-Terrorists in a control-point based battle. Team with the most control points captured wins. Respawns are available."
    },
    {
        header: "TDM OVERVIEW",
        content: "Red vs Blue armed conflict in a Team Deathmatch style match. Last team alive wins. No respawns."
    },
    {
        header: "HL2DM OVERVIEW",
        content: "Combine forces vs The Rebellion in a Deathmatch round with Half Life 2 Weaponry."
    },
    {
        header: "FLYING SCOUTSMEN OVERVIEW",
        content: "Red vs Blue in a low gravity Team Deathmatch where snipers and knifes are the only available weapons. Respawns are available."
    },
    {
        header: "HOMIGRAD CONFLICT OVERVIEW",
        content: "Taliban fighters vs NATO forces in a territorial dispute with control points. Team with most control points captured wins."
    },
    {
        header: "HIDE & SEEK OVERVIEW",
        content: "Hiders have to hide from Seekers until the cops arrive. Seekers have to kill all the hiders"
    },
    {
        header: "DEATMATCH OVERVIEW",
        content: "Free for all."
    },
    {
        header: "WW2 OVERVIEW",
        content: "Soviets vs The Wehrmacht in a control point based battle."
    },
];

Config.sidePanelRotationLength = 15000; // 15 seconds
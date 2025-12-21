// Centralized server configuration for all ZGRAD servers

export const SERVER_GROUPS = [
    {
        id: 'zgrad1',
        title: 'ZGRAD US1',
        suffix: 'US1',
        ip: '193.243.190.18',
        port: 27066,
        region: 'US',
        gamemode: 'All Gamemodes',
        link: 'connect/us1',
        backgroundImage: '/images/loadingscreen/homigrad-essence.jpg'
    },
    {
        id: 'zgrad2',
        title: 'ZGRAD US2',
        suffix: 'US2',
        ip: '193.243.190.18',
        port: 27051,
        region: 'US',
        gamemode: 'All Gamemodes',
        link: 'connect/us2',
        backgroundImage: '/images/loadingscreen/eighteenth.jpg'
    },
    {
        id: 'zgrad3',
        title: 'ZGRAD US3',
        suffix: 'US3',
        ip: '193.243.190.18',
        port: 27053,
        region: 'US',
        gamemode: 'TDM 24/7',
        link: 'connect/us3',
        backgroundImage: '/images/loadingscreen/street-war.jpg'
    },
    {
        id: 'zgrad4',
        title: 'ZGRAD US4',
        suffix: 'US4',
        ip: '193.243.190.18',
        port: 27052,
        region: 'US',
        gamemode: 'Homicide Only',
        link: 'connect/us4',
        backgroundImage: '/images/loadingscreen/eigth.jpg'
    },
    {
        id: 'zgrad5',
        title: 'ZGRAD US5',
        suffix: 'US5',
        ip: '193.243.190.18',
        port: 27025,
        region: 'US',
        gamemode: 'All Gamemodes',
        link: 'connect/us5',
        backgroundImage: '/images/loadingscreen/fourteenth.jpg'
    },
    {
        id: 'zgradeu1',
        title: 'ZGRAD EU1',
        suffix: 'EU1',
        ip: '23.161.169.60',
        port: 27015,
        region: 'EU',
        gamemode: 'All Gamemodes',
        link: 'connect/eu1',
        backgroundImage: '/images/loadingscreen/thirteenth.jpg'
    },
    {
        id: 'zgradeu2',
        title: 'ZGRAD EU2',
        suffix: 'EU2',
        ip: '23.161.169.60',
        port: 27016,
        region: 'EU',
        gamemode: 'All Gamemodes',
        link: 'connect/eu2',
        backgroundImage: '/images/loadingscreen/thirteenth.jpg'
    },
];

// Create a map for quick lookup by ID
export const SERVER_MAP = Object.fromEntries(
    SERVER_GROUPS.map(server => [server.id, server])
);

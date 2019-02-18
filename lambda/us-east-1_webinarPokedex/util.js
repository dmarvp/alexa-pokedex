const Pokedex = require('pokedex-promise-v2');

class PokedexEntry {
    constructor(number, name, img, description) {
        this.number = number;
        this.name = name;
        this.img = img;
        this.description = description;
    }
};

const getRandomInt = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const getPokedexEntry = async function (number) {
    const options = {
        cacheLimit: 1000
    };
    const P = new Pokedex(options);
    const basicResponse = await P.getPokemonByName(number);
    const pokedexResponse = await P.getPokemonSpeciesByName(number);
    const dexEntries = pokedexResponse.flavor_text_entries.filter(function (entry) {
        return (entry.language.name === 'en');
    });
    const entry = dexEntries[getRandomInt(0, dexEntries.length - 1)].flavor_text.replace(/[\x00-\x1F\x7F-\x9F]/g, " ");
    return new PokedexEntry(number, basicResponse.name, basicResponse.sprites.front_default, entry);
}

exports.getPokedexEntry = getPokedexEntry;
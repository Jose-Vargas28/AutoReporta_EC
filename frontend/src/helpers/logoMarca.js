// =============================================================
//  Helpers para logos de marcas de vehículos
//  Usa logo.dev (gratuito) a partir del dominio de la marca.
// =============================================================

const dominiosPorMarca = {
    // Americanas
    chevrolet: "chevrolet.com",
    ford: "ford.com",
    dodge: "dodge.com",
    ram: "ramtrucks.com",
    jeep: "jeep.com",
    cadillac: "cadillac.com",
    gmc: "gmc.com",
    lincoln: "lincoln.com",
    buick: "buick.com",
    chrysler: "chrysler.com",

    // Japonesas
    toyota: "toyota.com",
    nissan: "nissan-global.com",
    honda: "honda.com",
    mazda: "mazda.com",
    suzuki: "globalsuzuki.com",
    mitsubishi: "mitsubishi-motors.com",
    subaru: "subaru.com",
    lexus: "lexus.com",
    infiniti: "infinitiusa.com",
    acura: "acura.com",
    isuzu: "isuzu.com",
    daihatsu: "daihatsu.com",
    hino: "hino-global.com",

    // Coreanas
    kia: "kia.com",
    hyundai: "hyundai.com",
    genesis: "genesis.com",
    ssangyong: "ssangyong.com",

    // Europeas — alemanas
    volkswagen: "vw.com",
    bmw: "bmw.com",
    "mercedes-benz": "mercedes-benz.com",
    mercedes: "mercedes-benz.com",
    audi: "audi.com",
    porsche: "porsche.com",
    opel: "opel.com",

    // Europeas — francesas
    renault: "renault.com",
    peugeot: "peugeot.com",
    citroen: "citroen.com",
    ds: "dsautomobiles.com",

    // Europeas — italianas
    fiat: "fiat.com",
    alfa: "alfaromeo.com",
    "alfa romeo": "alfaromeo.com",
    ferrari: "ferrari.com",
    lamborghini: "lamborghini.com",
    maserati: "maserati.com",

    // Europeas — inglesas / nórdicas
    volvo: "volvocars.com",
    "land rover": "landrover.com",
    jaguar: "jaguar.com",
    mini: "mini.com",
    bentley: "bentleymotors.com",
    rolls: "rolls-roycemotorcars.com",
    "rolls-royce": "rolls-roycemotorcars.com",

    // Europeas — españolas
    seat: "seat.com",
    cupra: "cupraofficial.com",

    // Chinas — presentes en Ecuador
    chery: "cheryinternational.com",
    jac: "jac.com.cn",
    byd: "byd.com",
    changan: "globalchangan.com",
    "great wall": "gwm-global.com",
    gwm: "gwm-global.com",
    haval: "haval-global.com",
    jetour: "jetour.com.cn",
    dfsk: "dfskmotor.com",
    foton: "foton-global.com",
    geely: "geely.com",
    mg: "mgmotor.co.uk",
    hongqi: "faw-hongqi.com",
    omoda: "omoda.com",
    jaecoo: "jaecoo.com",
    tank: "gwm-global.com",
    aion: "aion.gac.com.cn",
    gac: "gac.com.cn",
    zotye: "zotye.com",
    lifan: "lifan.com",

    // Motos
    yamaha: "yamaha-motor.com",
    kawasaki: "kawasaki.com",
    bajaj: "bajajauto.com",
    ktm: "ktm.com",
    ducati: "ducati.com",
    harley: "harley-davidson.com",
    "harley-davidson": "harley-davidson.com",
    triumph: "triumphmotorcycles.com",
    hero: "heroMotocorp.com",
    akt: "aktmotos.com",
    tvs: "tvsmotor.com",
    royal: "royalenfield.com",
    "royal enfield": "royalenfield.com",
    benelli: "benelli.com",
    cfmoto: "cfmoto.com",

    // Comerciales — camiones, buses, furgonetas
    scania: "scania.com",
    volvo_trucks: "volvotrucks.com",
    man: "man.eu",
    iveco: "iveco.com",
    "king long": "kinglong.com.cn",
    kinglong: "kinglong.com.cn",
    yutong: "yutong.com",
    marcopolo: "marcopolo.com.br",
    mercedes_sprinter: "mercedes-benz.com",
    "volkswagen crafter": "vw.com",
    "ford transit": "ford.com",

    // Otras / Comerciales
    tesla: "tesla.com",
    rivian: "rivian.com",
    lucid: "lucidmotors.com",
}

const normalizar = (marca) => (marca || "").trim().toLowerCase()

export const getLogoMarca = (marca, token = "") => {
    const dominio = dominiosPorMarca[normalizar(marca)]
    if (!dominio) return null
    const params = new URLSearchParams({ size: "80", format: "png" })
    if (token) params.append("token", token)
    return `https://img.logo.dev/${dominio}?${params}`
}

export const getInicialMarca = (marca) =>
    (marca || "?").trim().charAt(0).toUpperCase()
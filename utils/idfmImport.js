// @ts-check

import { readFileSync } from 'fs';
import { PrismaClient } from '@prisma/client';
const client = new PrismaClient();

const idfmLinesPath = "C:/Users/augus/Downloads/referentiel-des-lignes.json";
const idfmStopsPath = "C:/Users/augus/Downloads/arrets-lignes.json";
const idfmAdditionalStopsPath = "C:/Users/augus/Downloads/perimetre-des-donnees-tr-disponibles-plateforme-idfm.json";

/** @type {import('../src/lib/index.ts').IProviderLineReference} */
const lines = JSON.parse(readFileSync(idfmLinesPath));

let promises = [];
for (let line of lines) {
    promises.push(client.line.upsert({
        where: {
            id: `IDFM:${line.id_line}`
        },
        create: {
            id: `IDFM:${line.id_line}`,
            name: line.name_line,
            shortName: line.shortname_line,
            // @ts-ignore
            transportMode: line.transportmode,
            // @ts-ignore
            transportSubmode: line.transportsubmode,
            operatorRef: line.operatorref,
            operatorName: line.operatorname,
            additionalOperators: line.additionaloperators,
            networkName: line.networkname,
            colourWebHexa: line.colourweb_hexa,
            colourTextHexa: line.textcolourweb_hexa,
            accessibility: line.accessibility === "true" ? true : false,
            groupOfLinesId: line.id_groupoflines,
            groupOfLinesShortname: line.shortname_groupoflines,
            status: line.status,
            privateCode: line.privatecode
        },
        update: {
            name: line.name_line,
            shortName: line.shortname_line,
            // @ts-ignore
            transportMode: line.transportmode,
            // @ts-ignore
            transportSubmode: line.transportsubmode,
            operatorRef: line.operatorref,
            operatorName: line.operatorname,
            additionalOperators: line.additionaloperators,
            networkName: line.networkname,
            colourWebHexa: line.colourweb_hexa,
            colourTextHexa: line.textcolourweb_hexa,
            accessibility: line.accessibility === "true" ? true : false,
            groupOfLinesId: line.id_groupoflines,
            groupOfLinesShortname: line.shortname_groupoflines,
            status: line.status,
            privateCode: line.privatecode
        }
    }));
}

await Promise.all(promises);

/** @type {import('../src/lib/index.ts').IProviderStopsReference}*/
const stops = JSON.parse(readFileSync(idfmStopsPath));

for (let stop of stops) {
    console.log(`Importing stop ${stop.stop_id}`, JSON.stringify({
        id: stop.stop_id,
        name: stop.stop_name,
        lat: stop.pointgeo.lat,
        lon: stop.pointgeo.lon,
        lines: {
            connect: {
                id: stop.id
            }
        },
        operatorName: stop.operatorname,
        nomCommune: stop.nom_commune,
        codeInsee: stop.code_insee,
    }, null, 2));

    await client.stop.upsert({
        where: {
            id: stop.stop_id
        },
        create: {
            id: stop.stop_id,
            name: stop.stop_name,
            lat: stop.pointgeo.lat,
            lon: stop.pointgeo.lon,
            lines: {
                connect: {
                    id: stop.id
                }
            },
            operatorName: stop.operatorname,
            nomCommune: stop.nom_commune,
            codeInsee: stop.code_insee,
        },
        update: {
            name: stop.stop_name,
            lat: stop.pointgeo.lat,
            lon: stop.pointgeo.lon,
            lines: {
                connect: {
                    id: stop.id
                }
            },
            operatorName: stop.operatorname,
            nomCommune: stop.nom_commune,
            codeInsee: stop.code_insee,
        },
    });
}

/** @type {{ns3_stoppointref: string, ns3_stopname: string, line: string, name_line: string}[]} */
const additionalStops = JSON.parse(readFileSync(idfmAdditionalStopsPath));

for (let stop of additionalStops) {
    let id = `IDFM:${stop.ns3_stoppointref.match(/\d+/)?.[0]}`;
    let lineId = `IDFM:${stop.line.match(/[A-Z]\d+/)?.[0]}`;

    if (!stop.ns3_stopname)
        continue;

    let existing = await client.stop.findUnique({
        where: {
            id
        }
    });

    if (!existing) {
        existing = await client.stop.findFirst({
            where: {
                name: stop.ns3_stopname
            }
        });

        if (existing) {
            console.log(`Updating stop ${stop.ns3_stopname} (${existing.id}) with `, JSON.stringify({
                id: id,
                lines: {
                    connect: {
                        id: lineId
                    }
                }
            }, null, 2));

            await client.stop.update({
                where: {
                    id: existing.id
                },
                data: {
                    id: id,
                    lines: {
                        connect: {
                            id: lineId
                        }
                    }
                }
            });
        }
    }
}

console.log("Lines and stops imported");

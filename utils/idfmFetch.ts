import { Arrival, ArrivalStatus, Disruption, DisruptionCause, DisruptionSeverity, PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import type { SiriResponse, DisruptionsResponse } from '../src/lib/idfm.d.ts';
import { existsSync, writeFileSync } from 'fs';
import { Logger } from 'tslog';

config({
    path: `../.env`
});
const baseUrl = `https://prim.iledefrance-mobilites.fr/marketplace/`;

const client = new PrismaClient();
const log = new Logger();

if (!process.env.IDFM_API_KEY) {
    throw new Error(`IDFM_API_KEY is not defined in the environment variables`);
}

async function updateTimetable() {
    let timetableJson: SiriResponse;

    if (existsSync(`./estimated-timetable.json`) && false) {
        log.info(`Estimated timetables already fetched, skipping...`);

        timetableJson = (await import(`./estimated-timetable.json`)).default as SiriResponse;
    } else {
        log.info(`Fetching estimated timetables...`);
        const timetableUrl = new URL(`estimated-timetable`, baseUrl);
        timetableUrl.searchParams.append(`LineRef`, `ALL`);
        const timetableRes = await fetch(timetableUrl, {
            headers: {
                'apiKey': process.env.IDFM_API_KEY
            }
        });
        if (!timetableRes.ok) {
            throw new Error(`Failed to fetch estimated timetables: ${timetableRes.statusText}`);
        }

        timetableJson = await timetableRes.json() as SiriResponse;

        if (!timetableJson.Siri.ServiceDelivery.EstimatedTimetableDelivery[0].EstimatedJourneyVersionFrame[0].EstimatedVehicleJourney) {
            throw new Error(`Failed to fetch estimated timetables: ${timetableJson.Siri.ServiceDelivery.ResponseMessageIdentifier}`);
        }

        writeFileSync(`./estimated-timetable.json`, JSON.stringify(timetableJson, null, 2));
    }

    const missingStops: Set<string> = new Set();
    const arrivalInserts: Arrival[] = [];
    const arrivalUpdates: Arrival[] = [];

    log.info(`Processing estimated timetables...`);

    const lines = (await client.line.findMany({
        select: {
            id: true
        },
        where: {
            id: {
                startsWith: `IDFM:`,
            },
            transportMode: {
                notIn: [
                    'bus',
                    'funicular'
                ]
            }
        }
    })).map((line) => line.id);

    const stopIds = (await client.stop.findMany({
        select: {
            id: true
        }
    })).map((stop) => stop.id);
    const journeyIds = (await client.arrival.findMany({
        select: {
            id: true
        }
    })).map((arrival) => arrival.id);

    for (const delivery of timetableJson.Siri.ServiceDelivery.EstimatedTimetableDelivery) {
        for (const frame of delivery.EstimatedJourneyVersionFrame) {
            if (!frame.EstimatedVehicleJourney) {
                continue;
            }

            for (const journey of frame.EstimatedVehicleJourney) {
                for (const call of journey.EstimatedCalls.EstimatedCall) {
                    let lineId = `IDFM:${journey.LineRef.value.match(/[A-Z]\d+/)}`;
                    if (!lines.includes(lineId)) {
                        continue;
                    }

                    let stopId = `IDFM:${call.StopPointRef.value.match(/\d+/)}`;
                    if (!stopIds.includes(stopId)) {
                        stopId = `IDFM:monomodalStopPlace:${call.StopPointRef.value.match(/\d+/)}`;

                        if (!stopIds.includes(stopId)) {
                            missingStops.add(call.StopPointRef.value);
                            continue;
                        }
                    }

                    let destinationId = `IDFM:${journey.DestinationRef.value.match(/\d+/)}`;
                    if (!stopIds.includes(destinationId)) {
                        destinationId = `IDFM:monomodalStopPlace:${journey.DestinationRef.value.match(/\d+/)}`;

                        if (!stopIds.includes(destinationId)) {
                            missingStops.add(journey.DestinationRef.value);
                            continue;
                        }
                    }

                    const arrival: Arrival = {
                        id: `${stopId}:${journey.DatedVehicleJourneyRef.value}`,
                        lineId: lineId,
                        destinationDisplay: call.DestinationDisplay[0]?.value ?? "",
                        stopId: stopId,
                        destinationId: destinationId,
                        expectedArrivalStatus: call.ArrivalStatus as ArrivalStatus || null,
                        expectedArrivalTime: call.ExpectedArrivalTime ? new Date(call.ExpectedArrivalTime) : null,
                        expectedDepartureStatus: call.DepartureStatus as ArrivalStatus || null,
                        expectedDepartureTime: call.ExpectedDepartureTime ? new Date(call.ExpectedDepartureTime) : new Date(journey.RecordedAtTime),
                    };

                    if (journeyIds.includes(arrival.id)) {
                        arrivalUpdates.push(arrival);
                    } else {
                        arrivalInserts.push(arrival);
                    }
                }
            }
        }
    }

    log.info("Updating estimated timetables...");

    for (const arr of arrivalInserts) {
        try {
            await client.arrival.create({
                data: arr
            });
        } catch (e) {
            log.error(`Failed to insert estimated arrival`, arr, e);
        }
    }

    let promises: any[] = [];
    promises = promises.concat(arrivalUpdates.map((arrival) => {
        return client.arrival.update({
            where: {
                id: arrival.id
            },
            data: arrival
        });
    }));
    await Promise.all(promises);

    log.info(`Updated estimated arrivals.`, {
        inserted: arrivalInserts.length,
        updated: arrivalUpdates.length
    });
}

function parseCustomDate(dateStr) {
    // Insert hyphens and colons to convert to a standard ISO 8601 format
    const formattedDate = dateStr.slice(0, 4) + '-' + dateStr.slice(4, 6) + '-' + dateStr.slice(6, 8)
        + 'T' + dateStr.slice(9, 11) + ':' + dateStr.slice(11, 13) + ':' + dateStr.slice(13, 15);

    // Create a new Date object using the formatted string
    return new Date(formattedDate);
}

async function updateInfoTrafic() {
    log.info(`Fetching disruptions...`);
    const url = new URL(`disruptions_bulk/disruptions/v2`, baseUrl);
    const res = await fetch(url, {
        headers: {
            'apiKey': process.env.IDFM_API_KEY
        }
    });

    if (!res.ok) {
        throw new Error(`Failed to fetch disruptions: ${res.statusText}`);
    }

    const data = await res.json() as DisruptionsResponse;

    log.info(`Processing disruptions...`);
    let disruptions: Disruption[] = [];

    for (const d of data.disruptions) {
        disruptions.push({
            id: d.id,
            title: d.title,
            message: d.message,
            cause: d.cause as DisruptionCause,
            severity: d.severity as DisruptionSeverity,
            lastUpdate: parseCustomDate(d.lastUpdate),
            startDate: parseCustomDate(d.applicationPeriods[0].begin),
            endDate: parseCustomDate(d.applicationPeriods[0].end)
        });
    }

    log.info(`Inserting disruptions...`);

    await client.disruption.deleteMany();

    let promises: any[] = [];
    promises = promises.concat(disruptions.map((disruption) => {
        return client.disruption.upsert({
            where: {
                id: disruption.id
            },
            update: disruption,
            create: disruption
        });
    }));

    await Promise.all(promises);

    log.info(`Updated disruptions.`, {
        inserted: disruptions.length
    });

    log.info(`Assigning disruptions to lines...`);

    const lineDisruptionInserts: {
        lineId: string,
        disruptionIds: string[]
    }[] = [];

    for (const line of data.lines) {
        for (const association of line.impactedObjects) {
            if (association.id.startsWith("line:")) {
                lineDisruptionInserts.push({
                    lineId: association.id.replace("line:", ""),
                    disruptionIds: association.disruptionIds
                });
            }
        }
    }

    promises = [];
    promises = promises.concat(lineDisruptionInserts.map((lineDisruption) => {
        return client.line.update({
            where: {
                id: lineDisruption.lineId
            },
            data: {
                disruptions: {
                    connect: lineDisruption.disruptionIds.map((disruptionId) => {
                        return {
                            id: disruptionId
                        };
                    })
                }
            }
        });
    }));

    await Promise.all(promises);

    log.info(`Assigned disruptions to lines.`, {
        updated: lineDisruptionInserts.length
    });
}

try {
    await updateTimetable();
} catch (error) { }

try {
    await updateInfoTrafic();
} catch (error) { }

setInterval(async () => {
    try {
        await updateTimetable();
    } catch (error) {
        log.error(`Failed to update timetable`, error);
    }
}, 2 * 60_000);

setInterval(async () => {
    try {
        await updateInfoTrafic();
    } catch (error) {
        log.error(`Failed to update disruptions`, error);
    }
}, 5 * 60_000);

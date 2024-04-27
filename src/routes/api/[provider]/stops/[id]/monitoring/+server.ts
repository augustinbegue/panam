import { prisma } from "$lib/server/prisma";
import type { Siri, SiriResponse } from "$lib/idfm";
import { error, json, type RequestHandler } from "@sveltejs/kit";


export const GET: RequestHandler = async ({ params }) => {
    const { provider, id } = params;

    if (provider !== "idfm") {
        throw error(404, "Provider not found");
    }

    let utcTime = new Date();
    utcTime.setSeconds(utcTime.getSeconds() - 30);

    const info = await prisma.stop.findUnique({
        where: {
            id: id
        },
        select: {
            name: true
        }
    });

    if (!info) {
        throw error(404, "Stop not found");
    }

    const arrivals = await prisma.arrival.findMany({
        where: {
            stopId: id,
            OR: [
                {
                    expectedArrivalTime: {
                        gte: utcTime
                    }
                },
                {
                    expectedDepartureTime: {
                        gte: utcTime
                    }
                }
            ]
        },
        orderBy: {
            expectedDepartureTime: "asc"
        },
        include: {
            destination: {
                select: {
                    name: true
                }
            }
        }
    });

    const res = arrivals.map((visit) => {
        return {
            lineId: visit.lineId,
            destinationId: visit.destinationId,
            destinationName: visit.destination.name.replace(/Gare de /, ""),
            expectedArrivalTime: visit.expectedArrivalTime || visit.expectedDepartureTime,
            expectedArrivalStatus: visit.expectedArrivalStatus || visit.expectedDepartureStatus
        };
    });

    let destinations = res.map((visit) => visit.destinationName);

    if (destinations.length < 1) {
        destinations = (await prisma.arrival.groupBy({
            by: ["destinationDisplay"],
            _count: {
                destinationDisplay: true
            },
            where: {
                stopId: id,
            }
        })).map((dest) => dest.destinationDisplay.replace(/Gare de /, "")).sort();
    }

    console.log({
        info,
        arrivals: res,
        destinations
    });

    return json({
        info,
        arrivals: res,
        destinations
    });
}

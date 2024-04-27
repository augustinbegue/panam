import type { Siri, SiriResponse } from "$lib/idfm";
import { prisma } from "$lib/server/prisma";
import { error, json, type RequestHandler } from "@sveltejs/kit";

const apiKey = "y3PyWUJpbADshreydYLFGrwIfp3aT3l2";

export const GET: RequestHandler = async ({ params }) => {
    const { provider, id } = params;

    if (provider !== "idfm") {
        throw error(404, "Provider not found");
    }

    const disruptions = await prisma.disruption.findMany({
        where: {
            impactedLines: {
                some: {
                    id: id,
                },
            },
            startDate: {
                lte: new Date(),
            },
            endDate: {
                gte: new Date(),
            },
        },
        include: {
            impactedLines: {
                select: {
                    id: true,
                }
            },
        },
    });

    return json(disruptions);
}

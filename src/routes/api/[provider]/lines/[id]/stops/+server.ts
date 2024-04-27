import type { IProvider, IProviderLineReference, IProviderLineReferenceRow, IProviderStopsReference, IProviderStopsReferenceRow } from "$lib";
import { prisma } from "$lib/server/prisma";
import type { RequestHandler } from "./$types";
import { error, json } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ params }) => {
    const { provider, id } = params;

    if (provider !== "idfm") {
        throw error(404, "Provider not found");
    }

    const stops = await prisma.stop.findMany({
        where: {
            lines: {
                some: {
                    id: id
                }
            }
        },
        include: {
            arrivals: {
                distinct: "destinationDisplay",
                select: {
                    destinationDisplay: true,
                },
                where: {
                    lineId: id
                }
            }
        },
        orderBy: {
            name: "asc"
        }
    });

    return json(stops);
}

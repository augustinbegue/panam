import type { IProvider, IProviderLineReference, IProviderLineReferenceRow } from "$lib";
import { prisma } from "$lib/server/prisma";
import { TransportMode, TransportSubmode, type Line } from "@prisma/client";
import type { RequestHandler } from "./$types";
import { error, json } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ params }) => {
    const { provider, mode, submode } = params;

    if (provider !== "idfm") {
        throw error(404, "Provider not found");
    }

    if ((TransportMode as any)[mode] === undefined || (TransportSubmode as any)[submode] === undefined && submode !== "null") {
        throw error(404, "Mode not found");
    }

    let lines: Line[];
    if (submode !== "null") {
        lines = await prisma.line.findMany({
            where: {
                transportMode: mode as TransportMode,
                transportSubmode: submode as TransportSubmode
            },
            orderBy: {
                shortName: "asc"
            }
        });
    } else {
        lines = await prisma.line.findMany({
            where: {
                transportMode: mode as TransportMode
            },
            orderBy: {
                shortName: "asc"
            }
        });
    }

    return json(lines);
}

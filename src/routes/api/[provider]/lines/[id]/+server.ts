import type { RequestHandler } from "./$types";
import idfmProvider from "$lib/providers/idfm.json";
import { error, json } from "@sveltejs/kit";
import { prisma } from "$lib/server/prisma";

export const GET: RequestHandler = async ({ params }) => {
    const { provider, id } = params;

    if (provider !== "idfm") {
        throw error(404, "Provider not found");
    }

    let line = await prisma.line.findUnique({
        where: {
            id
        }
    });

    if (!line) {
        throw error(404, "Line not found");
    }

    let type = "metro";
    for (const [t, metadata] of Object.entries(idfmProvider.types)) {
        if (metadata.transportmode === line.transportMode && metadata.transportsubmode === line.transportSubmode) {
            type = t;
            break;
        }
    }

    const lineIcon = `/assets/icons/${type}-${line.shortName.split('T').pop()?.toLowerCase()}.svg`;
    const typeIcon = `/assets/icons/${type}.svg`;

    return json({
        line,
        icons: {
            line: lineIcon,
            type: typeIcon
        }
    });
}
